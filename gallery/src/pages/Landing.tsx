import React, { useEffect, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { CATEGORIES, EFFECTS, EFFECTS_BY_SLUG } from "../../../meta/effects";
import type { EffectMeta } from "../../../meta/schema";
import { DURATION, FPS, PreviewComposition } from "../preview/Preview";
import { defaultsFor, type SiteTheme } from "../lib/state";
import { Icon } from "../ui/bits";
import { W, H } from "../ui/Stage";

const REPO = "https://github.com/holy-cursor/Remotion-Effects-Library";
const FLAGSHIP = EFFECTS.filter((m) => m.flagship);
const pick = (...slugs: string[]) => slugs.map((s) => EFFECTS_BY_SLUG[s]).find(Boolean) ?? FLAGSHIP[0] ?? EFFECTS[0];
const lead = (cat: string) => EFFECTS.find((m) => m.category === cat && m.flagship) ?? EFFECTS.find((m) => m.category === cat);
const count = (cat: string) => EFFECTS.filter((m) => m.category === cat).length;

/** A looping, muted preview that only mounts its player once it scrolls near the screen. */
function Loop({ meta, theme, className }: { meta: EffectMeta; theme: SiteTheme; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: "240px" });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={el} className={"loop " + (className ?? "")}>
      {on && (
        <Player
          component={PreviewComposition}
          inputProps={{ slug: meta.slug, values: { ...defaultsFor(meta, theme), background: "canvas" } }}
          durationInFrames={DURATION}
          fps={FPS}
          compositionWidth={W}
          compositionHeight={H}
          style={{ width: "100%", height: "100%" }}
          initialFrame={Math.round(DURATION * 0.45)}
          autoPlay
          loop
          controls={false}
          acknowledgeRemotionLicense
        />
      )}
    </div>
  );
}

function TwoTone({ lead: first, rest, id }: { lead: string; rest: string; id?: string }) {
  return (
    <h2 className="tt" id={id}>
      {first}
      <span>{rest}</span>
    </h2>
  );
}

const STEPS = [
  { n: "01", t: "Pick", d: `Search ${EFFECTS.length} effects by name, tag or family. Every card plays on hover.` },
  { n: "02", t: "Tune", d: "Scrub the timeline, swap palettes and fonts, retime the easing curve. Undo anything." },
  { n: "03", t: "Copy", d: "Take the exact scene code, a ready Composition, or a share link with your settings." },
];

const AGENT_FILES = [
  { n: "01", t: "SKILL.md", d: "How to pick, time and theme effects", s: "ready" },
  { n: "02", t: "llms-components.txt", d: "Every effect, prop and preset in plain text", s: "ready" },
  { n: "03", t: "components.json", d: "The same catalogue for tools", s: "ready" },
  { n: "04", t: "Shared theme API", d: "One set of props across every effect", s: "ready" },
  { n: "05", t: "Your scene", d: "The agent drops effects on your timeline", s: "you" },
];

const WHY = [
  { t: "One number", d: "Every effect is a pure function of progress, so it fits any frame math you already have." },
  { t: "One theme API", d: "Theme, palette, accent, font, speed, delay and grain work the same everywhere." },
  { t: "Copy, don't install", d: "Plain files you own. Copy them into your Remotion project and edit freely." },
  { t: "Agent-ready", d: "A skill file and machine-readable catalogue ship with the library." },
];

