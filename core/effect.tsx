import React, { createContext, useContext } from "react";
import { clamp01, hash01 } from "./motion";
import {
  DEFAULT_PALETTE,

  fontStack,
  PALETTES,
  rolesFor,
  type FontId,
  type PaletteId,
  type Roles,
  type ThemeMode,
} from "./tokens";

/**
 * Legacy palette shape used by InventoryEffects before 2026-11-24.
 * Still accepted by every effect's `theme` prop.
 */
export type LegacyPalette = {
  ink: string;
  paper: string;
  accent: string;
  secondary: string;
  muted: string;
};

/** `"light" | "dark"`, or (legacy) a partial palette object. */
export type ThemeInput = ThemeMode | Partial<LegacyPalette>;

/** Where the effect draws a backdrop. `"none"` keeps the legacy transparent behaviour. */
export type BackgroundInput = "none" | "canvas" | "surface" | (string & {});

/** Props shared by every effect. */
export type EffectBaseProps = {
  /** Normalised timeline position, 0 → 1. Values outside are clamped. */
  progress: number;
  /** Light or dark role set. Legacy palette objects are also accepted. */
  theme?: ThemeInput;
  /** Palette id from core/tokens (default "saint-orange"). */
  palette?: PaletteId;
  /** Overrides the palette's accent role. */
  accent?: string;
  /** Font id from core/tokens (sans, serif, mono…) or any CSS font-family. Default inherits. */
  fontFamily?: FontId | (string & {});
  /** "none" (default, transparent), "canvas", "surface", or any CSS colour/gradient. */
  background?: BackgroundInput;
  /** Uniform content scale. Default 1. */
  scale?: number;
  /** Playback speed multiplier on the progress timeline. 2 finishes at the halfway mark. Default 1. */
  speed?: number;
  /** Share of the timeline (0..0.9) before motion starts. Default 0. */
  delay?: number;
  /** Film grain over the backdrop, 0..1 (true = 0.35). Only drawn with a background. */
  grain?: number | boolean;
  /** Dotted grid on the backdrop. Only drawn with a background. */
  grid?: boolean;
  /** Fine-grained role overrides. */
  tokens?: Partial<Roles>;
  style?: React.CSSProperties;
  className?: string;
};

export type EffectDefaults = Partial<Omit<EffectBaseProps, "progress" | "style" | "className">>;

const EffectThemeContext = createContext<EffectDefaults>({});

/**
 * Provide defaults (palette, theme, accent, font…) to every effect below.
 * Props set directly on an effect win over the provider.
 */
export function EffectTheme({ children, ...value }: EffectDefaults & { children: React.ReactNode }) {
  const parent = useContext(EffectThemeContext);
  return (
    <EffectThemeContext.Provider value={{ ...parent, ...value }}>{children}</EffectThemeContext.Provider>
  );
}

export type ResolvedEffect = {
  /** Timeline after speed and delay, 0..1. Use this for motion. */
  t: number;
  /** Raw clamped progress. */
  progress: number;
  mode: ThemeMode;
  palette: PaletteId;
  roles: Roles;
  font?: string;
  background?: string;
  scale: number;
  grain: number;
  grid: boolean;
  style?: React.CSSProperties;
  className?: string;
};

function legacyToRoles(p: Partial<LegacyPalette>): Partial<Roles> {
  const r: Partial<Roles> = {};
  if (p.ink) r.ink = p.ink;
  if (p.paper) {
    r.surface = p.paper;
    r.onAccent = p.paper;
  }
  if (p.accent) r.accent = p.accent;
  if (p.secondary) r.secondary = p.secondary;
  if (p.muted) {
    r.line = p.muted;
    r.tertiary = p.muted;
  }
  return r;
}

/** Apply speed and delay to a normalised progress value. */
export function retime(progress: number, speed = 1, delay = 0): number {
  const p = clamp01(progress);
  const d = Math.max(0, Math.min(0.9, delay));
  const s = Math.max(0.05, speed);
  return clamp01(((p - d) / (1 - d)) * s);
}

