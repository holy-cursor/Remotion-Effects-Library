/**
 * Design tokens for shared-effects.
 *
 * Two layers (after Sho's brand-kit proposal, 2026-11-23):
 *  1. Primitives: raw values, referenced only inside this file.
 *  2. Roles: what effect code reads. Effects never hard-code hex values;
 *     they read roles from `resolveEffect()` (see ./effect.ts).
 *
 * A palette has a light and a dark role set. A style preset bundles a
 * palette with a font, grain and motion defaults.
 */

export type ThemeMode = "light" | "dark";

/** Semantic colour roles. Keep this list small; add a role only when two effects need it. */
export type Roles = {
  /** Full-bleed backdrop behind an effect. */
  canvas: string;
  /** Cards, panels, keys, rows. */
  surface: string;
  /** Hairlines, inactive tracks, grid dots. */
  line: string;
  /** Primary text and strong marks. */
  ink: string;
  /** Secondary text, captions, axis labels. */
  inkMuted: string;
  /** The one colour that carries the motion's focal point. */
  accent: string;
  /** Text and icons placed on top of `accent`. */
  onAccent: string;
  /** Supporting accent used for a second series or a warm/cool partner. */
  secondary: string;
  /** Third tone for gradients, highlights and selection fills. */
  tertiary: string;
  /** Soft shadow / glow colour (use with alpha). */
  shadow: string;
};

export type Palette = {
  id: string;
  name: string;
  description: string;
  light: Roles;
  dark: Roles;
};

/* ---------------------------------------------------------------- primitives */
const saint = {
  white: "#FFFFFE",
  orange: "#FB7501",
  red: "#FB4001",
  amber: "#FBA107",
  yellow: "#FAD889",
  cream: "#F6E7C1",
  // Dark mode uses cool neutrals (changed 2026-11-24 from warm #171310 at Saint's request).
  night: "#0C0D0F",
  nightRaised: "#17191C",
  nightLine: "#2A2D31",
  creamMuted: "#A1A1AA",
};
const graphite = {
  paper: "#F7F7F5",
  card: "#FFFFFF",
  line: "#E2E2DE",
  ink: "#151517",
  muted: "#6B6B70",
  blue: "#3D5AFE",
  sky: "#7FA2FF",
  ice: "#C9D6FF",
  night: "#0E0F12",
  nightRaised: "#17191E",
  nightLine: "#2A2D35",
  fog: "#ECECEF",
  fogMuted: "#8B8E99",
};
const editorial = {
  paper: "#F3EEE4",
  card: "#FBF8F2",
  line: "#DDD4C3",
  ink: "#1C1A17",
  muted: "#6E665A",
  red: "#D7301F",
  ochre: "#C98A1B",
  sand: "#E9D9B6",
  night: "#14120F",
  nightRaised: "#1F1C17",
  nightLine: "#36302A",
  bone: "#EFE7D8",
  boneMuted: "#9C9283",
};
const indigo = {
  paper: "#F4F3FA",
  card: "#FFFFFF",
  line: "#DCDAEC",
  ink: "#17133A",
  muted: "#625D86",
  indigo: "#5B3DF5",
  violet: "#9B87FF",
  lime: "#C6F432",
  night: "#0C0A1A",
  nightRaised: "#161330",
  nightLine: "#2B2650",
  mist: "#EEEBFF",
  mistMuted: "#8F89B5",
};
const mono = {
  paper: "#F2F2F2",
  card: "#FFFFFF",
  line: "#D9D9D9",
  ink: "#111111",
  muted: "#6A6A6A",
  mid: "#9A9A9A",
  night: "#0B0B0B",
  nightRaised: "#171717",
  nightLine: "#2E2E2E",
  snow: "#F0F0F0",
  snowMuted: "#8A8A8A",
};
const ember = {
  night: "#120C0A",
  raised: "#1E1411",
  line: "#3B2720",
  ink: "#FFE9D6",
  muted: "#A88D7B",
  ember: "#FF5A1F",
  gold: "#FFB547",
  rose: "#FF8A6B",
  paper: "#FFF4EA",
  card: "#FFFFFF",
  paperLine: "#F1D9C6",
  paperInk: "#3A1A0E",
  paperMuted: "#8A6553",
};

