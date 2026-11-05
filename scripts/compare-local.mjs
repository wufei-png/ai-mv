import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [remotionArg, hyperframesArg, outputArg] = process.argv.slice(2);
if (!remotionArg || !hyperframesArg || !outputArg || process.argv.length !== 5) {
  console.error('Usage: node scripts/compare-local.mjs <remotion.mp4> <hyperframes.mp4> <new-output-dir>');
  process.exit(2);
}
const sources = [resolve(remotionArg), resolve(hyperframesArg)];
const output = resolve(outputArg);
if (existsSync(output)) throw new Error('Comparison output already exists; choose a new directory.');
const parent = dirname(output);
mkdirSync(parent, {recursive: true});
const staging = mkdtempSync(join(parent, `.${basename(output)}-`));
const audio = join(root, '.local/xiang-yu/study-v001/excerpt.wav');
const spec = JSON.parse(readFileSync(join(root, 'works/xiang-yu/storyboard.json'), 'utf8'));
const duration = String(spec.durationFrames / spec.fps);
const run = (command, args) => execFileSync(command, args, {stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8'});
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

try {
  const sharedAudio = join(staging, 'shared-audio.m4a');
  run('ffmpeg', ['-v', 'error', '-n', '-i', audio, '-map', '0:a:0', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2', sharedAudio]);
  const results = [];
  for (const [index, label] of ['remotion', 'hyperframes'].entries()) {
    const target = join(staging, `${label}.mp4`);
    run('ffmpeg', ['-v', 'error', '-n', '-i', sources[index], '-i', sharedAudio,
      '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy', '-t', duration,
      '-map_metadata', '-1', '-movflags', '+faststart', target]);
    const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries',
      'format=duration:stream=codec_type,codec_name,width,height,pix_fmt,color_range,color_space,r_frame_rate,nb_frames,sample_rate,channels',
      '-of', 'json', target]));
    const video = probe.streams.find((stream) => stream.codec_type === 'video');
    const sound = probe.streams.find((stream) => stream.codec_type === 'audio');
    if (!video || video.codec_name !== 'h264' || video.width !== spec.width || video.height !== spec.height ||
        video.pix_fmt !== 'yuv420p' || video.color_range !== 'tv' || video.color_space !== 'bt709' ||
        video.r_frame_rate !== `${spec.fps}/1` || Number(video.nb_frames) !== spec.durationFrames ||
        !sound || sound.codec_name !== 'aac' || Number(sound.sample_rate) !== 48000 || sound.channels !== 2 ||
        Math.abs(Number(probe.format.duration) - Number(duration)) > 1 / spec.fps) {
      throw new Error(`${label} does not match the required video/audio profile.`);
    }
    run('ffmpeg', ['-v', 'error', '-xerror', '-i', target, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-']);
    const audioHash = run('ffmpeg', ['-v', 'error', '-i', target, '-map', '0:a:0', '-c', 'copy', '-f', 'hash', '-hash', 'sha256', '-']).trim();
    results.push({label, file: `${label}.mp4`, sha256: sha256(target), audioPacketHash: audioHash, video, audio: sound});
  }
  if (results[0].audioPacketHash !== results[1].audioPacketHash) throw new Error('Comparison audio packets differ.');
  writeFileSync(join(staging, 'report.json'), `${JSON.stringify({schemaVersion: 1, durationSeconds: Number(duration), results,
    note: 'Technical checks only; music synchronization and artistic quality require human review.'}, null, 2)}\n`);
  writeFileSync(join(staging, 'review.html'), `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>项虞 · 样片对照</title><style>
*{box-sizing:border-box}body{margin:0;background:#101521;color:#eee8dc;font:16px system-ui,sans-serif}
main{max-width:1500px;margin:auto;padding:28px}h1{font-size:28px;margin:0 0 8px}p{color:#c0c8d3;line-height:1.6}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.panel{background:#1b2433;border:1px solid #344053;border-radius:10px;padding:14px}
video{width:100%;aspect-ratio:16/9;background:#080b11}h2{font-size:18px;margin:0 0 12px}.toolbar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:18px 0}
button{background:#e1b87e;color:#1e1a19;border:0;border-radius:6px;padding:10px 16px;font-weight:600;cursor:pointer}input{flex:1;min-width:180px}
@media(max-width:800px){.grid{grid-template-columns:1fr}main{padding:16px}}
</style></head><body><main><h1>《项虞》· 框架样片对照</h1>
<p>两版使用相同片段、人物与场景。同步播放时只播放左侧音轨；仍可分别使用各自的播放控件。</p>
<div class="toolbar"><button id="toggle">同步播放</button><input id="seek" type="range" min="0" max="20.9" step="0.033333" value="0" aria-label="播放进度"><span id="clock">0.0 / 20.9 s</span></div>
<div class="grid"><section class="panel"><h2>Remotion</h2><video id="a" controls preload="metadata" src="remotion.mp4"></video></section>
<section class="panel"><h2>HyperFrames</h2><video id="b" controls preload="metadata" muted src="hyperframes.mp4"></video></section></div>
<p>人物动作主要采用姿势切换和镜头运动；这是美术与框架验证样片，尚不是完整 MV。</p></main>
<script>
const a=document.getElementById('a'),b=document.getElementById('b'),toggle=document.getElementById('toggle'),seek=document.getElementById('seek'),clock=document.getElementById('clock');let sync=false;
toggle.addEventListener('click',async()=>{if(!a.paused){a.pause();b.pause();sync=false;toggle.textContent='同步播放';return}b.currentTime=a.currentTime;b.muted=true;sync=true;try{await Promise.all([a.play(),b.play()]);toggle.textContent='暂停'}catch{sync=false;toggle.textContent='同步播放'}});
seek.addEventListener('input',()=>{a.currentTime=Number(seek.value);b.currentTime=a.currentTime});
a.addEventListener('timeupdate',()=>{seek.value=String(a.currentTime);clock.textContent=a.currentTime.toFixed(1)+' / 20.9 s';if(sync&&Math.abs(a.currentTime-b.currentTime)>.15)b.currentTime=a.currentTime});
a.addEventListener('ended',()=>{b.pause();sync=false;toggle.textContent='同步播放'});
</script></body></html>\n`);
  renameSync(staging, output);
  console.log(JSON.stringify({ok: true, output, files: ['remotion.mp4', 'hyperframes.mp4', 'review.html', 'report.json'],
    durationSeconds: Number(duration), audioPacketHash: results[0].audioPacketHash}, null, 2));
} catch (error) {
  rmSync(staging, {recursive: true, force: true});
  throw error;
}
