import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const local = join(root, '.local/xiang-yu/study-v001');
const manifest = JSON.parse(readFileSync(join(local, 'manifest.json'), 'utf8'));
const cues = JSON.parse(readFileSync(join(local, 'cues.json'), 'utf8'));
const digest = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const dirs = [join(root, 'engines/remotion/public/runtime'), join(root, 'engines/hyperframes/assets/runtime')];
for (const dir of dirs) {
  if (digest(join(dir, 'excerpt.wav')) !== manifest.excerptSha256) throw new Error('Runtime audio differs from the canonical excerpt.');
  for (const file of ['camp-v001.png', 'river-v001.png', 'farewell-v001.png', 'characters-v001.png']) {
    if (digest(join(dir, file)) !== digest(join(root, 'assets/xiang-yu', file))) throw new Error(`Runtime asset differs: ${file}`);
  }
}
const props = JSON.parse(readFileSync(join(local, 'remotion-props.json'), 'utf8'));
if (JSON.stringify(props.cues) !== JSON.stringify(cues)) throw new Error('Remotion cues differ from the saved cues.');
const expectedScript = `window.__CUES = ${JSON.stringify(cues)};\n`;
if (readFileSync(join(dirs[1], 'cues.js'), 'utf8') !== expectedScript) throw new Error('HyperFrames cues differ from the saved cues.');
console.log(`Inputs match: ${cues.length} cues, shared audio and four visual assets.`);
