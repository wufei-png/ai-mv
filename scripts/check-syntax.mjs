import {execFileSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  ...readdirSync(join(root, 'scripts'))
    .filter((file) => file.endsWith('.mjs'))
    .sort()
    .map((file) => join(root, 'scripts', file)),
  join(root, 'engines/hyperframes/scene.js'),
];
for (const file of files) {
  execFileSync(process.execPath, ['--check', file], {stdio: 'inherit'});
}
console.log(`Syntax checked ${files.length} files.`);
