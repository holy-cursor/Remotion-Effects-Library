import { FONTS, PALETTE_IDS, STYLE_PRESETS } from "../core/tokens";
import type { Category, EffectMeta, EffectPreset, PropGroup, PropSpec } from "./schema";

/* ------------------------------------------------------------- spec helpers */
const num = (d: number, min: number, max: number, step: number, description: string, group: PropGroup = "style"): PropSpec => ({
  kind: "number",
  type: "number",
  default: d,
  min,
  max,
  step,
  description,
  group,
});
const bool = (d: boolean, description: string, group: PropGroup = "style"): PropSpec => ({
  kind: "boolean",
  type: "boolean",
  default: d,
  description,
  group,
});
const text = (d: string, description: string, required = false): PropSpec => ({
  kind: "text",
  type: "string",
  default: d,
  description,
  group: "content",
  required,
});
const str = (d: string, description: string, group: PropGroup = "content"): PropSpec => ({
  kind: "string",
  type: "string",
  default: d,
  description,
  group,
});
const color = (description: string, d?: string): PropSpec => ({
  kind: "color",
  type: "string",
  default: d,
  description,
  group: "style",
});
const select = (d: string, options: readonly string[], description: string, type?: string, group: PropGroup = "style"): PropSpec => ({
  kind: "select",
  type: type ?? options.map((o) => JSON.stringify(o)).join(" | "),
  default: d,
  options,
  description,
  group,
});
const vec2 = (d: [number, number], description: string): PropSpec => ({
  kind: "vec2",
  type: "[number, number]",
  default: d,
  min: 0,
  max: 1,
  step: 0.01,
  description,
  group: "style",
});
const json = (type: string, description: string, d?: unknown, group: PropGroup = "content"): PropSpec => ({
  kind: "json",
  type,
  default: d,
  description,
  group,
  control: false,
});
const node = (description: string, type = "React.ReactNode", required = false): PropSpec => ({
  kind: "node",
  type,
  description,
  group: "content",
  control: false,
  required,
});

/* -------------------------------------------------------------- shared props */
/** Props every effect with `sharedProps: true` accepts (EffectBaseProps in core/effect.tsx). */
export const SHARED_PROPS: Readonly<Record<string, PropSpec>> = {
  progress: { ...num(0, 0, 1, 0.001, "Normalised timeline position. Drive it from useCurrentFrame().", "timing"), required: true, control: false },
  speed: num(1, 0.25, 3, 0.05, "Speed multiplier on the progress timeline. 2 finishes at the halfway mark.", "timing"),
  delay: num(0, 0, 0.6, 0.01, "Share of the timeline before motion starts.", "timing"),
  theme: select("light", ["light", "dark"], "Light or dark role set. Legacy palette objects are also accepted.", '"light" | "dark" | Partial<LegacyPalette>'),
  palette: select("saint-orange", PALETTE_IDS, "Palette id from core/tokens.", "PaletteId"),
  accent: color("Overrides the palette accent role."),
  fontFamily: select("inherit", ["inherit", ...Object.keys(FONTS)], "Font id (sans, serif, mono…) or any CSS font-family. Default inherits.", "FontId | string"),
  background: select("none", ["none", "canvas", "surface"], "Backdrop. \"none\" keeps the transparent legacy behaviour; any CSS colour also works.", '"none" | "canvas" | "surface" | string'),
  scale: num(1, 0.5, 2, 0.05, "Uniform content scale."),
  grain: num(0, 0, 1, 0.05, "Film grain over the backdrop (needs a background)."),
  grid: bool(false, "Dotted grid on the backdrop (needs a background)."),
  tokens: json("Partial<Roles>", "Fine-grained colour role overrides.", undefined, "style"),
  style: json("React.CSSProperties", "Inline styles on the effect root.", undefined, "style"),
};

export const CATEGORIES: readonly Category[] = [
  { id: "reveals", name: "Reveals & Masks", blurb: "Bring content on screen through a shape, pattern or blur." },
  { id: "text", name: "Text", blurb: "Per-letter and per-word typography motion." },
  { id: "numbers", name: "Numbers & Progress", blurb: "Counters, rings and meters that read at a glance." },
  { id: "depth", name: "Depth & Camera", blurb: "3D turns, push-ins and parallax." },
  { id: "transitions", name: "Transitions", blurb: "Slices, folds and peels between states." },
  { id: "paths", name: "Paths & Particles", blurb: "Travel, orbit, echo and gather." },
  { id: "texture", name: "Light & Texture", blurb: "Sheens, scans, CRT, halftone and colour fields." },
  { id: "ui", name: "UI Stories", blurb: "Product-interface moments: chat, forms, toggles, rankings." },
  { id: "data", name: "Data & Charts", blurb: "Series, candles, timelines and fills driven by your data." },
  { id: "primitives", name: "Primitives", blurb: "Low-level building blocks with explicit geometry." },
];

