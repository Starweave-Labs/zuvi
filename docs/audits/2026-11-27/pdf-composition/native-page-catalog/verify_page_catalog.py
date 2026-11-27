from pathlib import Path
import hashlib
import json
from pypdf import PdfReader

folder = Path('/tmp/zuvi-pdf-page-catalog-native/output/pdf')
expected = {
    'catalog-complex-original.pdf': {
        'labels': ['前言-iii', '前言-iv', '正文-8', '正文-9', 'Appendix-B'],
        'print': [0, 1, 3, 4],
        'pages': ['SRC_PAGE_1', 'SRC_PAGE_2', 'SRC_PAGE_3', 'SRC_PAGE_4', 'SRC_PAGE_5'],
        'widgets': 2,
    },
    'catalog-complex-prepared.pdf': {
        'labels': ['前言-iv', '2', '前言-iv', 'Appendix-B', '前言-iii', '正文-9'],
        'print': [0, 0, 2, 5],
        'pages': ['SRC_PAGE_2', None, 'SRC_PAGE_2', 'SRC_PAGE_5', 'SRC_PAGE_1', 'SRC_PAGE_4'],
        'widgets': 2,
    },
    'catalog-complex-extracted.pdf': {
        'labels': ['正文-9', '2', 'Appendix-B', '前言-iv'],
        'print': [0, 0, 2, 3],
        'pages': ['SRC_PAGE_4', None, 'SRC_PAGE_5', 'SRC_PAGE_2'],
        'widgets': 1,
    },
}

def ref_id(value):
    return (value.idnum, value.generation)

results = []
for file, contract in expected.items():
    reader = PdfReader(folder / file)
    assert reader.page_labels == contract['labels'], (file, reader.page_labels)
    prefs = reader.trailer['/Root']['/ViewerPreferences']
    assert list(prefs['/PrintPageRange']) == contract['print']
    assert len(reader.pages) == len(contract['pages'])
    values = reader.get_fields()
    assert values['Shared']['/V'] == 'Current'
    assert values['Shared']['/DV'] == 'Default'
    owners = {}
    for index, page in enumerate(reader.pages):
        text = page.extract_text()
        expected_text = contract['pages'][index]
        if expected_text is None:
            assert not text.strip(), (file, index, text)
        else:
            assert expected_text in text, (file, index, text)
        for ref in page.get('/Annots', []):
            widget = ref.get_object()
            if widget.get('/Subtype') == '/Widget':
                assert ref_id(ref) not in owners
                owners[ref_id(ref)] = ref_id(page.indirect_reference)
                assert ref_id(widget.raw_get('/P')) == owners[ref_id(ref)]
    widget_count = 0
    appearances = []
    for field_ref in reader.trailer['/Root']['/AcroForm']['/Fields']:
        field = field_ref.get_object()
        for widget_ref in field.get('/Kids', []):
            widget = widget_ref.get_object()
            assert widget.get('/Subtype') == '/Widget'
            assert ref_id(widget.raw_get('/Parent')) == ref_id(field_ref)
            assert ref_id(widget_ref) in owners
            appearance = widget['/AP']['/N']
            assert len(appearance.get_data()) > 0
            appearances.append(hashlib.sha256(appearance.get_data()).hexdigest())
            widget_count += 1
    assert widget_count == contract['widgets']
    metadata = reader.trailer['/Root']['/Metadata'].get_data()
    assert metadata == b'<x:xmpmeta>preserved</x:xmpmeta>'
    results.append({
        'file': file,
        'pageCount': len(reader.pages),
        'labels': reader.page_labels,
        'printRange': list(prefs['/PrintPageRange']),
        'fieldValue': values['Shared']['/V'],
        'fieldDefault': values['Shared']['/DV'],
        'widgets': widget_count,
        'appearanceHashes': appearances,
        'metadataHash': hashlib.sha256(metadata).hexdigest(),
    })

target = folder / 'independent-page-catalog-verification.json'
target.write_text(json.dumps(results, ensure_ascii=False, indent=2))
print(json.dumps(results, ensure_ascii=False, indent=2))
