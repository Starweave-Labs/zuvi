"""Record finite paragraph acceptance and distinguish historical browser bytes."""
from pathlib import Path
from datetime import datetime, timezone
import hashlib
import json
import subprocess
import zipfile
from xml.etree import ElementTree as ET

HERE = Path(__file__).resolve().parent
ROOT = next(parent for parent in HERE.parents if (parent / 'pnpm-workspace.yaml').exists())
W = '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'

def read(path):
    return json.loads(path.read_text())

def identity(path):
    data = path.read_bytes()
    return {'path': str(path.relative_to(ROOT)), 'bytes': len(data),
            'sha256': hashlib.sha256(data).hexdigest()}

def walk(suite):
    yield from suite.get('specs', [])
    for child in suite.get('suites', []):
        yield from walk(child)

ledger = {item['id']: item for item in read(ROOT / 'docs/onlyoffice-feature-ledger-2026-11-13.json')['items']}
previous = ROOT / 'docs/audits/2026-11-27/sheet-visibility'
report = read(previous / 'validation/resumed/full.json')
browser = [spec for suite in report['suites'] for spec in walk(suite)
           if spec['file'] in {'office-studio-word-paragraph.spec.ts',
                               'office-studio-word-tabs.spec.ts', 'office-studio-word-surface.spec.ts'}]
assert len(browser) == 4
for spec in browser:
    assert spec['ok'] and len(spec['tests']) == 1
    test = spec['tests'][0]
    assert test['status'] == 'expected' and len(test['results']) == 1
    assert test['results'][0]['status'] == 'passed' and test['results'][0]['retry'] == 0
frozen = {record['path']: record for record in read(previous / 'validation/initial/source-freeze.json')['source']}
names = [
    'StudioWord.tsx', 'StudioWordParagraphDialog.tsx', 'StudioWordTabsDialog.tsx',
    'StudioWordSurfaceDialog.tsx', 'studio-word-paragraph-format.ts',
    'studio-word-paragraph-layout.ts', 'studio-word-tab-extension.ts', 'studio-word-tabs.ts',
    'studio-word-tabs-dom.ts', 'studio-word-surface.ts', 'studio-word-surface-extension.ts',
    'studio-word-paragraph-layout.test.ts', 'studio-word-tabs.test.ts',
    'studio-word-surface.test.ts', 'StudioWordSurfaceDialog.test.tsx',
    'StudioWordParagraphDialogs.test.tsx',
]
paths = [ROOT / 'packages/ui/src/components/OfficeStudio' / name for name in names]
paths += [ROOT / name for name in [
    'docs/src/pages/collaboration/office-studio/studio-word-codec.ts',
    'docs/src/pages/collaboration/office-studio/studio-word-surface-codec.ts',
    'docs/src/pages/collaboration/office-studio/studio-print.ts',
    'docs/tests/office-studio-word.test.mjs', 'docs/tests/studio-print.test.mjs',
    'e2e/office-studio-word-paragraph.spec.ts', 'e2e/office-studio-word-tabs.spec.ts',
    'e2e/office-studio-word-surface.spec.ts', 'e2e/office-studio-word-paragraph-acceptance.spec.ts'
]]
source = []
for path in paths:
    record = identity(path)
    previous_record = frozen.get(record['path'])
    source.append({**record, 'previous317SourceMatches': previous_record is not None
                   and record['sha256'] == previous_record['sha256']})
receipt = read(previous / 'validation/resumed/full-restoration.json')
historical_artifacts = []
for record in receipt['retained']:
    if not any('/' + topic + '/' in '/' + record['path'] for topic in ['word-paragraph', 'word-tabs', 'word-surface']):
        continue
    path = ROOT / '.release/office-continuation/x030/validation/resumed/regenerated' / record['path']
    result = identity(path)
    assert all(result[key] == record['after'][key] for key in ['bytes', 'sha256'])
    if path.suffix == '.docx':
        with zipfile.ZipFile(path) as package:
            xml = ET.fromstring(package.read('word/document.xml'))
            paragraphs = []
            for p in xml.iter(W + 'p'):
                attrs = {}
                ppr = p.find(W + 'pPr')
                for node in list(ppr) if ppr is not None else []:
                    if node.tag in {W+'ind', W+'spacing', W+'jc', W+'shd'}:
                        attrs[node.tag.split('}')[-1]] = {k.split('}')[-1]: v for k,v in node.attrib.items()}
                    elif node.tag in {W+'tabs', W+'pBdr'}:
                        attrs[node.tag.split('}')[-1]] = [
                            {'element': child.tag.split('}')[-1],
                             'attrs': {k.split('}')[-1]: v for k,v in child.attrib.items()}}
                            for child in node]
                paragraphs.append({'text': ''.join(t.text or '' for t in p.iter(W+'t')), 'attrs': attrs})
            result['nativeParagraphs'] = paragraphs
    historical_artifacts.append(result)
