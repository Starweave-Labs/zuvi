"""Independent ZIP/XML and pypdf checks for the browser-authored artifacts."""
from pathlib import Path
import hashlib
import json
import re
import xml.etree.ElementTree as ET
import zipfile

from pypdf import PdfReader


directory = Path(__file__).resolve().parent
namespace = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
browser = json.loads((directory / "browser-roundtrip-evidence.json").read_text())
books = []
for filename in ["text-source.xlsx", "text-roundtrip-1.xlsx", "text-roundtrip-2.xlsx"]:
    source = directory / filename
    with zipfile.ZipFile(source) as archive:
        styles = ET.fromstring(archive.read("xl/styles.xml"))
        font = styles.find("x:fonts/x:font", namespace)
        assert font.find("x:name", namespace).attrib["val"] == "Arial"
        assert float(font.find("x:sz", namespace).attrib["val"]) == 9.5
        assert font.find("x:b", namespace) is not None
        assert font.find("x:i", namespace) is not None
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet1.xml"))
        rows = {row.attrib["r"]: row.attrib for row in sheet.findall("x:sheetData/x:row", namespace)}
        assert rows["2"].get("customHeight") == "0"
        height = float(rows["2"]["h"])
        if filename == "text-source.xlsx":
            assert height == 18.75
        else:
            assert abs(height * 4 / 3 - browser["grid"]["A2"]["height"]) < 0.02
            assert rows["5"].get("customHeight") == "1" and float(rows["5"]["h"]) == 90
            assert rows["8"].get("customHeight") == "1" and float(rows["8"]["h"]) == 72
        books.append({"file": filename, "sha256": hashlib.sha256(source.read_bytes()).hexdigest(), "row2": rows["2"], "font0": ET.tostring(font, encoding="unicode")})

pdf_path = directory / "text-print.pdf"
reader = PdfReader(pdf_path, strict=True)
text = "\n".join(page.extract_text() or "" for page in reader.pages)
compact = re.sub(r"\s+", "", text)
for expected in ["CENTER_TITLE", "ANGLED_TEXT", "LongHeading", "Hidden master", "Visible master", "Fourth row tail", "Control row", "自动换行随列宽变化并保留原始文字与工作簿默认字体。", "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz"]:
    assert re.sub(r"\s+", "", expected) in compact, expected
assert "\ufffd" not in text
links = []
pages = []
for index, page in enumerate(reader.pages, 1):
    sizes = sorted([float(page.mediabox.width), float(page.mediabox.height)])
    assert abs(sizes[0] - 595.28) < 2 and abs(sizes[1] - 841.89) < 2
    for reference in page.get("/Annots", []):
        annotation = reference.get_object()
        action = annotation.get("/A")
        if action and action.get("/S") == "/URI":
            links.append({"page": index, "uri": str(action.get("/URI")), "rect": list(annotation.get("/Rect", []))})
    pages.append({"page": index, "sizePt": [float(page.mediabox.width), float(page.mediabox.height)], "characters": len(page.extract_text() or "")})
assert {item["uri"] for item in links} >= {"https://example.com/native-text", "https://example.com/hidden-master"}
result = {"xlsx": books, "pdf": {"file": pdf_path.name, "sha256": hashlib.sha256(pdf_path.read_bytes()).hexdigest(), "pages": pages, "links": links, "text": text}, "layoutCheckedSeparately": "Browser geometry JSON and rendered PNG visual review"}
(directory / "independent-native-inspection.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"xlsx": len(books), "pdfPages": len(reader.pages), "pdfLinks": len(links), "cjkAndFullShrinkTextPreserved": True}, ensure_ascii=False))
