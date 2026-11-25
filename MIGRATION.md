# Migration notes: 2026-11-24 redesign

Branch: `gallery-redesign` (local git, baseline commit on `main`). Nothing was pushed.

## Summary

All existing exports in `index.ts` keep their names and their old props. `gallery/src/compat.tsx` is a type-level check of the old call shapes, and `npm run typecheck` in `gallery/` compiles it together with the old `review/*.tsx` scenes. What changed is the default look and a few prop meanings, listed below.

## New

- `core/tokens.ts`: palettes (`saint-orange` is the default), colour roles, fonts and style presets.
- `core/motion.ts`: easing, closed-form springs and stagger helpers. All of them are pure functions of progress.
- `core/effect.tsx`: `EffectBaseProps`, `useEffectProps`, `EffectStage`, `EffectRoot` and `<EffectTheme>` (a provider for defaults).
- `meta/`: machine-readable metadata for all 75 effects, plus a markdown and JSON manifest.
- `index.ts` also exports `core/*`, `EFFECTS`, `EFFECTS_BY_SLUG`, `CATEGORIES`, `SHARED_PROPS` and the metadata types.

## Shared props (every effect except the primitives)

`progress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens, style, className`

- `background` defaults to `"none"`, so effects stay transparent and drop into existing scenes as before.
- `grain` and `grid` only draw when there is a background.
- `speed` and `delay` retime progress: `t = clamp(((progress - delay) / (1 - delay)) * speed)`. With the defaults, `t` equals `progress`.

## Behaviour changes to check in existing scenes

| Area | Before | Now | To get the old behaviour |
| --- | --- | --- | --- |
| Default colours | Hard-coded hex values per effect, some not on-brand (`coral`, `#badaab`, `#e7866c`, `#ffa77d`, `#2558df`…) | Roles from the Saint Orange palette | Pass the old colour props explicitly (`color`, `trailColor`, `inactiveColor`, `colors`, `dot`) |
| Saint Orange, dark mode | Warm brown-black `#171310` backdrop | Cool neutral `#0C0D0F` (changed at Saint's request). Light mode is unchanged | Pass `background="#171310"` |
| Easing | Mostly linear, or cubic out | Tuned per effect (expo, quart, springs). Endpoints at 0 and 1 are unchanged | None. Timing curves were part of the visual rework |
| `Dock` `scale` | Target scale at progress 1 | Still read as the target scale when `targetScale` is not set | Nothing to do. Prefer `targetScale` in new code |
| `NoiseDissolve` `grain` | Noise frequency | A number is still read as noise frequency | Nothing to do. Prefer `noiseScale` in new code |
| `InventoryEffects` `theme` | `Partial<InventoryTheme>` | Also accepts `"light"` or `"dark"`. The object form maps onto roles | Nothing to do |
| `InventoryEffects` text on accent | Used `paper` | Uses the `onAccent` role (white in Saint Orange, so it looks the same) | Pass `tokens={{onAccent: …}}` |
| `ColorWave` base colour | White | `ink` role | Pass `base="#ffffff"` |
| `DitherReveal` pattern | Random cells | Ordered Bayer pattern with a left-to-right sweep | `pattern="random" from="none"` |
| `PaperFlip` columns | `repeat(n, 1fr)` | `repeat(n, minmax(max-content, 1fr))` (the same inside a sized parent) | Give the parent a width |
| `CRT`, `FisheyePicker` | No progress | `progress` is optional. CRT gets a rolling bar, and the picker can be driven by progress instead of `position` | Omit `progress` |
| `Typewriter` caret | A `|` glyph | An accent bar, blinking on progress | Pass `color` |
| `WordSlide` | Per letter | Per word, each word behind its own mask | None |
| `MotionEffect` legacy indices 18, 20, 26, 29, 30 | Hard-coded orange | Token colours (still not shown in the gallery) | None |

## Unchanged files

`TextReveal.tsx`, `RotatingCarousel.tsx`, `TypingEffect.tsx` and `StonkLogoTrace.tsx` (promo-video imports these by path), plus `Extrude.tsx`, `SolidExtrude.tsx`, `SurfaceExtrude.tsx`, `ShapeTransform.tsx`, `MoltenMetal.tsx` and `MotionExamples.tsx`.

## Rollback

`git diff main` shows every change. A full source backup (without MP4s) is at `remotion projects/_backups/shared-effects_2026-11-24_pre-gallery`.
