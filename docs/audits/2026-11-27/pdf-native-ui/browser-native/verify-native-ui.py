from pathlib import Path
import hashlib
import json
import math
import re
from pypdf import PdfReader
from pypdf.generic import ArrayObject, IndirectObject

ROOT = Path(__file__).resolve().parent
PREFIXES = ["p012-freetext", "p014-markers", "p016-geometry", "gesture-history",
            "p015-discussion", "legacy-migration", "nonempty-recipe", "explicit-none"]


def digest(value):
    return hashlib.sha256(value).hexdigest()


def numbers(value):
    return [float(item) for item in value or []]


def contents(page):
    value = page.get("/Contents")
    if value is None:
        return []
    obj = value.get_object()
    values = list(obj) if isinstance(obj, ArrayObject) else [obj]
    return [digest(item.get_object()._data) for item in values]


def inspect(path):
    reader = PdfReader(path)
    fields = reader.get_fields() or {}
    annotations = []
    refs = {}
    for index, page in enumerate(reader.pages):
        for reference in page.get("/Annots", []):
            item = reference.get_object()
            identity = str(item.get("/ZuviAnnotationId") or item.get("/NM") or "")
            if isinstance(reference, IndirectObject):
                refs[(reference.idnum, reference.generation)] = identity
            ap = item.get("/AP")
            normal = ap.get_object().get("/N") if ap is not None else None
            normal = normal.get_object() if normal is not None else None
            record = {"id": identity, "page": index, "subtype": str(item.get("/Subtype")),
                      "contents": str(item.get("/Contents", "")), "rect": numbers(item.get("/Rect")),
                      "author": str(item.get("/T", "")), "created": str(item.get("/CreationDate", "")),
                      "modified": str(item.get("/M", "")), "opacity": float(item.get("/CA", 1)),
                      "color": numbers(item.get("/C")), "fill": numbers(item.get("/IC")),
                      "colorPresent": "/C" in item, "fillPresent": "/IC" in item,
                      "quads": numbers(item.get("/QuadPoints")), "vertices": numbers(item.get("/Vertices")),
                      "line": numbers(item.get("/L")), "lineEnds": [str(value) for value in item.get("/LE", [])],
                      "ink": [numbers(stroke) for stroke in item.get("/InkList", [])],
                      "state": str(item.get("/State", "")), "stateModel": str(item.get("/StateModel", "")),
                      "replyType": str(item.get("/RT", "")), "flags": int(item.get("/F", 0)),
                      "apSha256": digest(normal.get_data()) if hasattr(normal, "get_data") else None,
                      "appearance": normal.get_data().decode("latin1") if hasattr(normal, "get_data") else None}
            reply = item.get("/IRT")
            if isinstance(reply, IndirectObject):
                record["replyRef"] = [reply.idnum, reply.generation]
            owner = item.get("/P")
            if isinstance(owner, IndirectObject):
                expected = page.indirect_reference
                assert (owner.idnum, owner.generation) == (expected.idnum, expected.generation), (path, identity, "wrong /P")
            for key in ["rect", "color", "fill", "quads", "vertices", "line"]:
                assert all(math.isfinite(value) for value in record[key]), (path, identity, key)
            if record["subtype"] != "/Widget":
                assert identity, (path, "missing stable annotation ID")
                if record["subtype"] in ["/Highlight", "/Underline", "/StrikeOut", "/Squiggly"]:
                    assert len(record["quads"]) >= 8 and len(record["quads"]) % 8 == 0
            annotations.append(record)
    for record in annotations:
        if "replyRef" in record:
            record["replyTo"] = refs.get(tuple(record["replyRef"]))
            assert record["replyTo"], (path, record["id"], "dangling /IRT")
    ids = [record["id"] for record in annotations if record["id"]]
    assert len(ids) == len(set(ids)), (path, "duplicate annotation identities")
    return {"sha256": digest(path.read_bytes()), "pageCount": len(reader.pages),
            "rotations": [int(page.get("/Rotate", 0)) for page in reader.pages],
            "contents": [contents(page) for page in reader.pages], "annotations": annotations,
            "fields": {name: {"value": str(value.get("/V", "")), "flags": int(value.get("/Ff", 0))}
                       for name, value in fields.items()}}


