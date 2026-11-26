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
  const [tab, setTab] = useState<"usage" | "props" | "source" | "notes">("usage");
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

  type DocTab = "usage" | "props" | "source" | "notes";
  const docTabs: { id: DocTab; label: string }[] = [
    { id: "usage", label: "Usage" },
    { id: "props", label: `Props · ${Object.keys(meta.props).length}` },
    { id: "source", label: "Source" },
    ...(meta.notes?.length ? [{ id: "notes" as const, label: "Notes" }] : []),
  ];

  return (
    <div className="fx-page">
      <div className="fx-main" style={{ minWidth: 0 }}>
        <div className="fx-top">
          <div>
            <div className="crumbs">
              <a href="#/effects">Effects</a>
              <span>/</span>
              <a href={`#/category/${meta.category}`}>{cat?.name}</a>
            </div>
            <h1 className="fx-title">{meta.name}</h1>
            <p className="fx-desc">{meta.description}</p>
          </div>
          <div className="fx-tools">
            <button className="btn primary" onClick={() => copy(usage, "Code copied")}>
              <Icon name="copy" /> Copy code
            </button>
            <button className="icon-btn" onClick={() => copy(effectMarkdown(meta), "Page copied as markdown")} title="Copy this page as markdown" aria-label="Copy page as markdown">
              <Icon name="doc" />
            </button>
            <span className="fx-pager">
              <button className="icon-btn" onClick={() => go(`#/effects/${prev.slug}`)} title={`Previous: ${prev.name} (k)`} aria-label={`Previous effect: ${prev.name}`}>
                <Icon name="left" />
              </button>
              <button className="icon-btn" onClick={() => go(`#/effects/${next.slug}`)} title={`Next: ${next.name} (j)`} aria-label={`Next effect: ${next.name}`}>
                <Icon name="right" />
              </button>
            </span>
          </div>
        </div>

        <div className="plate">
          <StagePlayer slug={meta.slug} values={api.values} />
        </div>

        <section className="doc-tabs">
          <div className="tabs" role="tablist" aria-label="Details">
            {docTabs.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="doc-body" role="tabpanel">
            {tab === "usage" && <CodeBlock tabs={[{ label: "Scene.tsx", code: usage }, { label: "Root.tsx", code: compositionSnippet(meta) }, { label: "Install", code: installSnippet(meta) }]} />}
            {tab === "props" && <PropsTable meta={meta} />}
            {tab === "source" && <CodeBlock tabs={[{ label: meta.file, code: src }, { label: "meta.json", code: JSON.stringify(meta, null, 2) }]} />}
            {tab === "notes" && (
              <ul className="notes">
                {meta.notes?.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
      <Customize meta={meta} api={api} onCopyCode={() => copy(usage, "Usage copied")} />
    </div>
  );
}
