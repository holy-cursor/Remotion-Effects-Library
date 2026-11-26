import React from "react";
import {
  scene,
  Label,
  Panel,
  Art,
  clamp,
  phase,
  smooth,
  out,
  pop,
  span,
  mixN,
  fontSize,
  hash01,
  diamond,
  alpha,
} from "./CompletionCore";

export const StrokeFill = scene("Stroke Fill", ({ p, t, props }) => (
  <g>
    {(props.paths ?? [diamond]).map((d, i) => (
      <path
        key={i}
        d={d}
        stroke={t.accent}
        strokeWidth={props.amount ?? 3}
        fill={t.accent}
        fillOpacity={span(p, 0.55, 0.9)}
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - out(phase(p, 0, 0.6))}
      />
    ))}
  </g>
));
export const WhipLetters = scene("Whip Letters", ({ p, t, text, props }) => {
  const chars = Array.from(text),
    size = fontSize(text, 62),
    step = size * 0.61,
    exit = phase(p, 0.62, 0.9),
    anticipate = Math.sin(phase(p, 0.38, 0.62) * Math.PI);
  return (
    <g transform={`translate(${-30 * anticipate + 900 * exit * exit} 0)`}>
      {chars.map((c, i) => {
        const q = out(phase(p, i * 0.015, 0.2 + i * 0.015));
        return (
          <g
            key={i}
            transform={`translate(${320 + (i - (chars.length - 1) / 2) * step} 182) rotate(${-18 * anticipate + 20 * (1 - q)})`}
            opacity={q * (1 - span(p, 0.88, 1))}
          >
            <text
              textAnchor="middle"
              fill={t.ink}
              fontSize={size}
              fontWeight={700}
            >
              {c}
            </text>
          </g>
        );
      })}
    </g>
  );
});
export const WordIconSwap = scene("Word Icon Swap", ({ p, t, text, props }) => {
  const shrink = span(p, 0.16, 0.37),
    rebuild = span(p, 0.65, 0.91),
    a = 1 - shrink + rebuild;
  return (
    <g>
      <g
        transform={`translate(320 180) scale(${Math.max(0.001, a)} 1) translate(-320 -180)`}
        opacity={clamp(a)}
      >
        <Label size={fontSize(text)} color={t.ink}>
          {text}
        </Label>
      </g>
      <g
        opacity={shrink * (1 - rebuild)}
        transform={`translate(320 180) scale(${pop(phase(p, 0.26, 0.5))}) translate(-320 -180)`}
      >
        {props.children ? (
          <Art
            box={{ x: 280, y: 140, width: 80, height: 80 }}
            text=""
            color={t.ink}
            fill={t.accent}
          >
            {props.children}
          </Art>
        ) : (
          <path d="M320 135L365 180L320 225L275 180Z" fill={t.accent} />
        )}
      </g>
    </g>
  );
});
export const CenterRipple = scene("Center Ripple", ({ p, t, text, props }) => {
  const chars = Array.from(text),
    size = fontSize(text, 60),
    step = size * 0.62,
    origin = clamp(props.amount ?? 0.5) * (chars.length - 1);
  return (
    <g>
      {chars.map((c, i) => {
        const delay = (Math.abs(i - origin) / Math.max(1, chars.length)) * 0.8,
          q = pop(phase(p, delay, delay + 0.35));
        return (
          <g
            key={i}
            transform={`translate(${320 + (i - (chars.length - 1) / 2) * step} ${190 + 30 * (1 - q)}) scale(${Math.max(0.001, q)})`}
            opacity={clamp(q)}
          >
            <text
              textAnchor="middle"
              fill={t.ink}
              fontSize={size}
              fontWeight={700}
            >
              {c}
            </text>
          </g>
        );
      })}
    </g>
  );
});
export const SliceGlitch = scene(
  "Slice Glitch",
  ({ p, t, text, id, props }) => {
    const n = Math.max(1, Math.min(20, props.count ?? 8)),
      impact = Math.sin(Math.PI * phase(p, 0.12, 0.72)) * (p < 0.72 ? 1 : 0),
      seed = props.seed ?? 7;
    return (
      <g>
        {Array.from({ length: n }, (_, i) => {
          const x =
            (hash01(i + Math.floor(p * 28) * 17 + seed) - 0.5) * 60 * impact;
          return (
            <g key={i}>
              <defs>
                <clipPath id={`${id}-${i}`}>
                  <rect
                    x={0}
                    y={110 + (i * 130) / n}
                    width={640}
                    height={130 / n + 0.2}
                  />
                </clipPath>
              </defs>
              <g clipPath={`url(#${id}-${i})`}>
                <g transform={`translate(${x} 0)`}>
                  <Label y={202} size={fontSize(text, 64)} color={t.accent}>
                    {text}
                  </Label>
                  <g
                    transform={`translate(${8 * impact} 0)`}
                    opacity={impact * 0.6}
                  >
                    <Label
                      y={202}
                      size={fontSize(text, 64)}
                      color={t.secondary}
                    >
                      {text}
                    </Label>
                  </g>
                </g>
              </g>
            </g>
          );
        })}
      </g>
    );
  },
);
export const PixelStroke = scene(
  "Pixel Stroke",
  ({ p, t, text, id, props }) => {
    const s = fontSize(text, 65),
      q = out(phase(p, 0, 0.8));
    return (
      <g>
        <defs>
          <pattern
            id={id}
            width={props.amount ?? 7}
            height={props.amount ?? 7}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width={Math.max(1, (props.amount ?? 7) - 1)}
              height={Math.max(1, (props.amount ?? 7) - 1)}
              fill={t.accent}
            />
          </pattern>
          <clipPath id={`${id}-reveal`}>
            <rect x={40} y={70} width={560 * q} height={220} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id}-reveal)`}>
          <text
            x={320}
            y={200}
            textAnchor="middle"
            fontSize={s}
            fontWeight={800}
            fill={`url(#${id})`}
            stroke={t.accent}
            strokeWidth={0.6}
            style={{
              filter: `drop-shadow(0 0 ${5 * (props.intensity ?? 1)}px ${alpha(t.accent, 0.6)})`,
            }}
          >
            {text}
          </text>
        </g>
      </g>
    );
  },
);
export const ScrollingType = scene(
  "Scrolling Type",
  ({ p, t, text, id, props }) => {
    const move = (props.amount ?? 160) * p;
    return (
      <g>
        <defs>
          <clipPath id={id}>
            <rect x={30} y={40} width={580} height={280} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          {Array.from({ length: 5 }, (_, i) => (
            <g key={i} transform={`translate(${i % 2 ? -move : move - 160} 0)`}>
              <Label
                x={320}
                y={80 + i * 56}
                size={fontSize(text, 52)}
                color={i === 2 ? t.ink : t.accent}
                opacity={i === 2 ? 1 : 0.22}
              >{`${text}   ${text}   ${text}`}</Label>
            </g>
          ))}
        </g>
        <rect x={30} y={141} width={580} height={62} fill={t.surface} />
        <Label y={188} size={fontSize(text, 44)} color={t.ink}>
          {text}
        </Label>
      </g>
    );
  },
);
export const SoftText = scene("Soft Text", ({ p, t, text, id }) => {
  const q = out(p),
    edge = mixN(-40, 700, q);
  return (
    <g>
      <defs>
        <linearGradient
          id={`${id}-g`}
          gradientUnits="userSpaceOnUse"
          x1={edge - 100}
          x2={edge}
        >
          <stop offset="0" stopColor="white" />
          <stop offset="1" stopColor="black" />
        </linearGradient>
        <mask id={id}>
          <rect width={640} height={360} fill={`url(#${id}-g)`} />
        </mask>
      </defs>
      <g
        mask={p === 1 ? undefined : `url(#${id})`}
        transform={`translate(0 ${14 * (1 - q)})`}
      >
        <Label size={fontSize(text, 62)} color={t.ink}>
          {text}
        </Label>
      </g>
    </g>
  );
});
export const CaptionCues = scene("Caption Cues", ({ p, t, text, props }) => {
  const cues = props.cues ?? [
    { start: 0, end: 0.32, text: text.split(" ")[0] ?? text },
    { start: 0.32, end: 0.67, text },
    { start: 0.67, end: 1, text },
  ];
  const active = cues.find(
    (c) => p >= c.start && (p < c.end || (p === 1 && c.end >= 1)),
  );
  if (!active) return null;
  const q = out(phase(p, active.start, active.start + 0.07));
  return (
    <g transform={`translate(0 ${12 * (1 - q)})`} opacity={q}>
      <rect x={60} y={137} width={520} height={86} rx={14} fill={t.accent} />
      <Label y={191} size={fontSize(active.text, 42)} color={t.onAccent}>
        {active.text}
      </Label>
    </g>
  );
});
