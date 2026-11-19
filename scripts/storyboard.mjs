// Validate the shared timeline contract used by the preparation and comparison
// scripts. Timed source ranges, frames and shots must all line up so a local
// study cannot silently render a different interval than the storyboard.
export function validateStoryboard(spec, {sampleRate = 48000} = {}) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    throw new Error('Storyboard must be a JSON object.');
  }
  if (spec.schemaVersion !== 1) {
    throw new Error(`Unsupported storyboard schemaVersion: ${spec.schemaVersion}.`);
  }
  for (const key of ['fps', 'width', 'height', 'durationFrames']) {
    if (!Number.isInteger(spec[key]) || spec[key] <= 0) {
      throw new Error(`Storyboard ${key} must be a positive integer.`);
    }
  }
  if (!Number.isInteger(spec.sourceStartFrame) || spec.sourceStartFrame < 0) {
    throw new Error('Storyboard sourceStartFrame must be a non-negative integer.');
  }
  if (!Number.isInteger(spec.sourceEndFrame) || spec.sourceEndFrame <= 0) {
    throw new Error('Storyboard sourceEndFrame must be a positive integer.');
  }
  if (!Number.isInteger(sampleRate) || sampleRate <= 0 || sampleRate % spec.fps !== 0) {
    throw new Error(`Storyboard fps ${spec.fps} must divide the ${sampleRate} Hz audio sample clock.`);
  }
  if (spec.sourceEndFrame <= spec.sourceStartFrame) {
    throw new Error('Storyboard source range must be positive.');
  }
  if (spec.sourceEndFrame - spec.sourceStartFrame !== spec.durationFrames) {
    throw new Error('Storyboard duration must equal the timed source range.');
  }
  if (!Array.isArray(spec.shots) || spec.shots.length === 0) {
    throw new Error('Storyboard must contain at least one shot.');
  }

  const ids = new Set();
  let nextFrame = 0;
  for (const [index, shot] of spec.shots.entries()) {
    if (!shot || typeof shot !== 'object' || Array.isArray(shot)) {
      throw new Error(`Storyboard shot ${index} must be an object.`);
    }
    if (typeof shot.id !== 'string' || !shot.id.trim()) {
      throw new Error(`Storyboard shot ${index} needs a non-empty id.`);
    }
    if (ids.has(shot.id)) throw new Error(`Duplicate storyboard shot id: ${shot.id}.`);
    if (!Number.isInteger(shot.startFrame) || !Number.isInteger(shot.endFrame)) {
      throw new Error(`Storyboard shot ${shot.id} needs integer frame bounds.`);
    }
    if (shot.startFrame !== nextFrame) {
      throw new Error(`Storyboard shot ${shot.id} must start at frame ${nextFrame}.`);
    }
    if (shot.endFrame <= shot.startFrame) {
      throw new Error(`Storyboard shot ${shot.id} must end after its start.`);
    }
    if (shot.endFrame > spec.durationFrames) {
      throw new Error(`Storyboard shot ${shot.id} exceeds the ${spec.durationFrames}-frame duration.`);
    }
    if (typeof shot.description !== 'string' || !shot.description.trim()) {
      throw new Error(`Storyboard shot ${shot.id} needs a non-empty description.`);
    }
    ids.add(shot.id);
    nextFrame = shot.endFrame;
  }
  if (nextFrame !== spec.durationFrames) {
    throw new Error(`Storyboard shots end at frame ${nextFrame}, expected ${spec.durationFrames}.`);
  }
  return spec;
}
