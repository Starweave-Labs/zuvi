from copy import deepcopy
from pathlib import Path
import json
import subprocess
import sys

HERE=Path(__file__).resolve().parent
ROOT=next(p for p in HERE.parents if (p/'pnpm-workspace.yaml').exists())
OUT=ROOT/'docs/audits/2026-11-28/sheet-sort-ranges'
PREFIX=str(OUT.relative_to(ROOT))
def read(path):
    return json.loads(path.read_text())
def save(path,value):
    path.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n')
source=sys.argv[1]
assert subprocess.check_output(['git','rev-parse',source],cwd=ROOT,text=True).strip()==source
verification=read(OUT/'verification.json')
assert verification['status']=='passed' and verification['sourceCommit'] is None
verification['sourceCommit']=source
save(OUT/'verification.json',verification)
path=ROOT/'docs/office-studio-goal-status-2026-11-23.json'
status=read(path)
item=next(item for item in status['items'] if item['id']=='X043')
item.setdefault('auditHistory',[]).append({key:deepcopy(item[key]) for key in ['status','gaps','currentAudit']})
assert item['status']!='verified-original-acceptance'
evidence=[PREFIX+'/'+name for name in ['README.md','verification.json','validation/full.json','validation/source-freeze.json','validation/native-first.txt']]
item['evidence']=list(dict.fromkeys(item['evidence']+evidence))
item['gaps']=['扩展选区询问以及多关键字实际流程的完整原始验收仍待补齐。']
item['currentAudit']={
    'date':'2026-11-28','sourceCommit':source,'implementation':'基础实现',
    'implementedBehavior':'多键优先级/方向、稳定排序；修复外表A1区域尾端继承限定符，记录移动后完整保留外表区域及缓存。本表同记录区域分别迁移，越界或不安全依赖整次拒绝。',
    'functionalGaps':item['gaps'],'acceptance':'not-proven-complete',
    'evidence':[{'path':name,'line':1,'anchor':'bounded sorting reference fix; original X043 remains incomplete'} for name in evidence],
    'existingTestFiles':['packages/ui/src/components/OfficeStudio/studio-sheet-sort-ranges.test.ts',
                         'docs/tests/studio-sheet-sort-ranges.test.mjs',
                         'e2e/office-studio-sheet-sort-ranges.spec.ts'],
    'testEvidenceNote':'Current source passes UI2941/docs682, all public gates and all16 Excel browser tests. Preceding319 whole-site run is bound to db48794; no claim of a whole-site rerun after this local fix.'
}
assert status['verifiedOriginalAcceptanceCount']==22 and status['remainingOriginalAcceptanceCount']==137
status['lastPatch']={'date':'2026-11-28','sourceCommit':source,'item':'X043','complete':False,
                     'browserScope':'Excel','browserPassed':16,'wholeSiteRerunAfterPatch':False,
                     'verification':PREFIX+'/verification.json'}
status['lastEvidenceUpdate']='2026-11-28'
save(path,status)
progress=ROOT/'docs/office-continuation-2026-11-27/current-progress.md'
with progress.open('a') as stream:
    stream.write('\n同日后续排序修复：源码'+source+'。已修复X043记录排序时外表区域尾端被改写的问题，实际计算值与两轮原生公式/缓存保持。修复后全UI2941/docs682及公共门禁、全部16项Excel浏览器通过；未再跑整站，前述319结果绑定db48794。X043仍缺扩选及完整多键原始验收，不新增完成数。归档：../audits/2026-11-28/sheet-sort-ranges/。\n')
plan=ROOT/'docs/office-studio-completion-2026-11-22.md'
with plan.open('a') as stream:
    stream.write('\n2026-11-28 X043局部续修（源码'+source+'）：交叉检查证实旧排序把Other!A4:B4改为Other!A4:B2，计算300变333；已按完整区域token保留继承外表限定符，本表同记录区域两端各自迁移，固定行保持，不安全范围整次拒绝。新增5项模型、2项原生两轮及真实排序/历史/下载重开浏览器；全UI2941/docs682、类型/lint/Registry/消费者/构建/browser/分发/体积及全部Excel16项通过。前述整站319绑定db48794，此局部补丁后未再跑整站，记录分别保留。X043仍待扩选和完整多键验收，完成数保持22、剩137。证据在docs/audits/2026-11-28/sheet-sort-ranges/。\n')
print(json.dumps({'sourceCommit':source,'excelBrowser':16,'verified':22,'remaining':137,'X043Complete':False}))
