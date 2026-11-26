import React from "react";
import {
  scene,
  Label,
  Panel,
  Art,
  Bars,
  Check,
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
} from "./CompletionCore";
export const MetricPills = scene("Metric Pills", ({ p, t, text, props }) => {
  const values = props.values ?? [19, 90, 250],
    n = values.length;
  return (
    <g>
      {values.slice(0, 5).map((v, i) => {
        const q = sequence(p, i, n, 0.55),
          x = 320 + (i % 2 ? 1 : -1) * 120 * (1 - q),
          y = 65 + i * 55;
        return (
          <g key={i} opacity={q} transform={`translate(${x - 320} 0)`}>
            <rect
              x={155}
              y={y}
              width={330}
              height={45}
              rx={22}
              fill={i % 2 ? t.tertiary : t.accent}
            />
            <Label
              x={180}
              y={y + 30}
              anchor="start"
              size={18}
              color={i % 2 ? t.ink : t.onAccent}
            >
              {props.items?.[i] ?? text}
            </Label>
            <Label
              x={455}
              y={y + 31}
              anchor="end"
              size={25}
              color={i % 2 ? t.ink : t.onAccent}
            >
              {props.format ? props.format(v * q) : Math.round(v * q)}
            </Label>
          </g>
        );
      })}
    </g>
  );
});
