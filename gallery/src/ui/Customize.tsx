import React, { useState } from "react";
import type { EffectMeta, PropGroup, PropSpec } from "../../../meta/schema";
import { SHARED_PROPS } from "../../../meta/effects";
import { FONTS, PALETTES, PALETTE_IDS, STYLE_PRESETS, type PaletteId } from "../../../core/tokens";
import { isControl, presetValues } from "../lib/state";
import type { Values } from "../preview/bindings";
import { copy, Icon } from "./bits";
import {EasingEditor} from './EasingEditor';
import {supportsEasing} from '../lib/easing';

type Api = {
  values: Values;
  set: (k: string, v: unknown) => void;
  apply: (patch: Values) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  canUndo: boolean;
  canRedo: boolean;
  beginGesture:()=>void;
  updateGesture:(key:string,value:unknown)=>void;
  endGesture:()=>void;
};

const fontLabel: Record<string, string> = {
  inherit: "Inherit",
  sans: "Inter Tight",
  grotesk: "Space Grotesk",
  serif: "Instrument Serif",
  display: "Fraunces",
  mono: "JetBrains Mono",
  system: "System UI",
};

function Num({ k, spec, value, set }: { k: string; spec: Extract<PropSpec, { kind: "number" }>; value: unknown; set: Api["set"] }) {
  const v = typeof value === "number" ? value : spec.default ?? spec.min;
  const digits = spec.step < 0.01 ? 3 : spec.step < 1 ? 2 : 0;
  return (
    <div className="ctl">
      <label htmlFor={"c-" + k}>
        <span title={spec.description}>{k}</span>
        <span className="val">{v.toFixed(digits)}</span>
      </label>
      <input id={"c-" + k} type="range" min={spec.min} max={spec.max} step={spec.step} value={v} onChange={(e) => set(k, Number(e.target.value))} />
    </div>
  );
}