def verify(path, prefix, reference):
    result = inspect(path)
    root = [item for item in result["annotations"] if item["subtype"] != "/Widget"]
    source_hashes = set(sum(reference["contents"], []))
    actual_hashes = set(sum(result["contents"], []))
    assert actual_hashes == source_hashes, (path, "native edits changed original Contents")
    expected_field = "Recipe current field" if prefix == "nonempty-recipe" else (
        "Accepted fields and annotations" if prefix in ["gesture-history", "p015-discussion"] else "Initial")
    assert result["fields"]["reviewer"]["value"] == expected_field, (path, "field lost")
    if prefix == "p012-freetext":
        assert len(root) == 1 and root[0]["subtype"] == "/FreeText"
        assert root[0]["contents"] == "中文原生批注\n第二行可编辑"
        assert root[0]["rect"] == [55.0, 500.0, 345.0, 580.0]
        assert root[0]["opacity"] == 0.65 and root[0]["apSha256"]
    elif prefix == "p014-markers":
        assert sorted(item["subtype"] for item in root) == ["/Highlight", "/Squiggly", "/StrikeOut", "/Underline", "/Underline"]
        assert all(len(item["quads"]) == 8 for item in root)
    elif prefix == "p016-geometry":
        assert sorted(item["subtype"] for item in root) == ["/Circle", "/Ink", "/Line", "/Line", "/PolyLine", "/Polygon", "/Square"]
        assert all(item["apSha256"] for item in root)
        assert all(item["lineEnds"] == ["/Circle", "/ClosedArrow"] for item in root if item["subtype"] == "/Line")
        assert next(item for item in root if item["subtype"] == "/Polygon")["vertices"] == [55, 340, 110, 390, 175, 345]
    elif prefix == "p015-discussion":
        assert any(item["contents"] == "浏览器新增便签" and item["subtype"] == "/Text" for item in root)
        for contents_text in ["第一条原生回复", "第二条原生回复"]:
            reply = next(item for item in root if item["contents"] == contents_text)
            assert reply["replyTo"] == "native-note" and reply["replyType"] == "/R"
            assert reply["author"] == "原生浏览器审阅者" and reply["created"]
    elif prefix == "legacy-migration":
        assert sorted(item["subtype"] for item in root) == ["/FreeText", "/Highlight", "/Ink", "/Square", "/Text"]
        assert next(item for item in root if item["subtype"] == "/Text")["replyType"] == "/R"
    elif prefix == "nonempty-recipe":
        assert result["pageCount"] == 3 and result["rotations"] == [0, 90, 0]
        assert {item["contents"] for item in root} == {"未保存记录原生中文", "复制记录有独立中文"}
    elif prefix == "explicit-none":
        assert sorted(item["subtype"] for item in root) == ["/FreeText", "/Highlight", "/Square"]
        for item in root:
            if item["subtype"] == "/FreeText":
                assert item["fillPresent"] and item["fill"] == []
                assert "Tj" in item["appearance"]
            else:
                assert item["colorPresent"] and item["color"] == []
            assert not re.search(r"(?:^|\s)(?:S|s|B|B\*|b|b\*|f|f\*|F)(?:\s|$)", item["appearance"])
    return result


reports = {}
for prefix in PREFIXES:
    source = ROOT / ("fixture-native-twelve-types.pdf" if prefix in ["gesture-history", "p015-discussion"] else "fixture-original.pdf")
    reference = inspect(source)
    for round_number in [1, 2]:
        path = ROOT / f"{prefix}-round-{round_number}.pdf"
        reports[path.name] = verify(path, prefix, reference)
    first, second = reports[f"{prefix}-round-1.pdf"], reports[f"{prefix}-round-2.pdf"]
    if prefix != "explicit-none":
        assert [(item["id"], item["created"], item["modified"], item["replyTo"] if "replyTo" in item else None)
                for item in first["annotations"]] == [(item["id"], item["created"], item["modified"], item.get("replyTo"))
                                                      for item in second["annotations"]], (prefix, "second save changed identity/time/thread")
    else:
        assert [item["id"] for item in first["annotations"]] == [item["id"] for item in second["annotations"]]
    print("verified independent pypdf", prefix, flush=True)
readonly = ROOT / "permissions-readonly.pdf"
assert readonly.read_bytes() == (ROOT / "fixture-native-locked-noap.pdf").read_bytes()
reports[readonly.name] = inspect(readonly)
assert next(item for item in reports[readonly.name]["annotations"] if item["id"] == "native-ui-locked-square")["flags"] & 64
assert next(item for item in reports[readonly.name]["annotations"] if item["id"] == "native-ui-noap-note")["apSha256"] is None
for name in ["p015-resolved.pdf", "p015-parent-deleted.pdf"]:
    reports[name] = inspect(ROOT / name)
assert any(item.get("replyTo") == "native-note" and item["state"] == "Completed" for item in reports["p015-resolved.pdf"]["annotations"])
assert not any(item["id"] == "native-note" or item.get("replyTo") == "native-note" for item in reports["p015-parent-deleted.pdf"]["annotations"])
(ROOT / "independent-pypdf.json").write_text(json.dumps({"status": "passed", "files": len(reports), "reports": reports}, ensure_ascii=False, indent=2))
print("passed", len(reports), "actual browser-produced PDFs", flush=True)