const c = (v: Partial<Record<string, unknown>>, id: string, name: string, description: string): EffectPreset => ({
  id,
  name,
  description,
  values: v as Record<string, unknown>,
});

const TEXT_PRESETS: readonly EffectPreset[] = [
  c({ speed: 0.8, fontFamily: "serif" }, "slow-serif", "Slow serif", "Editorial pace with a serif face."),
  c({ speed: 1.6, fontFamily: "grotesk" }, "punchy", "Punchy", "Fast in, long hold, grotesk."),
  c({ fontFamily: "mono", speed: 1.2 }, "mono-label", "Mono label", "Technical label feel."),
];

/* -------------------------------------------------------------- effect table */
type Def = Omit<EffectMeta, "sharedProps" | "props"> & { props?: Record<string, PropSpec>; sharedProps?: boolean };
const e = (d: Def): EffectMeta => ({ sharedProps: true, props: {}, ...d });

const wrap = (slug: string, name: string, exportName: string, file: string, category: EffectMeta["category"], description: string, tags: string[], props: Record<string, PropSpec> = {}, extra: Partial<Def> = {}) =>
  e({ slug, name, exportName, file, category, kind: "wrapper", description, tags, props: { children: node("Content to animate.", "React.ReactNode", true), ...props }, ...extra });

const textFx = (slug: string, name: string, exportName: string, description: string, tags: string[], extra: Partial<Def> = {}) =>
  e({
    slug,
    name,
    exportName,
    file: "AdditionalEffects.tsx",
    category: "text",
    kind: "text",
    description,
    tags: ["text", ...tags],
    props: { text: text(name, "Text to animate. Inherits font size from its parent.", true), color: color("Highlight / stroke colour. Defaults to the accent role.") },
    presets: TEXT_PRESETS,
    ...extra,
  });

const motionFx = (slug: string, name: string, exportName: string, category: EffectMeta["category"], description: string, tags: string[], extra: Partial<Def> = {}) =>
  wrap(slug, name, exportName, "AdditionalEffects.tsx", category, description, tags, {}, extra);

const inv = (slug: string, name: string, exportName: string, category: EffectMeta["category"], description: string, tags: string[], props: Record<string, PropSpec>, extra: Partial<Def> = {}) =>
  e({ slug, name, exportName, file: "InventoryEffects.tsx", category, kind: "scene", description, tags, props, notes: ["Draws in a 600 × 260 viewBox and fills its parent box."], ...extra });

