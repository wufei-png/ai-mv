import {strict as assert} from 'node:assert';
import {execFileSync, spawnSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const gate = resolve(dirname(fileURLToPath(import.meta.url)), '../scripts/ci-tests.mjs');
// The regression starts a separate Node test runner; do not let this test
// runner's inherited NODE_TEST_* context suppress that nested run.
const environment = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => !key.startsWith('NODE_TEST_')),
);

const runGate = (repo) => spawnSync(process.execPath, [gate], {
  cwd: repo,
  encoding: 'utf8',
  env: environment,
});

test('fails closed on newly tracked tests and never runs untracked tests', () => {
  const repo = mkdtempSync(join(tmpdir(), 'ai-mv-ci-tests-'));
  try {
    execFileSync('git', ['init', '--quiet'], {cwd: repo});
    mkdirSync(join(repo, 'tests'), {recursive: true});
    writeFileSync(join(repo, 'tests/safe.synthetic.test.mjs'),
      "import {test} from 'node:test';\ntest('tracked safe test runs', () => {});\n");
    writeFileSync(join(repo, 'tests/work.local.test.mjs'),
      "import {test} from 'node:test';\ntest('local-only failing test must not run', () => { throw new Error('local-only ran'); });\n");
    writeFileSync(join(repo, 'tests/untracked.test.mjs'),
      "import {test} from 'node:test';\ntest('untracked failing test must not run', () => { throw new Error('untracked ran'); });\n");
    execFileSync('git', ['add', 'tests/safe.synthetic.test.mjs', 'tests/work.local.test.mjs'], {cwd: repo});

    const untracked = runGate(repo);
    assert.equal(untracked.status, 0, untracked.stderr);
    const untrackedOutput = `${untracked.stdout}${untracked.stderr}`;
    assert.match(untrackedOutput, /tracked safe test runs/);
    assert.match(untrackedOutput, /Tracked synthetic tests: 1/);
    assert.match(untrackedOutput, /Tracked local-only tests skipped: 1/);
    assert.match(untrackedOutput, /skipped tests\/work\.local\.test\.mjs/);
    assert.doesNotMatch(untrackedOutput, /local-only failing test must not run/);
    assert.doesNotMatch(untrackedOutput, /untracked failing test must not run/);

    execFileSync('git', ['add', 'tests/untracked.test.mjs'], {cwd: repo});
    const blocked = runGate(repo);
    const blockedOutput = `${blocked.stdout}${blocked.stderr}`;
    assert.notEqual(blocked.status, 0);
    assert.match(blockedOutput, /Unclassified tracked test files:/);
    assert.match(blockedOutput, /tests\/untracked\.test\.mjs/);
    assert.doesNotMatch(blockedOutput, /untracked failing test must not run/);
  } finally {
    rmSync(repo, {recursive: true, force: true});
  }
});
