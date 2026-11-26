import React from "react";
import {
  scene,
  Label,
  Panel,
  Art,
  Bars,
  Check,
  Cursor,
  Graph,
  defaultPoints,
  defaultEdges,
  clamp,
  phase,
  smooth,
  out,
  pop,
  span,
  mixN,
  fontSize,
  alpha,
  sequence,
  interpolateBox,
} from "./CompletionCore";
export const FailureRoute = scene(
  "Failure Route",
  ({ p, t, props, items, text }) => {
    const selected = Math.max(
        0,
        Math.min(items.length - 1, props.selectedIndex ?? 1),
      ),
      q = span(p, 0.5, 0.95);
    return (
      <g>
        {items.map((item, i) => {
          const picked = i === selected,
            x = 100 + (i * 440) / Math.max(1, items.length - 1),
            box = interpolateBox(
              { x: x - 60, y: 130, width: 120, height: 100, radius: 9 },
              { x: 80, y: 176, width: 480, height: 8, radius: 4 },
              picked ? q : 0,
            );
          return (
            <g key={i} opacity={picked ? 1 : 1 - span(p, 0.15, 0.5)}>
              <Panel
                x={box.x}
                y={box.y}
                w={box.width}
                h={box.height}
                r={box.radius}
                fill={picked ? t.accent : t.line}
              />
              <path
                d={`M${x - 8} 172l16 16m0 -16l-16 16`}
                stroke={t.onAccent}
                strokeWidth={3}
                opacity={1 - q}
              />
            </g>
          );
        })}
        <circle
          cx={80 + 480 * phase(p, 0.6, 1)}
          cy={180}
          r={7}
          fill={t.secondary}
          opacity={q}
        />
        <Label y={280} size={fontSize(text, 32)} color={t.ink}>
          {text}
        </Label>
      </g>
    );
  },
);
