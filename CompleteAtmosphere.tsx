import React from "react";
import {
  scene,
  Label,
  clamp,
  phase,
  smooth,
  out,
  span,
  mixN,
  fontSize,
  hash01,
  alpha,
  boundedCount,
} from "./CompletionCore";

export const SweepGrid = scene("Sweep Grid", ({ p, t, id, text, props }) => {
  const step = Math.max(10, props.amount ?? 28),
    x = mixN(-100, 740, p);
  return (
    <g>
      <defs>
        <pattern
          id={id}
          width={step}
          height={step}
          patternUnits="userSpaceOnUse"
          patternTransform={`translate(${-p * step} ${p * step})`}
        >
          <path
            d={`M${step} 0H0V${step}`}
            stroke={t.accent}
            strokeWidth={1}
            fill="none"
          />
        </pattern>
        <radialGradient
          id={`${id}-g`}
          gradientUnits="userSpaceOnUse"
          cx={x}
          cy={180}
          r={250}
        >
          <stop stopColor="white" />
          <stop offset="1" stopColor="black" />
        </radialGradient>
        <mask id={`${id}-m`}>
          <rect width={640} height={360} fill={`url(#${id}-g)`} />
        </mask>
      </defs>
      <rect width={640} height={360} fill={`url(#${id})`} opacity={0.12} />
      <rect
        width={640}
        height={360}
        fill={`url(#${id})`}
        mask={`url(#${id}-m)`}
      />
      <Label color={t.ink} size={fontSize(text)}>
        {text}
      </Label>
    </g>
  );
});
export const AmbientParticles = scene(
  "Ambient Particles",
  ({ p, t, props, id, text }) => {
    const n = boundedCount(props.count, 40, 120),
      seed = props.seed ?? 11;
    return (
      <g>
        <defs>
          <radialGradient id={id}>
            <stop stopColor={t.accent} stopOpacity={0.22} />
            <stop offset="1" stopColor={t.accent} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse
          cx={320}
          cy={180}
          rx={220 + 20 * Math.sin(p * 6.28)}
          ry={160}
          fill={`url(#${id})`}
        />
        {Array.from({ length: n }, (_, i) => {
          const x = hash01(seed + i * 13) * 640,
            y =
              (((hash01(seed + i * 29) * 360 - p * (30 + hash01(i) * 80)) %
                360) +
                360) %
              360;
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={1 + hash01(i + 3) * 2}
              fill={t.accent}
              opacity={0.2 + hash01(i + 8) * 0.5}
            />
          );
        })}
        <Label size={fontSize(text)} color={t.ink}>
          {text}
        </Label>
      </g>
    );
  },
);
export const RisingMist = scene("Rising Mist", ({ p, t, text, id, props }) => (
  <g>
    <defs>
      <radialGradient id={id}>
        <stop stopColor={t.secondary} stopOpacity={0.5} />
        <stop offset="1" stopColor={t.secondary} stopOpacity={0} />
      </radialGradient>
    </defs>
    {Array.from({ length: 6 }, (_, i) => (
      <ellipse
        key={i}
        cx={i * 130 - 20 + Math.sin(p * 5 + i) * 50}
        cy={mixN(410, 90, p) + (i % 3) * 70}
        rx={150}
        ry={100}
        fill={`url(#${id})`}
        opacity={props.intensity ?? 0.7}
      />
    ))}
    <Label size={fontSize(text)} color={t.ink}>
      {text}
    </Label>
  </g>
));
export const WarpDots = scene("Warp Dots", ({ p, t, text, props }) => {
  const cols = 28,
    rows = 17,
    amp = props.amount ?? 16;
  return (
    <g>
      {Array.from({ length: cols * rows }, (_, i) => {
        const col = i % cols,
          row = Math.floor(i / cols),
          x = col * 24,
          y = row * 24;
        return (
          <circle
            key={i}
            cx={x + Math.sin(row * 0.35 + p * 5) * amp}
            cy={y + Math.sin(col * 0.25 + p * 4) * amp}
            r={1.3 + Math.sin(col * 0.4 + row * 0.3 + p * 6) * 0.8}
            fill={t.accent}
            opacity={0.35}
          />
        );
      })}
      <rect
        x={50}
        y={133}
        width={540}
        height={80}
        rx={12}
        fill={t.surface}
        opacity={0.9}
      />
      <Label size={fontSize(text)} color={t.ink}>
        {text}
      </Label>
    </g>
  );
});
export const PerspectiveGrid = scene(
  "Perspective Grid",
  ({ p, t, text, id }) => (
    <g>
      <defs>
        <radialGradient id={id}>
          <stop stopColor={t.accent} stopOpacity={0.38} />
          <stop offset="1" stopColor={t.accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={320} cy={155} rx={230} ry={100} fill={`url(#${id})`} />
      {Array.from({ length: 19 }, (_, i) => (
        <path
          key={i}
          d={`M${320 + (i - 9) * 10} 175L${320 + (i - 9) * 105} 360`}
          stroke={t.accent}
          opacity={0.22}
        />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const d = ((i + p) / 12) ** 2;
        return (
          <path
            key={i}
            d={`M0 ${175 + 185 * d}H640`}
            stroke={t.accent}
            opacity={0.2 + 0.4 * d}
          />
        );
      })}
      <Label y={135} size={fontSize(text)} color={t.ink}>
        {text}
      </Label>
    </g>
  ),
);
export const GrainField = scene("Grain Field", ({ p, t, id, props, text }) => {
  const seed = props.seed ?? 17,
    n = boundedCount(props.count, 400, 900);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <circle
          key={i}
          cx={hash01(i * 3 + seed) * 640}
          cy={hash01(i * 7 + seed) * 360}
          r={0.4 + hash01(i + seed) * 1.4}
          fill={t.ink}
          opacity={(props.intensity ?? 0.2) * (0.6 + 0.4 * Math.sin(p * 4 + i))}
        />
      ))}
      {[
        [30, 30],
        [610, 30],
        [30, 330],
        [610, 330],
      ].map(([x, y], i) => (
        <path
          key={i}
          d={`M${x - 7} ${y}h14M${x} ${y - 7}v14`}
          stroke={t.accent}
          strokeWidth={1.5}
        />
      ))}
      <Label size={fontSize(text)} color={t.ink}>
        {text}
      </Label>
    </g>
  );
});
export const HalftoneArc = scene("Halftone Arc", ({ p, t, id, props }) => {
  const q = out(phase(p, 0, 0.75)),
    shift = span(p, 0.8, 1) * 160;
  return (
    <g transform={`translate(${-shift} 0)`}>
      <defs>
        <pattern id={id} width={9} height={9} patternUnits="userSpaceOnUse">
          <circle cx={4.5} cy={4.5} r={props.amount ?? 2.8} fill={t.accent} />
        </pattern>
        <mask id={`${id}-m`}>
          <rect width={640} height={360} fill="black" />
          <circle cx={320} cy={180} r={240 * q} fill="white" />
        </mask>
      </defs>
      <path
        d="M100 280A220 220 0 0 1 540 280H450A130 130 0 0 0 190 280Z"
        fill={`url(#${id})`}
        mask={`url(#${id}-m)`}
      />
    </g>
  );
});
export const PixelLogo = scene("Pixel Logo", ({ p, t, props }) => {
  const gap = props.amount ?? 5,
    size = 70;
  return (
    <g>
      {Array.from({ length: 4 }, (_, i) => {
        const q = out(phase(p, i * 0.07, 0.5 + i * 0.07)),
          x = 320 + (i % 2 ? gap / 2 : -size - gap / 2),
          y = 180 + (i > 1 ? gap / 2 : -size - gap / 2),
          dx = (i % 2 ? 1 : -1) * 260 * (1 - q),
          dy = (i > 1 ? 1 : -1) * 80 * (1 - q);
        return (
          <rect
            key={i}
            x={x + dx}
            y={y + dy}
            width={size}
            height={size}
            fill={i % 2 ? t.secondary : t.accent}
            opacity={q}
          />
        );
      })}
    </g>
  );
});
export const PixelField = scene("Pixel Field", ({ p, t, id, props, text }) => {
  const cols = 24,
    rows = 14,
    seed = props.seed ?? 3,
    shape = props.paths?.[0];
  return (
    <g>
      <defs>
        <clipPath id={id}>
          {shape ? (
            <path d={shape} />
          ) : (
            <text
              x={320}
              y={205}
              textAnchor="middle"
              fontSize={fontSize(text, 95)}
              fontWeight={800}
            >
              {text}
            </text>
          )}
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        <rect
          width={640}
          height={360}
          fill={t.accent}
          opacity={out(phase(p, 0, 0.24))}
        />
      </g>
      <g>
        {Array.from({ length: cols * rows }, (_, i) => {
          const x = ((i % cols) * 640) / cols,
            y = (Math.floor(i / cols) * 360) / rows,
            dist = Math.hypot(x - 320, y - 180) / 365,
            start = 0.28 + dist * 0.4 + hash01(i + seed) * 0.15,
            q = out(phase(p, start, start + 0.12));
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={640 / cols + 0.5}
              height={360 / rows + 0.5}
              fill={t.accent}
              opacity={q}
            />
          );
        })}
      </g>
    </g>
  );
});