export function Landing({ theme }: { theme: SiteTheme }) {
  const tileA = pick("iris", "liquid-wipe");
  const tileB = pick("dither-aurora", "dither-globe", "pixel-field");
  const floats = [pick("glowing-trace", "orbit"), pick("character-flip", "masked-rise"), pick("liquid-wipe", "sheen"), pick("leaderboard-promotion", "tracking-line-chart")];
  const toAgents = () => document.getElementById("agents")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const cats = CATEGORIES.map((c) => ({ c, m: lead(c.id), n: count(c.id) })).filter((x) => x.m);

  return (
    <div className="landing">
      <section className="l-hero">
        <a className="announce" href="#/effects">
          <span className="announce-dot" />
          <b>{EFFECTS.length} effects</b>
          <span className="announce-sub">free, open source, built for agents too</span>
          <span className="announce-go">
            Browse <Icon name="right" />
          </span>
        </a>
        <h1 className="l-title">
          <span className="l-line">
            Effects <Loop meta={tileA} theme={theme} className="inline-tile" /> tuned by hand,
          </span>
          <span className="l-line dim">
            driven by <Loop meta={tileB} theme={theme} className="inline-tile alt" /> one number
          </span>
        </h1>
        <p className="l-sub">
          A library of Remotion effects that all take one <code>progress</code> value from 0 to 1. Play with any of them live, copy the code, or hand the
          whole set to your AI agent.
        </p>
        <div className="l-cta">
          <a className="pill-btn light" href="#/effects">
            Browse the effects <Icon name="right" />
          </a>
          <button className="pill-btn dark" onClick={toAgents}>
            Use it with an agent
          </button>
        </div>
      </section>

      <section className="l-stage" aria-label="Example">
        {floats.map((m, i) => (
          <a key={m.slug + i} href={`#/effects/${m.slug}`} className={`float f${i}`} aria-label={`Open ${m.name}`}>
            <Loop meta={m} theme={theme} />
            <span>{m.name}</span>
          </a>
        ))}
        <div className="prompt">
          <div className="prompt-head">
            <span className="prompt-file">Scene.tsx</span>
            <span className="prompt-path">~/launch-video</span>
          </div>
          <pre className="prompt-code">
            <span className="k">const</span> p = <span className="f">interpolate</span>(frame, [<span className="n">12</span>, <span className="n">60</span>], [<span className="n">0</span>, <span className="n">1</span>]);{"\n"}
            {"\n"}
            <span className="t">&lt;{tileA.exportName}</span> <span className="a">progress</span>={"{"}p{"}"} <span className="a">palette</span>=<span className="s">"saint-orange"</span> <span className="t">/&gt;</span>
            <span className="caret" />
          </pre>
          <div className="prompt-foot">
            <span className="faint">{EFFECTS.length} effects · one theme API</span>
            <a className="pill-btn light sm" href={`#/effects/${tileA.slug}`}>
              Open in the playground <Icon name="right" />
            </a>
          </div>
          <div className="picked">
            <span className="faint">Picked</span>
            {[tileA, tileB, ...floats.slice(0, 2)].map((m, i) => (
              <a key={m.slug + i} href={`#/effects/${m.slug}`}>
                {m.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="l-sec">
        <div className="l-head">
          <TwoTone lead="How it works" rest="Three steps, one session." />
        </div>
        <div className="steps">
          {STEPS.map((s) => (
            <div key={s.n} className="step">
              <span className="step-n">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-sec">
        <div className="l-head split">
          <TwoTone lead={`${cats.length} families of motion.`} rest="Every one plays live below." />
          <p className="l-aside">
            Reveals, type, numbers, depth, transitions, paths, texture, interface stories, charts and primitives. {EFFECTS.length} effects in all, each with
            presets and a typed props table.
          </p>
        </div>
        <div className="bento">
          {cats.map(({ c, m, n }, i) => (
            <a key={c.id} href={`#/category/${c.id}`} className={"tile" + (i < 2 ? " big" : "")}>
              <Loop meta={m!} theme={theme} className="tile-media" />
              <div className="tile-meta">
                <span className="tile-count">{n} effects</span>
                <h3>{c.name}</h3>
                <p>{c.blurb}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="l-sec agents" id="agents">
        <div className="agents-grid">
          <div>
            <TwoTone lead="Built for your agent." rest="It reads the library the way you do." />
            <p className="l-aside">
              Point Claude Code, Codex or any coding agent at the repo. The skill tells it how to choose an effect for a beat, time it to the edit and theme
              it to the brand.
            </p>
            <div className="l-cta left">
              <a className="pill-btn light" href={REPO} target="_blank" rel="noopener noreferrer">
                <Icon name="github" /> Get it on GitHub
              </a>
              <a className="pill-btn dark" href="/llms-components.txt" target="_blank" rel="noopener noreferrer">
                Read the agent manifest
              </a>
            </div>
          </div>
          <ol className="stages">
            {AGENT_FILES.map((f) => (
              <li key={f.n} className={f.s === "you" ? "next" : ""}>
                <span className="st-n">{f.n}</span>
                <b>{f.t}</b>
                <span className="st-d">{f.d}</span>
                <span className="st-s">{f.s === "you" ? "next" : "included"}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="l-sec">
        <div className="l-head center">
          <TwoTone lead="Why this library" rest="Less setup, more motion." />
        </div>
        <div className="why">
          {WHY.map((w) => (
            <div key={w.t}>
              <h3>{w.t}</h3>
              <p>{w.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-final">
        <h2>Your next edit deserves better than a fade.</h2>
        <div className="l-cta">
          <a className="pill-btn light" href="#/effects">
            Browse all {EFFECTS.length} effects <Icon name="right" />
          </a>
          <a className="pill-btn dark" href={REPO} target="_blank" rel="noopener noreferrer">
            View the source
          </a>
        </div>
      </section>

      <footer className="l-foot">
        <span>Remotion Effects Library</span>
        <span className="faint">Built by Saint · Remotion 4 · React 19</span>
        <a href={REPO} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}
