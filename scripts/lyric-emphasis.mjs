// Work with code points rather than UTF-16 offsets, so supplementary characters
// do not shift a reviewed emphasis span.
export function applyLyricEmphasis(props, review) {
  if (!Array.isArray(props?.cues) || !Array.isArray(review?.spans)) throw new Error('Missing lyric cues or reviewed emphasis spans.');
  const byFrame = new Map();
  for (const cue of props.cues) {
    if (byFrame.has(cue.startFrame)) throw new Error(`Duplicate lyric start frame: ${cue.startFrame}`);
    if (cue.emphasis !== undefined) throw new Error('The source cues already have emphasis data.');
    byFrame.set(cue.startFrame, cue);
  }
  const selected = new Map();
  for (const span of review.spans) {
    const cue = byFrame.get(span.cueStartFrame);
    if (!cue || typeof cue.text !== 'string') throw new Error(`Missing lyric cue at frame ${span.cueStartFrame}`);
    const chars = Array.from(cue.text);
    if (!Number.isInteger(span.start) || !Number.isInteger(span.end) || span.start < 0 || span.end <= span.start || span.end > chars.length) {
      throw new Error(`Invalid emphasis range at frame ${span.cueStartFrame}`);
    }
    if (typeof span.expected !== 'string' || chars.slice(span.start, span.end).join('') !== span.expected) {
      throw new Error(`Lyric text changed at reviewed frame ${span.cueStartFrame}; review the accent again.`);
    }
    const ranges = selected.get(span.cueStartFrame) ?? [];
    if (ranges.some((range) => span.start < range.end && range.start < span.end)) {
      throw new Error(`Overlapping emphasis ranges at frame ${span.cueStartFrame}`);
    }
    ranges.push({start: span.start, end: span.end});
    selected.set(span.cueStartFrame, ranges);
  }
  return {...props, cues: props.cues.map((cue) => {
    const ranges = selected.get(cue.startFrame);
    return ranges ? {...cue, emphasis: ranges.sort((a, b) => a.start - b.start)} : {...cue};
  })};
}
