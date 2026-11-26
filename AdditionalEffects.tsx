import { PeelingPage } from "./CornerPeel";
import React from "react";
import { EffectRoot, useEffectProps, type EffectBaseProps, type ResolvedEffect } from "./core/effect";
import { clamp01, ease, hash01, phase, spring01, springs, stagger } from "./core/motion";
import { alpha, mix } from "./core/tokens";

/** Legacy indices remain stable. Empty slots are effects removed from the collection. */
export const EXTRA_NAMES = [
  "Masked Rise",
  "Spring Pop",
  "Typewriter",
  "Character Flip",
  "Elastic Baseline",
  "Word Slide",
  "Text Unfold",
  "Selection Highlight",
  "Outline Fill",
  "Character Scatter",
  "Pixel Cascade",
  "Card Carousel",
  "Border Runner",
  "Camera Push",
  "Parallax Stack",
  "Fan Spread",
  "Accordion",
  "",
  "Radial Shutter",
  "Checker Fold",
  "Ribbon Twist",
  "Path Follow",
  "Grid Ripple",
  "",
  "Trail Echo",
  "",
  "Perspective Tunnel",
  "Corner Peel",
  "Split Slide",
  "Concentric Zoom",
  "Wireframe Reveal",
];

export type MotionProps = EffectBaseProps & {
  children?: React.ReactNode;
  /** Legacy index into EXTRA_NAMES (10–30). */
  index: number;
};

const base: React.CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  width: "100%",
  height: "100%",
  display: "grid",
  placeItems: "center",
  transformStyle: "preserve-3d",
};

