"""Verify this batch against frozen source, per-item proof and a completed run."""
from argparse import ArgumentParser
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
import gzip
import hashlib
import json
import subprocess

HERE = Path(__file__).resolve().parent
REPO = next(parent for parent in HERE.parents if (parent / 'pnpm-workspace.yaml').is_file())


def read(path):
    return json.loads(path.read_text())


def safe_file(value):
    path = Path(value)
    assert not path.is_absolute() and '..' not in path.parts, value
    return REPO / path


def check_bytes(path, record, encoding='original-bytes'):
    data = path.read_bytes()
    if encoding == 'gzip':
        data = gzip.decompress(data)
    else:
        assert encoding == 'original-bytes', encoding
    assert len(data) == record['bytes'], str(path) + ': size mismatch'
    assert hashlib.sha256(data).hexdigest() == record['sha256'], str(path) + ': SHA mismatch'


def walk(suite):
    for spec in suite.get('specs', []):
        for test in spec.get('tests', []):
            yield spec, test
    for child in suite.get('suites', []):
        yield from walk(child)


def main():
    parser = ArgumentParser()
    parser.add_argument('--browser-report', default='e2e-final-316.json')
    parser.add_argument('--ledger-source-commit')
    parser.add_argument('--output', default='verification-final.json')
    args = parser.parse_args()
    browser = read(HERE / args.browser_report)
    stats = browser['stats']
    assert {key: stats[key] for key in ['expected', 'unexpected', 'skipped', 'flaky']} == {
        'expected': 316, 'unexpected': 0, 'skipped': 0, 'flaky': 0
    }, 'A single completed 316/316 run with no failures, skips or retries is required: ' + str(stats)
    terminal = read(HERE / 'e2e-final-316-status.json')
    assert terminal['status'] == 'completed' and terminal['exitCode'] == 0, terminal
    assert terminal['stats'] == stats and terminal['workers'] == 1 and terminal['retries'] == 0
    tests = [item for suite in browser['suites'] for item in walk(suite)]
    assert len(tests) == 316 and not browser.get('errors'), 'Incomplete browser report'
    specs = Counter()
    for spec, test in tests:
        assert test['status'] == 'expected' and test['expectedStatus'] == 'passed', spec['title']
        assert len(test['results']) == 1 and test['results'][0]['status'] == 'passed', spec['title']
        specs[Path(spec['file']).name] += 1

    frozen = read(HERE / 'source-freeze-final.json')
    original = read(HERE / 'source-freeze.json')
    assert len(frozen['source']) == 113 and frozen['source'][:112] == original['source']
    assert frozen['productionSourceUnchangedFromContinuation315'] is True
    for group in ['source', 'uiDist', 'docsJs']:
        for record in frozen[group]:
            check_bytes(safe_file(record['path']), record)
    gates = read(HERE / 'gates-continuation.json')
    assert gates['status'] == 'passed' and len(gates['checks']) == 7
    for gate in gates['checks']:
        assert gate['exitCode'] == 0, gate['name']
        check_bytes(safe_file(gate['log']), gate)
    native = read(HERE / 'continuation-native-summary.json')
    assert native['status'] == 'passed'
    for record in native['proofs'] + native['currentRunInputs']:
        check_bytes(safe_file(record['retainedPath']), record, record['encoding'])

    authoritative = read(REPO / 'docs/onlyoffice-feature-ledger-2026-11-13.json')
    required = {item['id']: item for item in authoritative['items'] if item['product'] in ['Word', 'Excel', 'PDF']}
    assert len(required) == 159
    candidates = read(HERE / 'acceptance-candidates.json')['items']
    assert len(candidates) == len({item['id'] for item in candidates}) == 15
    for item in candidates:
        assert item['acceptance'] == required[item['id']]['acceptance'], item['id']
        assert safe_file(item['matrix']).is_file(), item['matrix']
        assert all(specs[Path(name).name] > 0 for name in item['requiredCurrentSpecs']), item['id']

    if args.ledger_source_commit:
        ledger = read(REPO / 'docs/office-studio-goal-status-2026-11-23.json')
        assert len(ledger['items']) == 159 and ledger['completionProven'] is False
        assert {item['id'] for item in ledger['items']} == set(required)
        assert all(item['acceptance'] == required[item['id']]['acceptance'] for item in ledger['items'])
        complete = [item for item in ledger['items'] if item['status'] == 'verified-original-acceptance']
        assert {item['id'] for item in complete} == {item['id'] for item in candidates}
        for item in complete:
            assert item['currentAudit']['sourceCommit'] == args.ledger_source_commit
            assert item['currentAudit']['acceptance'] == 'original-ledger-acceptance-verified'
            assert item['gaps'] == []
        assert sum(ledger['currentImplementationCounts'].values()) == 159
        assert dict(Counter(item['currentAudit']['implementation'] for item in ledger['items'])) == ledger['currentImplementationCounts']
        for record in frozen['source']:
            result = subprocess.run(['git', 'show', args.ledger_source_commit + ':' + record['path']],
                                    cwd=REPO, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            assert hashlib.sha256(result.stdout).hexdigest() == record['sha256'], record['path']

    output = {'status': 'passed', 'verifiedAt': datetime.now(timezone.utc).isoformat(),
              'sourceCommit': args.ledger_source_commit, 'browser': stats,
              'frozenObjects': {key: len(frozen[key]) for key in ['source', 'uiDist', 'docsJs']},
              'perItemOriginalAcceptance': [item['id'] for item in candidates],
              'requiredSpecPassCounts': dict(sorted(specs.items())),
              'nativeCounts': native['counts'], 'verifiedNativeObjects': len(native['proofs']) + len(native['currentRunInputs']),
              'gates': len(gates['checks']), 'whole159Complete': False}
    target = HERE / args.output
    with target.open('x') as stream:
        stream.write(json.dumps(output, ensure_ascii=False, indent=2) + chr(10))
    print(json.dumps({key: output[key] for key in ['status', 'sourceCommit', 'frozenObjects', 'perItemOriginalAcceptance', 'nativeCounts', 'gates', 'whole159Complete']}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
