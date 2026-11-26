# Dithercn adaptations

Aurora's field and noise helpers, the globe renderer, threshold matrices and world land mask are adapted from https://github.com/opencoredev/dithercn under the included MIT LICENSE.

The land data is rasterized Natural Earth 1:50m land, public domain. The mask is bundled; no runtime network request is made.

Source files: `components/dithercn/aurora.tsx`, `components/dithercn/dither-globe.tsx`, `components/dithercn/world-land.ts`, `lib/dither/shader.tsx`, `lib/dither/matrices.ts`, `lib/dither/blue-noise.ts`.

These adapters replace browser clocks, visibility loops, drag state and requestAnimationFrame with deterministic normalized progress. Aurora keeps the original curtain field; reversed-edge smoothstep calls are expressed as defined complements. The globe keeps its projection, land shading, atmosphere, pulsing markers and raised routes.

Copy this directory, including LICENSE, with `DitherAurora.tsx` and `DitherGlobe.tsx`. React and Remotion are the only package dependencies. Aurora needs WebGL; the globe uses Canvas 2D.
