# Source inventory: updated 26 November 2026

117 effects are active.

## Components and inputs

The additions are organized into typography, atmosphere, depth, transitions, interface, workflow and data modules. Every animation is driven by deterministic `progress`, with shared design tokens and configurable content. The gallery props tables and components.json describe the inputs for each effect.

Common inputs include `text`, `items`, `values`, `paths`, `points`, `edges`, `from`, `to`, `children`, `start` and `end`. Geometry uses a 640 × 360 coordinate system. `start` and `end` specify a subrange of normalized progress, after shared speed and delay. Defaults are demonstration artwork. Numerical examples and waveforms are synthetic; cue captions use explicit times, not inferred audio alignment.

```tsx
import {CardExpand, CaptionCues} from './shared-effects';

<CardExpand progress={progress}
  from={{x:200,y:100,width:240,height:160,radius:14}}
  to={{x:0,y:0,width:640,height:360,radius:0}}>
  <YourContent />
</CardExpand>

<CaptionCues progress={progress}
  cues={[{start:0,end:.5,text:'First cue'}, {start:.5,end:1,text:'Second cue'}]} />
```

### Related variants

| Component | Variants |
| --- | --- |
| DepthStream | `corridor`, `search`, `mail` |
| TelevisionReveal | `hold`, `continue` |
| ButtonPress | `press`, `whip` |

OrbitBurst combines the shared elliptical orbit and burst-exit behavior. Its items, radius and timing are configurable. CameraMove uses the Box-shaped `from`/`to` inputs for camera offsets (x/y) and scale factors (width/height), rather than content bounds.

## Optional rendering dependencies

CandleGeometry uses actual Three.js meshes, and CameraMotionBlur uses Remotion's temporal sampler. They live in a separate entry point so ordinary effect imports do not require these packages:

```tsx
import {CandleGeometry, CameraMotionBlur} from './shared-effects/optional';
```

Install `three` and `@types/three` for CandleGeometry. Install `@remotion/motion-blur` at the same version as your project's `remotion` for CameraMotionBlur. The gallery includes matching dependencies. Pass a frame-driven scene as `children` to sample your own motion; with no children it shows a moving-object demo. Normalized progress maps to a 96-frame sampling timeline. The maintained sampler can also be imported directly to use your composition's frame range unchanged.

## Validation

Run from `gallery/`:

```sh
npm run typecheck
npm run build
```

No render checks were run for the 26 November revision, as requested.
