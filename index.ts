export * from "./Extrude";
export * from "./SolidExtrude";
export * from "./SurfaceExtrude";
export * from "./ShapeTransform";
export * from "./MoltenMetal";
export * from "./ReviewEffects";
export * from "./MoreEffects";
export * from "./AdditionalEffects";
export * from "./InventoryEffects";

// Added 2026-11-24: design tokens, shared props and component metadata.
export * from "./core";
export { EFFECTS, EFFECTS_BY_SLUG, CATEGORIES, SHARED_PROPS } from "./meta/effects";
export type { EffectMeta, PropSpec, Category, CategoryId, EffectKind, EffectPreset } from "./meta/schema";

export { CornerPeel } from "./CornerPeel";
export type { CornerPeelProps } from "./CornerPeel";
