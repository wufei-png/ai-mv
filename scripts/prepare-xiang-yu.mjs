import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {
  copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync,
} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {clipLrc} from './lrc.mjs';
import {assertStoryboardAlignment} from './storyboard.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [sourceArg, lyricsArg] = process.argv.slice(2);
if (!sourceArg || !lyricsArg || process.argv.length !== 4) {
  console.error('Usage: node scripts/prepare-xiang-yu.mjs <audio-file> <lyrics.lrc>');
  process.exit(2);
}

const source = resolve(sourceArg);
const lyrics = resolve(lyricsArg);
const spec = JSON.parse(readFileSync(join(root, 'works/xiang-yu/storyboard.json'), 'utf8'));
const sampleRate = 48000;
assertStoryboardAlignment(spec, {sampleRate});
const startSample = spec.sourceStartFrame * sampleRate / spec.fps;
const endSample = spec.sourceEndFrame * sampleRate / spec.fps;
const startSeconds = spec.sourceStartFrame / spec.fps;
const endSeconds = spec.sourceEndFrame / spec.fps;
const digest = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const sourceHash = digest(source);
const lyricsHash = digest(lyrics);
const local = join(root, '.local/xiang-yu/study-v001');
const audioOut = join(local, 'excerpt.wav');
const manifestPath = join(local, 'manifest.json');
mkdirSync(local, {recursive: true});

if (existsSync(manifestPath)) {
  const previous = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (previous.sourceSha256 !== sourceHash || previous.lyricsSha256 !== lyricsHash ||
      previous.startFrame !== spec.sourceStartFrame || previous.endFrame !== spec.sourceEndFrame ||
      !existsSync(audioOut) || digest(audioOut) !== previous.excerptSha256) {
    throw new Error('Existing local study differs or is incomplete; preserve it and use a new study directory.');
  }
} else {
  if (existsSync(audioOut)) throw new Error('Untracked excerpt exists without a matching manifest.');
  const temp = join(local, 'excerpt.partial.wav');
  if (existsSync(temp)) throw new Error('A partial excerpt exists; inspect it before retrying.');
  try {
    execFileSync('ffmpeg', [
      '-hide_banner', '-loglevel', 'error', '-n', '-i', source, '-map', '0:a:0',
      '-af', `aresample=${sampleRate},atrim=start_sample=${startSample}:end_sample=${endSample},asetpts=PTS-STARTPTS`,
      '-ac', '2', '-ar', String(sampleRate), '-c:a', 'pcm_s24le', temp,
    ], {stdio: 'inherit'});
    const probe = JSON.parse(execFileSync('ffprobe', [
      '-v', 'error', '-select_streams', 'a:0', '-show_entries', 'stream=duration_ts,time_base,sample_rate',
      '-of', 'json', temp,
    ], {encoding: 'utf8'}));
    const stream = probe.streams?.[0];
    if (!stream || Number(stream.sample_rate) !== sampleRate ||
        stream.time_base !== `1/${sampleRate}` || Number(stream.duration_ts) !== endSample - startSample) {
      throw new Error('The decoded excerpt does not have the expected sample count.');
    }
    renameSync(temp, audioOut);
  } catch (error) {
    if (existsSync(temp)) rmSync(temp);
    throw error;
  }
  writeFileSync(manifestPath, `${JSON.stringify({
    schemaVersion: 1, sourceSha256: sourceHash, lyricsSha256: lyricsHash,
    excerptSha256: digest(audioOut), startFrame: spec.sourceStartFrame,
    endFrame: spec.sourceEndFrame, sampleRate,
  }, null, 2)}\n`);
}

const cues = clipLrc(readFileSync(lyrics, 'utf8'), {
  startSeconds, endSeconds, fps: spec.fps, durationFrames: spec.durationFrames,
});
writeFileSync(join(local, 'cues.json'), `${JSON.stringify(cues, null, 2)}\n`);
writeFileSync(join(local, 'remotion-props.json'), `${JSON.stringify({cues})}\n`);

const fontSource = join(root, 'node_modules/@fontsource-variable/noto-serif-sc');
const runtimeDirs = [
  join(root, 'engines/remotion/public/runtime'),
  join(root, 'engines/hyperframes/assets/runtime'),
];
for (const runtime of runtimeDirs) {
  mkdirSync(runtime, {recursive: true});
  for (const file of ['camp-v001.png', 'river-v001.png', 'farewell-v001.png', 'characters-v001.png']) {
    copyFileSync(join(root, 'assets/xiang-yu', file), join(runtime, file));
  }
  copyFileSync(audioOut, join(runtime, 'excerpt.wav'));
  mkdirSync(join(runtime, 'font'), {recursive: true});
  copyFileSync(join(fontSource, 'index.css'), join(runtime, 'font/index.css'));
  cpSync(join(fontSource, 'files'), join(runtime, 'font/files'), {recursive: true});
}
copyFileSync(join(root, 'node_modules/gsap/dist/gsap.min.js'), join(runtimeDirs[1], 'gsap.min.js'));
writeFileSync(join(runtimeDirs[1], 'cues.js'), `window.__CUES = ${JSON.stringify(cues)};\n`);
console.log(JSON.stringify({ok: true, frames: spec.durationFrames, cueCount: cues.length,
  sampleRate, sourceSha256: sourceHash, excerptSha256: digest(audioOut)}, null, 2));
