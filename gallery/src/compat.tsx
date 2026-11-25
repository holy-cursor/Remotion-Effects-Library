/**
 * Type-level backward-compatibility check (not rendered by the app).
 * Every call below uses a prop shape that existed before 2026-11-24.
 * `npm run typecheck` fails if a legacy shape stops compiling.
 */
import React from "react";
import * as FX from "../../index";

const n = <div />;
export const legacyCalls = [
  // README example
  <FX.PixelCascade progress={0.5}>{n}</FX.PixelCascade>,
  <FX.CharacterFlip progress={0.5} text="Your title" />,
  // InventoryEffects: theme object, style, inventoryTheme, INVENTORY_ADDITIONS
  <FX.LeaderboardPromotion progress={0.3} theme={{ accent: "#123456", ink: "#000000" }} style={{ width: 600 }} />,
  <FX.WordGapInsert progress={1} theme={FX.inventoryTheme} left="a" right="b" gap={80} />,
  ...FX.INVENTORY_ADDITIONS.map(({ component: C, id }) => <C key={id} progress={0.5} />),
  // MoreEffects legacy props
  <FX.Dock progress={0.4} x={10} y={-10} scale={0.4}>{n}</FX.Dock>,
  <FX.CompressionRing progress={0.4} color="#fff" end={0.2} trailColor="#000" />,
  <FX.SegmentFill progress={0.4} count={10} color="#f00" inactiveColor="#333" />,
  <FX.MovingBlobs progress={0.2} colors={["#f00", "#0f0"]} />,
  <FX.GlowingTrace progress={0.2} path="M0 0L10 10" color="#fff" />,
  <FX.ColorWave progress={0.2} text="x" color="coral" />,
  <FX.Scramble progress={0.2} text="x" />,
  <FX.RollCounter progress={0.2} from={0} to={10} />,
  <FX.Orbit progress={0.2} radius={100}>{n}{n}</FX.Orbit>,
  // ReviewEffects legacy props
  <FX.NoiseDissolve progress={0.5} seed={3} grain={0.48}>{n}</FX.NoiseDissolve>,
  <FX.LiquidWipe progress={0.5} origin={[0.2, 0.3]} waves={4}>{n}</FX.LiquidWipe>,
  <FX.DitherReveal progress={0.5} columns={20} rows={10} seed={2}>{n}</FX.DitherReveal>,
  <FX.PaperFlip progress={0.5} columns={3} stagger={0.4}>{n}</FX.PaperFlip>,
  <FX.CRT split={2} pitch={3}>{n}</FX.CRT>,
  <FX.FisheyePicker position={1.5} items={[n, n]} spacing={50} />,
  <FX.HalftoneStairs progress={0.5} color="#00f" dot="#fff" steps={6} />,
  // AdditionalEffects index API
  <FX.MotionEffect progress={0.5} index={12}>{n}</FX.MotionEffect>,
  <FX.TextMotion progress={0.5} index={3} text="x" />,
  // Primitives unchanged
  <FX.ShapeTransform progress={0.5} from={{ x: 0, y: 0, width: 1, height: 1, radius: 0 }} to={{ x: 1, y: 1, width: 2, height: 2, radius: 1 }} />,
  <FX.SurfaceExtrude width={10} height={10} depth={4}>{n}</FX.SurfaceExtrude>,
  <FX.MoltenMetal color1="#000000" />,
];
export const legacyNames: string[] = FX.EXTRA_NAMES;
// New API shapes
export const newCalls = [
  <FX.Iris progress={0.5} theme="dark" palette="graphite" accent="#ff0000" background="canvas" grain={0.3} grid speed={1.5} delay={0.1} scale={1.2} fontFamily="serif">{n}</FX.Iris>,
  <FX.EffectTheme palette="editorial" theme="dark"><FX.MaskedRise progress={1} text="x" /></FX.EffectTheme>,
];
