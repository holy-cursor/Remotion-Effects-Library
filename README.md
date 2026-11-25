# Remotion Effects Library

66 progress-driven effects for [Remotion](https://www.remotion.dev/) video. It is also an agent skill and comes with a live gallery.

- **For people:** the gallery gives every effect a live player with a scrubber, a customize panel (theme, palette, accent, font, timing, grain), style presets, copyable usage code and a typed props table.
- **For agents:** [`SKILL.md`](SKILL.md) teaches a video agent how to pick, install, time and theme effects. [`llms-components.txt`](llms-components.txt) and [`components.json`](components.json) describe every effect and its props. The deployed gallery also serves both files at `/llms-components.txt` and `/components.json`.

## Repository layout

| Path | What it is |
| --- | --- |
| `*.tsx`, `index.ts` | The effects. Copy these into your project. |
| `core/` | Design tokens, `EffectTheme`, shared props and easing. |
| `meta/` | One description per effect: category, props schema and presets. Drives the gallery and the manifests. |
| `gallery/` | The gallery web app (Vite and React, with `@remotion/player`). |
| `SKILL.md` | Agent skill instructions. |
| `vercel.json` | Vercel build settings for the gallery. |

## Run the gallery

```sh
cd gallery
npm install
npm run dev      # http://127.0.0.1:4198/
npm run build    # writes the manifests, then builds a static site into gallery/dist
```

On Windows you can double-click `gallery.cmd` instead.

## Deploy on Vercel

Import this repository in Vercel and keep the **Root Directory** at the repository root. `vercel.json` sets everything else:

- install: `npm ci --prefix gallery`
- build: `npm run build --prefix gallery`
- output: `gallery/dist`

The gallery uses `#` routes, so it needs no rewrites. The build compiles the effect files from the repository root, so the root directory must stay at the top level.

## License

No license file yet: all rights reserved until one is added. Third-party dependencies keep their own licenses.

---
## Use in an existing Remotion project

Copy this folder into your project. Install `ogl` for MoltenMetal. Use the React and Remotion versions already used by your project.

```tsx
import {useCurrentFrame} from 'remotion';
import {PixelCascade, CharacterFlip} from './shared-effects';

export function Scene() {
  const frame = useCurrentFrame();
  const progress = Math.max(0, Math.min(1, (frame - 12) / 48));
  return <>
    <div style={{position: 'relative', width: 600, height: 300}}>
      <PixelCascade progress={progress}>
        <div style={{width: 300, height: 180, background: '#FB7501'}} />
      </PixelCascade>
    </div>
    <div style={{fontSize: 72, color: '#FB4001'}}>
      <CharacterFlip progress={progress} text="Your title" />
    </div>
  </>;
}
```

Most effects accept normalized `progress` from 0 to 1. Text effects accept `text`; content effects accept `children`. Containers must have explicit dimensions. MoltenMetal uses Remotion frame context and WebGL.

## Shared props and tokens (2026-11-24)

Every effect except the primitives (Extrude, SolidExtrude, SurfaceExtrude, ShapeTransform, MoltenMetal) also takes the same shared props: `theme` (light or dark), `palette`, `accent`, `fontFamily`, `background`, `scale`, `speed`, `delay`, `grain`, `grid` and `tokens`. Colours come from roles in `core/tokens.ts`. The default palette is Saint Orange, the original look. Effects stay transparent unless you pass `background="canvas"`.

```tsx
<EffectTheme palette="graphite" theme="dark">
  <Iris progress={progress} background="canvas" grid grain={0.2}>…</Iris>
</EffectTheme>
```

`meta/effects.ts` describes every effect (category, props schema, presets). The gallery and the agent manifest are both built from it. See MIGRATION.md for behaviour changes.

The active gallery contains 29 original effects, 23 AdditionalEffects variants and 14 InventoryEffects scenes. The current collection is defined by meta/effects.ts.

## New inventory batch

Word Gap Insert, Glyph Selection, Proof Stack Tumble, Selection Roulette, Leaderboard Promotion, Form Send Flight, Folder Catch, Delivery Status, Candlestick HUD, Tracking Line Chart, Token Pot Fill, Timeline Rise, Logo Landing, and Device Conditions.

All 14 accept normalized progress and optional theme overrides. Numeric defaults are synthetic demo data. The complete four-second previews are in the gallery.

## Revision: 2026-11-25

Removed Venetian Blinds, Document Mosaic, Particle Gather, Pendulum, Node Lockup, Weighted Toggle, Chat Send, Message Reroute and Curve Crossfade from exports and the active gallery. Legacy numeric indices keep their positions, with removed slots empty.

ShapeTransform keeps its starting center fixed by default and has no squash/stretch. Set `stationary={false}` to deliberately animate between different centers. The gallery uses a centered circle-to-rounded-rectangle morph.

CornerPeel folds the whole scene from the bottom-right corner across a diagonal crease, with a reflected paper back and fold shadow. Set `width` and `height` to the scene's dimensions. Its background peels with the content so the underlying scene is visible.

FormSendFlight now contracts the form into an envelope, closes the flap and sends that same envelope away. Configure `recipient`, `message`, `sendLabel` and `sentLabel`.

DeviceConditions accepts arbitrary condition rows (`label`, optional `at` and `passed`), source/target device dimensions, custom responsive screen children and independent resize/checklist timing. Set `showConditions={false}` for just the device. `DeviceFrame` and `ConditionChecklist` are also exported separately; the checklist is an SVG fragment.

```tsx
<DeviceConditions progress={progress}
  fromDevice={{width: 420, height: 190, radius: 10}}
  toDevice={{width: 160, height: 225, radius: 24}}
  conditions={[{label: 'Touch input', at: .6}, {label: 'Offline', at: .8, passed: false}]}
  morphStart={.1} morphEnd={.5} darkScreen={false}>
  <YourResponsiveScreen />
</DeviceConditions>
```

TimelineRise accepts custom segments/colors, starting/ending values, units or a formatter, separate rail/growth timing, chart height/line width and visibility toggles. Descending and flat values produce descending and flat plots. `TimelineSegments` and `RisePlot` are independently reusable SVG fragments.

```tsx
<TimelineRise progress={progress}
  segments={[{label: 'Q1'}, {label: 'Q2', color: '#FB4001'}]}
  fromValue={20} toValue={95} unit="k"
  segmentEnd={.3} riseStart={.35} riseEnd={.9}
  showArea={false} />
```

## Gallery

Double-click `gallery.cmd` (or run `npm run start` in `gallery/`). It opens http://127.0.0.1:4198/. The first run installs dependencies into `gallery/node_modules` only. That folder sits beside the effect files, not above them, so copying `shared-effects` into a project does not drag in a second React.

Each effect page has a live player with a scrubber, a customize panel (content, timing, theme, palette, accent, font, background, grain, grid, undo/redo/reset, share link), style presets, usage code, the source and a props table. Search with `Ctrl K` or `/`. Move between effects with `j` and `k`, play or pause with `Space`, step frames with `,` and `.`, and switch light/dark with `t`.

While the gallery runs, http://127.0.0.1:4198/llms-components.txt and /components.json serve the agent manifest from `meta/`. `npm run manifest` prints the same text.

Checks, run in `gallery/`: `npm run typecheck` (strict, including the legacy call shapes in `src/compat.tsx`) and `npm run check` (renders every effect at progress 0, 0.5 and 1 in light and dark and writes contact sheets; needs the gallery running).
