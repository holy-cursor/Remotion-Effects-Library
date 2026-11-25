/**
 * Binds each metadata entry to its component and a demo scene.
 * Effects receive their props directly, so the gallery exercises the real API.
 */
import React from "react";
import * as FX from "../../../index";
import { EFFECTS } from "../../../meta/effects";
import type { EffectMeta } from "../../../meta/schema";
import { rolesFor, alpha, mix, FONTS, type Roles, type PaletteId, type ThemeMode } from "../../../core/tokens";
import { ease, clamp01 } from "../../../core/motion";
import { EffectStage, useEffectProps } from "../../../core/effect";

export type Values = Record<string, unknown>;
type Ctx = { values: Values; roles: Roles; progress: number; meta: EffectMeta };
type Render = (c: Ctx) => React.ReactNode;

// The barrel's named exports, typed loosely for dynamic lookup by metadata.
const lib = FX as unknown as Record<string, React.ComponentType<Record<string, unknown>>>;

const fill: React.CSSProperties = { position: "absolute", inset: 0 };

export function rolesOf(values: Values): Roles {
  return rolesFor(
    (values.palette as PaletteId) ?? "saint-orange",
    (values.theme as ThemeMode) ?? "light",
    (values.accent as string) || undefined,
  );
}

/** Hex-only mix (the WebGL effect parses #rrggbb). */
function hexMix(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  if (!/^#[0-9a-f]{6}$/i.test(a) || !/^#[0-9a-f]{6}$/i.test(b)) return a;
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

/* ---------------------------------------------------------------- demo art */
function Glyph({ kind = 0, size = 64, color }: { kind?: number; size?: number; color: string }) {
  const d = [
    "M50 6L94 50 50 94 6 50Z",
    "M38 8H62V38H92V62H62V92H38V62H8V38H38Z",
    "M50 8L93 88H7Z",
    "M50 8a42 42 0 1 0 0.01 0Z",
  ][kind % 4];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden>
      <path d={d} fill={color} />
    </svg>
  );
}

/** A designed sample card used as content for wrapper effects. */
export function DemoCard({ roles, title = "Launch day", kicker = "N° 01 / Motion", w = 380, h = 214, glyph = 0 }: { roles: Roles; title?: string; kicker?: string; w?: number; h?: number; glyph?: number }) {
  const hi = mix(roles.accent, "#ffffff", 0.22);
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: 22,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(140deg, ${hi}, ${roles.accent} 48%, ${mix(roles.accent, roles.secondary, 0.55)})`,
        color: roles.onAccent,
        boxShadow: `0 1px 0 ${alpha("#ffffff", 0.35)} inset, 0 24px 48px -18px ${alpha(roles.shadow, 0.45)}`,
        fontFamily: FONTS.sans,
      }}
    >
      <div style={{ position: "absolute", right: -40, top: -50, opacity: 0.18 }}>
        <Glyph kind={3} size={h * 1.25} color={roles.onAccent} />
      </div>
      <div style={{ position: "absolute", left: 22, top: 18, font: `500 11px ${FONTS.mono}`, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.85 }}>
        {kicker}
      </div>
      <div style={{ position: "absolute", right: 22, top: 18 }}>
        <Glyph kind={glyph} size={Math.round(h * 0.16)} color={roles.onAccent} />
      </div>
      <div style={{ position: "absolute", left: 22, bottom: 16, fontSize: Math.round(h * 0.25), fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 0.95 }}>
        {title}
      </div>
    </div>
  );
}

function Ball({ c, s }: { c: string; s: number }) {
  return <div style={{ width: s, height: s, borderRadius: "50%", background: `radial-gradient(circle at 30% 26%, #ffffffcc, ${c} 55%, ${mix(c, "#000000", 0.25)})` }} />;
}

/* ------------------------------------------------------------- props filter */
/** Strip undefined/empty values so component defaults apply. */
export function effectProps(meta: EffectMeta, values: Values, progress: number): Values {
  const out: Values = { progress };
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined || v === "" || k === "progress") continue;
    if (!meta.sharedProps && !(k in meta.props)) continue;
    if (k in meta.props || meta.sharedProps) out[k] = v;
  }
  return out;
}

const textStyle = (roles: Roles, text = ""): React.CSSProperties => ({
  ...fill,
  fontSize: Math.min(88, Math.floor(1050 / Math.max(1, text.length))),
  fontWeight: 700,
  letterSpacing: "-0.045em",
  lineHeight: 1,
  color: roles.ink,
});

