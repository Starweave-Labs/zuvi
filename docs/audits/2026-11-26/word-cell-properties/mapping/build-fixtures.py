"""Create native OOXML fixtures without using an editor or a browser."""

from copy import copy
from hashlib import sha256
import json
from pathlib import Path
import re
import xml.etree.ElementTree as ET
from zipfile import ZipFile


HERE = Path(__file__).resolve().parent
ROOT = next(parent for parent in HERE.parents if (parent / "pnpm-workspace.yaml").exists())
REFERENCE_PATH = "docs/audits/2026-11-26/word-math-groups/math-source.docx"
REFERENCE = (ROOT / REFERENCE_PATH).read_bytes()
W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS = {"w": W}


def margin_xml(tag, values):
    items = "".join(
        f'<w:{side} w:w="{round(value * 20)}" w:type="dxa"/>'
        for side, value in values.items()
    )
    return f"<w:{tag}>{items}</w:{tag}>" if items else ""


def paragraph(text, *, bold=False, italic=False):
    marks = ("<w:b/>" if bold else "") + ("<w:i/>" if italic else "")
    properties = f"<w:rPr>{marks}</w:rPr>" if marks else ""
    return (
        '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr>'
        f"<w:r>{properties}<w:t>{text}</w:t></w:r></w:p>"
    )


def cell(texts, *, colspan=1, restart=False, continuation=False, margins=None, fill=None, bold=False, italic=False):
    properties = f'<w:gridSpan w:val="{colspan}"/>' if colspan > 1 else ""
    if restart:
        properties += '<w:vMerge w:val="restart"/>'
    if continuation:
        properties += "<w:vMerge/>"
    properties += margin_xml("tcMar", margins or {})
    if fill:
        properties += f'<w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>'
    content = "<w:p/>" if continuation else "".join(
        paragraph(text, bold=bold and index == 0, italic=italic and index == 0)
        for index, text in enumerate(texts)
    )
    return f"<w:tc><w:tcPr>{properties}</w:tcPr>{content}</w:tc>"


def row(cells, spacing=None):
    properties = ""
    if spacing == 0:
        properties = '<w:trPr><w:tblCellSpacing w:type="nil"/></w:trPr>'
    elif spacing is not None:
        properties = f'<w:trPr><w:tblCellSpacing w:w="{round(spacing * 10)}" w:type="dxa"/></w:trPr>'
    return f"<w:tr>{properties}{''.join(cells)}</w:tr>"


def table(rows, defaults, grid):
    grid_xml = "".join(f'<w:gridCol w:w="{width}"/>' for width in grid)
    return (
        '<w:tbl><w:tblPr><w:tblCellSpacing w:w="60" w:type="dxa"/>'
        f'{margin_xml("tblCellMar", defaults)}</w:tblPr><w:tblGrid>{grid_xml}</w:tblGrid>'
        f"{''.join(rows)}</w:tbl>"
    )


SECTION = (
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
    '<w:pgMar w:top="2268" w:right="2268" w:bottom="2268" w:left="2268" '
    'w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>'
)

merged = table(
    [
        row([
            cell(["Span A"] + [f"A line {index}" for index in range(1, 9)], restart=True,
                 margins={"top": 0, "right": 3.25}, fill="e8eef7", bold=True),
            cell(["Wide B"], colspan=2, margins={"bottom": 2}, fill="ecfdf5", italic=True),
        ]),
        row([
            cell([], continuation=True), cell(["Cell C"]), cell(["D first", "D last"], bold=True),
        ], spacing=12),
        row([
            cell(["Unselected E"], colspan=2, margins={"left": 1.5}, bold=True),
            cell(["Unselected F"], italic=True),
        ], spacing=0),
    ],
    {"top": 4, "right": 5, "bottom": 6, "left": 7},
    [2100, 2250, 2250],
)
inheritance = table(
    [
        row([
            cell(["Direct zero"], margins={"top": 0, "right": 3.5}, bold=True),
            cell(["Inherited", "Second paragraph"]),
        ]),
        row([
            cell(["Other direct"], margins={"bottom": 2.25, "left": 1.5}, italic=True),
            cell(["Last inherited"]),
        ], spacing=12),
    ],
    {"top": 6, "right": 7, "bottom": 8, "left": 9},
    [3300, 3300],
)