function renderMotion(i: number, fx: ResolvedEffect, item: React.ReactNode): React.ReactNode {
  const p = fx.t;
  const q = ease.outCubic(p);
  const t = p * Math.PI * 2;
  const R = fx.roles;
  const copies = (n: number, style: (j: number) => React.CSSProperties) => (
    <>
      {Array.from({ length: n }, (_, j) => (
        <div key={j} style={{ ...base, ...style(j) }}>
          {item}
        </div>
      ))}
    </>
  );
  switch (i) {
    case 10: // Pixel Cascade: tiles drop into place top-left first
      return copies(48, (j) => {
        const col = j % 8,
          row = Math.floor(j / 8);
        const k = ease.outQuart(phase(p * 1.7 - (col + row) / 13 * 0.7, 0, 1));
        return {
          clipPath: `inset(${(row * 100) / 6}% ${100 - ((col + 1) * 100) / 8}% ${100 - ((row + 1) * 100) / 6}% ${(col * 100) / 8}%)`,
          transform: `translateY(${(1 - k) * -220}px) rotate(${(1 - k) * (hash01(j) - 0.5) * 30}deg)`,
          opacity: k,
        };
      });
    case 11: // Card Carousel: cards ride a shallow 3D ellipse
      return copies(5, (j) => {
        const a = ease.inOutCubic(p) * Math.PI * 1.3 + j * 1.2566;
        const z = Math.cos(a);
        return {
          transform: `translate(${Math.sin(a) * 190}px, ${z * 22}px) scale(${0.56 + 0.2 * z}) rotateY(${Math.sin(a) * 38}deg)`,
          zIndex: Math.round(20 + z * 10),
          filter: z < 0 ? `blur(${-z * 1.5}px) brightness(${0.85 + 0.15 * (1 + z)})` : undefined,
        };
      });
    case 12: // Border Runner: a comet of light runs the border
      return (
        <div
          style={{
            ...base,
            borderRadius: 28,
            background: R.surface,
            border: `1px solid ${alpha(R.accent, 0.2)}`,
            overflow: "hidden",
          }}
        >
          {item}
          <svg
            viewBox="0 0 400 210"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}
          >
            {[14, 6, 2].map((width, j) => (
              <rect
                key={j}
                x="3"
                y="3"
                width="394"
                height="204"
                rx="26"
                fill="none"
                stroke={[R.accent, R.secondary, R.tertiary][j]}
                strokeWidth={width}
                opacity={[0.2, 0.65, 1][j]}
                style={{ filter: j === 0 ? "blur(6px)" : undefined }}
                pathLength="1"
                strokeDasharray=".13 .87"
                strokeDashoffset={-ease.inOutCubic(p) * 1.7}
                strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      );
    case 13: // Camera Push: exponential pull-back with lateral drift
      return (
        <div style={{ ...base, transformOrigin: "50% 50%", transform: `translateX(${115 * (1 - q)}px) scale(${Math.exp(Math.log(5) * (1 - ease.inOutCubic(p)))})` }}>
          <svg viewBox="0 0 640 360" style={{position:"absolute",inset:0,width:"100%",height:"100%",overflow:"visible"}}>
            <path d="M-640 40H1280M-640 320H1280M45 -360V720M595 -360V720" fill="none" stroke="currentColor" strokeOpacity={.2}/>
            {[65,490].map((x,i)=><g key={x}><rect x={x} y={65+i*150} width={85} height={65} rx={9} fill="none" stroke="currentColor" strokeOpacity={.4} strokeWidth={2}/><circle cx={x+42} cy={97+i*150} r={12} fill="currentColor" opacity={.2}/></g>)}
          </svg>
          {item}
        </div>
      );
    case 14: // Parallax Stack: layers separate at different rates
      return copies(4, (j) => ({
        transform: `translate(${(j - 1.5) * 60 * Math.sin(t * 0.5)}px, ${(j - 1.5) * 26 * ease.inOutCubic(p)}px) scale(${1 - j * 0.12})`,
        opacity: 1 - j * 0.2,
        filter: j > 1 ? `blur(${(j - 1) * 0.8}px)` : undefined,
        zIndex: 4 - j,
      }));
    case 15: // Fan Spread: cards fan out from a shared pivot with a spring
      return copies(7, (j) => {
        const s = spring01(stagger(p, Math.abs(j - 3), 4, 0.3), springs.soft);
        return {
          transformOrigin: "50% 115%",
          transform: `rotate(${(j - 3) * 13 * s}deg) translateY(${-j * 2}px)`,
          opacity: 0.45 + j / 13,
          filter: `brightness(${0.8 + j * 0.035})`,
        };
      });
    case 16: // Accordion: panels unfold edge to edge
    case 18: // Radial Shutter (legacy, not in gallery)
      return copies(12, (j) => ({
        clipPath: `polygon(50% 50%,${50 + 75 * Math.cos((j * Math.PI) / 6)}% ${50 + 75 * Math.sin((j * Math.PI) / 6)}%,${50 + 75 * Math.cos(((j + 1) * Math.PI) / 6)}% ${50 + 75 * Math.sin(((j + 1) * Math.PI) / 6)}%)`,
        transform: `rotate(${(1 - q) * 75}deg) scale(${q})`,
      }));
    case 19: // Checker Fold: tiles fold up in a diagonal wave
      return copies(20, (j) => {
        const k = ease.outCubic(phase(p * 2 - ((j % 5) + Math.floor(j / 5)) * 0.13, 0, 1));
        return {
          clipPath: `inset(${Math.floor(j / 5) * 25}% ${100 - ((j % 5) + 1) * 20}% ${75 - Math.floor(j / 5) * 25}% ${(j % 5) * 20}%)`,
          transform: `perspective(600px) rotateX(${(1 - k) * 90}deg)`,
          filter: `brightness(${0.6 + 0.4 * k})`,
        };
      });
    case 20: // Ribbon Twist (legacy, not in gallery)
      return copies(15, (j) => ({
        clipPath: `inset(${(j * 100) / 15}% 0 ${100 - ((j + 1) * 100) / 15}% 0)`,
        transform: `translateX(${Math.sin(j * 0.45 + t) * 25 * (1 - p)}px) rotateY(${Math.sin(j * 0.4 + t) * 55 * (1 - p)}deg)`,
      }));
    case 21: // Path Follow: figure-eight travel that banks into its turns
      return (
        <>
          <svg viewBox="-200 -100 400 200" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            <path
              d={Array.from({ length: 81 }, (_, k) => {
                const a = (k / 80) * Math.PI * 2;
                return `${k ? "L" : "M"}${Math.sin(a - Math.PI / 2) * 150} ${Math.sin(a * 2) * 65}`;
              }).join("")}
              fill="none"
              stroke={R.line}
              strokeWidth="1.5"
              strokeDasharray="3 6"
            />
          </svg>
          <div style={{ ...base, transform: `translate(${Math.sin(t - Math.PI / 2) * 150}px, ${Math.sin(t * 2) * 65}px) rotate(${Math.cos(t) * 25}deg) scale(.5)` }}>
            {item}
          </div>
        </>
      );
    case 22: // Grid Ripple: a ring of scale passes through a grid of copies
    case 24: // Trail Echo: fading echoes follow the lead copy
      return copies(7, (j) => ({
        transform: `translate(${Math.sin(t - j * 0.15) * 145}px, ${Math.cos(t - j * 0.15) * 45}px) scale(${0.6 - j * 0.02})`,
        opacity: j === 0 ? 1 : ((7 - j) / 7) * 0.6,
        filter: j ? `blur(${j * 0.6}px)` : undefined,
        zIndex: 7 - j,
      }));
    case 26: // Perspective Tunnel (legacy, not in gallery)
      return copies(8, (j) => ({
        transform: `perspective(500px) translateZ(${((j * 100 + p * 240) % 800) - 650}px) rotate(${j * 8}deg)`,
        opacity: 1 - j * 0.08,
        border: `5px solid ${j % 2 ? R.accent : R.secondary}`,
      }));
    case 27:
      return <PeelingPage progress={p} paper={R.surface} shadow={R.shadow}>{item}</PeelingPage>;
    case 28: // Split Slide: halves slide in from opposite sides
      return copies(2, (j) => ({
        clipPath: `inset(${j * 50}% 0 ${(1 - j) * 50}% 0)`,
        transform: `translateX(${(1 - ease.outExpo(p)) * (j ? 520 : -520)}px)`,
      }));
    case 29: // Concentric Zoom (legacy, not in gallery)
      return copies(6, (j) => ({
        transform: `scale(${0.2 + j * 0.2 + p * 0.15}) rotate(${p * 20}deg)`,
        border: `3px solid ${j % 2 ? R.ink : R.secondary}`,
        borderRadius: "50%",
        opacity: 1 - j * 0.12,
      }));
    case 30: // Wireframe Reveal (legacy, not in gallery)
      return (
        <>
          {item}
          <div
            style={{
              ...base,
              background: `repeating-linear-gradient(0deg,transparent 0 14px,${R.accent} 15px 16px),repeating-linear-gradient(90deg,${R.surface} 0 14px,${R.accent} 15px 16px)`,
              clipPath: `inset(0 0 0 ${q * 100}%)`,
              border: `2px solid ${R.ink}`,
            }}
          />
        </>
      );
    default:
      return <>{item}</>;
  }
}

/** Deterministic progress-based primitives; any React content can replace the preview shape. */
export function MotionEffect(props: MotionProps) {
  const fx = useEffectProps(props);
  return <EffectRoot fx={fx}>{renderMotion(props.index, fx, props.children)}</EffectRoot>;
}

type ContentMotion = Omit<MotionProps, "index">;
export const PixelCascade = (props: ContentMotion) => <MotionEffect {...props} index={10} />;
export const CardCarousel = (props: ContentMotion) => <MotionEffect {...props} index={11} />;
export const BorderRunner = (props: ContentMotion) => <MotionEffect {...props} index={12} />;
export const CameraPush = (props: ContentMotion) => <MotionEffect {...props} index={13} />;
export const ParallaxStack = (props: ContentMotion) => <MotionEffect {...props} index={14} />;
export const FanSpread = (props: ContentMotion) => <MotionEffect {...props} index={15} />;
export const Accordion = (props: ContentMotion) => <MotionEffect {...props} index={16} />;
export const CheckerFold = (props: ContentMotion) => <MotionEffect {...props} index={19} />;
export const PathFollow = (props: ContentMotion) => <MotionEffect {...props} index={21} />;
export const GridRipple = (props: ContentMotion) => <MotionEffect {...props} index={22} />;
export const TrailEcho = (props: ContentMotion) => <MotionEffect {...props} index={24} />;
export const SplitSlide = (props: ContentMotion) => <MotionEffect {...props} index={28} />;

/* ================================================================ text */

export type TextMotionProps = Omit<EffectBaseProps, "progress"> & {
  index: number;
  progress: number;
  text: string;
  /** Override the effect's highlight/stroke colour. Defaults to the accent role. */
  color?: string;
};

function renderText(i: number, fx: ResolvedEffect, name: string, colorIn?: string): React.ReactNode {
  const p = fx.t;
  const R = fx.roles;
  const color = colorIn ?? R.accent;
  const chars = Array.from(name);
  const n = chars.length;
  const each = (style: (j: number, k: number) => React.CSSProperties, spread = 0.55, wrap?: React.CSSProperties) =>
    chars.map((c, j) => {
      const k = stagger(p, j, n, spread);
      const span = (
        <span key={j} style={{ display: "inline-block", whiteSpace: "pre", ...style(j, k) }}>
          {c}
        </span>
      );
      return wrap ? (
        <span key={j} style={{ display: "inline-block", ...wrap }}>
          {span}
        </span>
      ) : (
        span
      );
    });

  switch (i) {
    case 0: // Masked Rise
      return each(
        (_, k) => {
          const e = ease.outExpo(k);
          return { transform: `translateY(${(1 - e) * 110}%) skewY(${(1 - e) * 8}deg)`, opacity: k > 0 ? 1 : 0 };
        },
        0.5,
        { overflow: "hidden", verticalAlign: "top", padding: "0.06em 0 0.12em", margin: "-0.06em 0 -0.12em" },
      );
    case 1: // Spring Pop
      return each((_, k) => {
        const s = spring01(k, springs.bouncy);
        return {
          transform: `translateY(${(1 - s) * 0.35}em) scale(${0.35 + 0.65 * s})`,
          opacity: clamp01(k * 6),
          transformOrigin: "50% 80%",
        };
      }, 0.5);
    case 2: {
      // Typewriter
      const shown = Math.floor(clamp01(p) * n);
      const blink = p >= 1 || Math.floor(p * 18) % 2 === 0;
      return (
        <span style={{ whiteSpace: "pre" }}>
          {chars.slice(0, shown).join("")}
          <span
            style={{
              display: "inline-block",
              width: "0.08em",
              height: "0.95em",
              marginLeft: "0.04em",
              verticalAlign: "-0.1em",
              background: color,
              opacity: blink ? 1 : 0,
            }}
          />
        </span>
      );
    }
    case 3: // Character Flip
      return each((_, k) => {
        const s = spring01(k, springs.soft);
        return {
          transform: `perspective(400px) rotateX(${(1 - s) * -100}deg)`,
          transformOrigin: "50% 100%",
          opacity: clamp01(k * 4),
          filter: s < 0.9 ? `blur(${(1 - s) * 3}px)` : undefined,
          color: mix(R.ink, color, (1 - s) * 0.8),
        };
      }, 0.5);
    case 4: // Elastic Baseline
      return each((j) => ({
        transform: `translateY(${Math.sin((p * 3 - j * 0.18) * Math.PI) * 0.45 * (1 - ease.outCubic(p))}em)`,
        opacity: clamp01(p * 8 - j * 0.15),
      }));
    case 5: {
      // Word Slide
      const words = name.split(/(\s+)/);
      const wn = words.filter((w) => w.trim()).length;
      let wi = -1;
      return words.map((w, j) => {
        if (!w.trim()) return <span key={j} style={{ whiteSpace: "pre" }}>{w}</span>;
        wi++;
        const k = ease.outExpo(stagger(p, wi, wn, 0.45));
        return (
          <span key={j} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
            <span
              style={{
                display: "inline-block",
                transform: `translateX(${(1 - k) * 105}%)`,
                opacity: k,
                filter: k < 0.95 ? `blur(${(1 - k) * 4}px)` : undefined,
              }}
            >
              {w}
            </span>
          </span>
        );
      });
    }
    case 6: // Text Unfold
      return each((_, k) => ({
        transform: `scaleY(${Math.max(0.001, ease.outBack(k, 1.2))})`,
        transformOrigin: "50% 100%",
        opacity: clamp01(k * 5),
      }));
    case 7: {
      // Selection Highlight
      const k = ease.inOutCubic(p);
      return (
        <span style={{ position: "relative", display: "inline-block", whiteSpace: "pre" }}>
          <span
            style={{
              position: "absolute",
              left: "-0.08em",
              right: "-0.08em",
              top: "0.08em",
              bottom: "0.02em",
              borderRadius: "0.12em",
              background: colorIn ?? R.tertiary,
              transform: `scaleX(${k})`,
              transformOrigin: "left",
            }}
          />
          <span style={{ position: "relative" }}>{name}</span>
          {k > 0 && k < 1 && (
            <span
              style={{
                position: "absolute",
                top: "0.02em",
                bottom: "-0.04em",
                width: "0.05em",
                left: `calc(${k * 100}% - 0.025em)`,
                background: R.ink,
              }}
            />
          )}
        </span>
      );
    }
    case 8: {
      // Outline Fill
      const draw = ease.inOutCubic(phase(p, 0, 0.45));
      const fillK = ease.inOutCubic(phase(p, 0.35, 1));
      return (
        <span
          style={{
            position: "relative",
            display: "inline-block",
            whiteSpace: "pre",
            color: "transparent",
            WebkitTextStroke: `0.022em ${color}`,
            opacity: 0.25 + 0.75 * draw,
          }}
        >
          {name}
          <span
            style={{
              position: "absolute",
              inset: 0,
              color,
              WebkitTextStroke: "0",
              clipPath: `inset(0 ${(1 - fillK) * 100}% 0 0)`,
            }}
          >
            {name}
          </span>
        </span>
      );
    }
    case 9: // Character Scatter
      return each((j, k) => {
        const e = ease.outQuart(k);
        return {
          transform: `translate(${Math.sin(j * 8) * (1 - e) * 180}px, ${Math.cos(j * 4) * (1 - e) * 130}px) rotate(${(1 - e) * (j % 2 ? 140 : -140)}deg) scale(${0.6 + 0.4 * e})`,
          opacity: e,
          filter: e < 0.9 ? `blur(${(1 - e) * 5}px)` : undefined,
        };
      }, 0.4);
    default:
      return name;
  }
}

/** All ten text effects; `index` selects one (0–9). Text inherits font size from its parent. */
export function TextMotion(props: TextMotionProps) {
  const fx = useEffectProps(props);
  return (
    <EffectRoot fx={fx} inline>
      {renderText(props.index, fx, props.text, props.color)}
    </EffectRoot>
  );
}

export type TextEffectProps = Omit<TextMotionProps, "index">;
export const MaskedRise = (props: TextEffectProps) => <TextMotion {...props} index={0} />;
export const SpringPop = (props: TextEffectProps) => <TextMotion {...props} index={1} />;
export const Typewriter = (props: TextEffectProps) => <TextMotion {...props} index={2} />;
export const CharacterFlip = (props: TextEffectProps) => <TextMotion {...props} index={3} />;
export const ElasticBaseline = (props: TextEffectProps) => <TextMotion {...props} index={4} />;
export const WordSlide = (props: TextEffectProps) => <TextMotion {...props} index={5} />;
export const TextUnfold = (props: TextEffectProps) => <TextMotion {...props} index={6} />;
export const SelectionHighlight = (props: TextEffectProps) => <TextMotion {...props} index={7} />;
export const OutlineFill = (props: TextEffectProps) => <TextMotion {...props} index={8} />;
export const CharacterScatter = (props: TextEffectProps) => <TextMotion {...props} index={9} />;

