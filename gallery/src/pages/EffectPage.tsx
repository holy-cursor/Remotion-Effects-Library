import React, { useEffect, useMemo, useState } from "react";
import type { EffectMeta, PropSpec } from "../../../meta/schema";
import { CATEGORIES, EFFECTS, SHARED_PROPS } from "../../../meta/effects";
import { effectMarkdown } from "../../../meta/docs";
import { go, ORDER, useCustomize } from "../lib/state";
import { compositionSnippet, installSnippet, usageSnippet } from "../lib/snippet";
import { CodeBlock, copy, Icon } from "../ui/bits";
import { Customize } from "../ui/Customize";
import { StagePlayer } from "../ui/Stage";

const sources = import.meta.glob("../../../*.tsx", { query: "?raw", import: "default" }) as Record<string, () => Promise<string>>;

function useSource(file: string) {
  const [src, setSrc] = useState<string>("// loading…");
  useEffect(() => {
    const load = sources["../../../" + file];
    if (load) load().then(setSrc);
    else setSrc("// source not found: " + file);
  }, [file]);
  return src;
}

const fmtDefault = (s: PropSpec) => (s.default === undefined ? "—" : typeof s.default === "string" ? JSON.stringify(s.default) : JSON.stringify(s.default));

function PropsTable({ meta }: { meta: EffectMeta }) {
  const own = Object.entries(meta.props);
  const shared = meta.sharedProps ? Object.entries(SHARED_PROPS).filter(([k]) => !(k in meta.props)) : [];
  return (
    <div className="code" style={{ overflowX: "auto" }}>
      <table className="props">
        <thead>
          <tr>
            <th>Prop</th>
            <th>Type</th>
            <th>Default</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {own.map(([k, s]) => (
            <tr key={k}>
              <td>
                {k}
                {s.required && <span className="req" title="Required">*</span>}
              </td>
              <td>
                <code>{s.type}</code>
              </td>
              <td>
                <code>{fmtDefault(s)}</code>
              </td>
              <td className="muted">{s.description}</td>
            </tr>
          ))}
          {shared.map(([k, s]) => (
            <tr key={k} className="shared">
              <td>
                {k}
                {s.required && <span className="req">*</span>}
              </td>
              <td>
                <code>{s.type}</code>
              </td>
              <td>
                <code>{fmtDefault(s)}</code>
              </td>
              <td className="muted">
                <span className="badge" style={{ marginRight: 6 }}>shared</span>
                {s.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EffectPage({ meta, siteTheme, state }: { meta: EffectMeta; siteTheme: "light" | "dark"; state?: string }) {
  const api = useCustomize(meta, siteTheme, state);
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const src = useSource(meta.file);
  const i = EFFECTS.findIndex((m) => m.slug === meta.slug);
  const o = ORDER.findIndex((m) => m.slug === meta.slug);
  const prev = ORDER[(o - 1 + ORDER.length) % ORDER.length];
  const next = ORDER[(o + 1) % ORDER.length];
  const cat = CATEGORIES.find((c) => c.id === meta.category);
  const usage = useMemo(() => usageSnippet(meta, api.values, api.defaults), [meta, api.values, api.defaults]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) api.redo();
        else api.undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api]);

  return (
    <div className="fx-page">
      <div style={{ minWidth: 0 }}>
        <div className="crumbs mono">
          <a href="#/">Effects</a>
          <span>/</span>
          <a href={`#/category/${meta.category}`}>{cat?.name}</a>
        </div>
        <div className="fx-head">
          <h1>{meta.name}</h1>
          <span className="no">N° {String(i + 1).padStart(2, "0")}</span>
          {meta.flagship && <span className="badge" style={{ marginLeft: 0, alignSelf: "center" }}>reworked</span>}
        </div>
        <p className="fx-desc">{meta.description}</p>
        <div className="fx-actions">
          <button className="btn" onClick={() => copy(effectMarkdown(meta), "Page copied as markdown")}>
            <Icon name="doc" /> Copy page
          </button>
          <button className="btn" onClick={() => copy(usage, "Usage copied")}>
            <Icon name="copy" /> Copy code
          </button>
          <span className="mono faint">{meta.file}</span>
          <div className="pager">
            <button className="btn" onClick={() => go(`#/effects/${prev.slug}`)} title={`Previous: ${prev.name}`}>
              <Icon name="left" /> {prev.name} <kbd>k</kbd>
            </button>
            <button className="btn" onClick={() => go(`#/effects/${next.slug}`)} title={`Next: ${next.name}`}>
              {next.name} <kbd>j</kbd> <Icon name="right" />
            </button>
          </div>
        </div>

        <div className="plate">
          <div className="plate-bar">
            <div className="tabs" role="tablist">
              <button role="tab" aria-selected={tab === "preview"} className={tab === "preview" ? "on" : ""} onClick={() => setTab("preview")}>
                Preview
              </button>
              <button role="tab" aria-selected={tab === "code"} className={tab === "code" ? "on" : ""} onClick={() => setTab("code")}>
                Code
              </button>
            </div>
            <span className="spacer" style={{ flex: 1 }} />
            <span className="mono faint">640 × 360 · 30 fps · 4 s</span>
          </div>
          {tab === "preview" ? (
            <StagePlayer slug={meta.slug} values={api.values} />
          ) : (
            <div style={{ padding: 14 }}>
              <CodeBlock tabs={[{ label: "Usage", code: usage }, { label: meta.file, code: src }]} />
            </div>
          )}
        </div>

        <section className="doc">
          <h2>Usage</h2>
          <CodeBlock tabs={[{ label: "Scene.tsx", code: usage }, { label: "Root.tsx", code: compositionSnippet(meta) }, { label: "Install", code: installSnippet(meta) }]} />
        </section>

        <section className="doc">
          <h2>Props</h2>
          <PropsTable meta={meta} />
        </section>

        {meta.notes?.length ? (
          <section className="doc">
            <h2>Notes</h2>
            <ul className="notes">
              {meta.notes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="doc">
          <h2>Metadata</h2>
          <CodeBlock tabs={[{ label: "meta.json", code: JSON.stringify(meta, null, 2) }]} />
        </section>
      </div>
      <Customize meta={meta} api={api} onCopyCode={() => copy(usage, "Usage copied")} />
    </div>
  );
}
