import React, { useId } from "react";
import { EffectRoot, useEffectProps, type EffectBaseProps } from "./core/effect";
import { clamp01, ease, hash01, lerp, phase, spring01, springs } from "./core/motion";
import { alpha } from "./core/tokens";

type RevealProps = EffectBaseProps & { children: React.ReactNode };
const fill: React.CSSProperties = { position: "absolute", inset: 0 };

/* ---------------------------------------------------------- NoiseDissolve */
export type NoiseDissolveProps = Omit<RevealProps, "grain"> & {
  seed?: number;
  /** Noise frequency (0.05 coarse … 1 fine). Default 0.48. */
  noiseScale?: number;
  /**
   * Legacy: before 2026-11-24 `grain` meant noise frequency on this effect, and a number
   * here is still read that way. Film grain needs a background; use `noiseScale` for frequency.
   */
  grain?: number | boolean;
};
/** Content breaks up into fractal noise and disappears (progress 1 = gone). */
export function NoiseDissolve(props: NoiseDissolveProps) {
  const { children, seed = 18 } = props;
  const legacyFreq = typeof props.grain === "number" && props.noiseScale === undefined;
  const freq = props.noiseScale ?? (legacyFreq ? (props.grain as number) : 0.48);
  const fx = useEffectProps({ ...props, grain: legacyFreq ? 0 : props.grain });
  const p = ease.inOutCubic(fx.t);
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><filter id="n" x="0%" y="0%" width="100%" height="100%"><feTurbulence type="fractalNoise" numOctaves="3" baseFrequency="' +
    freq +
    '" seed="' +
    seed +
    '"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 0"/><feComponentTransfer><feFuncA type="linear" slope="18" intercept="' +
    (1 - 19 * p) +
    '"/></feComponentTransfer></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>';
  const mask = p > 0 ? 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")' : undefined;
  return (
    <EffectRoot fx={fx}>
      <div
        style={{
          opacity: fx.t >= 1 ? 0 : 1,
          maskImage: mask,
          WebkitMaskImage: mask,
          maskSize: "512px 512px",
          WebkitMaskSize: "512px 512px",
          filter: p > 0 && p < 1 ? `contrast(${1 + 0.15 * p})` : undefined,
        }}
      >
        {children}
      </div>
    </EffectRoot>
  );
}

/* ------------------------------------------------------------- LiquidWipe */
export type LiquidWipeProps = RevealProps & {
  origin?: [number, number];
  waves?: number;
  /** Accent wave that leads the reveal. Default true. */
  lead?: boolean;
  color?: string;
};
/** An organic blob grows from the origin; an accent wave runs just ahead of it. */
export function LiquidWipe(props: LiquidWipeProps) {
  const { children, origin = [0.5, 0.5], waves = 3, lead = true } = props;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const fx = useEffectProps(props);
  const p = ease.inOutCubic(fx.t);
  const leadColor = props.color ?? fx.roles.accent;
  const poly = (grow: number, wobble: number) =>
    Array.from({ length: 120 }, (_, i) => {
      const a = (i * Math.PI) / 60;
      const r =
        grow *
        1.8 *
        (1 + wobble * (0.12 * Math.sin(a * waves + fx.t * 5) + 0.06 * Math.cos(a * (waves + 2) - fx.t * 7)));
      return origin[0] + r * Math.cos(a) + "," + (origin[1] + r * Math.sin(a));
    }).join(" ");
  const done = fx.t >= 1;
  return (
    <EffectRoot fx={fx}>
      <div style={{ position: "relative" }}>
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <clipPath id={id + "a"} clipPathUnits="objectBoundingBox">
            <polygon points={poly(p, 1)} />
          </clipPath>
          <clipPath id={id + "b"} clipPathUnits="objectBoundingBox">
            <polygon points={poly(Math.min(1, p * 1.1 + 0.03 * Math.sin(Math.PI * p)), 1.3)} />
          </clipPath>
        </svg>
        <div style={{ visibility: "hidden" }}>{children}</div>
        {lead && !done && p > 0 && (
          <div style={{ ...fill, background: leadColor, clipPath: `url(#${id}b)` }} />
        )}
        <div style={{ ...fill, clipPath: done ? undefined : `url(#${id}a)`, opacity: p > 0 ? 1 : 0 }}>{children}</div>
      </div>
    </EffectRoot>
  );
}