/** Resolve shared props + context into concrete values. Call at the top of every effect. */
export function useEffectProps(props: Omit<EffectBaseProps, "progress"> & { progress: number }): ResolvedEffect {
  const ctx = useContext(EffectThemeContext);
  const themeIn = props.theme ?? ctx.theme;
  const mode: ThemeMode = themeIn === "dark" ? "dark" : "light";
  const legacy = typeof themeIn === "object" ? legacyToRoles(themeIn) : undefined;
  const palette = props.palette ?? ctx.palette ?? DEFAULT_PALETTE;
  const roles = rolesFor(palette in PALETTES ? palette : DEFAULT_PALETTE, mode, props.accent ?? ctx.accent, {
    ...ctx.tokens,
    ...legacy,
    ...props.tokens,
  });
  const bgIn = props.background ?? ctx.background ?? "none";
  const background =
    bgIn === "none" ? undefined : bgIn === "canvas" ? roles.canvas : bgIn === "surface" ? roles.surface : bgIn;
  const grainIn = props.grain ?? ctx.grain ?? 0;
  return {
    t: retime(props.progress, props.speed ?? ctx.speed, props.delay ?? ctx.delay),
    progress: clamp01(props.progress),
    mode,
    palette,
    roles,
    font: fontStack(props.fontFamily ?? ctx.fontFamily),
    background,
    scale: props.scale ?? ctx.scale ?? 1,
    grain: grainIn === true ? 0.35 : grainIn === false ? 0 : clamp01(grainIn),
    grid: props.grid ?? ctx.grid ?? false,
    style: props.style,
    className: props.className,
  };
}

const grainSvg = (seed: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5 0 0 0 0 .5 0 0 0 0 .5 0 0 0 1.6 -.3'/></filter><rect width='100%' height='100%' filter='url(#g)'/></svg>`,
  )}")`;
const GRAIN = grainSvg(7);

/** Backdrop with optional grid, soft light and grain. Fills its parent. */
export function EffectStage({
  fx,
  children,
  align = "center",
}: {
  fx: ResolvedEffect;
  children: React.ReactNode;
  align?: "center" | "stretch";
}) {
  const { roles, mode } = fx;
  const jitter = Math.floor(fx.progress * 60);
  return (
    <div
      className={fx.className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: fx.background,
        color: roles.ink,
        fontFamily: fx.font,
        isolation: "isolate",
        ...fx.style,
      }}
    >
      {/* soft key light */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            mode === "dark"
              ? `radial-gradient(120% 90% at 50% 0%, #ffffff0d, transparent 60%)`
              : `radial-gradient(120% 90% at 50% 0%, #ffffff99, transparent 65%)`,
        }}
      />
      {fx.grid && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `radial-gradient(${roles.line} 1.1px, transparent 1.4px)`,
            backgroundSize: "22px 22px",
            backgroundPosition: "center",
            maskImage: "radial-gradient(ellipse at center, #000 35%, transparent 85%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, #000 35%, transparent 85%)",
            opacity: mode === "dark" ? 0.9 : 1,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: align === "center" ? "grid" : "block",
          placeItems: "center",
          transform: fx.scale !== 1 ? `scale(${fx.scale})` : undefined,
        }}
      >
        {children}
      </div>
      {fx.grain > 0 && (
        <div
          style={{
            position: "absolute",
            inset: -40,
            pointerEvents: "none",
            backgroundImage: GRAIN,
            backgroundPosition: `${Math.round(hash01(jitter) * 200)}px ${Math.round(hash01(jitter, 3) * 200)}px`,
            opacity: fx.grain * (mode === "dark" ? 0.55 : 0.4),
            mixBlendMode: mode === "dark" ? "screen" : "multiply",
          }}
        />
      )}
    </div>
  );
}

/**
 * Wrap effect output. Without a background this adds nothing (legacy layout);
 * with one it draws an EffectStage. Scale and font are applied either way.
 */
export function EffectRoot({
  fx,
  children,
  inline = false,
  align,
}: {
  fx: ResolvedEffect;
  children: React.ReactNode;
  /** Inline effects (text) scale as inline-block instead of block. */
  inline?: boolean;
  align?: "center" | "stretch";
}) {
  // Inline (text) effects return many sibling spans; keep them on one line inside the stage grid.
  if (fx.background)
    return (
      <EffectStage fx={fx} align={align}>
        {inline ? <span style={{ whiteSpace: "pre" }}>{children}</span> : children}
      </EffectStage>
    );
  if (fx.scale === 1 && !fx.font && !fx.style && !fx.className) return <>{children}</>;
  return (
    <span
      className={fx.className}
      style={{
        display: fx.scale === 1 && !fx.style ? "contents" : inline ? "inline-block" : "block",
        fontFamily: fx.font,
        transform: fx.scale !== 1 ? `scale(${fx.scale})` : undefined,
        transformOrigin: "center",
        ...fx.style,
      }}
    >
      {children}
    </span>
  );
}

