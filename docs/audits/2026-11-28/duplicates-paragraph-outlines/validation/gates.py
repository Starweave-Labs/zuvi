from pathlib import Path
import datetime
import json
import os
import subprocess

HERE = Path(__file__).resolve().parent
ROOT = next(p for p in HERE.parents if (p / 'pnpm-workspace.yaml').exists())
os.chdir(ROOT)
assert not (HERE / 'gates.json').exists()
steps = [
    ('registry-generate', ['node', 'registry/scripts/generate.mjs']),
    ('build', ['pnpm', 'build']),
    ('browser-build', ['pnpm', '--filter', '@zuvi/react', 'build:browser']),
    ('ui', ['pnpm', '--filter', '@zuvi/react', 'exec', 'vitest', 'run', '--minWorkers=1', '--maxWorkers=4']),
    ('docs', ['pnpm', '--filter', '@zuvi/docs', 'test']),
    ('other-tests', ['pnpm', '-r', '--filter', '!@zuvi/react', '--filter', '!@zuvi/docs', 'test']),
    ('types', ['pnpm', 'typecheck']),
    ('lint', ['pnpm', 'lint']),
    ('registry', ['node', 'registry/scripts/generate.mjs', '--check']),
    ('consumer', ['node', 'scripts/check-consumer.mjs']),
    ('distribution', ['node', 'scripts/check-distribution.mjs']),
    ('bundle-size', ['node', 'scripts/check-bundle-size.mjs']),
]
records = []
environment = os.environ.copy()
environment['CHART_DOCS_CHECK_DIST'] = '1'
for name, command in steps:
    print('Starting ' + name, flush=True)
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    with (HERE / (name + '.txt')).open('x') as log:
        result = subprocess.run(command, env=environment, stdout=log, stderr=subprocess.STDOUT)
    records.append({'name': name, 'command': command, 'startedAt': started,
                    'finishedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                    'exitCode': result.returncode})
    (HERE / 'gates.json').write_text(json.dumps(records, indent=2) + '\n')
    print(name + ': ' + str(result.returncode), flush=True)
    if result.returncode:
        raise SystemExit(result.returncode)
