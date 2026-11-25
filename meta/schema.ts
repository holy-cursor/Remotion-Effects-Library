/**
 * Machine-readable component metadata. Plain data only (no React), so it can
 * drive the gallery, docs and an agent manifest (llms-components.txt) alike.
 */

export type PropGroup = "content" | "timing" | "style";

type Common = {
  /** TypeScript type as shown in the props table. */
  type: string;
  description: string;
  group: PropGroup;
  /** false = listed in the props table but not shown as a live control. */
  control?: boolean;
  required?: boolean;
};

export type PropSpec =
  | (Common & { kind: "number"; default?: number; min: number; max: number; step: number })
  | (Common & { kind: "boolean"; default?: boolean })
  | (Common & { kind: "string"; default?: string })
  | (Common & { kind: "text"; default?: string })
  | (Common & { kind: "color"; default?: string })
  | (Common & { kind: "select"; default?: string; options: readonly string[] })
  | (Common & { kind: "vec2"; default?: readonly [number, number]; min: number; max: number; step: number })
  | (Common & { kind: "json"; default?: unknown })
  | (Common & { kind: "node"; default?: undefined });

export type PropKind = PropSpec["kind"];

export type CategoryId =
  | "reveals"
  | "text"
  | "numbers"
  | "depth"
  | "transitions"
  | "paths"
  | "texture"
  | "ui"
  | "data"
  | "primitives";

export type Category = { id: CategoryId; name: string; blurb: string };

export type EffectKind =
  /** Wraps your children (masks, transitions, depth moves). */
  | "wrapper"
  /** Takes a `text` string. */
  | "text"
  /** Draws a self-contained scene that fills its parent box. */
  | "scene"
  /** Low-level building block with explicit geometry/colour props. */
  | "primitive";

export type EffectPreset = {
  id: string;
  name: string;
  description: string;
  /** Prop values applied on top of the defaults (shared or effect-specific). */
  values: Record<string, unknown>;
};

export type EffectMeta = {
  slug: string;
  name: string;
  /** Named export in index.ts. */
  exportName: string;
  /** Source file relative to shared-effects/. */
  file: string;
  category: CategoryId;
  kind: EffectKind;
  description: string;
  tags: readonly string[];
  /** Accepts the shared EffectBaseProps (theme, accent, speed…). */
  sharedProps: boolean;
  /** Reworked at full quality in the 2026-11-24 pass. */
  flagship?: boolean;
  /** Added or substantially changed in this release. */
  isNew?: boolean;
  /** Extra npm dependency needed. */
  requires?: readonly string[];
  /** Behavioural notes for agents and humans (e.g. "progress 1 = fully hidden"). */
  notes?: readonly string[];
  props: Readonly<Record<string, PropSpec>>;
  presets?: readonly EffectPreset[];
};
