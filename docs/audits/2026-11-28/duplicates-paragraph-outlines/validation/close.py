"""Update only the original requirements proven by this completed integration."""
from collections import Counter
from copy import deepcopy
import json
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').exists())
OUT = ROOT / 'docs/audits/2026-11-28/duplicates-paragraph-outlines'
PREFIX = str(OUT.relative_to(ROOT))
def read(path):
    return json.loads(path.read_text())
def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
source = sys.argv[1]
assert subprocess.check_output(['git', 'rev-parse', source], cwd=ROOT, text=True).strip() == source
verification = read(OUT / 'verification.json')
assert verification['status'] == 'passed' and verification['browser']['expected'] == 319
assert verification['sourceCommit'] is None
verification['sourceCommit'] = source
save(OUT / 'verification.json', verification)
original = {item['id']: item for item in read(ROOT / 'docs/onlyoffice-feature-ledger-2026-11-13.json')['items']}
target = ROOT / 'docs/office-studio-goal-status-2026-11-23.json'
status = read(target)
completed = set(verification['originalAcceptanceCandidates'])
assert completed == {'X046', 'W011', 'W012', 'W013', 'W016'}
evidence = [PREFIX + '/' + path for path in [
    'original-acceptance-matrix.json', 'verification.json', 'validation/full.json',
    'validation/source-freeze.json', 'validation/word-native-final.json', 'validation/gates.json'
]]
word_matrix = read(OUT / 'paragraph/candidate-matrix.json')
matrix = {'date': '2026-11-28', 'sourceCommit': source, 'whole159Complete': False,
          'P003Complete': False, 'items': []}
duplicate_notes = [
    'Typed exact tuples distinguish numbers/text/booleans/true blank/explicit empty text/formula results. Stable first records, optional header and comparison columns; source formatting and hyperlinks move, outside cells/dimensions/sheets remain.',
    'Actual component retains selection and grid focus, refuses IME and invalid cell drafts, preserves invalid column choices, cancels without a data write and closes stale external documents.',
    'Actual imported XLSX workflow and component test verify exactly one undo/redo for the complete removal. Duplicate-free no-op keeps document identity and adds no history.',
    'readOnly and disabled guard the actual write entry and open configuration; permission changes retain configuration. Actual browser verifies read-only write refusal.',
    'Actual browser imports source XLSX, selects columns and header, removes duplicates, downloads/reopens twice; independent ZIP/XML verifies typed empty values, formula/cache and outside cells. Five native tests cover style defaults, links and external ranges.',
    'Merges, arrays, protected/rule intersections, invalid comparisons and unsafe references reject atomically. Source model and native input bytes remain unchanged. No record or hyperlink is partially moved.'
]
for item in status['items']:
    assert item['acceptance'] == original[item['id']]['acceptance']
    assert item['commonAcceptance'] == original[item['id']]['commonAcceptance']
    if item['id'] not in completed and item['id'] != 'P003':
        continue
    item.setdefault('auditHistory', []).append({key: deepcopy(item[key]) for key in ['status', 'gaps', 'currentAudit']})
    if item['id'] == 'P003':
        files = [PREFIX + '/pdf-outlines/design.md', PREFIX + '/pdf-outlines/final-2026-11-28/verification.json', PREFIX + '/verification.json']
        gaps = [
            '独立目录内核尚未接入宿主可序列化模型、来源身份绑定与导入导出。',
            '层级面板、原目录导航、权限/IME/焦点/取消、Blob/模型配对历史、页面命令目标同步及真实浏览器两轮保存重开尚未完成。'
        ]
        item['status'] = 'audited-partial-acceptance-pending'
        item['gaps'] = gaps
        item['evidence'] = list(dict.fromkeys(item['evidence'] + files))
        item['currentAudit'] = {
            'date': '2026-11-28', 'sourceCommit': source, 'implementation': '部分实现',
            'implementedBehavior': '独立 loaded-PDF 目录树读取、层级纯编辑及原生写入；稳定页身份、标准视图与命名目标、被动动作和私有字典保全。',
            'functionalGaps': gaps, 'acceptance': 'not-proven-complete',
            'evidence': [{'path': path, 'line': 1, 'anchor': 'standalone kernel milestone only'} for path in files],
            'existingTestFiles': ['docs/tests/studio-pdf-outlines.test.mjs'],
            'testEvidenceNote': 'Nine native tests and three independently inspected PDF samples pass; actual editor integration and original P003 acceptance remain incomplete.'
        }
        continue
    item['status'] = 'verified-original-acceptance'
    item['gaps'] = []
    item['evidence'] = list(dict.fromkeys(item['evidence'] + evidence))
    tests = (['packages/ui/src/components/OfficeStudio/studio-sheet-duplicates.test.ts',
              'packages/ui/src/components/OfficeStudio/StudioSheet.duplicates.test.tsx',
              'docs/tests/studio-sheet-duplicates.test.mjs', 'e2e/office-studio-sheet-duplicates.spec.ts']
             if item['id'] == 'X046' else
             ['packages/ui/src/components/OfficeStudio/StudioWordParagraphDialogs.test.tsx',
              'docs/tests/office-studio-word.test.mjs', 'docs/tests/studio-print.test.mjs',
              'e2e/office-studio-word-paragraph-acceptance.spec.ts'])
    item['currentAudit'] = {
        'date': '2026-11-28', 'sourceCommit': source, 'implementation': '完整验收',
        'implementedBehavior': item['acceptance'], 'functionalGaps': [],
        'acceptance': 'original-ledger-acceptance-verified',
        'evidence': [{'path': path, 'line': 1, 'anchor': 'final original and applicable common acceptance'} for path in evidence],
        'existingTestFiles': tests,
        'testEvidenceNote': 'The final frozen 319/319 browser run, source/build identities, full unit/gate logs and independent DOCX/XLSX checks prove the finite original requirements. Initial failures remain archived; no whole-goal completion claim.'
    }
    if item['id'] == 'X046':
        assert len(item['commonAcceptance']) == len(duplicate_notes)
        candidate = {'id': item['id'], 'originalAcceptance': item['acceptance'],
                     'commonAcceptance': [{'criterion': criterion, 'evidence': note, 'status': 'verified'}
                                          for criterion, note in zip(item['commonAcceptance'], duplicate_notes)]}
    else:
        candidate = deepcopy(next(row for row in word_matrix['items'] if row['id'] == item['id']))
        assert candidate['originalAcceptance'] == item['acceptance']
        for criterion in candidate['commonAcceptance']:
            criterion['status'] = 'verified'
            criterion['finalEvidence'] = evidence
    candidate['status'] = 'verified-original-acceptance'
    candidate['sourceCommit'] = source
    candidate['finalBrowserReport'] = PREFIX + '/validation/full.json'
    matrix['items'].append(candidate)