/* ------------------------------------------------------------------ palettes */
export const PALETTES = {
  "saint-orange": {
    id: "saint-orange",
    name: "Saint Orange",
    description: "The original orange and cream look of this library, kept as-is.",
    light: {
      canvas: saint.white,
      surface: saint.white,
      line: saint.cream,
      ink: saint.red,
      inkMuted: saint.orange,
      accent: saint.orange,
      onAccent: saint.white,
      secondary: saint.amber,
      tertiary: saint.yellow,
      shadow: saint.amber,
    },
    dark: {
      canvas: saint.night,
      surface: saint.nightRaised,
      line: saint.nightLine,
      ink: saint.cream,
      inkMuted: saint.creamMuted,
      accent: saint.orange,
      onAccent: saint.white,
      secondary: saint.amber,
      tertiary: saint.yellow,
      shadow: "#000000",
    },
  },
  graphite: {
    id: "graphite",
    name: "Graphite",
    description: "Neutral product UI: quiet greys with one cobalt accent.",
    light: {
      canvas: graphite.paper,
      surface: graphite.card,
      line: graphite.line,
      ink: graphite.ink,
      inkMuted: graphite.muted,
      accent: graphite.blue,
      onAccent: "#FFFFFF",
      secondary: graphite.sky,
      tertiary: graphite.ice,
      shadow: "#1B2440",
    },
    dark: {
      canvas: graphite.night,
      surface: graphite.nightRaised,
      line: graphite.nightLine,
      ink: graphite.fog,
      inkMuted: graphite.fogMuted,
      accent: graphite.sky,
      onAccent: graphite.night,
      secondary: graphite.blue,
      tertiary: "#3A4A7A",
      shadow: "#000000",
    },
  },
  editorial: {
    id: "editorial",
    name: "Editorial",
    description: "Printed-matter warmth: bone paper, black ink, a single vermilion.",
    light: {
      canvas: editorial.paper,
      surface: editorial.card,
      line: editorial.line,
      ink: editorial.ink,
      inkMuted: editorial.muted,
      accent: editorial.red,
      onAccent: editorial.card,
      secondary: editorial.ochre,
      tertiary: editorial.sand,
      shadow: "#3A2A14",
    },
    dark: {
      canvas: editorial.night,
      surface: editorial.nightRaised,
      line: editorial.nightLine,
      ink: editorial.bone,
      inkMuted: editorial.boneMuted,
      accent: "#E8513E",
      onAccent: editorial.night,
      secondary: editorial.ochre,
      tertiary: "#4A3B22",
      shadow: "#000000",
    },
  },
  "indigo-signal": {
    id: "indigo-signal",
    name: "Indigo Signal",
    description: "Indigo, black and white with a lime signal colour for one key moment.",
    light: {
      canvas: indigo.paper,
      surface: indigo.card,
      line: indigo.line,
      ink: indigo.ink,
      inkMuted: indigo.muted,
      accent: indigo.indigo,
      onAccent: "#FFFFFF",
      secondary: indigo.violet,
      tertiary: indigo.lime,
      shadow: "#2A1F7A",
    },
    dark: {
      canvas: indigo.night,
      surface: indigo.nightRaised,
      line: indigo.nightLine,
      ink: indigo.mist,
      inkMuted: indigo.mistMuted,
      accent: indigo.violet,
      onAccent: indigo.night,
      secondary: indigo.indigo,
      tertiary: indigo.lime,
      shadow: "#000000",
    },
  },
  monochrome: {
    id: "monochrome",
    name: "Monochrome",
    description: "Grayscale only. Motion and type carry everything.",
    light: {
      canvas: mono.paper,
      surface: mono.card,
      line: mono.line,
      ink: mono.ink,
      inkMuted: mono.muted,
      accent: mono.ink,
      onAccent: mono.card,
      secondary: mono.mid,
      tertiary: mono.line,
      shadow: "#000000",
    },
    dark: {
      canvas: mono.night,
      surface: mono.nightRaised,
      line: mono.nightLine,
      ink: mono.snow,
      inkMuted: mono.snowMuted,
      accent: mono.snow,
      onAccent: mono.night,
      secondary: mono.snowMuted,
      tertiary: mono.nightLine,
      shadow: "#000000",
    },
  },
  ember: {
    id: "ember",
    name: "Late Ember",
    description: "Warm glow on near-black; a dark-first sibling of Saint Orange.",
    light: {
      canvas: ember.paper,
      surface: ember.card,
      line: ember.paperLine,
      ink: ember.paperInk,
      inkMuted: ember.paperMuted,
      accent: ember.ember,
      onAccent: "#FFFFFF",
      secondary: ember.gold,
      tertiary: ember.rose,
      shadow: "#7A2A0A",
    },
    dark: {
      canvas: ember.night,
      surface: ember.raised,
      line: ember.line,
      ink: ember.ink,
      inkMuted: ember.muted,
      accent: ember.ember,
      onAccent: "#FFFFFF",
      secondary: ember.gold,
      tertiary: ember.rose,
      shadow: "#000000",
    },
  },
} as const satisfies Record<string, Palette>;

export type PaletteId = keyof typeof PALETTES;
export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];
export const DEFAULT_PALETTE: PaletteId = "saint-orange";

