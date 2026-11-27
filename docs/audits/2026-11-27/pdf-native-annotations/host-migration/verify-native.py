from pathlib import Path
import hashlib
import json
import sys

from pypdf import PdfReader
from pypdf.generic import ArrayObject, DictionaryObject, IndirectObject

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "output"


def digest(value):
    return hashlib.sha256(value).hexdigest()


def key(value):
    return f"{value.idnum} {value.generation} R" if isinstance(value, IndirectObject) else None


def streams(value):
    if value is None:
        return []
    value = value.get_object()
    if isinstance(value, ArrayObject):
        return [entry.get_object().get_data() for entry in value]
    return [value.get_data()]


def ap_hashes(annotation):
    ap = annotation.get("/AP")
    result = {}
    if not ap:
        return result
    for role, value in ap.get_object().items():
        obj = value.get_object()
        if hasattr(obj, "get_data"):
            result[str(role)] = digest(obj.get_data())
        elif isinstance(obj, DictionaryObject):
            result[str(role)] = {str(name): digest(stream.get_object().get_data()) for name, stream in obj.items() if hasattr(stream.get_object(), "get_data")}
    return result


def font_files(annotation):
    ap = annotation.get("/AP")
    result = {}
    if not ap:
        return result
    normal = ap.get_object().get("/N")
    if not normal or not hasattr(normal.get_object(), "get_data"):
        return result
    resources = normal.get_object().get("/Resources", {})
    resources = resources.get_object() if hasattr(resources, "get_object") else resources
    fonts = resources.get("/Font", {})
    fonts = fonts.get_object() if hasattr(fonts, "get_object") else fonts
    for name, font_ref in fonts.items():
        font = font_ref.get_object()
        descriptor = font.get("/FontDescriptor")
        descendants = font.get("/DescendantFonts")
        if descendants:
            descriptor = descendants[0].get_object().get("/FontDescriptor")
        if descriptor:
            descriptor = descriptor.get_object()
            for file_key in ["/FontFile", "/FontFile2", "/FontFile3"]:
                if file_key in descriptor:
                    result[str(name)] = {
                        "family": str(font.get("/BaseFont")),
                        "sha256": digest(descriptor[file_key].get_object().get_data()),
                        "fontRef": key(font_ref),
                        "fileRef": key(descriptor.raw_get(file_key)),
                        "toUnicodeSha256": digest(font["/ToUnicode"].get_data()) if "/ToUnicode" in font else None,
                    }
    return result


def inspect(path):
    reader = PdfReader(path)
    pages = list(reader.pages)
    page_refs = {key(page.indirect_reference): index for index, page in enumerate(pages)}
    inventory = []
    for page_index, page in enumerate(pages):
        for ref in page.get("/Annots", []):
            annotation = ref.get_object()
            action = annotation.get("/A")
            action = action.get_object() if action else None
            dest = annotation.get("/Dest")
            if action and action.get("/S") == "/GoTo":
                dest = action.get("/D")
            dest = dest.get_object() if dest else None
            target = page_refs.get(key(dest[0])) if isinstance(dest, ArrayObject) else None
            inventory.append({
                "ref": key(ref), "page": page_index, "id": str(annotation.get("/ZuviAnnotationId", annotation.get("/NM", ""))),
                "name": str(annotation.get("/NM", "")), "originId": annotation.get("/ZuviAnnotationOriginId"),
                "subtype": str(annotation.get("/Subtype")), "rect": list(annotation.get("/Rect", [])),
                "contents": str(annotation.get("/Contents", "")), "author": str(annotation.get("/T", "")),
                "creation": str(annotation.get("/CreationDate", "")), "modified": str(annotation.get("/M", "")),
                "replyToRef": key(annotation.raw_get("/IRT")) if "/IRT" in annotation else None,
                "replyType": str(annotation.get("/RT", "/R")) if "/IRT" in annotation else None,
                "popupRef": key(annotation.raw_get("/Popup")) if "/Popup" in annotation else None,
                "popupParentRef": key(annotation.raw_get("/Parent")) if annotation.get("/Subtype") == "/Popup" and "/Parent" in annotation else None,
                "pageRef": key(annotation.raw_get("/P")) if "/P" in annotation else None,
                "stateModel": annotation.get("/StateModel"), "state": annotation.get("/State"),
                "opacity": float(annotation.get("/CA", 1)), "quads": list(annotation.get("/QuadPoints", [])),
                "ink": [list(stroke) for stroke in annotation.get("/InkList", [])],
                "line": list(annotation.get("/L", [])), "lineEnds": [str(value) for value in annotation.get("/LE", [])],
                "vertices": list(annotation.get("/Vertices", [])), "rd": list(annotation.get("/RD", [])),
                "border": {str(name): list(value) if isinstance(value, ArrayObject) else str(value) for name, value in annotation.get("/BS", {}).get_object().items()} if annotation.get("/BS") else {},
                "ap": ap_hashes(annotation), "fonts": font_files(annotation), "goToPage": target,
                "actionType": str(action.get("/S")) if action else None,
                "uri": str(action.get("/URI")) if action and action.get("/S") == "/URI" else None,
            })
    canonical = {annotation["ref"]: annotation for annotation in inventory}
    for annotation in inventory:
        if annotation["pageRef"] is not None:
            assert page_refs.get(annotation["pageRef"]) == annotation["page"], ("wrong P", path, annotation)
        if annotation["replyToRef"]:
            assert annotation["replyToRef"] in canonical, ("dangling IRT", path, annotation)
        if annotation["popupRef"]:
            popup = canonical.get(annotation["popupRef"])
            assert popup and popup["subtype"] == "/Popup", ("dangling Popup", path, annotation)
            assert popup["popupParentRef"] == annotation["ref"], ("Popup ownership mismatch", path, annotation)
        if annotation["popupParentRef"]:
            parent = canonical.get(annotation["popupParentRef"])
            assert parent and parent["popupRef"] == annotation["ref"], ("inverse Popup mismatch", path, annotation)
        if annotation["actionType"] == "/GoTo":
            assert annotation["goToPage"] is not None, ("dangling GoTo", path, annotation)
    return {
        "bytes": path.stat().st_size, "sha256": digest(path.read_bytes()),
        "pages": [{"id": str(page.get("/ZuviPageId", "")), "ref": key(page.indirect_reference), "contents": [digest(content) for content in streams(page.get("/Contents"))], "rotation": page.get("/Rotate", 0), "crop": list(page.cropbox)} for page in pages],
        "annotations": inventory,
    }



