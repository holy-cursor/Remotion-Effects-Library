import React from "react";
import { EffectRoot, useEffectProps, type EffectBaseProps } from "./core/effect";
import { clamp01, ease, hash01, lerp, phase, spring01, springs, stagger } from "./core/motion";
import { alpha, mix } from "./core/tokens";

/**
 * Nineteen progress-driven effects. Every component takes the shared
 * EffectBaseProps (theme, palette, accent, fontFamily, background, scale,
 * speed, delay, grain, grid) on top of its own props.
 * Defaults draw nothing behind content (legacy behaviour); pass
 * `background="canvas"` to get a themed stage.
 */
type Props = EffectBaseProps & { children?: React.ReactNode; color?: string };

const fill: React.CSSProperties = { position: "absolute", inset: 0 };
const center: React.CSSProperties = {
  display: "grid",
  placeItems: "center",
  position: "absolute",
  inset: 0,
};

/* ------------------------------------------------------------------- Iris */
export type IrisProps = Props & {
  /** Opening centre in 0..1 of the box. Default [0.5, 0.5]. */
  origin?: [number, number];
  /** Accent ring that rides the opening edge. Default true. */
  ring?: boolean;
  /** Edge softness in % of the radius. Default 1.5. */
  feather?: number;
};
/** Circular aperture reveal with a travelling accent ring. */
export function Iris(props: IrisProps) {
  const { children, origin = [0.5, 0.5], ring = true, feather = 1.5, color } = props;
  const fx = useEffectProps(props);
  const p = ease.inOutCubic(fx.t);
  const r = p * 104;
  const at = `${origin[0] * 100}% ${origin[1] * 100}%`;
  const ringColor = color ?? fx.roles.accent;
  const ringFade = 1 - phase(fx.t, 0.7, 1);
  const masked =
    fx.t >= 1
      ? undefined
      : `radial-gradient(circle farthest-corner at ${at}, #000 ${r}%, transparent ${r + feather}%)`;
  return (
    <EffectRoot fx={fx}>
      <div style={{ position: "relative" }}>
        <div style={{ maskImage: masked, WebkitMaskImage: masked, opacity: fx.t <= 0 ? 0 : 1 }}>
          {children}
        </div>
        {ring && fx.t > 0 && fx.t < 1 && (
          <div
            style={{
              ...fill,
              pointerEvents: "none",
              opacity: ringFade,
              background: `radial-gradient(circle farthest-corner at ${at}, transparent ${Math.max(0, r - 0.4)}%, ${ringColor} ${r}%, transparent ${r + 3}%)`,
            }}
          />
        )}
      </div>
    </EffectRoot>
  );
}

