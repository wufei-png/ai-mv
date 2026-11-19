import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {runInNewContext} from 'node:vm';

test('creates a caption for every cue, including more than four', () => {
  const captions = [];
  const embers = {appendChild() {}};
  const captionArea = {appendChild(element) { captions.push(element); }};
  const document = {
    createElement() { return {style: {}}; },
    getElementById(id) { return id === 'embers' ? embers : captionArea; },
  };
  const timeline = {fromTo() {}, set() {}, to() {}};
  const cues = Array.from({length: 6}, (_, i) => ({
    text: `Cue ${i}`, startFrame: i * 30, endFrame: (i + 1) * 30,
  }));
  const window = {__CUES: cues, gsap: {timeline() { return timeline; }}};
  runInNewContext(readFileSync('engines/hyperframes/scene.js', 'utf8'), {window, document});
  window.createXiangYuTimeline();
  assert.deepEqual(captions.map((element) => element.textContent), cues.map((cue) => cue.text));
});
