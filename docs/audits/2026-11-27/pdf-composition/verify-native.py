"""Independently verify the PDFs downloaded by the actual P008 browser workflow."""

from collections import Counter
from hashlib import sha256
import json
from pathlib import Path

from pypdf import PdfReader
from pypdf.generic import DictionaryObject, IndirectObject, StreamObject


BASE = Path(__file__).resolve().parent


def key(reference):
    if not isinstance(reference, IndirectObject):
        reference = getattr(reference, "indirect_reference", None)
    assert reference is not None, "Every tested field and widget is indirect"
    return reference.idnum, reference.generation


def plain(value):
    if isinstance(value, IndirectObject):
        return plain(value.get_object())
    if isinstance(value, list):
        return [plain(item) for item in value]
    return str(value) if value is not None else None


def appearance(widget):
    normal = widget["/AP"]["/N"]
    if isinstance(normal, StreamObject):
        data = normal.get_data()
        assert data, "Normal appearance stream must paint a nonempty appearance"
        return {"stream": sha256(data).hexdigest()}
    assert isinstance(normal, DictionaryObject)
    states = {}
    for state, reference in normal.items():
        stream = reference.get_object()
        assert isinstance(stream, StreamObject) and stream.get_data()
        states[str(state)] = sha256(stream.get_data()).hexdigest()
    assert states and widget["/AS"] in normal, "Selected appearance state must resolve"
    return states


def inspect(filename, labels, expected_fields):
    path = BASE / filename
    reader = PdfReader(path, strict=True)
    assert not reader.is_encrypted
    assert len(reader.pages) == len(labels)
    fields = reader.get_fields() or {}
    assert set(fields) == set(expected_fields), (filename, list(fields))
    for name, expected in expected_fields.items():
        for property_name, value in expected.items():
            assert plain(fields[name].get(property_name)) == value, (filename, name, property_name)

    # Independently traverse canonical AcroForm roots and their parent/kid edges.
    canonical = {}
    tree_widgets = {}
    visited = set()

    def walk(reference, parent=None, name="", terminal=None):
        identity = key(reference)
        assert identity not in visited, "Canonical field tree cannot repeat or cycle"
        visited.add(identity)
        node = reference.get_object()
        assert isinstance(node, DictionaryObject)
        if parent is not None:
            assert key(node.raw_get("/Parent")) == key(parent)
        if "/T" in node:
            name = ".".join(part for part in [name, str(node["/T"])] if part)
            if name in fields:
                assert name not in canonical
                canonical[name] = reference
                terminal = reference
        if node.get("/Subtype") == "/Widget":
            assert terminal is not None and name in fields
            tree_widgets[identity] = (name, node)
        for child in node.get("/Kids", []):
            walk(child, reference, name, terminal)

    for reference in reader.trailer["/Root"]["/AcroForm"]["/Fields"]:
        walk(reference)
    assert set(canonical) == set(fields)

    page_widgets = Counter()
    details = {name: [] for name in fields}
    pages = []
    for index, page in enumerate(reader.pages):
        text = page.extract_text()
        assert labels[index] in text, (filename, index, text)
        assert page.get_contents() is not None
        page.get_contents().get_data()
        pages.append({"label": labels[index], "mediaBox": list(map(float, page.mediabox))})
        for reference in page.get("/Annots", []):
            widget = reference.get_object()
            assert isinstance(widget, DictionaryObject), "Page annotation must not dangle"
            if widget.get("/Subtype") != "/Widget":
                continue
            identity = key(reference)
            assert identity in tree_widgets
            name, _ = tree_widgets[identity]
            page_widgets[identity] += 1
            assert key(widget.raw_get("/P")) == key(page)
            value_owner = widget
            parent_keys = set()
            while "/V" not in value_owner and "/Parent" in value_owner:
                parent = value_owner.raw_get("/Parent")
                assert key(parent) not in parent_keys
                parent_keys.add(key(parent))
                value_owner = parent.get_object()
            assert plain(value_owner.get("/V")) == plain(fields[name].get("/V"))
            details[name].append({"page": index + 1, "appearance": appearance(widget)})
    assert set(page_widgets) == set(tree_widgets)
    assert all(count == 1 for count in page_widgets.values())

    return reader, {"file": filename, "bytes": path.stat().st_size,
                    "sha256": sha256(path.read_bytes()).hexdigest(), "pages": pages,
                    "fields": {name: {"type": str(field["/FT"]), "value": plain(field.get("/V")),
                                      "defaultValue": plain(field.get("/DV")), "widgets": details[name]}
                               for name, field in fields.items()}}