assert len(matrix['items']) == 5
save(OUT / 'original-acceptance-matrix.json', matrix)
count = sum(item['status'] == 'verified-original-acceptance' for item in status['items'])
assert count == 22 and len(status['items']) == 159
status['verifiedOriginalAcceptanceCount'] = count
status['remainingOriginalAcceptanceCount'] = 159 - count
status['currentImplementationCounts'] = dict(Counter(item['currentAudit']['implementation'] for item in status['items']))
status['completionProven'] = False
status['lastEvidenceUpdate'] = '2026-11-28'
status.setdefault('integrationHistory', []).append(status['lastIntegration'])
status['lastIntegration'] = {'sourceCommit': source, 'date': '2026-11-28', 'browserPassed': 319,
                             'browserFailed': 0, 'browserSkipped': 0, 'browserRetries': 0,
                             'verification': PREFIX + '/verification.json'}
save(target, status)
remaining = [item for item in status['items'] if item['status'] != 'verified-original-acceptance']
by_product, by_phase = Counter(item['product'] for item in remaining), Counter(item['phase'] for item in remaining)
progress = ROOT / 'docs/office-continuation-2026-11-27/current-progress.md'
progress.write_text(
    '# OfficeStudio 当前进度（2026-11-28）\n\n源码：' + source + '。原始159项已完整验收22项，剩余137项。'
    '本批收口X046与W011/W012/W013/W016；P003仅目录内核里程碑，仍未完成。'
    '完整319/319、UI2936、docs680及公共门禁通过，证据在 ../audits/2026-11-28/duplicates-paragraph-outlines/。\n\n'
    '| 产品 | 待完成原始条目 |\n| --- | ---: |\n' +
    ''.join('| ' + product + ' | ' + str(by_product[product]) + ' |\n' for product in ['Word','Excel','PDF']) +
    '\n| 原始阶段 | 待完成条目 |\n| --- | ---: |\n' +
    ''.join('| ' + str(index) + ' | ' + str(by_phase[index]) + ' |\n' for index in range(1,5)) +
    '\n下一步：PDF P003目录树宿主模型、来源身份及实际层级界面和配对历史接线；Excel X043排序扩选或X044完整筛选；'
    'Word按原始要求继续样式/编号等已有功能收口。三份remaining-plan保留当时拆分，当前数量以本文件及目标状态JSON为准。\n')
plan = ROOT / 'docs/office-studio-completion-2026-11-22.md'
with plan.open('a') as stream:
    stream.write('\n2026-11-28 原始验收续补（源码' + source + '）：X046补齐表头/比较列/类型空值/稳定首条及删除计数，选区内压缩、格式和原生链接移动、尾清空、一次历史和两轮XLSX。修复旧格式残留、显式空文本导出为空白、外表范围尾端错误迁移；比较错误和合并/数组/保护/规则或不安全引用整批拒绝。Word三个段落弹窗补齐局部IME守卫，W011/W012/W013/W016按四对齐/首行悬挂、1倍/1.5倍/固定/最小行距、四类制表位前导符、每边线型距离/底纹清除及两轮DOCX/XML闭环。P003独立读写/纯树编辑内核九项原生通过，真实界面和配对历史尚未接入，保持部分实现。全UI2936/docs680、类型/lint/Registry92/消费者410/构建/browser/分发/入口124129<124928通过，冻结整站319/319零跳过零重试。当前完整验收22项、剩余137项；源码冻结、原生独立检查、失败日志、历史恢复回执见docs/audits/2026-11-28/duplicates-paragraph-outlines/，159项目标仍未完成。\n')
print(json.dumps({'sourceCommit':source,'verified':count,'remaining':159-count,'P003Complete':False}))
