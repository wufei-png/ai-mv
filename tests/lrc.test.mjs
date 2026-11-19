import {strict as assert} from 'node:assert';
import {test} from 'node:test';
import {clipLrc, fullSongCues} from '../scripts/lrc.mjs';

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

test('full-song cues omit timed credits and retain later blank intervals', () => {
  const lrc = '[00:00.00]Credit\n[00:01.00]Another credit\n[00:02.21]First line\n[00:03.50]\n[00:04.00]Second line\n';
  assert.deepEqual(fullSongCues(lrc, {fps: 30, durationFrames: 180, lyricStartSeconds: 2.21}), [
    {startFrame: 67, endFrame: 105, text: 'First line'},
    {startFrame: 120, endFrame: 180, text: 'Second line'},
  ]);
  assert.throws(() => fullSongCues('[00:00.00]Credit\n', {
    fps: 30, durationFrames: 180, lyricStartSeconds: 2,
  }), /No timed lyrics remain/);
});
