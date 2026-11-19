import {execFileSync, spawnSync} from 'node:child_process';
import {resolve} from 'node:path';

const root = resolve(process.cwd());
const TEST_PATTERN = /\.test\.(?:mjs|js|cjs)$/;
const SYNTHETIC_PATTERN = /\.synthetic\.test\.(?:mjs|js|cjs)$/;
const LOCAL_PATTERN = /\.local\.test\.(?:mjs|js|cjs)$/;

let tracked;
try {
  tracked = execFileSync('git', ['ls-files', '-z', '--', 'tests'], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter((file) => TEST_PATTERN.test(file));
} catch (error) {
  console.error('Cannot enumerate tracked tests with git; refusing to guess the CI test set.');
  console.error(error.message);
  process.exit(1);
}

const synthetic = [];
const localOnly = [];
const unclassified = [];
for (const file of tracked) {
  if (SYNTHETIC_PATTERN.test(file)) synthetic.push(file);
  else if (LOCAL_PATTERN.test(file)) localOnly.push(file);
  else unclassified.push(file);
}

if (unclassified.length > 0) {
  console.error('Unclassified tracked test files:');
  for (const file of unclassified) console.error(`  ${file}`);
  console.error('Rename CI-safe tests to "*.synthetic.test.mjs" and tests that need');
  console.error('work assets or private inputs to "*.local.test.mjs". CI fails closed');
  console.error('so a newly tracked test cannot be skipped silently.');
  process.exit(1);
}
if (synthetic.length === 0) {
  console.error('No tracked "*.synthetic.test.mjs" tests were found; refusing a green CI run.');
  process.exit(1);
}

console.log(`Tracked synthetic tests: ${synthetic.length}`);
console.log(`Tracked local-only tests skipped: ${localOnly.length}`);
if (localOnly.length > 0) {
  for (const file of localOnly) console.log(`  skipped ${file}`);
}

const result = spawnSync(process.execPath, ['--test', ...synthetic], {
  cwd: root,
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
