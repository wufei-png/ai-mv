import React, {useEffect, useState} from 'react';
import {
  AbsoluteFill, Audio, continueRender, delayRender, Img, interpolate, staticFile, useCurrentFrame,
} from 'remotion';

export type Cue = {startFrame: number; endFrame: number; text: string};
type Props = {cues: Cue[]};

const clamp = {extrapolateLeft: 'clamp' as const, extrapolateRight: 'clamp' as const};
const sprite = staticFile('runtime/characters-v001.png');

const Actor: React.FC<{
  row: number; pose: number; x: number; y: number; flip?: boolean; opacity?: number;
}> = ({row, pose, x, y, flip = false, opacity = 1}) => (
  <div style={{
    position: 'absolute', left: x, top: y, width: 372, height: 496, opacity,
    transform: flip ? 'scaleX(-1)' : undefined,
    backgroundImage: `url(${sprite})`, backgroundSize: '400% 200%',
    backgroundPosition: `${pose * 100 / 3}% ${row * 100}%`,
    backgroundRepeat: 'no-repeat', imageRendering: 'pixelated',
  }}/>
);

const AnimatedActor: React.FC<{
  row: number; x: number; y: number; frame: number; poses: number[]; flip?: boolean;
}> = ({row, x, y, frame, poses, flip}) => {
  const transitionA = interpolate(frame, [163, 171], [0, 1], clamp);
  const transitionB = interpolate(frame, [320, 328], [0, 1], clamp);
  return <>
    <Actor row={row} pose={poses[0]} x={x} y={y} flip={flip} opacity={1 - transitionA}/>
    <Actor row={row} pose={poses[1]} x={x} y={y} flip={flip} opacity={transitionA * (1 - transitionB)}/>
    <Actor row={row} pose={poses[2]} x={x} y={y} flip={flip} opacity={transitionB}/>
  </>;
};

export const XiangYu: React.FC<Props> = ({cues}) => {
  const frame = useCurrentFrame();
  const [fontGate] = useState(() => delayRender('Wait for local Chinese font'));
  useEffect(() => {
    document.fonts.ready.then(() => continueRender(fontGate)).catch(() => continueRender(fontGate));
  }, [fontGate]);

  const river = interpolate(frame, [292, 330], [0, 1], clamp);
  const closeupOpacity = Math.min(
    interpolate(frame, [150, 168], [0, 1], clamp),
    interpolate(frame, [292, 320], [1, 0], clamp),
  );
  const closeupScale = interpolate(frame, [150, 320], [1.01, 1.065], clamp);
  const camera = interpolate(frame, [0, 627], [1.02, 1.075], clamp);
  const maleX = interpolate(frame, [0, 480, 627], [555, 575, 685], clamp);
  const femaleX = interpolate(frame, [0, 320, 627], [995, 965, 960], clamp);
  const titleOpacity = interpolate(frame, [0, 18, 72, 105], [0, 1, 1, 0], clamp);
  const ending = interpolate(frame, [590, 626], [0, 0.48], clamp);
  const active = cues.find((cue) => frame >= cue.startFrame && frame < cue.endFrame);
  const captionOpacity = active ? Math.min(
    interpolate(frame, [active.startFrame, active.startFrame + 8], [0, 1], clamp),
    interpolate(frame, [active.endFrame - 8, active.endFrame], [1, 0], clamp),
  ) : 0;

  return (
    <AbsoluteFill style={{backgroundColor: '#101522', overflow: 'hidden', color: '#f3e8d2'}}>
      <link rel="stylesheet" href={staticFile('runtime/font/index.css')}/>
      <Audio src={staticFile('runtime/excerpt.wav')}/>
      <AbsoluteFill style={{transform: `scale(${camera})`}}>
        <Img src={staticFile('runtime/camp-v001.png')} style={{width: '100%', height: '100%', objectFit: 'cover'}}/>
        <Img src={staticFile('runtime/river-v001.png')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: river}}/>
        <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(90deg,rgba(10,14,25,.15),transparent 38%,rgba(10,14,25,.1))'}}/>
        <AnimatedActor row={0} poses={[1, 2, 3]} x={maleX} y={313} frame={frame}/>
        <AnimatedActor row={1} poses={[1, 2, 2]} x={femaleX} y={313} frame={frame} flip/>
      </AbsoluteFill>
      <Img src={staticFile('runtime/farewell-v001.png')} style={{position: 'absolute', inset: 0,
        width: '100%', height: '100%', objectFit: 'cover', opacity: closeupOpacity,
        transform: `scale(${closeupScale})`}}/>
      {Array.from({length: 18}, (_, i) => {
        const x = 130 + ((i * 307) % 1640);
        const y = 670 - ((i * 89 + frame * (0.3 + (i % 3) * 0.08)) % 440);
        const opacity = 0.14 + ((i * 7) % 12) / 100;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 3 + i % 3,
          height: 3 + i % 3, backgroundColor: '#e0ab73', opacity}}/>;
      })}
      <div style={{position: 'absolute', top: 105, left: 155, opacity: titleOpacity,
        fontFamily: '"Noto Serif SC Variable", serif', letterSpacing: 12, fontSize: 42,
        color: '#e2c9a3', textShadow: '0 2px 12px #101522'}}>
        项 虞 <span style={{fontSize: 30, letterSpacing: 4, marginLeft: 18}}>· 夜别</span>
      </div>
      <div style={{position: 'absolute', left: '10%', width: '80%', bottom: 110, textAlign: 'center',
        fontFamily: '"Noto Serif SC Variable", serif', fontSize: 58, fontWeight: 600,
        letterSpacing: 3, lineHeight: 1.35, opacity: captionOpacity,
        color: '#f4eddd', textShadow: '0 3px 8px #080a10, 0 1px 2px #080a10'}}>
        {active?.text ?? ''}
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 24, background: '#090d16'}}/>
      <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 24, background: '#090d16'}}/>
      <AbsoluteFill style={{backgroundColor: '#090d16', opacity: ending, pointerEvents: 'none'}}/>
    </AbsoluteFill>
  );
};