/* ----------------------------------------------------------- DitherReveal */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export type DitherRevealProps = RevealProps & {
  columns?: number;
  rows?: number;
  seed?: number;
  /** "bayer" ordered dither (default) or "random" cells (legacy look). */
  pattern?: "bayer" | "random";
  /** Sweep direction of the reveal front. Default "left". */
  from?: "left" | "none";
};
/** Content appears through a coarse dither pattern that sweeps across it. */
export function DitherReveal(props: DitherRevealProps) {
  const { children, columns = 64, rows = 20, seed = 1, pattern = "bayer", from = "left" } = props;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const fx = useEffectProps(props);
  const p = ease.inOutCubic(fx.t);
  const done = fx.t >= 1;
  return (
    <EffectRoot fx={fx}>
      <div style={{ clipPath: done ? undefined : `url(#${id})` }}>
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <clipPath id={id} clipPathUnits="objectBoundingBox">
            {!done &&
              Array.from({ length: columns * rows }, (_, i) => {
                const cx = i % columns,
                  cy = Math.floor(i / columns);
                const threshold =
                  pattern === "bayer"
                    ? (BAYER4[(cy % 4) * 4 + (cx % 4)] + 0.5) / 16
                    : hash01(i, seed);
                const sweep = from === "left" ? cx / columns : 0;
                const local = from === "left" ? clamp01(p * 1.6 - sweep * 0.6) : p;
                return threshold < local ? (
                  <rect
                    key={i}
                    x={cx / columns}
                    y={cy / rows}
                    width={1.002 / columns}
                    height={1.002 / rows}
                  />
                ) : null;
              })}
          </clipPath>
        </svg>
        {children}
      </div>
    </EffectRoot>
  );
}

/* -------------------------------------------------------------- PaperFlip */
/** Tiles flip down from their top edge in sequence, with paper shading and a spring settle. */
export function PaperFlip(props: RevealProps & { columns?: number; stagger?: number; gap?: number }) {
  const { children, columns = 4, stagger = 0.5, gap = 4 } = props;
  const fx = useEffectProps(props);
  const tiles = React.Children.toArray(children);
  return (
    <EffectRoot fx={fx}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(" + columns + ", minmax(max-content, 1fr))", gap }}>
        {tiles.map((tile, i) => {
          const t = clamp01((fx.t - (stagger * i) / Math.max(1, tiles.length - 1)) / (1 - stagger));
          const s = spring01(t, springs.soft);
          const angle = -92 * (1 - s);
          return (
            <div
              key={i}
              style={{
                position: "relative",
                transformOrigin: "top",
                opacity: clamp01(t * 6),
                transform: "perspective(520px) rotateX(" + angle + "deg)",
              }}
            >
              {tile}
              <div
                style={{
                  ...fill,
                  pointerEvents: "none",
                  background: "linear-gradient(180deg, #0000, #000)",
                  opacity: 0.35 * Math.min(1, Math.abs(angle) / 60),
                }}
              />
            </div>
          );
        })}
      </div>
    </EffectRoot>
  );
}

/* -------------------------------------------------------------------- CRT */
export type CRTProps = Omit<EffectBaseProps, "progress"> & {
  children: React.ReactNode;
  /** Optional; drives the rolling bar and flicker. Static when omitted. */
  progress?: number;
  split?: number;
  pitch?: number;
  /** Corner vignette strength 0..1. Default 0.6. */
  vignette?: number;
};
/** Chromatic split, scanlines, vignette and a rolling refresh bar. */
export function CRT(props: CRTProps) {
  const { children, split = 2, pitch = 4, vignette = 0.6 } = props;
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const fx = useEffectProps({ ...props, progress: props.progress ?? 0 });
  const animated = props.progress !== undefined;
  const bar = lerp(-20, 120, (fx.t * 2) % 1);
  return (
    <EffectRoot fx={fx}>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: "inherit" }}>
        <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
          <filter id={id}>
            <feOffset dx={split} />
            <feColorMatrix values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
            <feOffset in="SourceGraphic" dx={-split} />
            <feColorMatrix values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" />
            <feBlend in2="red" mode="screen" />
          </filter>
        </svg>
        <div style={{ filter: "url(#" + id + ")" }}>{children}</div>
        <div
          style={{
            ...fill,
            pointerEvents: "none",
            background:
              "repeating-linear-gradient(0deg,#0006 0px,#0006 1px,transparent 1px,transparent " + pitch + "px)",
            boxShadow: `inset 0 0 ${60 * vignette}px ${alpha("#000000", 0.7 * vignette)}`,
          }}
        />
        {animated && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: "18%",
              top: bar + "%",
              pointerEvents: "none",
              background: "linear-gradient(transparent, #ffffff1c, transparent)",
            }}
          />
        )}
      </div>
    </EffectRoot>
  );
}

