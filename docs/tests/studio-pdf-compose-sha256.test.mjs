import test from 'node:test';
import assert from 'node:assert/strict';
import { TextEncoder } from 'node:util';
import { createHash, randomBytes } from 'node:crypto';
import { sha256 } from './studio-pdf-compose-test-loader.mjs';
test('portable SHA-256 matches native crypto and published empty/abc vectors', () => {
  assert.equal(
    sha256(new Uint8Array()),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  );
  assert.equal(
    sha256(new TextEncoder().encode('abc')),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
  for (const length of [1, 55, 56, 63, 64, 65, 127, 128, 129, 131071, 1_000_000]) {
    const bytes = randomBytes(length);
    assert.equal(sha256(bytes), createHash('sha256').update(bytes).digest('hex'));
  }
});