COMMON = {"Text": {"/V": "合并前的中文"}, "Date": {"/V": "2026-11-26"},
          "Image": {"/FT": "/Btn"}, "Checked": {"/V": "/Yes", "/DV": "/Yes"},
          "Choice": {"/V": "/0", "/DV": "/0"}, "Drop": {"/V": "Two"},
          "List": {"/V": ["Alpha", "Gamma"]},
          "Vendor": {"/FT": "/VendorPassive", "/V": "PASSIVE"}}
SOURCE = {**COMMON, "Text": {"/V": "Native text"}}
COMBINED = {**COMMON, "Text__2": {"/V": "Incoming"}}
LABELS = ["SEVEN_PAGE_1", "INCOMING_PAGE_2", "INCOMING_PAGE_1", "SEVEN_PAGE_2", "SEVEN_PAGE_1"]
reports = []
_, primary = inspect("primary-source.pdf", ["SEVEN_PAGE_1", "SEVEN_PAGE_2"], SOURCE)
reports.append(primary)
_, history = inspect("before-composition-history.pdf", ["SEVEN_PAGE_1", "SEVEN_PAGE_2", "SEVEN_PAGE_1"], COMMON)
reports.append(history)
for round_number in [1, 2]:
    reader, report = inspect(f"combined-round-{round_number}.pdf", LABELS, COMBINED)
    assert [widget["page"] for widget in report["fields"]["Text"]["widgets"]] == [1, 5]
    for name in ["Date", "Image", "Checked", "Choice", "Drop", "List", "Vendor"]:
        source_appearances = [widget["appearance"] for widget in primary["fields"][name]["widgets"]]
        assert all(widget["appearance"] in source_appearances for widget in report["fields"][name]["widgets"])
    links = [annotation.get_object() for annotation in reader.pages[2]["/Annots"]
             if annotation.get_object().get("/Subtype") == "/Link"]
    assert len(links) == 1 and key(links[0]["/Dest"][0]) == key(reader.pages[1])
    reports.append(report)
assert (BASE / "combined-round-1.pdf").read_bytes() == (BASE / "combined-round-2.pdf").read_bytes(), "Unchanged reopen/export is byte stable"
for filename, value in [("radio-cleared.pdf", "/Off"), ("radio-round-1.pdf", "/0"), ("radio-round-2.pdf", "/0")]:
    _, report = inspect(filename, ["RADIO_PAGE_1"], {"Choice": {"/V": value, "/DV": "/0"}})
    reports.append(report)

snapshot = json.loads((BASE / "paired-history-and-refresh.json").read_text())
assert snapshot["before"]["sourceHash"] == snapshot["undone"]["sourceHash"] == primary["sha256"]
assert snapshot["combined"]["sourceHash"] == snapshot["fresh"]["sourceHash"]
assert snapshot["combined"]["document"]["marks"] == snapshot["fresh"]["document"]["marks"]
assert snapshot["errors"] == []
output = {"tool": "pypdf", "checks": "canonical field tree, unique page widgets, V/DV, AP state/data, unchanged appearances, page order/resources, links, byte-stable reopens and paired history", "files": reports}
(BASE / "independent-native-verification.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
print(json.dumps({"verified": len(reports), "output": str(BASE / "independent-native-verification.json")}, ensure_ascii=False))
