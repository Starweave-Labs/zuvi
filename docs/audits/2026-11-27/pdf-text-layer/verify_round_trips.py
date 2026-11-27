"""Independently inspect native PDF fields/APs, then compare Poppler pixels."""

from collections import Counter
from hashlib import sha256
import json
from pathlib import Path
import subprocess

from PIL import Image, ImageChops, ImageDraw
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parent


def content_hashes(page):
    value = page.get("/Contents")
    if value is None:
        return []
    value = value.get_object()
    streams = value if isinstance(value, list) else [value]
    return [sha256(stream.get_object().get_data()).hexdigest() for stream in streams]


def inspect(path):
    reader = PdfReader(path)
    pages = []
    for page in reader.pages:
        annotations = []
        for index, reference in enumerate(page.get("/Annots", [])):
            annotation = reference.get_object()
            normal = (annotation.get("/AP") or {}).get_object().get("/N") if annotation.get("/AP") else None
            appearance = normal.get_object() if normal else None
            if appearance is not None and not hasattr(appearance, "get_data"):
                appearance = next((value.get_object() for value in appearance.values() if hasattr(value.get_object(), "get_data")), None)
            key = f"{reference.idnum} {reference.generation} R" if hasattr(reference, "idnum") else f"direct:{index}"
            annotations.append({
                "key": key,
                "subtype": str(annotation.get("/Subtype")),
                "flags": int(annotation.get("/F", 0)),
                "name": str(annotation.get("/ZuviAnnotationId") or annotation.get("/NM") or annotation.get("/Contents") or ""),
                "rect": list(annotation.get("/Rect", [])),
                "quadPoints": list(annotation.get("/QuadPoints", [])),
                "appearanceHash": sha256(appearance.get_data()).hexdigest() if appearance else None,
                "appearanceSize": len(appearance.get_data()) if appearance else 0,
            })
            if annotation.get("/Subtype") == "/Widget":
                value = annotation
                while value.get("/Parent"):
                    value = value["/Parent"].get_object()
                assert value.get("/T") == "source-field"
                assert value.get("/V") == "Field value"
                assert annotations[-1]["appearanceSize"] > 0
        pages.append({
            "mediaBox": list(page.mediabox), "cropBox": list(page.cropbox),
            "userUnit": page.user_unit, "rotation": page.rotation,
            "text": page.extract_text(), "contentHashes": content_hashes(page),
            "annotations": annotations,
        })
    fields = {name: {"type": str(field.get("/FT")), "value": str(field.get("/V"))}
              for name, field in (reader.get_fields() or {}).items()}
    assert fields["source-field"] == {"type": "/Tx", "value": "Field value"}
    return {"file": path.name, "sha256": sha256(path.read_bytes()).hexdigest(), "pages": pages, "fields": fields}


def main():
    source = ROOT / "app-markup-source.pdf"
    if not source.exists():
        source = ROOT / "app-round-1/app-source.pdf"
    paths = [source, ROOT / "app-text-markups-round-1.pdf", ROOT / "app-text-markups-round-2.pdf"]
    reports = [inspect(path) for path in paths]
    original = reports[0]
    assert len(original["pages"]) == 2
    assert original["pages"][0]["cropBox"] == [40, 30, 440, 530]
    assert original["pages"][0]["userUnit"] == 1.5
    assert original["pages"][1]["rotation"] == 90
    original_marks = {annotation["name"]: annotation for annotation in original["pages"][0]["annotations"] if annotation["name"]}
    expected = Counter({"/Square": 3, "/Text": 1, "/Highlight": 2, "/Widget": 1, "/Underline": 1, "/StrikeOut": 1, "/Squiggly": 1})
    for saved in reports[1:]:
        assert len(saved["pages"]) == 2
        for index, page in enumerate(saved["pages"]):
            assert page["contentHashes"] == original["pages"][index]["contentHashes"]
            for key in ["mediaBox", "cropBox", "userUnit", "rotation", "text"]:
                assert page[key] == original["pages"][index][key]
        annotations = saved["pages"][0]["annotations"]
        assert Counter(annotation["subtype"] for annotation in annotations) == expected
        for annotation in annotations:
            before = original_marks.get(annotation["name"])
            if before:
                for key in ["flags", "rect", "quadPoints", "appearanceHash"]:
                    assert annotation[key] == before[key]
            elif annotation["subtype"] in ["/Highlight", "/Underline", "/StrikeOut", "/Squiggly"]:
                assert len(annotation["quadPoints"]) == 8 and annotation["appearanceSize"] > 0
    assert reports[1]["sha256"] == reports[2]["sha256"]
    images = []
    for index, path in enumerate(paths):
        prefix = ROOT / ("app-poppler-source" if index == 0 else f"app-poppler-round-{index}")
        subprocess.run(["pdftoppm", "-cropbox", "-r", "144", "-png", str(path), str(prefix)], check=True, capture_output=True)
        images.append([Image.open(prefix.with_name(prefix.name + f"-{page}.png")).convert("RGB") for page in [1, 2]])
    assert images[0][0].size == images[1][0].size == images[2][0].size
    assert ImageChops.difference(images[1][0], images[2][0]).getbbox() is None
    assert ImageChops.difference(images[0][1], images[1][1]).getbbox() is None
    crop = original["pages"][0]["cropBox"]
    width, height = images[0][0].size
    def pixel(x, y):
        return (round((x - crop[0]) * width / (crop[2] - crop[0])), round((crop[3] - y) * height / (crop[3] - crop[1])))
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    for annotation in reports[1]["pages"][0]["annotations"]:
        if annotation["name"] in original_marks or annotation["subtype"] == "/Widget":
            continue
        x0, y0, x1, y1 = annotation["rect"]
        draw.rectangle([pixel(x0 - 4, y1 + 4), pixel(x1 + 4, y0 - 4)], fill=255)
    difference = ImageChops.difference(images[0][0], images[1][0])
    outside = Image.composite(Image.new("RGB", (width, height)), difference, mask)
    assert outside.getbbox() is None, "Original content/appearance pixels changed outside the four new markup rectangles"
    sample = pixel(140, 260)
    original_alpha = list(images[0][0].getpixel(sample))
    assert original_alpha == list(images[1][0].getpixel(sample)) == list(images[2][0].getpixel(sample))
    assert original_alpha[:2] == [255, 255] and 178 <= original_alpha[2] <= 179
    payload = {"reports": reports, "poppler": {"firstPagePixels": [width, height], "outsideMarkupChanges": 0,
        "secondPageChanges": 0, "reopenPixelChanges": 0, "singleAlphaPixel": original_alpha}}
    (ROOT / "independent-round-trips.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print("pypdf fields, unchanged page streams and original APs verified; Poppler source/round1/round2 pixels verified")


if __name__ == "__main__":
    main()
