import {strict as assert} from 'node:assert';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {validateStoryboard} from '../scripts/storyboard.mjs';

// The fixture is deliberately synthetic: these checks must not need a work,
// private audio, lyrics, or any generated runtime asset.
const fixture = JSON.parse(readFileSync(new URL('./fixtures/storyboard.json', import.meta.url), 'utf8'));
const copy = () => structuredClone(fixture);

test('accepts a contiguous synthetic storyboard on the audio sample clock', () => {
  const spec = copy();
  const validated = validateStoryboard(spec, {sampleRate: 48000});
  assert.equal(validated, spec);
  assert.equal(validated.shots.length, 2);
});

test('rejects gaps, overlaps, duplicate ids and shots beyond the timeline', () => {
  const gap = copy();
  gap.shots[1].startFrame = 100;
  assert.throws(() => validateStoryboard(gap), /must start at frame 96/);

  const overlap = copy();
  overlap.shots[1].startFrame = 90;
  assert.throws(() => validateStoryboard(overlap), /must start at frame 96/);

  const duplicate = copy();
  duplicate.shots[1].id = 'opening';
  assert.throws(() => validateStoryboard(duplicate), /Duplicate storyboard shot id/);

  const beyond = copy();
  beyond.shots[1].endFrame = 250;
  assert.throws(() => validateStoryboard(beyond), /exceeds the 240-frame duration/);
});

test('rejects a mismatched source range, unaligned fps and incomplete metadata', () => {
  const duration = copy();
  duration.durationFrames = 241;
  assert.throws(() => validateStoryboard(duration), /duration must equal the timed source range/);

  const unaligned = copy();
  unaligned.fps = 27;
  assert.throws(() => validateStoryboard(unaligned), /must divide the 48000 Hz audio sample clock/);

  const missingDescription = copy();
  delete missingDescription.shots[1].description;
  assert.throws(() => validateStoryboard(missingDescription), /needs a non-empty description/);

  assert.throws(() => validateStoryboard(null), /must be a JSON object/);
});