/** Themed backdrop drawn by the gallery (used when the effect itself must stay transparent). */
export function ThemedStage({ values, children, align = "center" }: { values: Values; children: React.ReactNode; align?: "center" | "stretch" }) {
  const bg = values.background as string | undefined;
  const fx = useEffectProps({
    progress: 0,
    theme: values.theme as ThemeMode,
    palette: values.palette as PaletteId,
    accent: (values.accent as string) || undefined,
    background: !bg || bg === "none" ? "canvas" : bg,
    grid: values.grid as boolean,
    grain: typeof values.grain === "number" ? values.grain : 0,
    scale: typeof values.scale === "number" ? values.scale : 1,
  });
  return (
    <EffectStage fx={fx} align={align}>
      {children}
    </EffectStage>
  );
}

/* ------------------------------------------------------------- per-kind demos */
const byKind: Record<EffectMeta["kind"], Render> = {
  wrapper: ({ meta, values, roles, progress }) => {
    const C = lib[meta.exportName];
    const small = meta.file === "AdditionalEffects.tsx";
    if (small) {
      // Motion primitives fill their parent box, so stage them inside a bounded 440 × 250 frame.
      const props = { ...effectProps(meta, values, progress), background: "none", grid: false, grain: 0 };
      return (
        <ThemedStage values={values}>
          <div style={{ position: "relative", width: 440, height: 250 }}>
            <C {...props}>
              <DemoCard roles={roles} title="Motion" w={260} h={150} glyph={meta.slug.length} />
            </C>
          </div>
        </ThemedStage>
      );
    }
    return (
      <div style={fill}>
        <C {...effectProps(meta, values, progress)}>
          <DemoCard roles={roles} title={small ? "Motion" : "Launch day"} w={small ? 260 : 380} h={small ? 150 : 214} glyph={meta.slug.length} />
        </C>
      </div>
    );
  },
  text: ({ meta, values, roles, progress }) => {
    const C = lib[meta.exportName];
    return (
      <div style={textStyle(roles, String(values.text ?? meta.name))}>
        <C {...effectProps(meta, values, progress)} />
      </div>
    );
  },
  scene: ({ meta, values, progress }) => {
    const C = lib[meta.exportName];
    return (
      <div style={fill}>
        <C {...effectProps(meta, values, progress)} />
      </div>
    );
  },
  primitive: () => null,
};

