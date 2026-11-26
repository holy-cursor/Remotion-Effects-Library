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
const FALLBACK = `# Motion Effects: progress-driven Remotion effects\n\n## How to use\n- Every effect is a pure function of \`progress\` (0..1).\n- Wrapper effects animate their \`children\`. Text effects take \`text\`.`;
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
const X_URL = "https://x.com/0xsaint_";
const SKILL_URL = `${REPO}/blob/main/SKILL.md`;

function SecHead({ no, label, title, children }: { no: string; label: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="lp-h">
      <div className="lp-h-t">
        <p className="lp-label">
          {no} / {label}
        </p>
        <h2>{title}</h2>
      </div>
      {children ? <p>{children}</p> : null}
    </header>
  );
}

const STEPS = [
  { t: "Explore.", d: "Preview effects in real time and discover new creative possibilities." },
  { t: "Customize.", d: "Adjust animation curves, colors, typography and timing to match your creative direction." },
  { t: "Build.", d: "Copy the component into your Remotion project and compose it with other effects." },
];

const SYSTEM = ["Frame-driven animation", "Custom easing and timing", "Shared design tokens", "Customizable themes and palettes", "Composable React components"];

export function Landing({ theme }: { theme: SiteTheme }) {
  return (
    <div className="lp">
      <section className="lp-hero">
        <div className="lp-intro">
          <p className="lp-kicker">Motion Effects · {EFFECTS.length} components</p>
          <h1>
            Good motion shouldn't
            <br />
            <em>start from scratch.</em>
          </h1>
          <p className="lp-sub">
            A collection of reusable motion graphics, animations and visual effects for video built with code. Designed for creatives, developers and AI agents
            working with Remotion.
          </p>
          <div className="lp-cta">
            <a className="btn primary lg" href="#/effects">
              Explore effects <Icon name="right" />
            </a>
            <a className="btn lg" href={REPO} target="_blank" rel="noopener noreferrer">
              <Icon name="github" /> View on GitHub
            </a>
          </div>
          <ul className="lp-stats" aria-label="Library at a glance">
            <li>
              <b>{EFFECTS.length}</b> effects
            </li>
            <li>
              <b>{CATEGORIES.length}</b> categories
            </li>
            <li>Fully customizable</li>
          </ul>
        </div>
        <Scrubber theme={theme} />
      </section>

      <section className="lp-sec">
        <SecHead no="01" label="The collection" title="A library of motion.">
          From the smallest text animation to full-scene transitions. Explore, experiment and find the right movement for your next video.
        </SecHead>
        <FamilyIndex theme={theme} />
      </section>

      <section className="lp-sec">
        <SecHead no="02" label="The playground" title="Make it yours.">
          Every effect comes with an interactive playground. Experiment with timing, easing, colors and composition before bringing it into your project.
        </SecHead>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.t}>
              <span className="steps-n">{String(i + 1).padStart(2, "0")}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-sec">
        <SecHead no="03" label="The system" title="Different effects. A consistent language.">
          A shared animation architecture makes it easy to combine, customize and reuse effects across entire video projects.
        </SecHead>
        <div className="sys">
          <ul className="sys-list">
            {SYSTEM.map((x, i) => (
              <li key={x}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                {x}
              </li>
            ))}
          </ul>
          <p className="sys-close">
            Less time rebuilding animations. <em>More time deciding what to create.</em>
          </p>
        </div>
      </section>

      <section className="lp-sec">
        <SecHead no="04" label="Agentic video" title="A motion toolkit for your AI agent.">
          AI agents shouldn't have to reinvent a text reveal, a transition or a chart animation every time they create a video. Give your agent a library of
          reusable motion components, along with the knowledge to select, customize and sequence them.
        </SecHead>
        <div className="ag">
          <Manifest />
          <ul className="ag-files">
            <li>
              <b>Agent Skill</b>
              <span>Instructions for choosing and implementing motion effects within video compositions.</span>
            </li>
            <li>
              <b>Component Manifest</b>
              <span>A machine-readable catalogue of available effects, parameters and presets.</span>
            </li>
            <li>
              <b>Source Components</b>
              <span>Editable React components that integrate directly into Remotion projects.</span>
            </li>
            <li className="ag-cta">
              <a className="btn primary lg" href={SKILL_URL} target="_blank" rel="noopener noreferrer">
                Explore agent resources <Icon name="right" />
              </a>
              <a className="btn lg" href={REPO} target="_blank" rel="noopener noreferrer">
                <Icon name="github" /> View repository
              </a>
            </li>
          </ul>
        </div>
      </section>

      <section className="lp-why">
        <p className="lp-label">05 / Why this exists</p>
        <h2>
          Spend more time directing motion, <em>less time rebuilding it.</em>
        </h2>
        <div className="lp-why-row">
          <p>
            As video creation becomes increasingly programmable, there's an opportunity to make good motion more accessible without sacrificing creative control.
            This library is my contribution to that future.
          </p>
          <p className="lp-why-sign">Built for people who create with code, and the agents creating alongside them.</p>
        </div>
      </section>

      <footer className="lp-foot">
        <div>
          <b>Motion Effects</b>
          <span className="faint">An independent motion design resource by Saint. Built with Remotion and React.</span>
        </div>
        <nav aria-label="Footer">
          <a href={REPO} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
          <a href={X_URL} target="_blank" rel="noopener noreferrer">
            X
          </a>
          <a href="#/effects">Browse effects</a>
        </nav>
      </footer>
    </div>
  );
}