assert len(historical_artifacts) == 29
logs = []
for name in ['dialogs-before.txt', 'dialogs-models-final.txt', 'component-current.txt',
             'native-print-current.txt', 'docs-types.txt', 'ui-types.txt', 'e2e-list.txt',
             'e2e-list-single.txt']:
    logs.append(identity(HERE / name))
assert '3 failed | 3 passed (6)' in (HERE / 'dialogs-before.txt').read_text()
assert '42 passed (42)' in (HERE / 'dialogs-models-final.txt').read_text()
assert '8 passed | 132 skipped (140)' in (HERE / 'component-current.txt').read_text()
assert '# pass 9' in (HERE / 'native-print-current.txt').read_text()
assert '# fail 0' in (HERE / 'native-print-current.txt').read_text()
result = {
    'reviewDate': '2026-11-28',
    'recordedAt': datetime.now(timezone.utc).isoformat(),
    'reviewedHead': subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
    'sourceState': 'Three independent dialog fixes plus independent component and browser tests are uncommitted; final source commit is assigned by root after integration.',
    'items': ['W011','W012','W013','W016'],
    'currentFocused': {'uiModelAndDialog':42,'actualWordComponent':8,'nativeAndPrint':9,
                       'nameFilteredComponentSkips':132,'nameFilteredNativeSkips':110},
    'uiTypecheck': "The first UI typecheck failed only in another task's StudioSheet.duplicates.test.tsx exact options. This is not reported as a passing check; root must complete final typecheck.",
    'browserRunWasRepeated':False, 'previous317Browser':browser,
    'previousBrowserIsFinalAfterDialogFixes':False,
    'sourceFiles':source, 'historicalArtifacts':historical_artifacts, 'logs':logs,
    'nextBrowserSpec':'e2e/office-studio-word-paragraph-acceptance.spec.ts',
    'nextBrowserOutput':str(HERE.relative_to(ROOT) / 'browser'),
    'whole159Complete':False,
}
(HERE/'source-and-evidence.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+chr(10))
UI = 'packages/ui/src/components/OfficeStudio/'
NATIVE = 'docs/tests/office-studio-word.test.mjs'
PRINT = 'docs/tests/studio-print.test.mjs'
E2E = 'e2e/office-studio-word-paragraph-acceptance.spec.ts'
def ref(path, line, note):
    return {'path': path, 'line': line, 'note': note}
current_dialog = [
    ref(UI+'StudioWordParagraphDialogs.test.tsx',62,'Twelve cases across all three dialogs: valid numeric composition/apply, IME Enter, invalid draft, permissions, IME Escape, failed onSave and cancellation.'),
    ref(UI+'StudioWordParagraphDialogs.test.tsx',103,'Permission changes retain the composing draft; composition ending does not bypass blocked state.'),
    ref(UI+'StudioWordParagraphDialogs.test.tsx',124,'Rejected save retains the draft; composition and cancellation do not issue another save.'),
]
entries = {
 'W011': {
  'behavior':'The four alignment values and positive first-line/negative hanging point indents are represented by the existing paragraph command, dialog and native codec. New browser coverage explicitly exercises all four alignment buttons and both special indents.',
  'originalEvidence':[ref(UI+'studio-word-paragraph-format.ts',48,'Validates left/center/right/justify and signed native point distances.'),
                      ref(UI+'studio-word-paragraph-layout.test.ts',139,'Mixed selected paragraphs/headings retain text/marks, use one transaction and preserve independent first-line positions.'),
                      ref(NATIVE,249,'Native both alignment, firstLine/hanging, left/right indent aliases and two saves retain point values and marks.')],
  'data':[ref(UI+'studio-word-paragraph-layout.test.ts',139,'Text, links and run formatting are unchanged for selected paragraphs/headings.'),
          ref(UI+'StudioWord.test.tsx',184,'Actual component applies mixed values once and retains untouched paragraph spacing.')],
  'focus':current_dialog+[ref(UI+'StudioWord.test.tsx',306,'Ruler preview does not write data; Escape restores preview before pointer release commits.')],
  'history':[ref(UI+'studio-word-paragraph-layout.test.ts',139,'Checks undo depth +1, exact original JSON on undo and corrected values on redo.'),ref(UI+'StudioWord.test.tsx',184,'Actual component invokes onChange once, then undo/redo restores each indent.')],
  'permissions':[ref(UI+'studio-word-paragraph-layout.test.ts',184,'Read-only rejects mutation.'),ref(UI+'StudioWord.test.tsx',211,'Open dialog retains invalid draft after readOnly change; input and apply disable.'),ref(UI+'StudioWord.test.tsx',290,'Disabled ruler cannot change data.')],
  'native':[ref(NATIVE,249,'Two native DOCX cycles preserve firstLine/hanging, left/right, alignment, text and bold.')],
  'failure':[ref(UI+'studio-word-paragraph-layout.test.ts',184,'Invalid mixed batch throws before editing any selected paragraph.'),ref(UI+'StudioWordParagraphDialogs.test.tsx',124,'Rejected onSave leaves draft open for correction/cancel.')],
  'pending':['Execute the new real editor spec for four alignment buttons, positive first-line and hanging values, then verify both native roundtrips and the final build/source identity.']
 },
 'W012': {
  'behavior':'Existing model uses auto multipliers and exact/atLeast points; native units are 240 per auto line and 20 per point. Independent style raw-unit inheritance is tested. New browser spec explicitly sets 1x and checks the actual computed lineHeight/fontSize ratio, then sets 1.5x, exact 18pt and minimum 24pt with before/after spacing. Both native rounds require the 1x paragraph to retain auto/line240.',
  'originalEvidence':[ref(UI+'studio-word-paragraph-format.ts',27,'Separates auto line units (240) from points (20).'),ref(UI+'studio-word-paragraph-layout.test.ts',130,'Native precision and multiplier/point validation.'),ref(UI+'studio-word-paragraph-layout.test.ts',226,'Inherited raw units and changes of inherited rule convert independently.'),ref(NATIVE,249,'auto/exact/atLeast import and repeated native serialization.')],
  'data':[ref(UI+'studio-word-paragraph-layout.test.ts',139,'Formatting preserves text/marks while setting spacing and native line rules.'),ref(UI+'StudioWord.test.tsx',184,'Untouched mixed spaceAfter values remain distinct.')],
  'focus':current_dialog+[ref(UI+'StudioWord.test.tsx',211,'Invalid numeric draft remains editable and cancel writes no data.')],
  'history':[ref(UI+'studio-word-paragraph-layout.test.ts',139,'One transaction includes line/paragraph spacing.'),ref(UI+'StudioWord.test.tsx',184,'Actual component one application, undo and redo.')],
  'permissions':[ref(UI+'studio-word-paragraph-layout.test.ts',184,'Read-only refuses the command.'),ref(UI+'StudioWord.test.tsx',211,'Permission change disables apply and fields without discarding draft.')],
  'native':[ref(NATIVE,249,'Native exact, minimum and auto units preserve point values over two saves.'),ref(NATIVE,289,'Independent style rule/value inheritance and explicit zero overrides preserve native units.'),ref(PRINT,120,'Print retains point geometry and exact/minimum rule metadata.')],
  'failure':[ref(UI+'studio-word-paragraph-layout.test.ts',184,'Invalid multiplier batch refuses before mutation.'),ref(UI+'StudioWordParagraphDialogs.test.tsx',83,'Invalid/blocked draft cancels without calling onSave.')],
  'pending':['Execute the authored 1x/1.5x/exact/minimum/before-after real-editor flow and inspect two native cycles, including the 1x computed ratio and auto/line240 assertions.','Complete the final shared build/type/lint/consumer/distribution gates.']
 },
 'W013': {
  'behavior':'Existing tab model includes left/center/right/decimal, dot leader, native direct deltas and clear directives. Measurement is a view decoration and retains the original tab characters. New local composition guard also blocks setting/clearing draft tab entries before composition ends.',
  'originalEvidence':[ref(UI+'studio-word-tabs.test.ts',52,'Calculates left/center/right/decimal alignment from following-text widths.'),ref(UI+'studio-word-tabs.test.ts',27,'Native precision, ordered stops and explicit clear directives.'),ref(NATIVE,212,'left/center/right/decimal definitions, dot/hyphen/underscore leaders and two native saves.')],
  'data':[ref(UI+'studio-word-tabs.test.ts',63,'Mixed selected paragraphs preserve text, marks and unmodified positions.'),ref(PRINT,107,'Print retains native tab text and measurement-only leaders.')],
  'focus':current_dialog+[ref(UI+'StudioWord.test.tsx',88,'Actual component opens the selected paragraphs, rejects invalid precision and cancel writes no data.')],
  'history':[ref(UI+'studio-word-tabs.test.ts',63,'One history entry, no-op is false, undo restores original JSON and redo retains tab characters.'),ref(UI+'StudioWord.test.tsx',88,'Actual entry applies once and restores stops by undo/redo.')],
  'permissions':[ref(UI+'studio-word-tabs.test.ts',63,'Readonly cannot clear stops.'),ref(UI+'studio-word-tab-extension.ts',22,'Command rejects destroyed/readOnly/composing editors before planning.'),ref(UI+'StudioWordParagraphDialogs.test.tsx',103,'Blocked dialog retains draft, application stays disabled after composition ends.')],
  'native':[ref(NATIVE,212,'Native definitions, leaders, inherited clears and default interval survive edit/two saves.'),ref(NATIVE,570,'Actual native tab characters, text and formatting survive repeated saves.')],
  'failure':[ref(NATIVE,238,'Unsupported/malformed/duplicate native tabs reject the complete document.'),ref(UI+'StudioWordParagraphDialogs.test.tsx',124,'Rejected onSave preserves the tab draft and cancellation does not resave.')],
  'pending':['Execute new spec after rebuilding to verify all four tab alignments/dot leaders and local IME guard against the current dialog source.','Reuse the old current-byte tab measurement/core native evidence only with its historical pre-dialog-fix classification; final current-build browser result is required.']
 },
 'W016': {
  'behavior':'Each top/right/bottom/left border has independent line style/width/distance/color; surface deltas retain untouched edges. Native nil clears and shading are preserved. New browser spec sets four different edges and separately removes all outer edges plus shading.',
  'originalEvidence':[ref(UI+'studio-word-surface.test.ts',65,'Validates native eighth-point widths, integral distances and supported line styles.'),ref(UI+'studio-word-surface.test.ts',89,'Mixed paragraphs retain each untouched edge while editing right edge and shading.'),ref(NATIVE,151,'Independent edges, distance, shading, text/marks and two native cycles.'),ref(NATIVE,166,'Explicit nil and inherited edges stay distinct.')],
  'data':[ref(UI+'studio-word-surface.test.ts',89,'Text, links and each unedited edge remain unchanged.'),ref(UI+'StudioWordSurfaceDialog.test.tsx',13,'Renaming a style retains untouched surface/tabs definitions.')],
  'focus':current_dialog+[ref(UI+'StudioWordSurfaceDialog.test.tsx',19,'Mixed edge draft invalid precision/cancel calls no onSave.')],
  'history':[ref(UI+'studio-word-surface.test.ts',89,'Selected surface command undoes to exact original and redoes edge properties.'),ref(UI+'studio-word-surface.test.ts',123,'Automatic-style updates share one undo group.')],
  'permissions':[ref(UI+'studio-word-surface.test.ts',132,'Readonly/composition refuse command without model/history changes.'),ref(UI+'StudioWordSurfaceDialog.test.tsx',39,'Permission change retains draft and disables apply.'),ref(UI+'StudioWordParagraphDialogs.test.tsx',103,'Composition and blocked state cannot race application.')],
  'native':[ref(NATIVE,151,'Native pBdr/shd edge styles, distance, shadow/frame and shaded pattern retain identity over two saves.'),ref(NATIVE,166,'Native explicit nil stays separate from inherited base edge.')],
  'failure':[ref(UI+'studio-word-surface.test.ts',132,'Invalid batch leaves complete original JSON unchanged.'),ref(UI+'StudioWordParagraphDialogs.test.tsx',124,'onSave exception leaves valid draft visible and cancel does not issue another save.')],
  'pending':['Execute new real-editor spec for each of four outer edges, independent styles/distance, clear-all borders and no-shading, then inspect two native reopens.','Final current-build browser evidence must include the local dialog IME fix; old surface screenshots and browser run remain historical.']
 },
}
matrix = {'reviewDate':'2026-11-28','status':'candidate-awaiting-final-integration',
          'reviewedHead':result['reviewedHead'],'finalSourceCommit':None,
          'sourceIdentity':'source-and-evidence.json','originalLedger':'docs/onlyoffice-feature-ledger-2026-11-13.json',
          'currentBrowserRun':{'status':'not-run-by-this-agent','spec':E2E},
          'whole159Complete':False,'items':[]}
keys=['data','focus','history','permissions','native','failure']
for item_id, details in entries.items():
    item=ledger[item_id]
    matrix['items'].append({
        'id':item_id,'feature':item['feature'],'originalAcceptance':item['acceptance'],
        'status':'candidate-awaiting-final-integration','currentBehavior':details['behavior'],
        'originalAcceptanceEvidence':details['originalEvidence'],
        'commonAcceptance':[{'criterion':criterion,'status':'focused-verified-awaiting-final-integration',
                             'currentEvidence':details[key]}
                            for criterion,key in zip(item['commonAcceptance'],keys)],
        'pending':details['pending'],
        'outOfScopeBlockersNotAdded':'No requirement for all fonts/directions/floats/pagination combinations is added to the original finite acceptance.'
    })
assert len(matrix['items']) == 4
assert all(len(item['commonAcceptance'])==6 for item in matrix['items'])
(HERE/'candidate-matrix.json').write_text(json.dumps(matrix,ensure_ascii=False,indent=2)+chr(10))
print(json.dumps({'status':'focused-verified-awaiting-final-browser','sourceFiles':len(source),
                  'historicalArtifactHashesVerified':len(historical_artifacts),'historicalBrowserSpecs':len(browser)},ensure_ascii=False))
