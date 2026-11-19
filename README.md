# AI MV

An independent portfolio and production workspace for AI-assisted music videos.
Each work keeps its creative direction and reproducible production instructions;
released works can link to an authorized public viewing location.

## Works

- [Xiang Yu — pixel narrative study](works/xiang-yu/README.md): a local,
  same-song Remotion / HyperFrames comparison. A public full-length video has not
  been released.

## Reproduce the study

Node.js 22+, FFmpeg, FFprobe, and a compatible local Chrome are required.
Install the pinned dependencies and check the source:

```bash
npm ci
npm run check
```

`npm run check:ci` runs the TypeScript, Node syntax and tracked synthetic tests
used by CI; it does not depend on local media or work-specific fixtures. Tracked
test files must be named `*.synthetic.test.mjs` to run in CI or
`*.local.test.mjs` to be skipped deliberately; an unclassified tracked test
fails the gate instead of being omitted silently. `npm run check` also picks up
any local test files under `tests/`, regardless of that classification.

Provide your own recording and timed LRC file. The preparation step writes
only ignored local media and runtime copies, records the source hashes locally,
and refuses to replace a different existing study:

```bash
npm run prepare:xiang-yu -- /path/to/source.flac /path/to/lyrics.lrc
npm run check:inputs
```

Render the two implementations using the same input and output profile. Set
`AI_MV_BROWSER` to your Chrome executable. The recordings and output MP4s remain
local. The commands intentionally disable HyperFrames telemetry for this
comparison.

```bash
mkdir -p .local/xiang-yu/renders
./node_modules/.bin/remotion render engines/remotion/src/index.tsx XiangYuStudy \
  .local/xiang-yu/renders/remotion.mp4 \
  --props=.local/xiang-yu/study-v001/remotion-props.json \
  --public-dir=engines/remotion/public --browser-executable="$AI_MV_BROWSER" \
  --concurrency=2 --codec=h264 --audio-codec=aac --crf=16 \
  --pixel-format=yuv420p --image-format=jpeg --jpeg-quality=100 --color-space=bt709
HYPERFRAMES_NO_TELEMETRY=1 HYPERFRAMES_BROWSER_PATH="$AI_MV_BROWSER" \
  ./node_modules/.bin/hyperframes render engines/hyperframes \
  --output="$PWD/.local/xiang-yu/renders/hyperframes.mp4" --fps=30 --quality=looks --workers=2
npm run compare:xiang-yu -- .local/xiang-yu/renders/remotion.mp4 \
  .local/xiang-yu/renders/hyperframes.mp4 .local/xiang-yu/comparison
```

These commands render the fixed study interval, not a general-purpose song
converter. Review the supplied LRC against the actual recording; automatic or
imported timestamps are not evidence of listening accuracy.
The comparison step copies both video streams, replaces their audio with one
shared AAC encode, validates the output profiles and audio packet hashes, and
writes a local side-by-side review page.

## Repository boundaries

The repository contains code, production notes, and specifically included
visual assets. Audio, source lyrics, private inputs, rendered videos, caches,
and generated local manifests stay in `.local/` or another private location.
They are not included in a clone; a user must supply their own authorized
source media. See [media provenance](assets/xiang-yu/PROVENANCE.md).

The MIT license applies to the code in this repository. Music, lyrics, artwork,
and finished videos have their own rights and are not relicensed by the code
license. See the relevant work and asset records before reuse or publication.
