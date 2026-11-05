import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {clipLrc} from '../scripts/lrc.mjs';

test('clips repeated lines to frames and preserves a blank lyric interval', () => {
  const lrc = '[00:00.50]Earlier\n[00:01.00]Again\n[00:02.25]\n[00:02.50]Other\n[00:03.50]Again\n';
  assert.deepEqual(clipLrc(lrc, {startSeconds: 1, endSeconds: 4, fps: 30, durationFrames: 90}), [
    {startFrame: 0, endFrame: 38, text: 'Again'},
    {startFrame: 45, endFrame: 75, text: 'Other'},
    {startFrame: 75, endFrame: 90, text: 'Again'},
  ]);
});

test('rejects an excerpt without timed lyric text', () => {
  assert.throws(() => clipLrc('[00:00.00]\n', {
    startSeconds: 0, endSeconds: 1, fps: 30, durationFrames: 30,
  }), /No valid lyric cues/);
});
