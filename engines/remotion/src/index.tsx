import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {XiangYu, type Cue} from './xiang-yu';
import storyboard from '../../../works/xiang-yu/storyboard.json';

const Root: React.FC = () => (
  <Composition
    id="XiangYuStudy"
    component={XiangYu}
    durationInFrames={storyboard.durationFrames}
    fps={storyboard.fps}
    width={storyboard.width}
    height={storyboard.height}
    defaultProps={{cues: [] as Cue[]}}
  />
);

registerRoot(Root);