/* --------------------------------------------------------------------- fonts */
export const FONTS = {
  sans: '"Inter Tight Variable", "Inter Tight", Inter, "Segoe UI", system-ui, sans-serif',
  grotesk: '"Space Grotesk Variable", "Space Grotesk", "Inter Tight Variable", system-ui, sans-serif',
  serif: '"Instrument Serif", "Fraunces Variable", Georgia, serif',
  display: '"Fraunces Variable", Fraunces, Georgia, serif',
  mono: '"JetBrains Mono Variable", "JetBrains Mono", ui-monospace, Consolas, monospace',
  system: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;
export type FontId = keyof typeof FONTS;
/** Inherit keeps the legacy behaviour: the effect uses whatever font its parent sets. */
export const DEFAULT_FONT = "inherit";

/* ------------------------------------------------------------- style presets */
export type StylePreset = {
  id: string;
  name: string;
  description: string;
  palette: PaletteId;
  theme: ThemeMode;
  fontFamily: FontId;
  grain: number;
  speed: number;
  delay: number;
  /** Optional accent override; omitted means the palette accent. */
  accent?: string;
};

export const STYLE_PRESETS: readonly StylePreset[] = [
  {
    id: "saint-orange",
    name: "Saint Orange",
    description: "Original cream and orange, crisp sans, no grain. Matches the old gallery.",
    palette: "saint-orange",
    theme: "light",
    fontFamily: "sans",
    grain: 0,
    speed: 1,
    delay: 0,
  },
  {
    id: "saint-night",
    name: "Saint Night",
    description: "Saint Orange on warm black with a little film grain.",
    palette: "saint-orange",
    theme: "dark",
    fontFamily: "sans",
    grain: 0.35,
    speed: 1,
    delay: 0,
  },
  {
    id: "studio-graphite",
    name: "Studio Graphite",
    description: "Product-launch neutral. Dark graphite, cobalt focus, brisk timing.",
    palette: "graphite",
    theme: "dark",
    fontFamily: "grotesk",
    grain: 0.15,
    speed: 1.25,
    delay: 0,
  },
  {
    id: "broadsheet",
    name: "Broadsheet",
    description: "Editorial serif on bone paper, unhurried, with a print-like tooth.",
    palette: "editorial",
    theme: "light",
    fontFamily: "serif",
    grain: 0.45,
    speed: 0.85,
    delay: 0.05,
  },
  {
    id: "signal",
    name: "Signal",
    description: "Indigo night with a lime moment. Mono labels, fast in, long hold.",
    palette: "indigo-signal",
    theme: "dark",
    fontFamily: "mono",
    grain: 0.2,
    speed: 1.5,
    delay: 0,
  },
  {
    id: "ink-only",
    name: "Ink Only",
    description: "Monochrome and calm. Good for checking that motion reads without colour.",
    palette: "monochrome",
    theme: "light",
    fontFamily: "sans",
    grain: 0.1,
    speed: 0.9,
    delay: 0,
  },
  {
    id: "late-ember",
    name: "Late Ember",
    description: "Glowing warm accents on near-black, heavier grain, slower settle.",
    palette: "ember",
    theme: "dark",
    fontFamily: "display",
    grain: 0.55,
    speed: 0.8,
    delay: 0.04,
  },
];

/** Resolve roles for a palette and mode, then apply an accent and role overrides. */
export function rolesFor(
  palette: PaletteId = DEFAULT_PALETTE,
  mode: ThemeMode = "light",
  accent?: string,
  overrides?: Partial<Roles>,
): Roles {
  const base: Roles = { ...PALETTES[palette][mode] };
  if (accent) base.accent = accent;
  return overrides ? { ...base, ...overrides } : base;
}

/** Resolve a font id or a raw CSS font-family string. */
export function fontStack(font?: string): string | undefined {
  if (!font || font === "inherit") return undefined;
  return font in FONTS ? FONTS[font as FontId] : font;
}

/** `#RRGGBB` + alpha 0..1 → `#RRGGBBAA`. Other colour strings use color-mix. */
export function alpha(color: string, a: number): string {
  const k = Math.max(0, Math.min(1, a));
  if (/^#[0-9a-f]{6}$/i.test(color)) {
    return color + Math.round(k * 255).toString(16).padStart(2, "0");
  }
  return `color-mix(in srgb, ${color} ${Math.round(k * 100)}%, transparent)`;
}

/** Mix two colours (0 → a, 1 → b). */
export function mix(a: string, b: string, t: number): string {
  const k = Math.max(0, Math.min(1, t));
  return `color-mix(in srgb, ${a} ${Math.round((1 - k) * 100)}%, ${b})`;
}
