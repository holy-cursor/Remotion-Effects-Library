import React, { useCallback, useEffect, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { CATEGORIES, EFFECTS, EFFECTS_BY_SLUG } from "../../../meta/effects";
import type { EffectMeta } from "../../../meta/schema";
import { DURATION, FPS, PreviewComposition, frameToProgress, progressToFrame } from "../preview/Preview";
import { defaultsFor, type SiteTheme } from "../lib/state";
import { Icon } from "../ui/bits";
import { W, H } from "../ui/Stage";

const REPO = "https://github.com/holy-cursor/Remotion-Effects-Library";
const FLAGSHIP = EFFECTS.filter((m) => m.flagship);
const bySlug = (...slugs: string[]) => slugs.map((s) => EFFECTS_BY_SLUG[s]).find(Boolean);
const lead = (cat: string) => EFFECTS.find((m) => m.category === cat && m.flagship) ?? EFFECTS.find((m) => m.category === cat);
const count = (cat: string) => EFFECTS.filter((m) => m.category === cat).length;
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/* A reel of effects for the hero; falls back to the reworked set. */
const REEL: EffectMeta[] = (() => {
  const picked = [bySlug("liquid-wipe"), bySlug("character-flip"), bySlug("tracking-line-chart"), bySlug("corner-peel"), bySlug("roll-counter")].filter(Boolean) as EffectMeta[];
  return picked.length >= 3 ? picked : FLAGSHIP.slice(0, 5);
})();

/* ------------------------------------------------------------------ hero: you hold the number */
function Scrubber({ theme }: { theme: SiteTheme }) {
  const ref = useRef<PlayerRef>(null);
  const [k, setK] = useState(0);
  const [frame, setFrame] = useState(progressToFrame(0.5));
  const [held, setHeld] = useState(false);
  const last = useRef(0);
  const meta = REEL[k % REEL.length];

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => {
      const f = e.detail.frame;
      // when the loop wraps, move on to the next effect in the reel
      if (f < last.current - 20 && !held) setK((x) => x + 1);
      last.current = f;
      setFrame(f);
    };
    p.addEventListener("frameupdate", onFrame);
    return () => p.removeEventListener("frameupdate", onFrame);
  }, [held, k]);

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    p.seekTo(reduced() ? progressToFrame(0.7) : 0);
    last.current = 0;
    if (!reduced() && !held) p.play();
  }, [k]);

  const seek = useCallback((progress: number) => {
    const p = ref.current;
    if (!p) return;
    p.pause();
    setHeld(true);
    const f = progressToFrame(Math.max(0, Math.min(1, progress)));
    p.seekTo(f);
    setFrame(f);
  }, []);
  const togglePlay = () => {
    const p = ref.current;
    if (!p) return;
    if (held || !p.isPlaying()) {
      setHeld(false);
      if (frameToProgress(p.getCurrentFrame()) >= 1) p.seekTo(0);
      p.play();
    } else {
      p.pause();
      setHeld(true);
    }
  };
  const choose = (i: number) => {
    setHeld(false);
    setK(i);
  };
  const progress = frameToProgress(frame);

  return (
    <div className="sc">
      <div className="sc-stage">
        <Player
          key={meta.slug}
          ref={ref}
          component={PreviewComposition}
          inputProps={{ slug: meta.slug, values: { ...defaultsFor(meta, theme), background: "canvas" } }}
          durationInFrames={DURATION}
          fps={FPS}
          compositionWidth={W}
          compositionHeight={H}
          style={{ width: "100%", height: "100%" }}
          autoPlay={!reduced()}
          loop
          controls={false}
          clickToPlay={false}
          acknowledgeRemotionLicense
        />
        <a className="sc-tag" href={`#/effects/${meta.slug}`}>
          {meta.name} <Icon name="right" />
        </a>
      </div>
      <div className="sc-rail">
        <button className="sc-play" onClick={togglePlay} aria-label={held ? "Play" : "Pause"} title={held ? "Play" : "Pause"}>
          <Icon name={held ? "play" : "pause"} fill />
        </button>
        <span className="sc-label">progress</span>
        <div className="sc-track" style={{ ["--p" as string]: progress }}>
          <span className="sc-fill" />
          <span className="sc-knob" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.001}
            value={progress}
            aria-label="Progress: drag to drive the effect"
            onChange={(e) => seek(Number(e.target.value))}
          />
        </div>
        <span className="sc-num">{progress.toFixed(2)}</span>
      </div>
      <div className="sc-reel" role="tablist" aria-label="Effects in the reel">
        {REEL.map((m, i) => (
          <button key={m.slug} role="tab" aria-selected={i === k % REEL.length} className={i === k % REEL.length ? "on" : ""} onClick={() => choose(i)}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            {m.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ index: hover a family, it plays */
function FamilyIndex({ theme }: { theme: SiteTheme }) {
  const rows = CATEGORIES.map((c, i) => ({ c, i, m: lead(c.id), n: count(c.id) })).filter((r) => r.m);
  const [on, setOn] = useState(0);
  const cur = rows[on] ?? rows[0];
  return (
    <div className="ix">
      <ol className="ix-list">
        {rows.map((r, i) => (
          <li key={r.c.id}>
            <a href={`#/category/${r.c.id}`} className={i === on ? "on" : ""} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)}>
              <span className="ix-n">{String(i + 1).padStart(2, "0")}</span>
              <span className="ix-name">{r.c.name}</span>
              <span className="ix-blurb">{r.c.blurb}</span>
              <span className="ix-count">{r.n}</span>
            </a>
          </li>
        ))}
      </ol>
      <div className="ix-preview" aria-hidden="true">
        <div className="ix-frame">
          <Player
            key={cur.m!.slug}
            component={PreviewComposition}
            inputProps={{ slug: cur.m!.slug, values: { ...defaultsFor(cur.m!, theme), background: "canvas" } }}
            durationInFrames={DURATION}
            fps={FPS}
            compositionWidth={W}
            compositionHeight={H}
            style={{ width: "100%", height: "100%" }}
            initialFrame={reduced() ? progressToFrame(0.7) : 0}
            autoPlay={!reduced()}
            loop
            controls={false}
            acknowledgeRemotionLicense
          />
        </div>
        <p className="ix-cap">
          <b>{cur.m!.name}</b> · {cur.c.name}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ agents: the real manifest */
const FALLBACK = `# Remotion Effects Library: progress-driven Remotion effects\n\n## How to use\n- Every effect is a pure function of \`progress\` (0..1).\n- Wrapper effects animate their \`children\`. Text effects take \`text\`.`;
function Manifest() {
  const [text, setText] = useState(FALLBACK);
  useEffect(() => {
    fetch("/llms-components.txt")
      .then((r) => (r.ok ? r.text() : FALLBACK))
      .then((t) => setText(t.startsWith("#") ? t : FALLBACK))
      .catch(() => setText(FALLBACK));
  }, []);
  const lines = text.split("\n").filter((l, i, a) => !(l === "" && a[i - 1] === "")).slice(0, 16);
  return (
    <figure className="mf">
      <figcaption>
        <span>llms-components.txt</span>
        <a href="/llms-components.txt" target="_blank" rel="noopener noreferrer">
          Open the full file <Icon name="right" />
        </a>
      </figcaption>
      <pre>
        {lines.map((l, i) => (
          <span key={i} className={"mf-l" + (l.startsWith("#") ? " h" : l.startsWith(">") ? " q" : "")}>
            <i>{i + 1}</i>
            {l || " "}
          </span>
        ))}
      </pre>
    </figure>
  );
}

/* ------------------------------------------------------------------ page */
export function Landing({ theme }: { theme: SiteTheme }) {
  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-intro">
          <p className="lp-kicker">Remotion Effects Library · {EFFECTS.length} effects</p>
          <h1>
            Every effect,
            <br />
            <em>one number.</em>
          </h1>
          <p className="lp-sub">
            Each effect in this library takes a single <code>progress</code> value from 0 to 1. Drag the rail and you are the timeline. Theme it, retime it,
            copy the code, or hand the whole set to your agent.
          </p>
          <div className="lp-cta">
            <a className="btn primary lg" href="#/effects">
              Browse all {EFFECTS.length} <Icon name="right" />
            </a>
            <a className="btn lg" href={REPO} target="_blank" rel="noopener noreferrer">
              <Icon name="github" /> Source
            </a>
          </div>
        </div>
        <Scrubber theme={theme} />
      </section>

      <section className="lp-sec">
        <header className="lp-h">
          <span className="lp-no">A</span>
          <h2>Index</h2>
          <p>{CATEGORIES.length} families. Hover one to watch it; click to open every effect inside.</p>
        </header>
        <FamilyIndex theme={theme} />
      </section>

      <section className="lp-sec">
        <header className="lp-h">
          <span className="lp-no">B</span>
          <h2>The contract</h2>
          <p>Every effect in the library speaks the same small language.</p>
        </header>
        <dl className="contract">
          <div>
            <dt>
              <code>progress</code>
            </dt>
            <dd>0 to 1. Compute it from the frame however you like; the effect is a pure function of it.</dd>
          </div>
          <div>
            <dt>
              <code>theme · palette · accent</code>
            </dt>
            <dd>Colours come from named roles, so one palette swap restyles a whole scene.</dd>
          </div>
          <div>
            <dt>
              <code>speed · delay · easing</code>
            </dt>
            <dd>Retime anything without touching its code. The playground has a curve editor.</dd>
          </div>
          <div>
            <dt>
              <code>background · grid · grain</code>
            </dt>
            <dd>Transparent by default. Ask for a stage and it brings its own backdrop and film grain.</dd>
          </div>
        </dl>
      </section>

      <section className="lp-sec">
        <header className="lp-h">
          <span className="lp-no">C</span>
          <h2>For agents</h2>
          <p>The library describes itself. A skill file tells an agent how to choose, time and theme effects; this manifest lists every prop.</p>
        </header>
        <div className="ag">
          <Manifest />
          <ul className="ag-files">
            <li>
              <b>SKILL.md</b>
              <span>How an agent picks an effect for a beat, times it to the edit and themes it to the brand.</span>
            </li>
            <li>
              <b>llms-components.txt</b>
              <span>Every effect, prop, default and preset in plain text.</span>
            </li>
            <li>
              <b>components.json</b>
              <span>The same catalogue for tools.</span>
            </li>
            <li>
              <a className="btn lg" href={REPO} target="_blank" rel="noopener noreferrer">
                Point your agent at the repo <Icon name="right" />
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section className="lp-end">
        <p className="lp-big" aria-hidden="true">
          p = 1.00
        </p>
        <div className="lp-end-row">
          <p>Copy the files into your Remotion project. They are yours to edit.</p>
          <a className="btn primary lg" href="#/effects">
            Start browsing <Icon name="right" />
          </a>
        </div>
      </section>

      <footer className="lp-foot">
        <span>Remotion Effects Library</span>
        <span className="faint">By Saint · Remotion 4 · React 19</span>
        <a href={REPO} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
