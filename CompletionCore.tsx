import React, { useId } from "react";
import {
  EffectRoot,
  useEffectProps,
  type EffectBaseProps,
  type ResolvedEffect,
} from "./core/effect";
export { alpha, mix } from "./core/tokens";
export { hash01 } from "./core/motion";

export const clamp = (v: number) =>
  Math.max(0, Math.min(1, Number.isFinite(v) ? v : 0));
export const phase = (p: number, a = 0, b = 1) =>
  clamp((p - a) / Math.max(0.001, b - a));
export const smooth = (p: number) => {
  const t = clamp(p);
  return t * t * (3 - 2 * t);
};
export const out = (p: number) => 1 - (1 - clamp(p)) ** 3;
export const mixN = (a: number, b: number, p: number) => a + (b - a) * p;
export const pop = (p: number) => {
  const t = clamp(p);
  return t === 0 ? 0 : t === 1 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(9 * t);
};
export const span = (p: number, a: number, b: number) => smooth(phase(p, a, b));
export const sequence = (p: number, i: number, n: number, end = 0.8) =>
  out(phase(p, (i * end) / Math.max(1, n), (i * end) / Math.max(1, n) + 0.2));
export const boundedCount = (n: number | undefined, fallback = 5, max = 80) =>
  Math.max(0, Math.min(max, Math.round(Number.isFinite(n) ? n! : fallback)));
export type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
};
export type Point = { x: number; y: number; label?: string };
export type Cue = { start: number; end: number; text: string };
export type CompletionProps = EffectBaseProps & {
  text?: string;
  items?: string[];
  values?: number[];
  count?: number;
  amount?: number;
  seed?: number;
  children?: React.ReactNode;
  secondary?: React.ReactNode;
  from?: Box;
  to?: Box;
  paths?: string[];
  points?: Point[];
  edges?: [number, number][];
  cues?: Cue[];
  selectedIndex?: number;
  orientation?: "horizontal" | "vertical";
  variant?: string;
  start?: number;
  end?: number;
  intensity?: number;
  radius?: number;
  format?: (n: number) => string;
};
export type Context = {
  p: number;
  t: ResolvedEffect["roles"];
  fx: ResolvedEffect;
  id: string;
  props: CompletionProps;
  text: string;
  items: string[];
  n: number;
};
export function scene(name: string, render: (c: Context) => React.ReactNode) {
  const Component = (props: CompletionProps) => {
    const fx = useEffectProps(props),
      id = useId().replace(/:/g, "");
    const p = phase(fx.t, props.start ?? 0, props.end ?? 1),
      items = props.items ?? ["01", "02", "03", "04"];
    return (
      <EffectRoot fx={fx}>
        <svg
          viewBox="0 0 640 360"
          width="100%"
          height="100%"
          role="img"
          aria-label={props.text ?? name}
          style={{
            display: "block",
            overflow: "hidden",
            fontFamily: fx.font ?? "inherit",
          }}
        >
          {render({
            p,
            t: fx.roles,
            fx,
            id,
            props,
            text: props.text ?? name,
            items,
            n: boundedCount(props.count, items.length),
          })}
        </svg>
      </EffectRoot>
    );
  };
  Component.displayName = name;
  return Component;
}
export function Label({
  children,
  x = 320,
  y = 190,
  size = 44,
  color,
  anchor = "middle",
  opacity = 1,
}: {
  children: React.ReactNode;
  x?: number;
  y?: number;
  size?: number;
  color: string;
  anchor?: "middle" | "start" | "end";
  opacity?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fill={color}
      opacity={opacity}
      fontWeight={650}
      fontSize={size}
      letterSpacing={-size * 0.035}
    >
      {children}
    </text>
  );
}
export const fontSize = (text: string, max = 48) =>
  Math.max(
    16,
    Math.min(max, (520 / Math.max(1, Array.from(text).length)) * 1.7),
  );
