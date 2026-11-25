import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {Extrude} from './Extrude';
import {ShapeTransform} from './ShapeTransform';

export function MotionExamples() {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const progress = Math.min(1, Math.max(0, frame / fps / 1.5));
  const depth = progress * progress * (3 - 2 * progress);
  return <AbsoluteFill style={{background: '#f6f1e9'}}>
    <svg viewBox="0 0 600 180" style={{width: '100%', height: '45%'}}>
      <Extrude silhouette={<text x={40} y={115} fontSize={100} fontWeight={900}>TYPE</text>}
        dx={12 * depth} dy={18 * depth} face="#ec5339"/>
      <Extrude silhouette={<path d="M390 35 L490 35 L440 125 Z"/>}
        dx={-12 * depth} dy={18 * depth} face="#a4bbdf"/>
    </svg>
    <ShapeTransform progress={progress} arc={height * 0.12} fill="#25272b"
      from={{x: width * 0.2, y: height * 0.7, width: 64, height: 64, radius: 32}}
      to={{x: width * 0.7, y: height * 0.7, width: width * 0.35, height: 90, radius: 12}}/>
  </AbsoluteFill>;
}
