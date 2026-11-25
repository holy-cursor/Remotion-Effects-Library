import React, { useId } from "react";
import { EffectRoot, useEffectProps, type EffectBaseProps } from "./core/effect";
import { clamp01, ease } from "./core/motion";

type Point = [number, number];
// Clip the page against its moving diagonal crease. Reflecting the removed
// polygon across that same crease keeps the fold attached throughout the exit.
function halfPlane(points: Point[], c: number, keep: boolean): Point[] {
  return points.flatMap((a, i) => {
    const b = points[(i + 1) % points.length];
    const da = a[0] + a[1] - c, db = b[0] + b[1] - c;
    const inside = keep ? da <= 0 : da >= 0;
    const other = keep ? db <= 0 : db >= 0;
    const result: Point[] = inside ? [a] : [];
    if (inside !== other) {
      const t = da / (da - db);
      result.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    return result;
  });
}

export function PeelingPage({ progress, children, paper, shadow, width = 640, height = 360 }: {
  progress: number; children?: React.ReactNode; paper: string; shadow: string; width?: number; height?: number;
}) {
  const id = useId().replace(/:/g, "");
  const w = Math.max(1, width), h = Math.max(1, height);
  const p = ease.inOutCubic(clamp01(progress)), c = (w + h) * (1 - p);
  const rect: Point[] = [[0, 0], [w, 0], [w, h], [0, h]];
  const page = halfPlane(rect, c, true);
  const fold = halfPlane(rect, c, false).map(([x, y]) => [c - y, c - x]);
  return <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
    <defs>
      <clipPath id={`${id}-page`}><polygon points={page.map(v => v.join(",")).join(" ")} /></clipPath>
      <linearGradient id={`${id}-fold`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={paper} /><stop offset=".8" stopColor={paper} /><stop offset="1" stopColor={shadow} stopOpacity=".35" />
      </linearGradient>
      <filter id={`${id}-shadow`} x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="3" dy="3" stdDeviation="5" floodColor={shadow} floodOpacity=".22" /></filter>
    </defs>
    {p < 1 && <foreignObject width={w} height={h} clipPath={`url(#${id}-page)`}><div style={{ position: "relative", width: w, height: h }}>{children}</div></foreignObject>}
    {p > 0 && p < 1 && <polygon points={fold.map(v => v.join(",")).join(" ")} fill={`url(#${id}-fold)`} filter={`url(#${id}-shadow)`} />}
  </svg>;
}

export type CornerPeelProps = EffectBaseProps & { children?: React.ReactNode; width?: number; height?: number; backColor?: string };
export function CornerPeel({ children, width = 640, height = 360, backColor, ...props }: CornerPeelProps) {
  const fx = useEffectProps(props);
  return <EffectRoot fx={{...fx, background: undefined}}><PeelingPage progress={fx.t} width={width} height={height} paper={backColor ?? fx.roles.surface} shadow={fx.roles.shadow}>
    <EffectRoot fx={{...fx, scale: 1, style: undefined, className: undefined}}>{children}</EffectRoot>
  </PeelingPage></EffectRoot>;
}
