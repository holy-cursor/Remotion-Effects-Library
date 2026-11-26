---
name: motion-effects
description: Pick and drop in ready-made, progress-driven effects for Remotion videos, including reveals, text motion, counters, transitions, depth, paths, textures, UI animation, charts and primitives. Each effect takes a normalized progress value and shares one theme API. Use when an agent is building or editing a Remotion composition and needs a polished motion moment instead of hand-rolled interpolations.
metadata:
  author: "David (Saint)"
  version: "0.1.0"
---

# Motion Effects

Give a video agent a richer visual vocabulary. Instead of writing the same fade, slide and scale again, pick an effect that matches the beat, drive it with one `progress` value, and theme it to the brand.

## When activated

Input: a Remotion 4 project (React 19) and a scene or beat that needs motion. Output: working composition code that imports effects from this library, with timing that fits the edit.

### 1. Find the right effect

1. Read `llms-components.txt` in the repo root. It lists every effect with its category, description, props, defaults and presets. `components.json` holds the same data as JSON.
2. Choose by the beat's job, not by name:
   - **Reveals & Masks:** bring content on screen.
   - **Typography:** headlines and per-letter motion.
   - **Numbers & Progress:** stats and counters.
   - **Depth & Camera:** push-ins, turns and parallax.
   - **Transitions:** move between states.
   - **Paths & Particles:** travel and orbit.
   - **Light & Texture:** finishing passes.
   - **UI Animation:** product-interface moments.
   - **Data & Charts:** values that move.
   - **Primitives:** low-level geometry.
3. When a person is choosing, point them to the gallery: each effect has a live player, a customize panel and copyable usage code.

### 2. Install

Copy the library files into the project, for example into `src/effects/`:

- Copy the root `*.tsx` and `*.ts` files, `core/` and `meta/`.
- Don't copy `gallery/`. It has its own `node_modules`, and copying it would add a second copy of React.
- Use the project's own `react` and `remotion`. Install `ogl` only if you use `MoltenMetal`.

### 3. Drive it with progress

Every effect is a pure function of `progress`, from 0 to 1. Compute it from the frame and clamp it:

```tsx
import {interpolate, useCurrentFrame} from 'remotion';
import {Iris, CharacterFlip, EffectTheme} from './effects';

export const Beat: React.FC = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [12, 60], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <EffectTheme palette="saint-orange" theme="light">
      <div style={{width: 1280, height: 720, position: 'relative'}}>
        <Iris progress={p}><YourShot /></Iris>
      </div>
      <div style={{fontSize: 96}}><CharacterFlip progress={p} text="Ship it" /></div>
    </EffectTheme>
  );
};
```

- Wrapper effects animate their `children`, and text effects take `text`.
- Scene effects fill their parent, so give the parent an explicit width and height.
- Start and end the window on beats in the edit, such as a cut, a voice line or a sound hit, not on round numbers.

### 4. Theme it to the brand

All effects except the primitives share the same props:
- **Look:** `theme`, `palette`, `accent`, `fontFamily`, `background`.
- **Size and timing:** `scale`, `speed`, `delay`.
- **Finish:** `grain`, `grid`, `tokens`.

Wrap a subtree in `<EffectTheme>` to set defaults once. Effects are transparent by default. Pass `background="canvas"` for a themed stage. Prefer passing the brand colour as `accent` over editing effect code.

### 5. Check before delivering

- Render stills at progress 0, 0.5 and 1 and look at them: nothing clipped, text readable, and the start and end states still read as the brand.
- Hold the final state long enough to read it.
- Don't claim a render looks right unless you actually looked at the frames.

## Result contract

Deliver:
1. Each effect you chose, and why it fits the beat.
2. Working composition code.
3. The timing window for each effect, in frames.
4. Theme settings.
5. What you checked visually and what you didn't.

## Notes

- `MIGRATION.md` covers behaviour changes from the earlier API. Old prop shapes still compile.
- The library has no license file yet. Until one is added, ask the author before you redistribute it.
