import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {assertStoryboardAlignment} from '../scripts/storyboard.mjs';

// The same helper is called by scripts/prepare-xiang-yu.mjs before it reads or
// writes any media. The fixture is synthetic and contains no work asset.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/storyboard.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(fixture);

test('accepts the aligned synthetic timeline used by preparation', () => {
  const spec = copy();
  assert.equal(assertStoryboardAlignment(spec, {sampleRate: 48000}), spec);
});

test('rejects the same audio-clock and duration misalignment as preparation', () => {
  const unaligned = copy();
  unaligned.fps = 27;
  assert.throws(() => assertStoryboardAlignment(unaligned, {sampleRate: 48000}), {
    message: 'Storyboard is not aligned to the audio sample clock.',
  });

  const duration = copy();
  duration.durationFrames = 241;
  assert.throws(() => assertStoryboardAlignment(duration, {sampleRate: 48000}), {
    message: 'Storyboard is not aligned to the audio sample clock.',
  });
});
