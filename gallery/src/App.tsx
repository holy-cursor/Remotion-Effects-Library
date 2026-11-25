import React, { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { useCurrentFrame } from "remotion";
import { CATEGORIES, EFFECTS, EFFECTS_BY_SLUG } from "../../meta/effects";
import type { EffectMeta } from "../../meta/schema";
import { EffectScene, DURATION, FPS, frameToProgress } from "./preview/Preview";
import { MISSING_EXPORTS, type Values } from "./preview/bindings";
import { defaultsFor, go, ORDER, useRoute, useSiteTheme, type SiteTheme } from "./lib/state";
import { EffectPage } from "./pages/EffectPage";
import { Icon, Toaster } from "./ui/bits";
import { LiveCard, W, H } from "./ui/Stage";

const FLAGSHIP = EFFECTS.filter((m) => m.flagship);
const byCat = (id: string) => EFFECTS.filter((m) => m.category === id);
const match = (m: EffectMeta, q: string) => {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return [m.name, m.exportName, m.description, m.category, ...m.tags].join(" ").toLowerCase().includes(s);
};

/* ------------------------------------------------------------------ search */
function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = useMemo(() => EFFECTS.filter((m) => match(m, q)).slice(0, 40), [q]);
  useEffect(() => {
    if (open) {
      setQ("");
      setI(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);
  if (!open) return null;
  const pick = (m?: EffectMeta) => {
    if (!m) return;
    go(`#/effects/${m.slug}`);
    onClose();
  };
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-label="Search effects" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={input}
          value={q}
          placeholder="Search 66 effects by name, tag or category…"
          onChange={(e) => {
            setQ(e.target.value);
            setI(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setI((x) => Math.min(results.length - 1, x + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setI((x) => Math.max(0, x - 1));
            } else if (e.key === "Enter") pick(results[i]);
            else if (e.key === "Escape") onClose();
          }}
        />
        <ul role="listbox">
          {results.map((m, k) => (
            <li key={m.slug} role="option" aria-selected={k === i} className={k === i ? "on" : ""} onMouseEnter={() => setI(k)} onClick={() => pick(m)}>
              <b style={{ fontWeight: 550 }}>{m.name}</b>
              <span className="faint" style={{ fontSize: 12 }}>
                {m.exportName}
              </span>
              <span className="cat mono">{CATEGORIES.find((c) => c.id === m.category)?.name}</span>
            </li>
          ))}
          {!results.length && <li className="faint">No effect matches “{q}”.</li>}
        </ul>
        <div className="foot">
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- sidebar */
function Sidebar({ current }: { current?: string }) {
  const [q, setQ] = useState("");
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    list.current?.querySelector("a.on")?.scrollIntoView({ block: "nearest" });
  }, [current]);
  return (
    <div className="side" ref={list}>
      <input className="filter" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter effects" />
      {CATEGORIES.map((c) => {
        const items = byCat(c.id).filter((m) => match(m, q));
        if (!items.length) return null;
        return (
          <div key={c.id}>
            <h4>
              <a href={`#/category/${c.id}`}>{c.name}</a>
              <span>{items.length}</span>
            </h4>
            <ul>
              {items.map((m) => (
                <li key={m.slug}>
                  <a href={`#/effects/${m.slug}`} className={current === m.slug ? "on" : ""}>
                    <span className="num">{String(EFFECTS.indexOf(m) + 1).padStart(2, "0")}</span>
                    {m.name}
                    {m.flagship && <span className="badge">new</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------- home */
function Reel({ theme }: { theme: SiteTheme }) {
  const frame = useCurrentFrame();
  const k = Math.floor(frame / DURATION) % FLAGSHIP.length;
  const m = FLAGSHIP[k];
  const values: Values = { ...defaultsFor(m, theme), grain: theme === "dark" ? 0.3 : 0.1 };
  return <EffectScene slug={m.slug} values={values} progress={frameToProgress(frame % DURATION)} />;
}

function Home({ theme }: { theme: SiteTheme }) {
  const names = EFFECTS.map((m) => m.name);
  return (
    <div className="home">
      <div className="hero">
        <div>
          <span className="mono faint">Local library · 66 effects · Remotion 4</span>
          <h1>
            Motion effects, <em>tuned by hand</em>, driven by one number.
          </h1>
          <p>
            Every component here is a pure function of <code>progress</code>. Scrub it, theme it, restyle it with a preset, then copy the exact code into a
            scene. Same props everywhere: theme, accent, font, speed, delay, grain.
          </p>
          <div className="cta">
            <a className="btn primary" href={`#/effects/${FLAGSHIP[0]?.slug ?? EFFECTS[0].slug}`}>
              Open the first effect <Icon name="right" />
            </a>
            <a className="btn" href="#/effects">
              Browse all 66
            </a>
          </div>
          <div className="term">
            <b>$</b> git clone https://github.com/holy-cursor/Remotion-Effects-Library
          </div>
        </div>
        <div>
          <div className="hero-stage">
            <Player component={Reel} inputProps={{ theme }} durationInFrames={DURATION * FLAGSHIP.length} fps={FPS} compositionWidth={W} compositionHeight={H} style={{ width: "100%", height: "100%" }} autoPlay loop controls={false} acknowledgeRemotionLicense />
          </div>
          <div className="hero-cap mono">
            <span>Reworked set · {FLAGSHIP.length} effects</span>
            <span>Saint Orange</span>
          </div>
        </div>
      </div>
      <div className="marquee" aria-hidden>
        <div className="row">
          {[...names, ...names].map((n, i) => (
            <span key={i}>{n}</span>
          ))}
        </div>
      </div>
      <div className="block">
        <div className="block-head">
          <h2>Categories</h2>
          <span className="serif">ten drawers</span>
        </div>
        <div className="cats">
          {CATEGORIES.map((c) => (
            <a key={c.id} href={`#/category/${c.id}`}>
              <b>
                {c.name} <span>{String(byCat(c.id).length).padStart(2, "0")}</span>
              </b>
              <p>{c.blurb}</p>
            </a>
          ))}
        </div>
      </div>
      <div className="block">
        <div className="block-head">
          <h2>Reworked</h2>
          <span className="serif">hover to play</span>
          <a href="#/effects">All effects →</a>
        </div>
        <Cards items={FLAGSHIP} theme={theme} />
      </div>
      <div className="block">
        <div className="block-head">
          <h2>One API</h2>
          <span className="serif">for all seventy-five</span>
        </div>
        <div className="api">
          <div>
            <span className="mono faint">01 · Timing</span>
            <h3>progress, speed, delay</h3>
            <p>Drive any effect from your own frame math. Speed and delay retime it without touching the scene.</p>
          </div>
          <div>
            <span className="mono faint">02 · Tokens</span>
            <h3>theme, palette, accent</h3>
            <p>Colours come from roles (canvas, ink, accent, onAccent…). Saint Orange is the default palette, so old scenes look the same.</p>
          </div>
          <div>
            <span className="mono faint">03 · Stage</span>
            <h3>background, grid, grain, scale</h3>
            <p>Transparent by default. Ask for a stage and get a themed backdrop, a dotted grid and film grain.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Cards({ items, theme }: { items: readonly EffectMeta[]; theme: SiteTheme }) {
  return (
    <div className="grid">
      {items.map((m) => (
        <a key={m.slug} className="card" href={`#/effects/${m.slug}`}>
          <LiveCard slug={m.slug} values={defaultsFor(m, theme)} />
          <div className="meta">
            <b>
              {m.name}
              {m.flagship && <span className="badge">new</span>}
            </b>
            <p>{m.description}</p>
          </div>
        </a>
      ))}
    </div>
  );
}

function IndexPage({ title, blurb, items, theme }: { title: string; blurb: string; items: readonly EffectMeta[]; theme: SiteTheme }) {
  return (
    <div className="page-pad">
      <div className="crumbs mono">
        <a href="#/">Effects</a>
        <span>/</span>
        <span>{title}</span>
      </div>
      <h1 className="page-title">{title}</h1>
      <p className="fx-desc">{blurb}</p>
      <Cards items={items} theme={theme} />
    </div>
  );
}

/* --------------------------------------------------------------------- app */
export function App() {
  const route = useRoute();
  const [theme, setTheme] = useSiteTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const current = route.page === "effect" ? route.slug : undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = !!el.closest("input, textarea, select, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "j" || e.key === "k") {
        const i = current ? ORDER.findIndex((m) => m.slug === current) : -1;
        const n = ORDER.length;
        const next = e.key === "j" ? (i + 1) % n : (i - 1 + n) % n;
        go(`#/effects/${ORDER[next].slug}`);
      }
      if (e.key === "t") setTheme(theme === "dark" ? "light" : "dark");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, theme, setTheme]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const m = current ? EFFECTS_BY_SLUG[current] : undefined;
    document.title = m ? `${m.name} · Remotion Effects Library` : "Remotion Effects Library";
  }, [current, route.page]);

  let body: React.ReactNode;
  if (route.page === "effect") {
    const m = EFFECTS_BY_SLUG[route.slug];
    body = m ? <EffectPage key={m.slug} meta={m} siteTheme={theme} state={route.state} /> : <div className="page-pad">Unknown effect “{route.slug}”.</div>;
  } else if (route.page === "category") {
    const c = CATEGORIES.find((x) => x.id === route.id);
    body = c ? <IndexPage title={c.name} blurb={c.blurb} items={byCat(c.id)} theme={theme} /> : <div className="page-pad">Unknown category.</div>;
  } else if (route.page === "all") {
    body = <IndexPage title="All effects" blurb="Every effect in the library. Hover a card to play it." items={EFFECTS} theme={theme} />;
  } else body = <Home theme={theme} />;

  return (
    <>
      <header className="top">
        <a className="brand" href="#/">
          <span className="mark" />
          <b>Remotion Effects</b>
          <i>library</i>
        </a>
        <nav>
          <a href="#/" className={route.page === "home" ? "on" : ""}>
            Home
          </a>
          <a href="#/effects" className={route.page !== "home" ? "on" : ""}>
            Effects
          </a>
        </nav>
        <span className="spacer" />
        <button className="search-btn" onClick={() => setSearchOpen(true)}>
          <Icon name="search" />
          <span>Search effects</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Toggle light/dark (t)" aria-label="Toggle theme">
          <Icon name={theme === "dark" ? "sun" : "moon"} />
        </button>
      </header>
      <div className="layout">
        <Sidebar current={current} />
        <main className="main">{body}</main>
      </div>
      <SearchPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <Toaster />
      {MISSING_EXPORTS.length > 0 && <div className="toast">Missing exports: {MISSING_EXPORTS.join(", ")}</div>}
    </>
  );
}
