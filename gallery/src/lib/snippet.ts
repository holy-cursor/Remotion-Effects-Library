import type { EffectMeta } from "../../../meta/schema";
import { SHARED_PROPS } from "../../../meta/effects";
import type { Values } from "../preview/bindings";

const literal = (v: unknown): string => {
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") return String(Math.round(v * 1000) / 1000);
  if (typeof v === "boolean") return v ? "" : "{false}";
  return "{" + JSON.stringify(v) + "}";
};

function attrs(meta: EffectMeta, values: Values, defaults: Values): string[] {
  const out: string[] = [];
  const keys = [...Object.keys(meta.props), ...(meta.sharedProps ? Object.keys(SHARED_PROPS) : [])];
  const seen = new Set<string>();
  for (const k of keys) {
    if (seen.has(k) || k === "progress" || k === "children") continue;
    seen.add(k);
    const v = values[k];
    if (v === undefined || v === "") continue;
    const spec = meta.props[k] ?? SHARED_PROPS[k];
    const libDefault = spec?.default;
    // Show values the user changed, plus gallery staging that differs from the library default.
    if (JSON.stringify(v) === JSON.stringify(libDefault) && JSON.stringify(v) === JSON.stringify(defaults[k])) continue;
    if (JSON.stringify(v) === JSON.stringify(libDefault)) continue;
    const lit = literal(v);
    out.push(lit === "" ? k : typeof v === "string" ? `${k}=${lit}` : `${k}=${lit.startsWith("{") ? lit : "{" + lit + "}"}`);
  }
  return out;
}

export function usageSnippet(meta: EffectMeta, values: Values, defaults: Values): string {
  const a = attrs(meta, values, defaults);
  const open = (extra: string[]) => {
    const all = [...extra, ...a];
    if (all.join(" ").length < 60) return `<${meta.exportName} ${all.join(" ")}`;
    return `<${meta.exportName}\n        ${all.join("\n        ")}\n      `;
  };
  const progressLine = meta.props.progress || meta.sharedProps;
  let body: string;
  if (meta.kind === "wrapper") {
    body = `${open(progressLine ? ["progress={progress}"] : [])}>\n        <YourContent />\n      </${meta.exportName}>`;
  } else if (meta.slug === "fisheye-picker") {
    body = `${open(["progress={progress}", "items={items}"])}/>`;
  } else {
    body = `${open(progressLine ? ["progress={progress}"] : [])}/>`;
  }
  const req = meta.requires?.length ? `// npm i ${meta.requires.join(" ")}\n` : "";
  return `${req}import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {${meta.exportName}} from "./effects";

export const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [6, 102], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      ${body}
    </AbsoluteFill>
  );
};`;
}

export const compositionSnippet = (meta: EffectMeta) => `import {Composition} from "remotion";
import {Scene} from "./Scene";

// 4 s at 30 fps: 0.2 s lead-in, 3.2 s of motion, 0.6 s hold.
<Composition id="${meta.exportName}Demo" component={Scene}
  durationInFrames={120} fps={30} width={1280} height={720} />`;

export const installSnippet = (meta: EffectMeta) =>
  [
    "# Copy the library files (not gallery/) into your Remotion project",
    "git clone --depth 1 https://github.com/holy-cursor/Remotion-Effects-Library",
    "mkdir -p src/effects && cp -r Remotion-Effects-Library/*.ts Remotion-Effects-Library/*.tsx Remotion-Effects-Library/core Remotion-Effects-Library/meta src/effects/",
    ...(meta.requires?.length ? [`npm i ${meta.requires.join(" ")}`] : []),
    "# Uses the remotion and react versions already in your project",
  ].join("\n");
