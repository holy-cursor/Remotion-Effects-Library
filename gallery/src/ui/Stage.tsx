import React, { useCallback, useEffect, useRef, useState } from "react";
import { Player, Thumbnail, type PlayerRef } from "@remotion/player";
import { DURATION, FPS, frameToProgress, PreviewComposition, progressToFrame } from "../preview/Preview";
import type { Values } from "../preview/bindings";
import { Icon } from "./bits";

export const W = 640;
export const H = 360;

/** Live player with a custom transport: play/pause, scrubber with a time ruler, loop. */
export function StagePlayer({ slug, values }: { slug: string; values: Values }) {
  const ref = useRef<PlayerRef>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [loop, setLoop] = useState(true);

  useEffect(() => {
    const p = ref.current;
    if (!p) return;
    const onFrame = (e: { detail: { frame: number } }) => setFrame(e.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    p.addEventListener("frameupdate", onFrame);
    p.addEventListener("play", onPlay);
    p.addEventListener("pause", onPause);
    p.addEventListener("ended", onPause);
    return () => {
      p.removeEventListener("frameupdate", onFrame);
      p.removeEventListener("play", onPlay);
      p.removeEventListener("pause", onPause);
      p.removeEventListener("ended", onPause);
    };
  }, []);

  const toggle = useCallback(() => {
    const p = ref.current;
    if (!p) return;
    if (p.isPlaying()) p.pause();
    else {
      if (p.getCurrentFrame() >= DURATION - 1) p.seekTo(0);
      p.play();
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "," || e.key === ".") {
        const p = ref.current;
        if (!p) return;
        p.pause();
        p.seekTo(Math.max(0, Math.min(DURATION - 1, p.getCurrentFrame() + (e.key === "," ? -1 : 1))));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const pct = (frame / (DURATION - 1)) * 100;
  const mStart = (progressToFrame(0) / (DURATION - 1)) * 100;
  const mEnd = (progressToFrame(1) / (DURATION - 1)) * 100;
  return (
    <>
      <div className="stage-wrap">
        <span className="crop tl" />
        <span className="crop tr" />
        <span className="crop bl" />
        <span className="crop br" />
        <div className="stage">
          <Player
            ref={ref}
            component={PreviewComposition}
            inputProps={{ slug, values }}
            durationInFrames={DURATION}
            fps={FPS}
            compositionWidth={W}
            compositionHeight={H}
            style={{ width: "100%", height: "100%" }}
            autoPlay
            loop={loop}
            controls={false}
            clickToPlay={false}
            acknowledgeRemotionLicense
          />
        </div>
      </div>
      <div className="transport">
        <button className="play" onClick={toggle} aria-label={playing ? "Pause" : "Play"} title="Play / pause (Space)">
          <Icon name={playing ? "pause" : "play"} fill />
        </button>
        <button className={"icon-btn"} style={loop ? { color: "var(--accent)", borderColor: "var(--accent)" } : undefined} onClick={() => setLoop((l) => !l)} title="Loop" aria-pressed={loop}>
          <Icon name="loop" />
        </button>
        <div className="scrub">
          <div className="track" />
          <div className="motion" style={{ left: mStart + "%", width: mEnd - mStart + "%" }} />
          <div className="fill" style={{ width: pct + "%" }} />
          <div className="thumb" style={{ left: pct + "%" }} />
          <div className="ruler" aria-hidden>
            {Array.from({ length: 9 }, (_, i) => (
              <span key={i} style={{ left: (i / 8) * 100 + "%" }}>
                {i % 2 === 0 ? `${i / 2}s` : ""}
              </span>
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={DURATION - 1}
            step={1}
            value={frame}
            aria-label="Scrub timeline"
            onChange={(e) => {
              const p = ref.current;
              if (!p) return;
              p.pause();
              p.seekTo(Number(e.target.value));
            }}
          />
        </div>
        <div className="readout">
          <b>{(frame / FPS).toFixed(2)}s</b> / {(DURATION / FPS).toFixed(2)}s · p <b>{frameToProgress(frame).toFixed(2)}</b>
        </div>
      </div>
    </>
  );
}

/** Static thumbnail at a given progress (for index cards). */
export function StillThumb({ slug, values, progress = 0.62 }: { slug: string; values: Values; progress?: number }) {
  return (
    <Thumbnail
      component={PreviewComposition}
      inputProps={{ slug, values }}
      compositionWidth={W}
      compositionHeight={H}
      durationInFrames={DURATION}
      fps={FPS}
      frameToDisplay={progressToFrame(progress)}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/** Thumbnail that becomes a playing Player while hovered, and lazy-mounts when visible. */
export function LiveCard({ slug, values }: { slug: string; values: Values }) {
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setVisible(true), { rootMargin: "200px" });
    io.observe(node);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={el} className="thumb" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {visible &&
        (hover ? (
          <Player
            component={PreviewComposition}
            inputProps={{ slug, values }}
            durationInFrames={DURATION}
            fps={FPS}
            compositionWidth={W}
            compositionHeight={H}
            style={{ width: "100%", height: "100%" }}
            autoPlay
            loop
            controls={false}
            acknowledgeRemotionLicense
          />
        ) : (
          <StillThumb slug={slug} values={values} />
        ))}
    </div>
  );
}
