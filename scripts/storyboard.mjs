// Shared preparation contract: the source range must land on the same audio
// sample clock and frame duration that the renderer and comparison use. Keep the
// conditions and message unchanged when moving this out of the preparation step.
export function assertStoryboardAlignment(spec, {sampleRate = 48000} = {}) {
  if (sampleRate % spec.fps !== 0 || spec.sourceEndFrame - spec.sourceStartFrame !== spec.durationFrames) {
    throw new Error('Storyboard is not aligned to the audio sample clock.');
  }
  return spec;
}
