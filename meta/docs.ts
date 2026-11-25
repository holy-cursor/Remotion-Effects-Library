import { CATEGORIES, EFFECTS, SHARED_PROPS } from "./effects";
import type { EffectMeta, PropSpec } from "./schema";
import { PALETTES, STYLE_PRESETS } from "../core/tokens";

const fmt = (v: unknown) => (v === undefined ? "—" : typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v));
const cell = (s: string) => s.replace(/\|/g, "\\|");
const row = (k: string, s: PropSpec) =>
  `| \`${k}\`${s.required ? " (required)" : ""} | \`${cell(s.type)}\` | ${cell(fmt(s.default))} | ${cell(s.description)} |`;

/** One effect as markdown (used by "Copy page" and the agent manifest). */
export function effectMarkdown(m: EffectMeta): string {
  const cat = CATEGORIES.find((c) => c.id === m.category)?.name ?? m.category;
  const lines = [
    `## ${m.name} (\`${m.exportName}\`)`,
    "",
    `${m.description}`,
    "",
    `- Category: ${cat}. Kind: ${m.kind}. Source: \`shared-effects/${m.file}\`.`,
    `- Import: \`import {${m.exportName}} from "./shared-effects";\``,
    m.requires?.length ? `- Requires: ${m.requires.join(", ")}` : "",
    m.sharedProps ? "- Accepts the shared props (progress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens)." : "- Primitive: does not take the shared props.",
    ...(m.notes ?? []).map((n) => `- ${n}`),
    "",
    "| Prop | Type | Default | Description |",
    "| --- | --- | --- | --- |",
    ...Object.entries(m.props).map(([k, s]) => row(k, s)),
    "",
  ];
  if (m.presets?.length) {
    lines.push("Presets:", ...m.presets.map((p) => `- ${p.name}: ${p.description} \`${JSON.stringify(p.values)}\``), "");
  }
  return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n");
}

/** Whole-library manifest in the style of an llms.txt. */
export function libraryManifest(): string {
  const head = [
    "# Remotion Effects Library: progress-driven Remotion effects",
    "",
    "> Source: https://github.com/holy-cursor/Remotion-Effects-Library. Copy the library files (not gallery/) into a Remotion 4 project and import from them. Agents: see SKILL.md.",
    "> No license file yet: all rights reserved until one is added.",
    "",
    "## How to use",
    "- Every effect is a pure function of `progress` (0..1). Compute it from `useCurrentFrame()` with `interpolate(..., {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})`.",
    "- Wrapper effects animate their `children`. Text effects take `text` and inherit font size. Scene effects fill their parent box; give the parent explicit width and height.",
    "- Shared props: " + Object.keys(SHARED_PROPS).join(", ") + ".",
    "- Defaults are transparent (`background=\"none\"`). Pass `background=\"canvas\"` for a themed stage with optional `grid` and `grain`.",
    "- Wrap a subtree in `<EffectTheme palette=… theme=… accent=…>` to set defaults for every effect below it.",
    "",
    "## Palettes",
    ...Object.values(PALETTES).map((p) => `- \`${p.id}\` ${p.name}: ${p.description}`),
    "",
    "## Style presets",
    ...STYLE_PRESETS.map((p) => `- \`${p.id}\` ${p.name}: ${p.description} (palette ${p.palette}, ${p.theme}, font ${p.fontFamily}, grain ${p.grain}, speed ${p.speed})`),
    "",
    "## Shared props",
    "| Prop | Type | Default | Description |",
    "| --- | --- | --- | --- |",
    ...Object.entries(SHARED_PROPS).map(([k, s]) => row(k, s)),
    "",
    "## Effects",
    "",
  ];
  return [...head, ...EFFECTS.map(effectMarkdown)].join("\n");
}

/** JSON manifest (props schema, presets) for tools. */
export function libraryJson() {
  return {
    name: "shared-effects",
    status: "preview",
    sharedProps: SHARED_PROPS,
    categories: CATEGORIES,
    palettes: PALETTES,
    stylePresets: STYLE_PRESETS,
    effects: EFFECTS,
  };
}