function Control({ k, spec, value, set }: { k: string; spec: PropSpec; value: unknown; set: Api["set"] }) {
  switch (spec.kind) {
    case "number":
      return <Num k={k} spec={spec} value={value} set={set} />;
    case "boolean":
      return (
        <div className="ctl">
          <label className="toggle" title={spec.description}>
            <span>{k}</span>
            <input type="checkbox" checked={Boolean(value ?? spec.default)} onChange={(e) => set(k, e.target.checked)} />
          </label>
        </div>
      );
    case "text":
      return (
        <div className="ctl">
          <label htmlFor={"c-" + k}>
            <span title={spec.description}>{k}</span>
          </label>
          <input id={"c-" + k} type="text" value={String(value ?? "")} onChange={(e) => set(k, e.target.value)} />
        </div>
      );
    case "string":
      return (
        <div className="ctl">
          <label htmlFor={"c-" + k}>
            <span title={spec.description}>{k}</span>
          </label>
          <input id={"c-" + k} type="text" spellCheck={false} style={{ fontFamily: "var(--mono)", fontSize: 12 }} value={String(value ?? "")} onChange={(e) => set(k, e.target.value)} />
        </div>
      );
    case "color":
      return (
        <div className="ctl">
          <label>
            <span title={spec.description}>{k}</span>
            <span className="val">{String(value || "token")}</span>
          </label>
          <div className="swatches">
            <button className={"swatch" + (!value ? " on" : "")} title="Use token" style={{ background: "repeating-linear-gradient(45deg, var(--line) 0 3px, transparent 3px 6px)" }} onClick={() => set(k, "")} />
            <span className="swatch" style={{ background: String(value || "#ffffff") }}>
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(String(value)) ? String(value) : "#ffffff"} onChange={(e) => set(k, e.target.value)} aria-label={k} />
            </span>
          </div>
        </div>
      );
    case "select":
      return (
        <div className="ctl">
          <label htmlFor={"c-" + k}>
            <span title={spec.description}>{k}</span>
          </label>
          {spec.options.length <= 3 ? (
            <div className="seg">
              {spec.options.map((o) => (
                <button key={o} className={(value ?? spec.default) === o ? "on" : ""} onClick={() => set(k, o)}>
                  {o}
                </button>
              ))}
            </div>
          ) : (
            <select id={"c-" + k} value={String(value ?? spec.default)} onChange={(e) => set(k, e.target.value)}>
              {spec.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          )}
        </div>
      );
    case "vec2": {
      const v = (Array.isArray(value) ? value : spec.default ?? [0.5, 0.5]) as [number, number];
      return (
        <div className="ctl">
          <label>
            <span title={spec.description}>{k}</span>
            <span className="val">
              {v[0].toFixed(2)}, {v[1].toFixed(2)}
            </span>
          </label>
          <div className="vec">
            <input type="range" min={0} max={1} step={0.01} value={v[0]} onChange={(e) => set(k, [Number(e.target.value), v[1]])} aria-label={k + " x"} />
            <input type="range" min={0} max={1} step={0.01} value={v[1]} onChange={(e) => set(k, [v[0], Number(e.target.value)])} aria-label={k + " y"} />
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

const ACCENTS = ["#FB7501", "#FB4001", "#3D5AFE", "#5B3DF5", "#C6F432", "#D7301F", "#111111", "#FF5A1F"];

export function Customize({ meta, api, onCopyCode }: { meta: EffectMeta; api: Api; onCopyCode: () => void }) {
  const { values, set } = api;
  const [hover, setHover] = useState<string | null>(null);
  const grouped: Record<PropGroup, [string, PropSpec][]> = { content: [], timing: [], style: [] };
  for (const [k, s] of Object.entries(meta.props)) if (isControl(s)) grouped[s.group].push([k, s]);
  const shared = meta.sharedProps || meta.kind === "primitive";
  const activePreset = STYLE_PRESETS.find((p) => Object.entries(presetValues(p)).every(([k, v]) => values[k] === v));
  const presetNote = hover ?? activePreset?.description ?? "One click applies palette, theme, font, grain and timing.";
  return (
    <aside className="panel" aria-label="Customize">
      <div className="panel-head">
        <b>Customize</b>
        <button className="icon-btn" title="Undo (Ctrl+Z)" disabled={!api.canUndo} onClick={api.undo}>
          <Icon name="undo" />
        </button>
        <button className="icon-btn" title="Redo (Ctrl+Shift+Z)" disabled={!api.canRedo} onClick={api.redo}>
          <Icon name="redo" />
        </button>
        <button className="icon-btn" title="Reset" onClick={api.reset}>
          <Icon name="reset" />
        </button>
        <button className="icon-btn" title="Copy share link" onClick={() => copy(location.href, "Share link copied")}>
          <Icon name="link" />
        </button>
        <button className="icon-btn" title="Copy code" onClick={onCopyCode}>
          <Icon name="copy" />
        </button>
      </div>

      <div className="presets" onMouseLeave={() => setHover(null)}>
        {STYLE_PRESETS.map((p) => {
          const pal = PALETTES[p.palette][p.theme];
          return (
            <button key={p.id} className={"preset" + (activePreset?.id === p.id ? " on" : "")} onMouseEnter={() => setHover(p.description)} onFocus={() => setHover(p.description)} onClick={() => api.apply(presetValues(p))}>
              <span className="preset-sw" style={{ background: `linear-gradient(135deg, ${pal.canvas} 0 50%, ${pal.accent} 50% 100%)` }} />
              {p.name}
            </button>
          );
        })}
      </div>
      {meta.presets?.length ? (
        <div className="presets own" onMouseLeave={() => setHover(null)}>
          <span className="presets-label">For this effect</span>
          {meta.presets.map((p) => (
            <button key={p.id} className="preset" onMouseEnter={() => setHover(p.description)} onFocus={() => setHover(p.description)} onClick={() => api.apply(p.values)}>
              <span className="preset-sw own" />
              {p.name}
            </button>
          ))}
        </div>
      ) : null}
      <div className="preset-desc">{presetNote}</div>
      {supportsEasing(meta)&&<EasingEditor value={values.easingCurve} set={set} beginGesture={api.beginGesture} updateGesture={api.updateGesture} endGesture={api.endGesture}/>}

      {(["content", "timing", "style"] as const).map((g) => {
        const items = grouped[g];
        const sharedTiming = g === "timing" && meta.sharedProps;
        if (!items.length && !sharedTiming) return null;
        return (
          <details key={g} className="group" open={g !== "style"}>
            <summary>{g}</summary>
            {sharedTiming && (
              <>
                <Control k="speed" spec={SHARED_PROPS.speed} value={values.speed} set={set} />
                <Control k="delay" spec={SHARED_PROPS.delay} value={values.delay} set={set} />
              </>
            )}
            {items.map(([k, s]) => (
              <Control key={k} k={k} spec={s} value={values[k]} set={set} />
            ))}
          </details>
        );
      })}

      {shared && (
        <details className="group">
          <summary>Theme</summary>
          <div className="ctl">
            <label>
              <span>theme</span>
            </label>
            <div className="seg">
              {(["light", "dark"] as const).map((t) => (
                <button key={t} className={values.theme === t ? "on" : ""} onClick={() => set("theme", t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="ctl">
            <label>
              <span>palette</span>
            </label>
            <div className="pal">
              {PALETTE_IDS.map((id) => {
                const p = PALETTES[id][(values.theme as "light" | "dark") ?? "light"];
                return (
                  <button key={id} className={values.palette === id ? "on" : ""} onClick={() => set("palette", id as PaletteId)} title={PALETTES[id].description}>
                    <span className="chips">
                      {[p.canvas, p.ink, p.accent, p.secondary].map((c, i) => (
                        <i key={i} style={{ background: c }} />
                      ))}
                    </span>
                    {PALETTES[id].name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="ctl">
            <label>
              <span>accent</span>
              <span className="val">{String(values.accent || "palette")}</span>
            </label>
            <div className="swatches">
              <button className={"swatch" + (!values.accent ? " on" : "")} title="Palette accent" style={{ background: PALETTES[(values.palette as PaletteId) ?? "saint-orange"][(values.theme as "light" | "dark") ?? "light"].accent }} onClick={() => set("accent", "")} />
              {ACCENTS.map((a) => (
                <button key={a} className={"swatch" + (values.accent === a ? " on" : "")} style={{ background: a }} title={a} onClick={() => set("accent", a)} />
              ))}
              <span className="swatch" style={{ background: "conic-gradient(red, yellow, lime, cyan, blue, magenta, red)" }} title="Custom">
                <input type="color" value={/^#[0-9a-f]{6}$/i.test(String(values.accent)) ? String(values.accent) : "#fb7501"} onChange={(e) => set("accent", e.target.value)} aria-label="Custom accent" />
              </span>
            </div>
          </div>
          {meta.sharedProps && (
            <>
              <div className="ctl">
                <label htmlFor="c-font">
                  <span>fontFamily</span>
                </label>
                <select id="c-font" value={String(values.fontFamily ?? "inherit")} onChange={(e) => set("fontFamily", e.target.value)}>
                  {["inherit", ...Object.keys(FONTS)].map((f) => (
                    <option key={f} value={f}>
                      {fontLabel[f] ?? f}
                    </option>
                  ))}
                </select>
              </div>
              <Control k="background" spec={SHARED_PROPS.background} value={values.background} set={set} />
              <Control k="scale" spec={SHARED_PROPS.scale} value={values.scale} set={set} />
            </>
          )}
          {meta.sharedProps && <Control k="grain" spec={SHARED_PROPS.grain} value={values.grain} set={set} />}
          <Control k="grid" spec={SHARED_PROPS.grid} value={values.grid} set={set} />
        </details>
      )}
    </aside>
  );
}
