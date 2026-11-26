import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { EFFECTS_BY_SLUG } from "../../../meta/effects";
import { renderDemo, rolesOf, ThemedStage, type Values } from "./bindings";
import {applyEasing} from '../../../core/easing';
import {supportsEasing} from '../lib/easing';

export const FPS = 30;
export const DURATION = 120; // 4 s
const LEAD = 6;
const RUN = 96;

/** Timeline → progress: short lead-in, 3.2 s of motion, then a hold on the final frame. */
export const frameToProgress = (frame: number) => Math.max(0, Math.min(1, (frame - LEAD) / RUN));
export const progressToFrame = (p: number) => Math.round(LEAD + p * RUN);

export type PreviewProps = { slug: string; values: Values; progress?: number };

export function EffectScene({ slug, values, progress }: PreviewProps) {
  const meta = EFFECTS_BY_SLUG[slug];
  const roles = rolesOf(values);
  if (!meta) return <AbsoluteFill style={{ background: "#300", color: "#fff" }}>Unknown effect {slug}</AbsoluteFill>;
  const p = progress ?? 0;
  const demo = renderDemo(meta, values, supportsEasing(meta)?applyEasing(p,values.easingCurve):p);
  return (
    <AbsoluteFill style={{ background: roles.canvas, overflow: "hidden" }}>
      {meta.sharedProps ? demo : <ThemedStage values={values} align="stretch">{demo}</ThemedStage>}
    </AbsoluteFill>
  );
}

/** Remotion composition component used by the Player. */
export function PreviewComposition({ slug, values }: PreviewProps) {
  const frame = useCurrentFrame();
  useVideoConfig();
  return <EffectScene slug={slug} values={values} progress={frameToProgress(frame)} />;
}
