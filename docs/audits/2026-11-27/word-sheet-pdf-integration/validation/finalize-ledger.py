"""Bind the verified original acceptance records to their source commit."""
import json
import shutil
import subprocess
from collections import Counter
from pathlib import Path

BASE = Path(__file__).resolve().parent
REPO = next(p for p in BASE.parents if (p / 'pnpm-workspace.yaml').exists())
commit = subprocess.check_output(['git', 'rev-parse', '3c751e0'], cwd=REPO, text=True).strip()
path = REPO / 'docs/office-studio-goal-status-2026-11-23.json'
ledger = json.loads(path.read_text())
candidates = json.loads((BASE / 'acceptance-candidates.json').read_text())['items']
selected = {item['id']: item for item in candidates}
for item in ledger['items']:
    if item['id'] not in selected:
        continue
    if item['status'] == 'verified-original-acceptance':
        raise ValueError('Already finalized: ' + item['id'])
    candidate = selected[item['id']]
    item.setdefault('auditHistory', []).append({
        'status': item['status'], 'gaps': item['gaps'], 'currentAudit': item['currentAudit']
    })
    proof = [candidate['matrix']] + [str((BASE / name).relative_to(REPO)) for name in [
        'source-freeze-final.json', 'e2e-final-316.json',
        'continuation-native-summary.json', 'verification-final.json'
    ]]
    item['status'] = 'verified-original-acceptance'
    item['gaps'] = []
    item['evidence'] += proof
    item['currentAudit'] = {
        'date': '2026-11-27', 'sourceCommit': commit, 'implementation': '完整验收',
        'implementedBehavior': candidate['acceptance'], 'functionalGaps': [],
        'acceptance': 'original-ledger-acceptance-verified',
        'evidence': [{'path': p, 'line': 1, 'anchor': 'original acceptance evidence'} for p in proof],
        'existingTestFiles': candidate['requiredCurrentSpecs'],
        'testEvidenceNote': 'Individual matrices, native files and a single frozen 316/316 browser run verify original acceptance and applicable common criteria. No whole-goal completion claim.'
    }
ledger['currentImplementationCounts'] = dict(Counter(i['currentAudit']['implementation'] for i in ledger['items']))
ledger['verifiedOriginalAcceptanceCount'] = 15
ledger['remainingOriginalAcceptanceCount'] = 144
ledger['lastEvidenceUpdate'] = '2026-11-27'
ledger['lastIntegration'] = {
    'sourceCommit': commit, 'date': '2026-11-27', 'browserPassed': 316,
    'browserFailed': 0, 'browserSkipped': 0, 'browserRetries': 0,
    'verification': str((BASE / 'verification-final.json').relative_to(REPO))
}
path.write_text(json.dumps(ledger, ensure_ascii=False, indent=2) + chr(10))
path = REPO / 'docs/office-studio-current-audit-2026-11-25.md'
lines = path.read_text().splitlines()
lines[2] = '整体审计基线 2382530；后续按 JSON 中逐项日期与源码续验。2026-11-27 源码 3c751e0：15 项按原始验收闭环，144 项仍需完成。全部 159 项尚未完成。'
for index, line in enumerate(lines):
    if line.startswith('实现分类：'):
        lines[index] = '当前分类：' + '、'.join(k + ' ' + str(v) + ' 项' for k, v in ledger['currentImplementationCounts'].items()) + '。完整验收数按原始要求逐项登记。'
    if line.startswith('| '):
        cols = line.split('|')
        ident = cols[1].strip()
        if ident in selected:
            candidate = selected[ident]
            cols[3] = ' 完整验收 '
            cols[4] = ' ' + candidate['acceptance'] + '；逐项矩阵、整站316/316与原生重开已核验 '
            cols[5] = ' 原始验收已闭环 '
            cols[6] = ' ' + candidate['matrix'] + '；源码3c751e0 '
            lines[index] = '|'.join(cols)
path.write_text(chr(10).join(lines) + chr(10))
out = REPO / 'docs/office-continuation-2026-11-27'
out.mkdir(exist_ok=True)
for product in ['word', 'excel', 'pdf']:
    for suffix in ['md', 'json']:
        name = product + '-remaining-plan.' + suffix
        shutil.copyfile(REPO / '.release/office-continuation' / name, out / name)
print(json.dumps({'sourceCommit': commit, 'counts': ledger['currentImplementationCounts']}, ensure_ascii=False))