export const EFFECTS: readonly EffectMeta[] = [
  /* ---------------- primitives */
  e({
    slug: "extrude",
    name: "Extrude",
    exportName: "Extrude",
    file: "Extrude.tsx",
    category: "primitives",
    kind: "primitive",
    sharedProps: false,
    description: "Give any SVG silhouette (text, paths) solid depth. Pass `contours` for lit, rotating walls instead.",
    tags: ["3d", "svg", "depth"],
    props: {
      silhouette: node("SVG elements that define the shape.", "React.ReactNode", true),
      dx: num(12, -40, 40, 1, "Depth projection on x, in SVG units."),
      dy: num(18, -40, 40, 1, "Depth projection on y, in SVG units."),
      face: color("Front face colour.", "#f7f3eb"),
      side: color("Side wall colour.", "#46404d"),
      children: node("Artwork masked onto the face."),
    },
    notes: ["Not progress-driven: animate dx/dy yourself."],
  }),
  e({
    slug: "shape-transform",
    name: "Shape Transform",
    exportName: "ShapeTransform",
    file: "ShapeTransform.tsx",
    category: "primitives",
    kind: "primitive",
    sharedProps: false,
    description: "A centered shape smoothly morphs between circle and rounded rectangle. Translation is opt-in.",
    tags: ["morph", "squash", "stretch"],
    props: {
      progress: { ...num(0, 0, 1, 0.001, "Timeline position.", "timing"), required: true, control: false },
      from: json("ShapePose", "Start pose {x, y, width, height, radius} in composition px.", undefined),
      to: json("ShapePose", "End pose.", undefined),
      stationary: bool(true, "Keep the starting center fixed throughout the morph."),
      arc: num(0, 0, 200, 1, "Arc height in px."),
      stretch: num(0, 0, 0.5, 0.01, "Squash and stretch amount."),
      fill: color("Fill colour.", "currentColor"),
      children: node("Content clipped inside the shape."),
    },
  }),
  e({
    slug: "molten-metal",
    name: "Molten Metal",
    exportName: "MoltenMetal",
    file: "MoltenMetal.tsx",
    category: "texture",
    kind: "primitive",
    sharedProps: false,
    requires: ["ogl"],
    description: "WebGL liquid-metal field. Driven by the Remotion frame; colours and flow are props.",
    tags: ["webgl", "shader", "background"],
    props: {
      color1: color("Shadow tone.", "#5227FF"),
      color2: color("Mid tone.", "#FF9FFC"),
      color3: color("Highlight tone.", "#FFFFFF"),
      backgroundColor: color("Background in light mode.", "#FFFFFF"),
      lightMode: bool(false, "Paint on a light background instead of additive glow."),
      paletteOnly: bool(false, "Use only the three colours (no darkening)."),
      speed: num(0.35, 0, 2, 0.05, "Flow speed.", "timing"),
      scale: num(4, 1, 8, 0.1, "Pattern scale."),
      detail: num(3, 1, 8, 1, "Iterations."),
      glow: num(1.6, 0, 4, 0.1, "Glow strength."),
      brightness: num(1.3, 0.2, 3, 0.1, "Brightness."),
      grain: bool(true, "Shader grain."),
    },
    notes: ["Uses useCurrentFrame; render with --gl=angle or swiftshader in headless renders."],
  }),

  /* ---------------- ReviewEffects */
  wrap("noise-dissolve", "Noise Dissolve", "NoiseDissolve", "ReviewEffects.tsx", "reveals", "Content breaks into fractal noise and disappears.", ["mask", "noise", "exit"], {
    noiseScale: num(0.48, 0.05, 1, 0.01, "Noise frequency: low is coarse, high is fine."),
    seed: num(18, 0, 99, 1, "Noise seed."),
  }, { notes: ["Exit effect: progress 1 means fully hidden.", "Legacy: a numeric `grain` is read as noise frequency on this effect."] }),
  wrap("liquid-wipe", "Liquid Wipe", "LiquidWipe", "ReviewEffects.tsx", "reveals", "An organic blob grows from a point, led by an accent wave.", ["mask", "blob", "wipe"], {
    origin: vec2([0.5, 0.5], "Origin of the blob in 0..1."),
    waves: num(3, 1, 8, 1, "Lobes around the edge."),
    lead: bool(true, "Accent wave running ahead of the reveal."),
    color: color("Lead wave colour (default accent)."),
  }, { flagship: true }),
  wrap("dither-reveal", "Dither Reveal", "DitherReveal", "ReviewEffects.tsx", "reveals", "Content appears through an ordered dither that sweeps across it.", ["mask", "dither", "pixel"], {
    columns: num(64, 8, 120, 1, "Cells across."),
    rows: num(20, 4, 48, 1, "Cells down."),
    pattern: select("bayer", ["bayer", "random"], "Ordered Bayer pattern or random cells (legacy)."),
    from: select("left", ["left", "none"], "Sweep direction."),
    seed: num(1, 0, 99, 1, "Seed for the random pattern."),
  }),
  wrap("paper-flip", "Paper Flip", "PaperFlip", "ReviewEffects.tsx", "transitions", "Tiles flip down from their top edge in sequence, with paper shading.", ["tiles", "flip", "grid"], {
    columns: num(4, 1, 8, 1, "Grid columns."),
    stagger: num(0.5, 0, 0.9, 0.05, "Share of the timeline used for stagger.", "timing"),
    gap: num(4, 0, 24, 1, "Gap between tiles in px."),
  }, { notes: ["Each child is one tile."] }),
  wrap("crt", "CRT", "CRT", "ReviewEffects.tsx", "texture", "Chromatic split, scanlines, vignette and a rolling refresh bar.", ["retro", "scanlines", "chromatic"], {
    split: num(2, 0, 8, 0.5, "Chromatic split in px."),
    pitch: num(4, 2, 10, 1, "Scanline pitch in px."),
    vignette: num(0.6, 0, 1, 0.05, "Corner vignette."),
  }, { notes: ["`progress` is optional; without it the effect is static."] }),
  e({
    slug: "fisheye-picker",
    name: "Fisheye Picker",
    exportName: "FisheyePicker",
    file: "ReviewEffects.tsx",
    category: "ui",
    kind: "scene",
    description: "A drum picker: items curve away from a focus slot with depth, blur and fade.",
    tags: ["picker", "wheel", "list"],
    props: {
      items: node("Items to show.", "React.ReactNode[]", true),
      position: { ...num(0, 0, 10, 0.01, "Fractional focused index. Overrides progress.", "timing"), control: false },
      spacing: num(66, 30, 120, 1, "Row spacing in px."),
      guides: bool(true, "Accent guide lines around the focus slot."),
    },
  }),
  e({
    slug: "halftone-stairs",
    name: "Halftone Stairs",
    exportName: "HalftoneStairs",
    file: "ReviewEffects.tsx",
    category: "texture",
    kind: "scene",
    description: "Halftone columns rise as a staircase from the bottom edge.",
    tags: ["halftone", "dots", "wipe"],
    props: {
      steps: num(9, 2, 24, 1, "Number of columns."),
      pitch: num(8, 4, 20, 1, "Dot pitch in px."),
      color: color("Column colour (default accent)."),
      dot: color("Dot colour (default tertiary)."),
    },
  }),

  /* ---------------- MoreEffects */
  wrap("iris", "Iris", "Iris", "MoreEffects.tsx", "reveals", "Circular aperture reveal with a travelling accent ring.", ["mask", "circle", "aperture"], {
    origin: vec2([0.5, 0.5], "Centre of the aperture in 0..1."),
    ring: bool(true, "Accent ring on the opening edge."),
    feather: num(1.5, 0, 10, 0.5, "Edge softness."),
    color: color("Ring colour (default accent)."),
  }, { flagship: true, presets: [
    c({ origin: [0.15, 0.85], feather: 4 }, "corner", "From the corner", "Opens from bottom-left with a softer edge."),
    c({ ring: false, feather: 0, speed: 1.4 }, "hard-cut", "Hard cut", "No ring, crisp edge, quick."),
  ] }),
  wrap("strip-wipe", "Strip Wipe", "StripWipe", "MoreEffects.tsx", "transitions", "Bands wipe in one after another, each led by an accent sliver.", ["bands", "wipe", "stagger"], {
    bands: num(8, 1, 24, 1, "Number of bands."),
    edge: bool(true, "Accent sliver on each leading edge."),
    color: color("Edge colour (default accent)."),
  }),
  wrap("focus-pull", "Focus Pull", "FocusPull", "MoreEffects.tsx", "reveals", "Rack focus: content resolves from a soft, slightly oversized blur.", ["blur", "focus", "lens"], {
    blur: num(14, 0, 40, 1, "Starting blur in px."),
  }),
  wrap("sheen", "Sheen", "Sheen", "MoreEffects.tsx", "texture", "A light sweep across content: wide soft bloom with a bright core.", ["light", "shine", "card"], {
    color: color("Light colour.", "#ffffff"),
    angle: num(115, 0, 180, 1, "Sweep angle in degrees."),
  }),
  wrap("orbit", "Orbit", "Orbit", "MoreEffects.tsx", "paths", "Items circle on a tilted ellipse with depth: far items shrink, blur and dim.", ["orbit", "loop", "3d"], {
    radius: num(145, 40, 280, 1, "Orbit radius in px."),
    tilt: num(0.45, 0, 1, 0.01, "Vertical squash of the ellipse."),
    depth: bool(true, "Depth blur and dimming."),
  }, { notes: ["Each child is one orbiting item. progress 0→1 is one full turn."] }),
  e({
    slug: "glowing-trace",
    name: "Glowing Trace",
    exportName: "GlowingTrace",
    file: "MoreEffects.tsx",
    category: "paths",
    kind: "scene",
    flagship: true,
    description: "Draws an SVG path with a bloom, a hot head and a faint guide track.",
    tags: ["svg", "stroke", "line", "glow"],
    props: {
      path: { ...str("M30 130 H80 L125 55 H190 L235 109 H310 L358 23 H406", "SVG path data."), required: true },
      viewBox: str("0 0 420 160", "SVG viewBox for the path.", "style"),
      width: { ...str("80%", "Rendered width.", "style"), type: "number | string" },
      strokeWidth: num(4, 1, 12, 0.5, "Stroke width."),
      color: color("Stroke colour (default accent)."),
    },
  }),
  e({
    slug: "color-wave",
    name: "Color Wave",
    exportName: "ColorWave",
    file: "MoreEffects.tsx",
    category: "text",
    kind: "text",
    description: "A crest of accent colour travels through the text, lifting each letter it passes.",
    tags: ["text", "colour", "wave"],
    props: {
      text: text("Color Wave", "Text to animate.", true),
      fontSize: num(76, 24, 160, 1, "Font size in px."),
      width: num(1.6, 0.5, 6, 0.1, "Crest width in letters."),
      color: color("Crest colour (default accent)."),
      base: color("Resting colour (default ink)."),
    },
    presets: TEXT_PRESETS,
  }),
  e({
    slug: "letter-swing",
    name: "Letter Swing",
    exportName: "LetterSwing",
    file: "MoreEffects.tsx",
    category: "text",
    kind: "text",
    description: "Letters swing down from a top-left hinge and settle on a spring.",
    tags: ["text", "spring", "hinge"],
    props: { text: text("Letter Swing", "Text to animate.", true), fontSize: num(72, 24, 160, 1, "Font size in px.") },
    presets: TEXT_PRESETS,
  }),
  e({
    slug: "scramble",
    name: "Scramble",
    exportName: "Scramble",
    file: "MoreEffects.tsx",
    category: "text",
    kind: "text",
    flagship: true,
    description: "Decoder text: characters churn through a glyph pool and lock in left to right.",
    tags: ["text", "decode", "mono", "glitch"],
    props: {
      text: text("SCRAMBLE", "Text to resolve.", true),
      pool: str("ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&*+/<>", "Glyphs used while unresolved.", "style"),
      churn: num(0.35, 0.05, 0.9, 0.01, "Share of the timeline each character scrambles.", "timing"),
      fontSize: num(68, 24, 160, 1, "Font size in px."),
      seed: num(3, 0, 99, 1, "Scramble seed."),
    },
    presets: [
      c({ churn: 0.6, speed: 0.8 }, "long-decode", "Long decode", "Characters churn longer before locking."),
      c({ pool: "01", churn: 0.25 }, "binary", "Binary", "Only 0 and 1 while resolving."),
    ],
  }),
  wrap("tracking-reveal", "Tracking Reveal", "TrackingReveal", "MoreEffects.tsx", "text", "Wide-tracked, blurred letters pull together into the final word shape.", ["text", "tracking", "blur"], {
    tracking: num(18, 0, 60, 1, "Starting extra letter-spacing in px."),
    fontSize: num(66, 24, 160, 1, "Font size in px."),
  }),
  e({
    slug: "roll-counter",
    name: "Roll Counter",
    exportName: "RollCounter",
    file: "MoreEffects.tsx",
    category: "numbers",
    kind: "text",
    flagship: true,
    description: "Odometer counter: each digit column rolls, with blur proportional to its speed.",
    tags: ["number", "counter", "odometer", "stats"],
    props: {
      from: num(0, -100000, 1000000, 1, "Start value.", "content"),
      to: num(100, -100000, 1000000, 1, "End value.", "content"),
      prefix: str("", "Text before the number (e.g. $)."),
      suffix: str("", "Text after the number (e.g. %)."),
      grouping: bool(true, "Thousands separators."),
      fontSize: num(80, 24, 200, 1, "Font size in px."),
    },
    presets: [
      c({ from: 0, to: 48250, prefix: "$" }, "revenue", "Revenue", "Dollar figure with grouping."),
      c({ from: 12, to: 98, suffix: "%" }, "percent", "Percent", "Small range with a suffix."),
    ],
  }),
  e({
    slug: "compression-ring",
    name: "Compression Ring",
    exportName: "CompressionRing",
    file: "MoreEffects.tsx",
    category: "numbers",
    kind: "scene",
    flagship: true,
    description: "A full ring compresses to a sliver while a lagging trail arc follows it in.",
    tags: ["ring", "progress", "gauge"],
    props: {
      end: num(0.15, 0, 1, 0.01, "Share of the ring left at progress 1."),
      size: num(200, 80, 320, 1, "Size in px."),
      thickness: num(17, 4, 40, 1, "Stroke width."),
      showValue: bool(false, "Percentage in the centre.", "content"),
      label: str("", "Caption under the value."),
      color: color("Lead arc colour (default accent)."),
      trailColor: color("Trail arc colour (default secondary)."),
    },
    presets: [c({ showValue: true, label: "Compressed", end: 0.22 }, "readout", "With readout", "Shows the remaining share.")],
  }),
  e({
    slug: "segment-fill",
    name: "Segment Fill",
    exportName: "SegmentFill",
    file: "MoreEffects.tsx",
    category: "numbers",
    kind: "scene",
    description: "Skewed segments light up in sequence, each with a small spring pop.",
    tags: ["meter", "progress", "bars"],
    props: {
      count: num(16, 2, 40, 1, "Number of segments."),
      width: num(18, 4, 40, 1, "Segment width."),
      height: num(65, 10, 140, 1, "Segment height."),
      gap: num(4, 0, 16, 1, "Gap in px."),
      color: color("Lit colour (default accent)."),
      inactiveColor: color("Unlit colour (default line)."),
    },
  }),
  wrap("depth-fly-in", "Depth Fly In", "DepthFlyIn", "MoreEffects.tsx", "depth", "Content flies in from depth with a 3D turn and atmospheric blur.", ["3d", "enter", "perspective"]),
  wrap("fold-away", "Fold Away", "FoldAway", "MoreEffects.tsx", "transitions", "Content folds back on its top hinge, darkening as it turns away.", ["3d", "exit", "hinge"], {}, { notes: ["Exit effect: progress 1 means folded away."] }),
  wrap("dock", "Dock", "Dock", "MoreEffects.tsx", "paths", "Content travels on an arc to a docked corner and shrinks.", ["dock", "minimise", "arc"], {
    x: num(175, -320, 320, 1, "Target x offset in px."),
    y: num(-86, -180, 180, 1, "Target y offset in px."),
    targetScale: num(0.32, 0.1, 1, 0.01, "Scale at progress 1."),
    arc: num(40, 0, 160, 1, "Arc height in px."),
  }, { notes: ["Legacy: without targetScale, a numeric `scale` is read as the target scale."] }),
  e({
    slug: "moving-blobs",
    name: "Moving Blobs",
    exportName: "MovingBlobs",
    file: "MoreEffects.tsx",
    category: "texture",
    kind: "scene",
    description: "Soft colour fields drift on Lissajous paths. Fills its parent.",
    tags: ["background", "gradient", "mesh"],
    props: {
      colors: json("string[]", "Blob colours (default accent, secondary, tertiary)."),
      blur: num(48, 0, 120, 1, "Blur in px."),
      size: num(220, 60, 420, 1, "Blob size in px."),
    },
  }),
  wrap("dot-drift", "Dot Drift", "DotDrift", "MoreEffects.tsx", "texture", "A dotted field drifts diagonally behind the content.", ["background", "dots", "grid"], {
    spacing: num(18, 8, 48, 1, "Dot spacing in px."),
    color: color("Dot colour (default accent)."),
  }),
  wrap("scan", "Scan", "Scan", "MoreEffects.tsx", "texture", "A glowing scan line sweeps down; scanned content is tinted.", ["scan", "line", "hud"], {
    tint: bool(true, "Tint the scanned area."),
    color: color("Line colour (default accent)."),
  }),

  /* ---------------- AdditionalEffects: text */
  textFx("masked-rise", "Masked Rise", "MaskedRise", "Letters rise from behind a baseline mask with a slight skew.", ["mask", "rise"], { flagship: true }),
  textFx("spring-pop", "Spring Pop", "SpringPop", "Letters pop up from small to full size on a bouncy spring.", ["spring", "pop"]),
  textFx("typewriter", "Typewriter", "Typewriter", "Characters type on with a blinking accent caret.", ["type", "caret"]),
  textFx("character-flip", "Character Flip", "CharacterFlip", "Letters flip up on their baseline with a soft spring and a colour fade.", ["flip", "3d"], { flagship: true }),
  textFx("elastic-baseline", "Elastic Baseline", "ElasticBaseline", "The baseline ripples like a plucked string and settles flat.", ["wave", "elastic"]),
  textFx("word-slide", "Word Slide", "WordSlide", "Words slide in from behind their own masks, one after another.", ["words", "slide"]),
  textFx("text-unfold", "Text Unfold", "TextUnfold", "Letters unfold upward from the baseline with a small overshoot.", ["unfold", "scale"]),
  textFx("selection-highlight", "Selection Highlight", "SelectionHighlight", "A highlighter selection sweeps across the text with a caret.", ["highlight", "marker"]),
  textFx("outline-fill", "Outline Fill", "OutlineFill", "An outline draws in, then fills left to right.", ["stroke", "fill"]),
  textFx("character-scatter", "Character Scatter", "CharacterScatter", "Scattered, spinning letters gather into the word.", ["scatter", "gather"]),

  /* ---------------- AdditionalEffects: motion */
  motionFx("pixel-cascade", "Pixel Cascade", "PixelCascade", "reveals", "Tiles of the content drop into place in a diagonal cascade.", ["tiles", "drop"]),
  motionFx("card-carousel", "Card Carousel", "CardCarousel", "depth", "Copies ride a shallow 3D ellipse with depth blur.", ["carousel", "3d"]),
  motionFx("border-runner", "Border Runner", "BorderRunner", "texture", "A comet of light runs around a card border.", ["border", "glow"]),
  motionFx("camera-push", "Camera Push", "CameraPush", "depth", "Exponential camera pull-back with lateral drift.", ["camera", "zoom"]),
  motionFx("parallax-stack", "Parallax Stack", "ParallaxStack", "depth", "Layered copies separate at different rates.", ["parallax", "layers"]),
  motionFx("fan-spread", "Fan Spread", "FanSpread", "paths", "Copies fan out from a shared pivot on a spring.", ["fan", "cards"]),
  motionFx("accordion", "Accordion", "Accordion", "transitions", "Vertical panels unfold edge to edge in 3D.", ["panels", "fold"]),
  motionFx("checker-fold", "Checker Fold", "CheckerFold", "transitions", "Tiles fold up in a diagonal wave.", ["tiles", "fold"]),
  motionFx("path-follow", "Path Follow", "PathFollow", "paths", "Content travels a figure-eight and banks into its turns.", ["path", "loop"]),
  motionFx("grid-ripple", "Grid Ripple", "GridRipple", "paths", "A ring of scale passes through a grid of copies.", ["grid", "ripple"]),
  motionFx("trail-echo", "Trail Echo", "TrailEcho", "paths", "Fading, blurred echoes follow the lead copy.", ["trail", "echo"]),
  motionFx("corner-peel", "Corner Peel", "CornerPeel", "transitions", "The bottom-right corner folds diagonally across the entire page, revealing the scene underneath.", ["page", "exit"], { file: "CornerPeel.tsx", props: {
    children: node("Entire outgoing scene.", "React.ReactNode", true),
    width: num(640, 100, 3840, 1, "Scene coordinate width."),
    height: num(360, 100, 2160, 1, "Scene coordinate height."),
    backColor: color("Paper back colour."),
  }, notes: ["Exit effect: progress 1 means gone. Match width and height to the source scene."] }),
  motionFx("split-slide", "Split Slide", "SplitSlide", "transitions", "Top and bottom halves slide in from opposite sides.", ["split", "slide"]),

  /* ---------------- InventoryEffects */
  inv("word-gap-insert", "Word Gap Insert", "WordGapInsert", "text", "A gap opens between two words and an object springs into it.", ["text", "layout", "insert"], {
    left: text("Make", "Left word."),
    right: text("room.", "Right word."),
    gap: num(100, 20, 240, 1, "Gap width in px."),
    children: node("Object to insert (default: a star)."),
  }),
  inv("glyph-selection", "Glyph Selection", "GlyphSelection", "ui", "A vector selection box turns filled glyphs into outlines.", ["selection", "vector", "design-tool"], {
    text: text("CREATE", "Word to select."),
    glyphs: node("Custom SVG glyphs instead of text."),
  }),
  inv("proof-stack-tumble", "Proof Stack Tumble", "ProofStackTumble", "numbers", "Proof cards tumble off a stack one by one; the last one stays.", ["cards", "stats", "stack"], {
    cards: json("{ value: string; label: string }[]", "Cards, top first.", [
      { value: "2B+", label: "Impressions" },
      { value: "50+", label: "Projects" },
      { value: "20", label: "New effects" },
    ]),
  }),
  inv("selection-roulette", "Selection Roulette", "SelectionRoulette", "ui", "Drag a selection, cycle candidates, lock one and expand it.", ["selection", "picker"], {
    items: json("string[]", "Candidates.", ["01 / Form", "02 / Type", "03 / Mark"]),
    selectedIndex: num(2, 0, 9, 1, "Index that wins.", "content"),
  }),
  inv("leaderboard-promotion", "Leaderboard Promotion", "LeaderboardPromotion", "ui", "A highlighted row lifts, overtakes the others and settles at the top.", ["ranking", "list", "leaderboard"], {
    items: json("string[]", "Rows, top first.", ["Studio A", "Studio B", "Studio C", "Your studio"]),
    fromIndex: num(3, 0, 9, 1, "Row that moves.", "content"),
    toIndex: num(0, 0, 9, 1, "Where it lands.", "content"),
  }, { flagship: true }),
  inv("form-send-flight", "Form Send Flight", "FormSendFlight", "ui", "The send button presses, the form contracts into an envelope, its flap closes, and the envelope flies away.", ["form", "email", "send"], {
    sendLabel: text("Send", "Button label."),
    sentLabel: text("Sent", "Success label."),
    recipient: text("hello@studio.co", "Recipient line."),
    message: text("Let’s make something great.", "Body text."),
  }),
  inv("folder-catch", "Folder Catch", "FolderCatch", "ui", "Cards drop behind a folder rim, each landing with a pulse.", ["folder", "inbox", "drop"], {
    count: num(5, 1, 24, 1, "Number of cards.", "content"),
    label: text("Inbox", "Folder label."),
  }),
  inv("delivery-status", "Delivery Status", "DeliveryStatus", "ui", "Sent, delivered and seen checks, then the message body expands.", ["status", "checks", "mail"], {
    subject: text("Your next project", "Subject line."),
    body: json("string[]", "Body lines."),
    labels: json("[string, string, string]", "Status labels.", ["Sent", "Delivered", "Seen"]),
  }),
  inv("candlestick-hud", "Candlestick HUD", "CandlestickHUD", "data", "OHLC candles draw one by one with a live price and volume readout.", ["chart", "finance", "ohlc"], {
    data: json("CandleDatum[]", "OHLC data (synthetic by default)."),
  }),
  inv("tracking-line-chart", "Tracking Line Chart", "TrackingLineChart", "data", "A live series draws with a tracking camera, a pulsing tip and a delta readout.", ["chart", "line", "live"], {
    values: json("number[]", "Series values (synthetic by default)."),
    format: json("(value: number) => string", "Number formatter."),
  }, { flagship: true }),
  inv("token-pot-fill", "Token Pot Fill", "TokenPotFill", "data", "Each arriving token bumps the counter and the pot fill together.", ["counter", "fill", "coins"], {
    amounts: json("number[]", "Amount per token.", [10, 15, 10, 20, 15, 30]),
    format: json("(value: number) => string", "Number formatter."),
  }),
  inv("timeline-rise", "Timeline Rise", "TimelineRise", "data", "Time segments fill in sequence, then a two-point rise with a percentage.", ["timeline", "growth"], {
    labels: json("string[]", "Segment labels.", ["Year 1", "Year 2", "Year 3", "Year 4"]),
    segments: json("TimelineSegment[]", "Segments with label and optional color; overrides labels."),
    fromValue: num(0, -1000, 1000, 1, "Starting value.", "content"),
    toValue: { ...num(86, -1000, 1000, 1, "Ending value; overrides increase.", "content"), default: undefined },
    unit: text("%", "Value suffix."),
    showSegments: bool(true, "Show the timeline rail."),
    showAxes: bool(true, "Show axes."),
    showArea: bool(true, "Show the filled area."),
    showValue: bool(true, "Show the value."),
    chartHeight: num(100, 10, 165, 1, "Chart height in viewBox units."),
    lineWidth: num(4, 1, 12, 1, "Line width."),
    riseStart: num(.48, 0, .9, .01, "Growth starts.", "timing"),
    riseEnd: num(.96, .1, 1, .01, "Growth ends.", "timing"),
    segmentEnd: num(.45, .01, 1, .01, "Rail finishes filling.", "timing"),
    format: json("(value: number) => string", "Custom number formatter."),
    increase: num(86, -100, 500, 1, "Percentage shown at the end.", "content"),
  }),
  inv("logo-landing", "Logo Landing", "LogoLanding", "paths", "A mark falls, squashes on contact, rebounds and settles on its shadow.", ["logo", "bounce", "squash"], {
    children: node("Your mark (120 × 120)."),
  }),
  inv("device-conditions", "Device Conditions", "DeviceConditions", "ui", "A browser shell becomes a phone; dark-mode and network rows tick in.", ["device", "responsive", "checklist"], {
    labels: json("string[]", "Condition labels.", ["Dark mode", "Slow network"]),
    conditions: json("DeviceCondition[]", "Rows {label, at?, passed?}; overrides labels."),
    fromDevice: json("DeviceSize", "Starting {width, height, radius}.", {width:390, height:192, radius:10}),
    toDevice: json("DeviceSize", "Ending {width, height, radius}.", {width:140, height:226, radius:23}),
    children: node("Custom responsive screen content."),
    showConditions: bool(true, "Show condition rows."),
    darkScreen: bool(true, "Switch to a dark screen at checksStart."),
    morphStart: num(.24, 0, .9, .01, "Device resize starts.", "timing"),
    morphEnd: num(.58, .1, 1, .01, "Device resize ends.", "timing"),
    checksStart: num(.64, 0, .9, .01, "Default checklist start.", "timing"),
  }),
];

export const EFFECTS_BY_SLUG: Readonly<Record<string, EffectMeta>> = Object.fromEntries(EFFECTS.map((m) => [m.slug, m]));
export { STYLE_PRESETS };
