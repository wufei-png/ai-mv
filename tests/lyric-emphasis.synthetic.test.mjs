import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {applyLyricEmphasis} from '../scripts/lyric-emphasis.mjs';

test('reviewed emphasis preserves timing and text and counts Unicode code points', () => {
  const source = {cues: [{startFrame: 42, endFrame: 90, text: '春🌸风又起'}]};
  const review = {spans: [{cueStartFrame: 42, start: 1, end: 3, expected: '🌸风'}]};
  const result = applyLyricEmphasis(source, review);
  assert.deepEqual(result.cues[0], {...source.cues[0], emphasis: [{start: 1, end: 3}]});
  assert.equal(source.cues[0].emphasis, undefined);
});

test('changed lyrics and overlapping emphasis require a new review', () => {
  const source = {cues: [{startFrame: 42, endFrame: 90, text: '春风又起'}]};
  assert.throws(() => applyLyricEmphasis(source, {spans: [{cueStartFrame: 42, start: 0, end: 2, expected: '秋风'}]}), /text changed/);
  assert.throws(() => applyLyricEmphasis(source, {spans: [
    {cueStartFrame: 42, start: 0, end: 2, expected: '春风'},
    {cueStartFrame: 42, start: 1, end: 3, expected: '风又'},
  ]}), /Overlapping/);
});