export function Panel({
  x = 160,
  y = 90,
  w = 320,
  h = 180,
  fill,
  stroke,
  children,
  opacity = 1,
  r = 12,
}: {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  fill: string;
  stroke?: string;
  children?: React.ReactNode;
  opacity?: number;
  r?: number;
}) {
  return (
    <g opacity={opacity}>
      <rect
        x={x}
        y={y}
        width={Math.max(0, w)}
        height={Math.max(0, h)}
        rx={r}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      {children}
    </g>
  );
}
export function Bars({
  x = 190,
  y = 130,
  w = 260,
  color,
  rows = 3,
  gap = 26,
}: {
  x?: number;
  y?: number;
  w?: number;
  color: string;
  rows?: number;
  gap?: number;
}) {
  return (
    <g fill={color}>
      {Array.from({ length: rows }, (_, i) => (
        <rect
          key={i}
          x={x}
          y={y + i * gap}
          width={w * (i === rows - 1 ? 0.64 : 1)}
          height={8}
          rx={4}
        />
      ))}
    </g>
  );
}
export function Check({
  x,
  y,
  color,
  p = 1,
  size = 12,
}: {
  x: number;
  y: number;
  color: string;
  p?: number;
  size?: number;
}) {
  return (
    <path
      d={`M${x - size * 0.65} ${y}l${size * 0.45} ${size * 0.45}l${size * 0.85} ${-size}`}
      fill="none"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - clamp(p)}
    />
  );
}
export function Cursor({
  x,
  y,
  color,
  press = 0,
}: {
  x: number;
  y: number;
  color: string;
  press?: number;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${1 - 0.12 * press})`}>
      <path
        d="M0 0L3 29L10 20L19 30L24 26L15 16L27 14Z"
        fill={color}
        strokeWidth={1.5}
      />
    </g>
  );
}
export const diamond = "M320 95L405 180L320 265L235 180Z";
export function Art({
  children,
  box = { x: 160, y: 90, width: 320, height: 180 },
  text,
  color,
  fill,
}: {
  children?: React.ReactNode;
  box?: Box;
  text: string;
  color: string;
  fill: string;
}) {
  if (children !== undefined)
    return (
      <foreignObject x={box.x} y={box.y} width={box.width} height={box.height}>
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {children}
        </div>
      </foreignObject>
    );
  return (
    <Panel
      x={box.x}
      y={box.y}
      w={box.width}
      h={box.height}
      r={box.radius ?? 12}
      fill={fill}
    >
      <Label
        x={box.x + box.width / 2}
        y={box.y + box.height / 2 + 9}
        size={Math.min(32, (box.width / Math.max(1, text.length)) * 1.4)}
        color={color}
      >
        {text}
      </Label>
    </Panel>
  );
}
export function interpolateBox(a: Box, b: Box, p: number): Box {
  return {
    x: mixN(a.x, b.x, p),
    y: mixN(a.y, b.y, p),
    width: mixN(a.width, b.width, p),
    height: mixN(a.height, b.height, p),
    radius: mixN(a.radius ?? 12, b.radius ?? 12, p),
  };
}
export const defaultPoints: Point[] = [
  { x: 100, y: 180 },
  { x: 245, y: 85 },
  { x: 245, y: 275 },
  { x: 410, y: 85 },
  { x: 410, y: 275 },
  { x: 550, y: 180 },
];
export const defaultEdges: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 5],
];
export function Graph({
  points = defaultPoints,
  edges = defaultEdges,
  p,
  color,
  muted,
  selected = -1,
}: {
  points?: Point[];
  edges?: [number, number][];
  p: number;
  color: string;
  muted: string;
  selected?: number;
}) {
  return (
    <g>
      {edges.map(([a, b], i) =>
        points[a] && points[b] ? (
          <path
            key={i}
            d={`M${points[a].x} ${points[a].y}L${points[b].x} ${points[b].y}`}
            stroke={color}
            opacity={selected < 0 || a === selected || b === selected ? 1 : 0.2}
            strokeWidth={3}
            fill="none"
            pathLength={1}
            strokeDasharray="1 1"
            strokeDashoffset={1 - sequence(p, i, edges.length)}
          />
        ) : null,
      )}
      {points.map((v, i) => (
        <g key={i} opacity={sequence(p, i, points.length)}>
          <circle
            cx={v.x}
            cy={v.y}
            r={13}
            fill={selected < 0 || selected === i ? color : muted}
          />
          {v.label && (
            <Label x={v.x} y={v.y + 32} size={13} color={color}>
              {v.label}
            </Label>
          )}
        </g>
      ))}
    </g>
  );
}
export function Waveform({
  x = 180,
  y = 180,
  w = 280,
  h = 60,
  p = 1,
  color,
  values,
}: {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  p?: number;
  color: string;
  values?: number[];
}) {
  const a =
    values ??
    Array.from(
      { length: 45 },
      (_, i) => 0.15 + 0.85 * Math.abs(Math.sin(i * 0.71) * Math.cos(i * 0.29)),
    );
  return (
    <g
      stroke={color}
      strokeLinecap="round"
      strokeWidth={Math.max(1, (w / Math.max(1, a.length)) * 0.48)}
    >
      {a.map((v, i) => {
        const k =
          Math.min(1, Math.abs(Number.isFinite(v) ? v : 0)) *
          h *
          sequence(p, i, a.length, 0.55);
        return (
          <path
            key={i}
            d={`M${x + (i * w) / Math.max(1, a.length - 1)} ${y - k / 2}v${k}`}
          />
        );
      })}
    </g>
  );
}
