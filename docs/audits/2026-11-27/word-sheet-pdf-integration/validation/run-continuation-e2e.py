from pathlib import Path
import datetime,json,os,subprocess
p=Path(__file__).resolve().parent
status=p/'e2e-continuation-status.json'
if status.exists() or (p/'e2e-continuation.txt').exists() or (p/'e2e-continuation.json').exists():
 raise SystemExit('This run identity already has evidence; use a new run identity instead of overwriting it.')
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
record={'startedAt':now(),'status':'running','sourceFreeze':'source-freeze.json','workers':1,'retries':0,'port':5281}
def write():
 t=status.with_suffix('.json.tmp');t.write_text(json.dumps(record,indent=2)+chr(10));t.replace(status)
write()
env=os.environ.copy();env.update(ZUVI_E2E_PORT='5281',PLAYWRIGHT_JSON_OUTPUT_FILE=str(p/'e2e-continuation.json'))
cmd=['pnpm','exec','playwright','test','--config','e2e/playwright.config.ts','--workers=1','--retries=0','--output='+str(p/'e2e-continuation-output'),'--reporter=list,json']
try:
 with (p/'e2e-continuation.txt').open('x') as log: result=subprocess.run(cmd,env=env,stdout=log,stderr=subprocess.STDOUT)
 record.update(status='completed',exitCode=result.returncode,finishedAt=now())
 if (p/'e2e-continuation.json').is_file(): record['stats']=json.loads((p/'e2e-continuation.json').read_text())['stats']
except BaseException as e: record.update(status='runner-error',error=repr(e),finishedAt=now())
write()