results = {path.name: inspect(path) for path in sorted(ROOT.glob("*.pdf"))}
original = results["original.pdf"]
for name, report in results.items():
    if name == "original.pdf":
        continue
    identities = [annotation["id"] for annotation in report["annotations"]]
    assert all(identities) and len(set(identities)) == len(identities), ("identity",name)
    for page in report["pages"]:
        assert page["id"], ("page alias",name)
    reader = PdfReader(ROOT / name)
    fields = reader.get_fields()
    assert fields["reviewer"]["/V"] == "Accepted fields and annotations", (name, fields)
    if "reviewer__2" in fields:
        assert fields["reviewer__2"]["/V"] == "Accepted fields and annotations"
    content_set = {tuple(page["contents"]) for page in original["pages"]}
    assert all(tuple(page["contents"]) in content_set for page in report["pages"]), ("page body changed",name)
twelve = results["native-twelve-types.pdf"]
assert set(annotation["subtype"] for annotation in twelve["annotations"] if annotation["subtype"] != "/Widget") == {
    "/FreeText","/Text","/Highlight","/Underline","/StrikeOut","/Squiggly","/Square","/Circle","/Line","/Polygon","/PolyLine","/Ink"}
copy = results["copy-edited.pdf"]
assert copy["pages"][0]["id"] == "host-copy-a"
assert any(annotation["page"] == 0 and annotation["contents"] == "复制页独立中文编辑" for annotation in copy["annotations"])
assert any(annotation["page"] == 2 and annotation["contents"] == "中文自由文本：原生迁入后保留" for annotation in copy["annotations"])
first = results["merged-round-1.pdf"]
second = results["merged-round-2.pdf"]
assert len(first["pages"]) == len(second["pages"]) == 6
assert len(first["annotations"]) == len(second["annotations"])
assert any(annotation["page"] == 0 and annotation["contents"] == "重开编辑保留字体" for annotation in second["annotations"])
for report in [copy,first,second]:
    for reply in [annotation for annotation in report["annotations"] if annotation["replyToRef"]]:
        parent = next(annotation for annotation in report["annotations"] if annotation["ref"] == reply["replyToRef"])
        assert reply["page"] // 2 == parent["page"] // 2, ("thread escaped its source group",reply,parent)
(ROOT / "independent-pypdf.json").write_text(json.dumps({"status":"passed","files":len(results),"results":results}, ensure_ascii=False,indent=2))
print("pypdf host migration passed:",len(results),"PDFs;12 types, stable IDs/page aliases, fields, IRT/P, original Contents, two reopen/edit saves.")
