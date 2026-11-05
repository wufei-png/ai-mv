# Comparison protocol

The first experiment compares two implementations of the same storyboard. It
does not establish a universal framework ranking. Both use the same private
audio excerpt, lyric cues, generated artwork, 1920×1080 canvas and 30 fps
timeline. Inputs are checked with `npm run check:inputs`; versions are pinned by
`package-lock.json`.

Compare the rendered result for story clarity, visual consistency, lyric
timing, editability, rendering stability and local resource use. Objective
media checks are not a substitute for listening and artistic review. Record
render options and hardware alongside any timing result; one run is not a
benchmark.

The existing `music-video-toolkit` can decode audio and import LRC files. Its
comparison command requires its own preview-manifest contracts. This repository
does not claim that arbitrary Remotion or HyperFrames output can be fed directly
to that command.

The locally installed Noto Serif SC Variable font comes from the pinned
`@fontsource-variable/noto-serif-sc` package and is distributed under the SIL
Open Font License 1.1. Runtime copies are ignored; the package remains a normal
dependency rather than a vendored private font.

HyperFrames 0.9.16 pins `undici` 7.25.0. The project applies a scoped override
to 7.30.1 to address npm audit advisories. This differs from HyperFrames' exact
dependency pin; the local study render is tested with the override, but other
HyperFrames features have not been validated. Revisit it when upgrading.