/* -------------------------------------------------------------- StripWipe */
/** Horizontal bands wipe in one after another, each led by an accent sliver. */
export function StripWipe(props: Props & { bands?: number; edge?: boolean }) {
  const { children, bands = 8, edge = true, color } = props;
  const fx = useEffectProps(props);
  const n = Math.max(1, Math.round(bands));
  const edgeColor = color ?? fx.roles.accent;
  return (
    <EffectRoot fx={fx}>
      <div style={{ position: "relative" }}>
        <div style={{ visibility: "hidden" }}>{children}</div>
        {Array.from({ length: n }, (_, i) => {
          const k = ease.outQuart(stagger(fx.t, i, n, 0.45));
          const top = (i * 100) / n;
          const bottom = ((n - i - 1) * 100) / n;
          return (
            <React.Fragment key={i}>
              <div style={{ ...fill, clipPath: `inset(${top}% ${(1 - k) * 100}% ${bottom}% 0)` }}>{children}</div>
              {edge && k > 0 && k < 1 && (
                <div
                  style={{
                    position: "absolute",
                    top: `${top}%`,
                    height: `${100 / n}%`,
                    left: `calc(${k * 100}% - 3px)`,
                    width: 3 + 24 * (1 - k),
                    background: `linear-gradient(90deg, ${edgeColor}, transparent)`,
                    opacity: 1 - k * 0.6,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </EffectRoot>
  );
}

/* -------------------------------------------------------------- FocusPull */
/** Rack-focus: content resolves from a soft, slightly oversized blur. */
export function FocusPull(props: Props & { blur?: number }) {
  const { children, blur = 14 } = props;
  const fx = useEffectProps(props);
  const k = ease.outCubic(fx.t);
  return (
    <EffectRoot fx={fx}>
      <div
        style={{
          filter: k < 1 ? `blur(${(1 - k) * blur}px) saturate(${0.7 + 0.3 * k})` : undefined,
          transform: `scale(${1.12 - 0.12 * k})`,
          opacity: 0.25 + 0.75 * ease.outQuart(fx.t * 1.6),
        }}
      >
        {children}
      </div>
    </EffectRoot>
  );
}

/* ------------------------------------------------------------------ Sheen */
/** A light sweep across content: wide soft bloom with a bright core. */
export function Sheen(props: Props & { angle?: number }) {
  const { children, color = "#ffffff", angle = 115 } = props;
  const fx = useEffectProps(props);
  const x = lerp(-85, 85, ease.inOutCubic(fx.t));
  return (
    <EffectRoot fx={fx}>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: "inherit" }}>
        {children}
        <div
          style={{
            position: "absolute",
            inset: "-50%",
            pointerEvents: "none",
            mixBlendMode: "screen",
            background: `linear-gradient(${angle}deg, transparent 38%, ${alpha(color, 0.18)} 46%, ${alpha(color, 0.75)} 50%, ${alpha(color, 0.18)} 54%, transparent 62%)`,
            transform: `translateX(${x}%)`,
            opacity: Math.sin(Math.PI * clamp01(fx.t)) ** 0.5,
          }}
        />
      </div>
    </EffectRoot>
  );
}

/* ------------------------------------------------------------------ Orbit */
/** Items circle on a tilted ellipse with depth: far items shrink, blur and dim. */
export function Orbit(props: Props & { radius?: number; tilt?: number; depth?: boolean }) {
  const { children, radius = 145, tilt = 0.45, depth = true } = props;
  const fx = useEffectProps(props);
  const count = React.Children.count(children);
  return (
    <EffectRoot fx={fx}>
      <div style={center}>
        {React.Children.map(children, (item, i) => {
          const a = 2 * Math.PI * (fx.t + i / Math.max(1, count));
          const z = Math.sin(a);
          return (
            <div
              style={{
                position: "absolute",
                zIndex: Math.round(100 + 90 * z),
                filter: depth && z < 0 ? `blur(${-z * 1.6}px)` : undefined,
                opacity: depth ? 0.55 + 0.45 * (z + 1) / 2 : 1,
                transform: `translate(${radius * Math.cos(a)}px, ${radius * tilt * z}px) scale(${0.78 + 0.22 * z})`,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </EffectRoot>
  );
}

/* ----------------------------------------------------------- GlowingTrace */
/** Draws an SVG path with a bloom, a hot head and a fading tail. */
export function GlowingTrace(
  props: Props & { path: string; viewBox?: string; width?: number | string; strokeWidth?: number },
) {
  const { path, viewBox = "0 0 420 160", width = "80%", strokeWidth = 4 } = props;
  const fx = useEffectProps(props);
  const color = props.color ?? fx.roles.accent;
  const k = ease.inOutCubic(fx.t);
  const head = Math.min(0.06, k);
  const common = {
    d: path,
    pathLength: 1,
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <EffectRoot fx={fx}>
      <svg viewBox={viewBox} width={width} style={{ overflow: "visible" }}>
        <path {...common} stroke={fx.roles.line} strokeWidth={strokeWidth * 0.5} opacity={0.6} />
        <path
          {...common}
          stroke={color}
          strokeWidth={strokeWidth * 3.5}
          strokeDasharray="1 1"
          strokeDashoffset={1 - k}
          opacity={0.22}
          style={{ filter: `blur(${strokeWidth * 1.6}px)` }}
        />
        <path {...common} stroke={color} strokeWidth={strokeWidth} strokeDasharray="1 1" strokeDashoffset={1 - k} />
        {k > 0 && k < 1 && (
          <path
            {...common}
            stroke="#ffffff"
            strokeWidth={strokeWidth * 0.9}
            strokeDasharray={`${head} 2`}
            strokeDashoffset={-(k - head)}
            style={{ filter: `drop-shadow(0 0 ${strokeWidth * 1.5}px ${color})` }}
          />
        )}
      </svg>
    </EffectRoot>
  );
}

/* -------------------------------------------------------------- ColorWave */
/** A crest of accent colour travels through the text, lifting each letter it passes. */
export function ColorWave(props: Props & { text: string; fontSize?: number; base?: string; width?: number }) {
  const { text, fontSize = 76, width = 1.6 } = props;
  const fx = useEffectProps(props);
  const color = props.color ?? fx.roles.accent;
  const base = props.base ?? fx.roles.ink;
  const chars = Array.from(text);
  const pos = fx.t * (chars.length + 4) - 2;
  return (
    <EffectRoot fx={fx} inline>
      <strong style={{ fontSize, whiteSpace: "pre", letterSpacing: "-0.04em" }}>
        {chars.map((c, i) => {
          const g = Math.exp(-(((pos - i) / width) ** 2));
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                color: mix(base, color, g),
                transform: `translateY(${-g * fontSize * 0.08}px)`,
              }}
            >
              {c}
            </span>
          );
        })}
      </strong>
    </EffectRoot>
  );
}

/* ------------------------------------------------------------ LetterSwing */
/** Letters swing down from a hinge on their top-left corner and settle with a spring. */
export function LetterSwing(props: Props & { text: string; fontSize?: number }) {
  const { text, fontSize = 72 } = props;
  const fx = useEffectProps(props);
  const chars = Array.from(text);
  return (
    <EffectRoot fx={fx} inline>
      <strong style={{ fontSize, whiteSpace: "pre", letterSpacing: "-0.04em" }}>
        {chars.map((c, i) => {
          const local = stagger(fx.t, i, chars.length, 0.5);
          const s = spring01(local, springs.bouncy);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transformOrigin: "0% 0%",
                opacity: clamp01(local * 5),
                transform: `rotate(${-70 * (1 - s)}deg)`,
              }}
            >
              {c}
            </span>
          );
        })}
      </strong>
    </EffectRoot>
  );
}

/* --------------------------------------------------------------- Scramble */
export type ScrambleProps = Props & {
  text: string;
  /** Glyphs used while a character is unresolved. */
  pool?: string;
  /** Share of the timeline every character spends scrambling. Default 0.35. */
  churn?: number;
  fontSize?: number;
  seed?: number;
};
/** Decoder text: characters churn through a glyph pool and lock in left to right. */
export function Scramble(props: ScrambleProps) {
  const { text, pool = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+/<>", churn = 0.35, fontSize = 68, seed = 3 } = props;
  const fx = useEffectProps(props);
  const chars = Array.from(text);
  const n = chars.length;
  const tick = Math.floor(fx.t * 60);
  return (
    <EffectRoot fx={fx} inline>
      <b
        style={{
          font: fx.font ? undefined : `bold ${fontSize}px monospace`,
          fontSize,
          fontWeight: 700,
          whiteSpace: "pre",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {chars.map((c, i) => {
          const start = n <= 1 ? 0 : (i / (n - 1)) * (1 - churn);
          const lock = start + churn;
          const done = fx.t >= lock;
          const active = fx.t >= start && !done;
          if (c === " ") return <span key={i}> </span>;
          const g = pool[Math.floor(hash01(i * 13 + tick, seed) * pool.length)] ?? c;
          const flash = done ? 1 - phase(fx.t, lock, lock + 0.08) : 0;
          return (
            <span
              key={i}
              style={{
                color: active ? fx.roles.accent : done ? mix(fx.roles.ink, fx.roles.accent, flash) : fx.roles.inkMuted,
                opacity: fx.t < start ? 0.35 : 1,
              }}
            >
              {done ? c : g}
            </span>
          );
        })}
      </b>
    </EffectRoot>
  );
}

/* --------------------------------------------------------- TrackingReveal */
/** Wide-tracked, blurred letters pull together into the final word shape. */
export function TrackingReveal(props: Props & { tracking?: number; fontSize?: number }) {
  const { children, tracking = 18, fontSize = 66 } = props;
  const fx = useEffectProps(props);
  const k = ease.outExpo(fx.t);
  return (
    <EffectRoot fx={fx}>
      <div
        style={{
          letterSpacing: `calc(${(1 - k) * tracking}px - 0.02em)`,
          opacity: ease.outCubic(fx.t * 1.4),
          filter: k < 1 ? `blur(${(1 - k) * 6}px)` : undefined,
          fontSize,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {children}
      </div>
    </EffectRoot>
  );
}

/* ------------------------------------------------------------ RollCounter */
export type RollCounterProps = Props & {
  from?: number;
  to?: number;
  fontSize?: number;
  prefix?: string;
  suffix?: string;
  /** Group thousands with commas. Default true. */
  grouping?: boolean;
};
/** Odometer counter: each digit column rolls, with blur proportional to its speed. */
export function RollCounter(props: RollCounterProps) {
  const { from = 0, to = 100, fontSize = 80, prefix = "", suffix = "", grouping = true } = props;
  const fx = useEffectProps(props);
  const k = ease.outQuart(fx.t);
  const value = lerp(from, to, k);
  const shown = fx.t >= 1 ? to : value;
  const negative = shown < 0;
  const abs = Math.abs(shown);
  const digits = Math.max(1, String(Math.floor(Math.max(Math.abs(from), Math.abs(to)))).length);
  // derivative of outQuart, scaled to digits per frame-ish
  const velocity = 4 * (1 - clamp01(fx.t)) ** 3 * Math.abs(to - from);
  const cols: React.ReactNode[] = [];
  for (let place = digits - 1; place >= 0; place--) {
    const unit = 10 ** place;
    const pos = place === 0 ? abs % 10 : (abs / unit) % 10;
    const exact = fx.t >= 1 ? Math.floor(abs / unit) % 10 : pos;
    const blur = Math.min(4, (velocity / unit) * 0.012) * (fx.t < 1 ? 1 : 0);
    const leadingZero = place > 0 && abs < unit && Math.max(Math.abs(from), Math.abs(to)) >= unit;
    cols.push(
      <span
        key={place}
        style={{
          display: "inline-block",
          height: "1em",
          overflow: "hidden",
          verticalAlign: "top",
          opacity: leadingZero ? 0.18 : 1,
          maskImage: "linear-gradient(transparent, #000 18%, #000 82%, transparent)",
          WebkitMaskImage: "linear-gradient(transparent, #000 18%, #000 82%, transparent)",
        }}
      >
        <span
          style={{
            display: "block",
            transform: `translateY(${-exact}em)`,
            filter: blur > 0.15 ? `blur(${blur}px)` : undefined,
          }}
        >
          {Array.from({ length: 11 }, (_, d) => (
            <span key={d} style={{ display: "block", height: "1em", lineHeight: "1em" }}>
              {d % 10}
            </span>
          ))}
        </span>
      </span>,
    );
    if (grouping && place > 0 && place % 3 === 0) {
      cols.push(
        <span key={"c" + place} style={{ display: "inline-block", width: "0.3em", textAlign: "center" }}>
          ,
        </span>,
      );
    }
  }
  return (
    <EffectRoot fx={fx} inline>
      <b
        style={{
          font: fx.font ? undefined : `bold ${fontSize}px monospace`,
          fontSize,
          fontWeight: 700,
          lineHeight: 1,
          display: "inline-flex",
          alignItems: "flex-start",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "-0.02em",
        }}
      >
        {prefix && <span>{prefix}</span>}
        {negative && <span>−</span>}
        {cols}
        {suffix && <span style={{ marginLeft: "0.05em" }}>{suffix}</span>}
      </b>
    </EffectRoot>
  );
}

/* -------------------------------------------------------- CompressionRing */
export type CompressionRingProps = Props & {
  /** Fraction of the ring left at progress 1. Default 0.15. */
  end?: number;
  trailColor?: string;
  size?: number;
  thickness?: number;
  /** Show the remaining share in the centre. Default false. */
  showValue?: boolean;
  label?: string;
};
/** A full ring compresses to a sliver; a lagging trail arc follows it in. */
export function CompressionRing(props: CompressionRingProps) {
  const { end = 0.15, size = 200, thickness = 17, showValue = false, label } = props;
  const fx = useEffectProps(props);
  const color = props.color ?? fx.roles.accent;
  const trail = props.trailColor ?? fx.roles.secondary;
  const k = ease.inOutCubic(fx.t);
  const lead = 1 - (1 - end) * k;
  const lag = 1 - (1 - end) * ease.inOutCubic(fx.t ** 1.35);
  const r = 78;
  const ring = (len: number, stroke: string, w: number, extra?: React.SVGProps<SVGCircleElement>) => (
    <circle
      cx={100}
      cy={100}
      r={r}
      pathLength={1}
      fill="none"
      stroke={stroke}
      strokeWidth={w}
      strokeLinecap="round"
      strokeDasharray={`${Math.max(0.0001, len)} 1`}
      transform="rotate(-90 100 100)"
      {...extra}
    />
  );
  return (
    <EffectRoot fx={fx} inline>
      <svg height={size} width={size} viewBox="0 0 200 200" style={{ overflow: "visible" }}>
        <circle cx={100} cy={100} r={r} fill="none" stroke={fx.roles.line} strokeWidth={thickness} />
        {ring(lag, trail, thickness, { opacity: 0.55 })}
        {ring(lead, color, thickness * 1.8, { opacity: 0.18, style: { filter: "blur(6px)" } })}
        {ring(lead, color, thickness)}
        {(showValue || label) && (
          <g fill={fx.roles.ink} textAnchor="middle" fontFamily="inherit">
            {showValue && (
              <text x={100} y={label ? 106 : 114} fontSize={40} fontWeight={700} letterSpacing={-1.5}>
                {Math.round(lead * 100)}%
              </text>
            )}
            {label && (
              <text x={100} y={showValue ? 132 : 106} fontSize={13} fill={fx.roles.inkMuted} letterSpacing={1.5}>
                {label.toUpperCase()}
              </text>
            )}
          </g>
        )}
      </svg>
    </EffectRoot>
  );
}

/* ------------------------------------------------------------ SegmentFill */
/** Skewed segments light up in sequence, each with a small spring pop. */
export function SegmentFill(
  props: Props & { count?: number; inactiveColor?: string; width?: number; height?: number; gap?: number },
) {
  const { count = 16, width = 18, height = 65, gap = 4 } = props;
  const fx = useEffectProps(props);
  const color = props.color ?? fx.roles.accent;
  const inactive = props.inactiveColor ?? fx.roles.line;
  const n = Math.max(1, Math.round(count));
  const lit = fx.t * n;
  return (
    <EffectRoot fx={fx} inline>
      <div style={{ display: "flex", gap, alignItems: "center" }}>
        {Array.from({ length: n }, (_, i) => {
          const local = clamp01(lit - i);
          const s = spring01(clamp01(local * 1.6), springs.snappy);
          const on = local > 0;
          const lead = on && lit - i < 1.5 && fx.t < 1;
          return (
            <i
              key={i}
              style={{
                width,
                height,
                borderRadius: 3,
                transform: `skewX(-12deg) scaleY(${on ? 0.86 + 0.14 * s : 0.86})`,
                background: on ? `linear-gradient(180deg, ${mix(color, "#ffffff", 0.18)}, ${color})` : inactive,
                boxShadow: lead ? `0 0 18px ${alpha(color.startsWith("#") ? color : "#ffffff", 0.55)}` : undefined,
                opacity: on ? 0.55 + 0.45 * s : 1,
              }}
            />
          );
        })}
      </div>
    </EffectRoot>
  );
}

/* ------------------------------------------------------------- DepthFlyIn */
/** Content flies in from depth with a 3D turn and atmospheric blur. */
export function DepthFlyIn(props: Props) {
  const { children } = props;
  const fx = useEffectProps(props);
  const k = ease.outQuint(fx.t);
  return (
    <EffectRoot fx={fx}>
      <div
        style={{
          opacity: ease.outCubic(fx.t * 3),
          filter: k < 0.98 ? `blur(${(1 - k) * 8}px)` : undefined,
          transform: `perspective(900px) translateZ(${(1 - k) * -520}px) rotateY(${(1 - k) * 48}deg) rotateX(${(1 - k) * 18}deg)`,
        }}
      >
        {children}
      </div>
    </EffectRoot>
  );
}

/* --------------------------------------------------------------- FoldAway */
/** Content folds back on its top hinge, darkening as it turns away. */
export function FoldAway(props: Props) {
  const { children } = props;
  const fx = useEffectProps(props);
  const k = ease.inCubic(fx.t);
  return (
    <EffectRoot fx={fx}>
      <div
        style={{
          position: "relative",
          transformOrigin: "top",
          transform: `perspective(700px) rotateX(${-89 * k}deg)`,
          opacity: 1 - phase(fx.t, 0.82, 1),
        }}
      >
        {children}
        <div style={{ ...fill, pointerEvents: "none", background: "#000", opacity: 0.45 * k }} />
      </div>
    </EffectRoot>
  );
}

/* ------------------------------------------------------------------- Dock */
export type DockProps = Props & {
  x?: number;
  y?: number;
  /** Scale reached at progress 1. Preferred over the legacy `scale`. */
  targetScale?: number;
  /** Arc height of the travel in px. Default 40. */
  arc?: number;
};
/**
 * Content travels on an arc to a docked corner position and shrinks.
 * Legacy: if `targetScale` is not set, a numeric `scale` is read as the target scale
 * (its meaning before 2026-11-24) and does not scale the whole effect.
 */
export function Dock(props: DockProps) {
  const { children, x = 175, y = -86, arc = 40 } = props;
  const legacyScale = props.targetScale === undefined && props.scale !== undefined;
  const target = props.targetScale ?? props.scale ?? 0.32;
  const fx = useEffectProps({ ...props, scale: legacyScale ? 1 : props.scale });
  const k = ease.inOutCubic(fx.t);
  const lift = Math.sin(Math.PI * k) * arc;
  return (
    <EffectRoot fx={fx}>
      <div
        style={{
          transform: `translate(${x * k}px, ${y * k - lift}px) scale(${1 + (target - 1) * k}) rotate(${-6 * Math.sin(Math.PI * k)}deg)`,
          filter: `drop-shadow(0 ${18 * (1 - k)}px ${24 * (1 - k)}px ${alpha(fx.roles.shadow, 0.22 * (1 - k))})`,
        }}
      >
        {children}
      </div>
    </EffectRoot>
  );
}

/* ------------------------------------------------------------ MovingBlobs */
/** Soft colour fields drifting on Lissajous paths. Fills its parent. */
export function MovingBlobs(props: Props & { colors?: string[]; blur?: number; size?: number }) {
  const { blur = 48, size = 220 } = props;
  const fx = useEffectProps(props);
  const colors = props.colors ?? [fx.roles.accent, fx.roles.secondary, fx.roles.tertiary];
  return (
    <EffectRoot fx={fx}>
      <div style={{ ...center, overflow: "hidden" }}>
        {colors.map((c, i) => {
          const a = fx.t * Math.PI * 2;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: size * (1 + 0.15 * i),
                height: size * (0.85 + 0.1 * i),
                borderRadius: "50%",
                background: `radial-gradient(circle at 40% 40%, ${c}, ${alpha(c.startsWith("#") ? c : "#ffffff", 0)} 70%)`,
                filter: `blur(${blur}px)`,
                opacity: 0.9,
                transform: `translate(${Math.sin(a + i * 2.1) * 210}px, ${Math.cos(a * 1.3 + i) * 110}px) scale(${1 + 0.18 * Math.sin(a * 2 + i)})`,
              }}
            />
          );
        })}
      </div>
    </EffectRoot>
  );
}

/* ---------------------------------------------------------------- DotDrift */
/** A dotted field drifts diagonally behind the content. Fills its parent. */
export function DotDrift(props: Props & { spacing?: number }) {
  const { children, spacing = 18 } = props;
  const fx = useEffectProps(props);
  const color = props.color ?? fx.roles.accent;
  return (
    <EffectRoot fx={fx}>
      <div
        style={{
          ...center,
          backgroundImage: `radial-gradient(${color} 1.3px, transparent 1.8px)`,
          backgroundSize: `${spacing}px ${spacing}px`,
          backgroundPosition: `${fx.t * spacing * 4}px ${fx.t * spacing * 2}px`,
          maskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, #000 30%, transparent 80%)",
        }}
      />
      <div style={center}>{children}</div>
    </EffectRoot>
  );
}

/* -------------------------------------------------------------------- Scan */
/** A glowing scan line sweeps down; content above the line is tinted as scanned. */
export function Scan(props: Props & { tint?: boolean }) {
  const { children, tint = true } = props;
  const fx = useEffectProps(props);
  const color = props.color ?? fx.roles.accent;
  const y = lerp(-8, 108, ease.inOutCubic(fx.t));
  const c = color.startsWith("#") ? color : "#ffffff";
  return (
    <EffectRoot fx={fx}>
      <div style={{ position: "relative", overflow: "hidden" }}>
        {children}
        {tint && (
          <div
            style={{
              ...fill,
              pointerEvents: "none",
              background: alpha(c, 0.08),
              clipPath: `inset(0 0 ${100 - clamp01(y / 100) * 100}% 0)`,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 44,
            top: `calc(${y}% - 44px)`,
            pointerEvents: "none",
            background: `linear-gradient(transparent, ${alpha(c, 0.45)})`,
            borderBottom: `2px solid ${color}`,
            boxShadow: `0 0 16px ${alpha(c, 0.6)}`,
          }}
        />
      </div>
    </EffectRoot>
  );
}
