/**
 * Render-check sheet: every effect at progress 0, 0.5 and 1, light or dark.
 * ?theme=light|dark&page=0..2&per=25 . Results land on window.__fxCheck.
 */
import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import { EFFECTS } from "../../meta/effects";
import { defaultsFor } from "./lib/state";
import { StillThumb } from "./ui/Stage";

type Result = { slug: string; progress: number; theme: string; error?: string };
const results: Result[] = [];
(window as unknown as { __fxCheck: Result[] }).__fxCheck = results;

class Boundary extends React.Component<{ id: Omit<Result, "error">; children: React.ReactNode }, { error?: string }> {
  override state: { error?: string } = {};
  static getDerivedStateFromError(e: unknown) {
    return { error: String((e as Error)?.message ?? e) };
  }
  override componentDidCatch(e: unknown) {
    results.push({ ...this.props.id, error: String((e as Error)?.message ?? e) });
  }
  override render() {
    return this.state.error ? <div className="err">{this.state.error}</div> : this.props.children;
  }
}

const q = new URLSearchParams(location.search);
const theme = (q.get("theme") === "dark" ? "dark" : "light") as "light" | "dark";
const per = Number(q.get("per") ?? 25);
const page = Number(q.get("page") ?? 0);
const selected = q.get("slugs")?.split(",");
const list = selected ? EFFECTS.filter(m => selected.includes(m.slug)) : EFFECTS.slice(page * per, page * per + per);
const frames = q.get("progress")?.split(",").map(Number) ?? [0, .5, 1];
const overrides = JSON.parse(q.get("values") ?? "{}");
document.documentElement.dataset.theme = theme;

function Sheet() {
  return (
    <div className="g">
      {list.map((m) => (
        <React.Fragment key={m.slug}>
          <div className="lab">
            {String(EFFECTS.indexOf(m) + 1).padStart(2, "0")} {m.name} · {theme} · p {frames.join(" / ")}
          </div>
          {frames.map((p) => (
            <div className="cell" key={p}>
              <Boundary id={{ slug: m.slug, progress: p, theme }}>
                <StillThumb slug={m.slug} values={{...defaultsFor(m, theme), ...overrides}} progress={p} />
              </Boundary>
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<Sheet />);
document.fonts.ready.then(() => setTimeout(() => ((window as unknown as { __ready: boolean }).__ready = true), 2500));
