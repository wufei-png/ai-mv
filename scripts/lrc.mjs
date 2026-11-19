export function clipLrc(content, {startSeconds, endSeconds, fps, durationFrames}) {
  const entries = [];
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\[(\d+):(\d+(?:\.\d+)?)\](.*)$/);
    if (match) entries.push({time: Number(match[1]) * 60 + Number(match[2]), text: match[3].trim()});
  }
  entries.sort((a, b) => a.time - b.time);
  const cues = entries.flatMap((entry, index) => {
    const end = entries[index + 1]?.time ?? endSeconds;
    if (!entry.text || end <= startSeconds || entry.time >= endSeconds) return [];
    return [{
      startFrame: Math.max(0, Math.ceil((entry.time - startSeconds) * fps - 1e-7)),
      endFrame: Math.min(durationFrames, Math.ceil((end - startSeconds) * fps - 1e-7)),
      text: entry.text,
    }];
  });
  if (!cues.length || cues.some((cue) => cue.startFrame >= cue.endFrame)) {
    throw new Error('No valid lyric cues overlap the selected excerpt.');
  }
  return cues;
}

export function fullSongCues(content, {fps, durationFrames, lyricStartSeconds}) {
  const cues = clipLrc(content, {startSeconds: 0, endSeconds: durationFrames / fps, fps, durationFrames})
    .filter((cue) => cue.startFrame >= Math.ceil(lyricStartSeconds * fps - 1e-7));
  if (!cues.length) throw new Error('No timed lyrics remain after the credits.');
  return cues;
}