HERE.mkdir(parents=True, exist_ok=True)
(HERE / "source-reference.docx").write_bytes(REFERENCE)
fixtures = {}
with ZipFile(HERE / "source-reference.docx") as reference:
    source_xml = reference.read("word/document.xml").decode("utf-8")
    for name, title, native_table in [
        ("merged", "Mixed merged cell mapping", merged),
        ("inheritance", "Cell margin inheritance mapping", inheritance),
    ]:
        body = paragraph(title) + native_table + paragraph("After the mapping table") + SECTION
        document = re.sub(r"<w:body>[\s\S]*?</w:body>", f"<w:body>{body}</w:body>", source_xml, count=1)
        if document == source_xml:
            raise ValueError("Reference document has no replaceable native body")
        xml_path = HERE / f"{name}-source.xml"
        xml_path.write_text(document, encoding="utf-8")
        filename = HERE / f"{name}-source.docx"
        with ZipFile(filename, "w") as result:
            for entry in reference.infolist():
                result.writestr(copy(entry), document.encode("utf-8") if entry.filename == "word/document.xml" else reference.read(entry.filename))
        with ZipFile(filename) as result:
            if result.testzip() is not None:
                raise ValueError(f"Corrupt ZIP fixture {filename}")
            for entry in result.namelist():
                if entry.endswith(".xml") or entry.endswith(".rels"):
                    ET.fromstring(result.read(entry))
            root = ET.fromstring(result.read("word/document.xml"))
            native_rows = root.findall(".//w:tbl/w:tr", NS)
            if len(native_rows) != (3 if name == "merged" else 2):
                raise ValueError("Unexpected fixture row count")
        fixtures[name] = {
            "path": str(filename.relative_to(ROOT)),
            "sha256": sha256(filename.read_bytes()).hexdigest(),
            "bytes": filename.stat().st_size,
            "nativeRows": len(native_rows),
            "zipReadable": True,
            "xmlWellFormed": True,
        }

(HERE / "fixture.json").write_text(json.dumps({
    "status": "prepared-not-browser-verified",
    "referencePath": REFERENCE_PATH,
    "referenceSha256": sha256(REFERENCE).hexdigest(),
    "fixtures": fixtures,
    "nativeUnits": {"margins": "points * 20", "spacing": "physical gap points * 10"},
    "merged": {
        "gridTwips": [2100, 2250, 2250], "tablePhysicalGapPt": 6,
        "rowOverridePhysicalGapPt": [None, 12, 0],
        "logicalCells": [[0, 0, 1, 2], [0, 1, 2, 1], [1, 1, 1, 1], [1, 2, 1, 1], [2, 0, 2, 1], [2, 2, 1, 1]],
        "selection": "Real mouse from Span A rowspan to Wide B colspan forms the four-cell merge closure",
        "rows": "automatic only, no fixed height",
    },
    "inheritance": {
        "gridTwips": [3300, 3300], "tablePhysicalGapPt": 6,
        "rowOverridePhysicalGapPt": [None, 12],
        "directFirst": {"top": 0, "right": 3.5},
        "otherDirect": {"bottom": 2.25, "left": 1.5},
        "stages": ["restore first cell margins to null, two reopens", "clear default left and all spacing, direct top zero, two reopens"],
    },
    "page": {"paper": "A4", "uniformMarginMm": 40},
    "browserRun": False,
    "codecImportRun": False,
    "nativeVisualQa": "pending root bundled LibreOffice render and PNG inspection",
}, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"prepared": fixtures, "browserRun": False}, indent=2))
