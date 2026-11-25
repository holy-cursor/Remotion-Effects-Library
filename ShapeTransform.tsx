import React from 'react';

export type ShapePose = {x: number; y: number; width: number; height: number; radius: number};

/** Centers are in composition pixels. Progress comes from the caller's timeline. */
export function ShapeTransform({from, to, progress, arc = 0, stretch = 0,
  stationary = true, fill = 'currentColor', children}: {
  from: ShapePose; to: ShapePose; progress: number; arc?: number; stretch?: number; stationary?: boolean;
  fill?: string; children?: React.ReactNode;
}) {
  const time = Math.max(0, Math.min(1, progress));
  const travel = time * time * (3 - 2 * time);
  const mix = (a: number, b: number) => a + (b - a) * travel;
  const lift = 4 * travel * (1 - travel);
  // Compress before launch, stretch in flight, compress on contact, then settle.
  const compression = Math.exp(-Math.pow((time - 0.13) / 0.085, 2))
    + Math.exp(-Math.pow((time - 0.83) / 0.075, 2));
  const envelope = 4 * time * (1 - time);
  const aspect = Math.exp(stretch * envelope * (3 * compression - lift));
  const width = mix(from.width, to.width) * aspect;
  const height = mix(from.height, to.height) / aspect;
  return <div style={{position: 'absolute', left: stationary ? from.x : mix(from.x, to.x),
    top: stationary ? from.y : mix(from.y, to.y) - arc * lift, transform: 'translate(-50%, -50%)',
    width, height, borderRadius: Math.min(width / 2, height / 2, mix(from.radius, to.radius)),
    overflow: 'hidden', background: fill}}>{children}</div>;
}
