from pathlib import Path
import hashlib
import json
import shutil
import subprocess
import zipfile
from xml.etree import ElementTree as ET

BASE = Path(__file__).resolve().parent
HERE = BASE / 'final'
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').exists())
OUT = ROOT / 'docs/audits/2026-11-28/sheet-sort-ranges'
def read(path):
    return json.loads(path.read_text())
def ident(path):
    data = path.read_bytes()
    return {'path':str(path.relative_to(ROOT)), 'bytes':len(data), 'sha256':hashlib.sha256(data).hexdigest()}
def copy(source, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    assert not destination.exists()
    shutil.copy2(source,destination)
    assert ident(source)['sha256'] == ident(destination)['sha256']
status = read(HERE / 'full-status.json')
report = read(HERE / 'full.json')
assert status['status']=='completed' and status['exitCode']==0
assert status['workers']==1 and status['retries']==0
assert report['stats']==status['stats'] and not report['errors']
stats=report['stats']
assert stats['expected']==16 and all(stats[key]==0 for key in ['unexpected','skipped','flaky'])
assert len(read(HERE/'gates.json'))==11 and all(step['exitCode']==0 for step in read(HERE/'gates.json'))
assert '2941 passed (2941)' in (HERE/'ui.txt').read_text()
for token in ['# pass 682','# fail 0','# skipped 0']:
    assert token in (HERE/'docs.txt').read_text()
subprocess.run(['python3','-B',str(HERE/'run-sheet.py'),'verify'],cwd=ROOT,check=True)
assert not OUT.exists()
OUT.mkdir(parents=True)
for path in sorted(HERE.iterdir()):
    if path.is_file():
        copy(path,OUT/'validation'/path.name)
for path in sorted((BASE.parent/'browser').iterdir()):
    if path.is_file():
        copy(path,OUT/'browser'/path.name)
for path in sorted(BASE.iterdir()):
    if path.is_file():
        copy(path,OUT/'validation/initial'/path.name)
for path in sorted((BASE/'full-output').rglob('*')):
    if path.is_file():
        copy(path,OUT/'validation/initial/full-output'/path.relative_to(BASE/'full-output'))
prior=ROOT/'.release/office-continuation/2026-11-28-integration'
for name in ['known-sorting-range.md','known-sorting-range.json','sort-range-fix.patch','sort-range-fix-runtime.json']:
    copy(prior/name,OUT/'before-fix'/name)
S='{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
native=[]
for path in sorted((OUT/'browser').glob('*.xlsx')):
    with zipfile.ZipFile(path) as package:
        xml=ET.fromstring(package.read('xl/worksheets/sheet1.xml'))
        cells={cell.attrib['r']:cell for cell in xml.iter(S+'c')}
        actual={}
        if path.name!='source.xlsx':
            for old,new,value in [(4,2,300),(3,3,30),(2,4,3)]:
                for column,formula in [('C',f'SUM(Other!A{old}:B{old})'),
                                       ('D',f"SUM('Other quoted'!$A{old}:B$"+f"{old})")]:
                    cell=cells[column+str(new)]
                    assert cell.findtext(S+'f')==formula and float(cell.findtext(S+'v'))==value
                    actual[column+str(new)]={'formula':formula,'cache':value}
        native.append({**ident(path),'verifiedNativeCells':actual})
assert len(native)==3
prior_verification=read(ROOT/'docs/audits/2026-11-28/duplicates-paragraph-outlines/verification.json')
result={'date':'2026-11-28','status':'passed','sourceCommit':None,
        'originalItem':'X043','X043Complete':False,'whole159Complete':False,
        'browserScope':'all 16 Excel browser tests','browser':stats,
        'uiPassed':2941,'docsPassed':682,'nativeFiles':native,
        'previousWholeSite':{'sourceCommit':prior_verification['sourceCommit'],'passed':319,
                             'verification':'docs/audits/2026-11-28/duplicates-paragraph-outlines/verification.json'},
        'wholeSiteRerunAfterPatch':False,
        'historicalFilesRestored':read(HERE/'restoration.json')['verifiedHistoricalFiles']}
(OUT/'verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'status':'passed','excelBrowser':stats['expected'],'ui':2941,'docs':682}))