const special: Record<string, Render> = {
  "corner-peel": ({ meta, values, roles, progress }) => (
    <div style={{...fill, background: roles.secondary}}>
      <FX.CornerPeel {...(effectProps(meta, values, progress) as {progress:number})}>
        <div style={{...fill, background: roles.accent, color: roles.onAccent, display: "grid", placeItems: "center", fontSize: 64, fontWeight: 700, letterSpacing: "-.04em"}}>Corner Peel</div>
      </FX.CornerPeel>
    </div>
  ),
  "paper-flip": ({ meta, values, roles, progress }) => (
    <div style={fill}>
      <FX.PaperFlip {...(effectProps(meta, values, progress) as { progress: number })} columns={(values.columns as number) ?? 6}>
        {Array.from({ length: 12 }, (_, j) => (
          <div key={j} style={{ width: 84, height: 84, borderRadius: 10, background: [roles.accent, roles.secondary, roles.tertiary, roles.surface][j % 4], display: "grid", placeItems: "center", border: `1px solid ${alpha(roles.ink, 0.08)}` }}>
            <Glyph kind={j} size={34} color={j % 4 === 3 ? roles.accent : roles.onAccent} />
          </div>
        ))}
      </FX.PaperFlip>
    </div>
  ),
  orbit: ({ meta, values, roles, progress }) => (
    <div style={fill}>
      <FX.Orbit {...(effectProps(meta, values, progress) as { progress: number })}>
        {[roles.accent, roles.secondary, roles.tertiary, roles.accent, roles.secondary, roles.ink].map((c, j) => (
          <Ball key={j} c={c} s={34 + j * 5} />
        ))}
      </FX.Orbit>
    </div>
  ),
  "tracking-reveal": ({ meta, values, roles, progress }) => (
    <div style={{ ...fill, color: roles.ink }}>
      <FX.TrackingReveal {...(effectProps(meta, values, progress) as { progress: number })}>Tracking</FX.TrackingReveal>
    </div>
  ),
  dock: ({ meta, values, roles, progress }) => (
    <div style={fill}>
      <FX.Dock {...(effectProps(meta, values, progress) as { progress: number })}>
        <div style={{ width: 150, height: 150, borderRadius: 34, background: `linear-gradient(150deg, ${mix(roles.accent, "#fff", 0.2)}, ${roles.accent})`, display: "grid", placeItems: "center", boxShadow: `0 20px 40px -12px ${alpha(roles.shadow, 0.5)}` }}>
          <Glyph kind={3} size={70} color={roles.onAccent} />
        </div>
      </FX.Dock>
    </div>
  ),
  "dot-drift": ({ meta, values, roles, progress }) => (
    <div style={fill}>
      <FX.DotDrift {...(effectProps(meta, values, progress) as { progress: number })}>
        <div style={{ fontSize: 86, fontWeight: 700, letterSpacing: "-0.05em", color: roles.ink }}>Dot Drift</div>
      </FX.DotDrift>
    </div>
  ),
  "fisheye-picker": ({ meta, values, roles, progress }) => (
    <div style={fill}>
      <FX.FisheyePicker
        {...(effectProps(meta, values, progress) as { progress: number })}
        items={["Brand", "Motion", "Launch", "Product", "Social", "Story", "System"].map((w, j) => (
          <div key={w} style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 40, fontWeight: 650, letterSpacing: "-0.03em", color: roles.ink }}>
            <Glyph kind={j} size={26} color={roles.accent} />
            {w}
          </div>
        ))}
      />
    </div>
  ),
  "glowing-trace": ({ meta, values, progress }) => (
    <div style={fill}>
      <FX.GlowingTrace {...(effectProps(meta, values, progress) as { progress: number; path: string })} width={(values.width as string) || "86%"} />
    </div>
  ),
  "word-gap-insert": ({ meta, values, progress }) => (
    <div style={fill}>
      <FX.WordGapInsert {...(effectProps(meta, values, progress) as { progress: number })} />
    </div>
  ),
  extrude: ({ values, roles, progress }) => {
    const k = ease.inOutCubic(clamp01(progress));
    const dx = ((values.dx as number) ?? 12) * k;
    const dy = ((values.dy as number) ?? 18) * k;
    return (
      <div style={{ ...fill, display: "grid", placeItems: "center" }}>
        <svg viewBox="0 0 600 220" width="88%">
          <FX.Extrude
            silhouette={
              <text x={300} y={150} textAnchor="middle" fontSize={150} fontWeight={800} letterSpacing={-8} fontFamily={FONTS.sans}>
                DEPTH
              </text>
            }
            dx={dx}
            dy={dy}
            face={(values.face as string) || roles.accent}
            side={(values.side as string) || mix(roles.accent, "#000000", 0.55)}
          />
        </svg>
      </div>
    );
  },
  "shape-transform": ({ values, roles, progress }) => (
    <div style={fill}>
      <FX.ShapeTransform
        progress={ease.inOutCubic(clamp01(progress))}
        stationary={(values.stationary as boolean) ?? true}
        arc={(values.arc as number) ?? 0}
        stretch={(values.stretch as number) ?? 0}
        fill={(values.fill as string) || roles.accent}
        from={{ x: 320, y: 180, width: 56, height: 56, radius: 28 }}
        to={{ x: 320, y: 180, width: 300, height: 110, radius: 22 }}
      />
    </div>
  ),
  "molten-metal": ({ values, roles }) => (
    <div style={fill}>
      <FX.MoltenMetal
        color1={(values.color1 as string) || hexMix(roles.accent, "#000000", 0.3)}
        color2={(values.color2 as string) || roles.accent}
        color3={(values.color3 as string) || roles.tertiary}
        backgroundColor={(values.backgroundColor as string) || roles.canvas}
        lightMode={(values.lightMode as boolean | undefined) ?? values.theme !== "dark"}
        paletteOnly={(values.paletteOnly as boolean | undefined) ?? true}
        speed={(values.speed as number) ?? 0.6}
        scale={(values.scale as number) ?? 2.8}
        detail={(values.detail as number) ?? 3}
        glow={(values.glow as number) ?? 2}
        brightness={(values.brightness as number) ?? 1.8}
        grain={(values.grain as boolean | undefined) ?? false}
      />
    </div>
  ),
};

export function renderDemo(meta: EffectMeta, values: Values, progress: number): React.ReactNode {
  const roles = rolesOf(values);
  const r = special[meta.slug] ?? byKind[meta.kind];
  return r({ meta, values, roles, progress });
}

// Sanity: every metadata entry must resolve to an export.
export const MISSING_EXPORTS = EFFECTS.filter((m) => !(m.exportName in lib)).map((m) => m.exportName);