/* ---------------------------------------------------------- FisheyePicker */
export type FisheyePickerProps = Omit<EffectBaseProps, "progress"> & {
  /** Fractional index of the focused item. */
  position?: number;
  /** Alternative to `position`: 0..1 maps to the first..last item. */
  progress?: number;
  items: React.ReactNode[];
  spacing?: number;
  /** Draw accent guide lines around the focus slot. Default true. */
  guides?: boolean;
};
/** A drum picker: items curve away from a focus slot with depth, blur and fade. */
export function FisheyePicker(props: FisheyePickerProps) {
  const { items, spacing = 66, guides = true } = props;
  const fx = useEffectProps({ ...props, progress: props.progress ?? 0 });
  const position =
    props.position ?? (props.progress !== undefined ? ease.inOutCubic(fx.t) * Math.max(0, items.length - 1) : 0);
  return (
    <EffectRoot fx={fx}>
      <div style={{ position: "relative", width: "100%", height: spacing * 5, overflow: "hidden" }}>
        {guides && (
          <div
            style={{
              position: "absolute",
              left: "8%",
              right: "8%",
              top: "50%",
              height: spacing * 0.98,
              transform: "translateY(-50%)",
              borderTop: `1px solid ${alpha(fx.roles.accent, 0.5)}`,
              borderBottom: `1px solid ${alpha(fx.roles.accent, 0.5)}`,
              background: alpha(fx.roles.accent, 0.05),
            }}
          />
        )}
        {items.map((item, i) => {
          const angle = (i - position) * 0.51;
          if (Math.abs(angle) >= Math.PI / 2) return null;
          const focus = Math.cos(angle),
            y = (Math.sin(angle) * spacing) / 0.51;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "50%",
                textAlign: "center",
                opacity: focus ** 2,
                filter: focus < 0.995 ? "blur(" + (1 - focus) * 2.4 + "px)" : undefined,
                transform:
                  "translateY(-50%) translateY(" +
                  y +
                  "px) perspective(750px) rotateX(" +
                  (-angle * 180) / Math.PI +
                  "deg) scale(" +
                  (0.7 + 0.34 * focus) +
                  ")",
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

/* --------------------------------------------------------- HalftoneStairs */
export type HalftoneStairsProps = EffectBaseProps & {
  color?: string;
  dot?: string;
  steps?: number;
  /** Dot pitch in px. Default 8. */
  pitch?: number;
};
/** Halftone columns rise as a staircase from the bottom edge. Fills its parent. */
export function HalftoneStairs(props: HalftoneStairsProps) {
  const { steps = 9, pitch = 8 } = props;
  const fx = useEffectProps(props);
  const color = props.color ?? fx.roles.accent;
  const dot = props.dot ?? fx.roles.tertiary;
  const n = Math.max(1, Math.round(steps));
  return (
    <EffectRoot fx={fx} align="stretch">
      <div style={{ position: "absolute", inset: 0, display: "flex", pointerEvents: "none" }}>
        {Array.from({ length: n }, (_, i) => {
          const p = ease.outQuart(phase(fx.t * 1.6 - (0.6 * i) / Math.max(1, n - 1), 0, 1));
          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: 100 * p + "%",
                alignSelf: "end",
                backgroundColor: color,
                backgroundImage: `radial-gradient(${dot} ${pitch * 0.19}px, transparent ${pitch * 0.22}px)`,
                backgroundSize: `${pitch}px ${pitch}px`,
                boxShadow: p > 0 ? `inset 0 2px 0 ${alpha(dot, 0.6)}` : undefined,
              }}
            />
          );
        })}
      </div>
    </EffectRoot>
  );
}
