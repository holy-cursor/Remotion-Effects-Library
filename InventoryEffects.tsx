import React, { useId } from "react";
import { EffectRoot, useEffectProps, type EffectBaseProps, type ResolvedEffect } from "./core/effect";
import { spring01, springs } from "./core/motion";
import { alpha, PALETTES, rolesFor, mix } from "./core/tokens";

/** Fourteen retained adaptations of the original audit. All motion is a pure function of progress.
 * SVG effects use a 600 x 260 viewBox. No clocks or random values.
 * Colours come from design-token roles (core/tokens); `theme` accepts "light" | "dark"
 * or, as before, a partial InventoryTheme object.
 * See review/InventoryReferences.md for audit IDs and differences from older effects.
 */
export type InventoryTheme = {
  ink: string;
  paper: string;
  accent: string;
  secondary: string;
  muted: string;
};
const so = PALETTES["saint-orange"].light;
/** The Saint Orange light values, unchanged from the original release. */
export const inventoryTheme: InventoryTheme = {
  ink: so.ink,
  paper: so.surface,
  accent: so.accent,
  secondary: so.secondary,
  muted: so.line,
};
export type InventoryProps = EffectBaseProps & {
  theme?: "light" | "dark" | Partial<InventoryTheme>;
};
type InvColors = InventoryTheme & { inkMuted: string; shadow: string; canvas: string; onAccent: string; tertiary: string };
type InvFx = ResolvedEffect & { c: InvColors };
function useInv(props: Omit<InventoryProps, "style" | "className">): InvFx {
  const fx = useEffectProps(props);
  const R = fx.roles;
  return {
    ...fx,
    c: {
      ink: R.ink,
      paper: R.surface,
      accent: R.accent,
      secondary: R.secondary,
      muted: R.line,
      inkMuted: R.inkMuted,
      shadow: R.shadow,
      canvas: R.canvas,
      onAccent: R.onAccent,
      tertiary: R.tertiary,
    },
  };
}
const clamp = (p: number) =>
  Math.max(0, Math.min(1, Number.isFinite(p) ? p : 0));
const phase = (p: number, a: number, b: number) => clamp((p - a) / (b - a));
const smooth = (p: number) => {
  const t = clamp(p);
  return t * t * (3 - 2 * t);
};
const out = (p: number) => 1 - (1 - clamp(p)) ** 3;
const outExpo = (p: number) => (p >= 1 ? 1 : 1 - 2 ** (-10 * clamp(p)));
const springPop = (p: number) => spring01(p, springs.snappy);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const uid = (id: string) => "inv" + id.replace(/[^a-zA-Z0-9_-]/g, "");
function Canvas({
  children,
  style,
  label,
  fx,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  label: string;
  fx: InvFx;
}) {
  const id = uid(useId());
  return (
    <EffectRoot fx={fx}>
      <svg
        viewBox="0 0 600 260"
        width="100%"
        height="100%"
        role="img"
        aria-label={label}
        style={{
          display: "block",
          overflow: "hidden",
          fontFamily: fx.font ?? "inherit",
          ...style,
        }}
      >
        <defs>
          <filter id={id + "soft"} x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="9" floodColor={fx.c.shadow} floodOpacity={fx.mode === "dark" ? 0.5 : 0.14} />
          </filter>
        </defs>
        <g style={{ filter: `url(#${id}soft)` }}>{children}</g>
      </svg>
    </EffectRoot>
  );
}
function Cursor({ x, y, color, outline = "#FFFFFE" }: { x: number; y: number; color: string; outline?: string }) {
  return (
    <path
      d="M0 0V26L7 19L13 31L18 28L12 17L23 17Z"
      transform={`translate(${x} ${y})`}
      fill={color}
      stroke={outline}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  );
}
function Tick({
  x,
  y,
  p,
  color,
}: {
  x: number;
  y: number;
  p: number;
  color: string;
}) {
  return (
    <path
      d="M-7 0L-1 6L10 -7"
      transform={`translate(${x} ${y})`}
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      pathLength="1"
      strokeDasharray="1"
      strokeDashoffset={1 - clamp(p)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}
function Envelope({
  x = 0,
  y = 0,
  w = 60,
  h = 40,
  color,
  fill,
}: {
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  color: string;
  fill: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        width={w}
        height={h}
        rx="5"
        fill={fill}
        stroke={color}
        strokeWidth="2"
      />
      <path
        d={`M2 4L${w / 2} ${h * 0.55}L${w - 2} 4`}
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </g>
  );
}

/** E021: expanding layout gap pushes two text runs apart as an object enters. */
export function WordGapInsert({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  left = "Make",
  right = "room.",
  children,
  gap = 100,
}: InventoryProps & {
  left?: string;
  right?: string;
  children?: React.ReactNode;
  gap?: number;
}) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    p = outExpo(phase(progress, 0.15, 0.7)),
    pop = springPop(phase(progress, 0.3, 0.95));
  return (
    <EffectRoot fx={fx}>
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: t.ink,
        fontFamily: fx.font,
        fontSize: 52,
        fontWeight: 650,
        letterSpacing: -2,
        ...style,
      }}
    >
      <span>{left}</span>
      <div
        style={{
          width: Math.max(0, gap) * p,
          height: 100,
          overflow: "hidden",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <div
          style={{
            transform: `translateY(${70 * (1 - pop)}px) rotate(${150 * (1 - pop)}deg) scale(${Math.max(0, pop)})`,
          }}
        >
          {children ?? (
            <svg width="70" height="70" viewBox="0 0 70 70">
              <path
                d="M35 0L43 25L70 35L43 43L35 70L25 43L0 35L25 25Z"
                fill={t.accent}
              />
            </svg>
          )}
        </div>
      </div>
      <span>{right}</span>
    </div>
    </EffectRoot>
  );
}

/** E024: geometric selection turns supplied SVG glyphs from filled to outlined. */
export function GlyphSelection({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  text = "CREATE",
  glyphs,
}: InventoryProps & { text?: string; glyphs?: React.ReactNode }) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    id = uid(useId()),
    p = smooth(phase(progress, 0.15, 0.72)),
    w = 448 * p,
    h = 100 * smooth(phase(progress, 0.15, 0.55));
  const art = glyphs ?? (
    <text
      x="300"
      y="158"
      textAnchor="middle"
      fontSize="82"
      fontWeight="700"
      letterSpacing="-4"
      textLength="420"
      lengthAdjust="spacingAndGlyphs"
    >
      {text}
    </text>
  );
  return (
    <Canvas fx={fx} style={style} label="Glyph selection">
      <defs>
        <clipPath id={id}>
          <rect x="76" y="75" width={w} height={h} />
        </clipPath>
        <mask id={id + "m"}>
          <rect width="600" height="260" fill="white" />
          <rect x="76" y="75" width={w} height={h} fill="black" />
        </mask>
      </defs>
      <g fill={t.ink} mask={`url(#${id}m)`}>
        {art}
      </g>
      <g fill="none" stroke={t.ink} strokeWidth="1.2" clipPath={`url(#${id})`}>
        {art}
      </g>
      {p > 0 && (
        <g>
          <rect
            x="76"
            y="75"
            width={w}
            height={h}
            fill={t.accent}
            fillOpacity=".06"
            stroke={t.accent}
          />
          {[76, 76 + w].flatMap((x) =>
            [75, 75 + h].map((y) => (
              <rect
                key={`${x}-${y}`}
                x={x - 3}
                y={y - 3}
                width="6"
                height="6"
                fill={t.ink}
              />
            )),
          )}
          <text
            x="76"
            y="63"
            fontSize="11"
            fill={t.ink}
            opacity={phase(progress, 0.72, 0.85)}
          >
            VECTOR SELECTION / {Math.round(w)} × {Math.round(h)}
          </text>
        </g>
      )}
      <g opacity={1 - phase(progress, 0.87, 1)}>
        <Cursor x={76 + w} y={75 + h} color={t.ink} />
      </g>
    </Canvas>
  );
}

/** E043: independently timed proof cards tumble from a stack; final card remains. */
export function ProofStackTumble({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  cards = [
    { value: "2B+", label: "Impressions" },
    { value: "50+", label: "Projects" },
    { value: "20", label: "New effects" },
  ],
}: InventoryProps & { cards?: { value: string; label: string }[] }) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    p = clamp(progress),
    n = cards.length;
  return (
    <EffectRoot fx={fx}>
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        perspective: 900,
        overflow: "hidden",
        fontFamily: fx.font,
        ...style,
      }}
    >
      {cards.map((c, i) => {
        const interval = 0.72 / Math.max(1, n - 1),
          fall =
            i === n - 1
              ? 0
              : phase(
                  p,
                  0.2 + i * interval,
                  0.2 + i * interval + Math.min(0.22, interval * 0.8),
                ),
          depth = Math.max(0, i - (n - 1) * phase(p, 0.2, 0.92));
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: "66%",
              height: "65%",
              left: "17%",
              top: "20%",
              borderRadius: 18,
              padding: 22,
              boxSizing: "border-box",
              background: [t.accent, t.paper, t.secondary][i % 3],
              color: [t.onAccent, t.ink, t.onAccent][i % 3],
              boxShadow: `0 18px 40px ${alpha(t.shadow, fx.mode === "dark" ? 0.5 : 0.16)}`,
              zIndex: n - i,
              transformOrigin: "50% 100%",
              transform: `translateY(${-depth * 15 + fall * fall * 450}px) scale(${1 - depth * 0.055}) rotateX(${-fall * 105}deg) rotate(${fall * 12}deg)`,
              opacity: 1 - phase(fall, 0.8, 1),
              border: `1px solid ${alpha(t.muted, 0.9)}`,
            }}
          >
            <div style={{ fontSize: 12, letterSpacing: 2 }}>
              PROOF / {String(i + 1).padStart(2, "0")}
            </div>
            <div
              style={{
                fontSize: 58,
                fontWeight: 650,
                letterSpacing: -3,
                marginTop: 8,
              }}
            >
              {c.value}
            </div>
            <div style={{ fontSize: 17, opacity: 0.85 }}>{c.label}</div>
          </div>
        );
      })}
    </div>
    </EffectRoot>
  );
}


/** E074: drag selection, cycle candidates, lock one, then expand it. */
export function SelectionRoulette({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  items = ["01 / Form", "02 / Type", "03 / Mark"],
  selectedIndex = 2,
}: InventoryProps & { items?: string[]; selectedIndex?: number }) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    p = clamp(progress),
    draw = smooth(phase(p, 0.05, 0.3)),
    expand = smooth(phase(p, 0.72, 0.96)),
    index =
      p < 0.65
        ? Math.floor(phase(p, 0.3, 0.65) * 8) % Math.max(1, items.length)
        : Math.max(0, Math.min(items.length - 1, selectedIndex));
  const w = lerp(280, 510, expand),
    h = lerp(150, 215, expand),
    x = 300 - w / 2,
    y = 130 - h / 2;
  return (
    <Canvas fx={fx} style={style} label="Selection roulette">
      <rect
        x={x}
        y={y}
        width={w * draw}
        height={h * draw}
        fill={t.muted}
        fillOpacity=".28"
        stroke={t.accent}
        strokeWidth="2"
        strokeDasharray={p < 0.65 ? "5 4" : undefined}
      />
      <g opacity={phase(p, 0.29, 0.35)}>
        <circle
          cx="300"
          cy="113"
          r={28 + 12 * expand}
          fill={[t.ink, t.accent, t.secondary][index % 3]}
        />
        <path
          d={index % 2 ? "M280 113H320M300 93V133" : "M280 113L294 127L322 98"}
          fill="none"
          stroke={t.onAccent}
          strokeWidth="4"
        />
        <text
          x="300"
          y={172 + 10 * expand}
          textAnchor="middle"
          fontSize="20"
          fontWeight="600"
          fill={t.ink}
        >
          {items[index] ?? "No candidates"}
        </text>
      </g>
      <g opacity={1 - phase(p, 0.7, 0.85)}>
        <Cursor x={x + w * draw} y={y + h * draw} color={t.ink} />
      </g>
    </Canvas>
  );
}


/** E077: a selected row overtakes others; the displaced rows retain their order. */
export function LeaderboardPromotion({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  items = ["Studio A", "Studio B", "Studio C", "Your studio"],
  fromIndex = 3,
  toIndex = 0,
}: InventoryProps & {
  items?: string[];
  fromIndex?: number;
  toIndex?: number;
}) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    n = items.length,
    from = Math.max(0, Math.min(n - 1, fromIndex)),
    to = Math.max(0, Math.min(n - 1, toIndex)),
    lift = smooth(phase(progress, 0.06, 0.22)) * (1 - smooth(phase(progress, 0.84, 0.98))),
    p = spring01(phase(progress, 0.14, 0.86), springs.soft),
    highlight = phase(progress, 0.08, 0.2),
    rh = Math.min(49, 210 / Math.max(1, n));
  return (
    <Canvas fx={fx} style={style} label="Leaderboard promotion">
      {items
        .map((label, i) => {
          const target =
            i === from
              ? to
              : from > to && i >= to && i < from
                ? i + 1
                : from < to && i > from && i <= to
                  ? i - 1
                  : i;
          const active = i === from;
          const displaced = !active && target !== i;
          const rowP = active ? p : spring01(phase(progress, 0.22 + Math.abs(i - to) * 0.05, 0.8 + Math.abs(i - to) * 0.04), springs.snappy);
          const row = lerp(i, target, rowP);
          const s = active ? 1 + 0.035 * lift : 1;
          const fillRow = active ? t.accent : t.paper;
          const txt = active ? t.onAccent : t.ink;
          const sub = active ? t.onAccent : t.inkMuted;
          return (
            <g
              key={i}
              transform={`translate(${300} ${24 + row * rh + (rh - 5) / 2}) scale(${s}) translate(${-300 + (active ? -6 * lift : 0)} ${-(rh - 5) / 2})`}
              opacity={active || highlight < 1 ? 1 : displaced ? 0.92 : 0.8}
            >
              {active && (
                <rect x="90" width="420" height={rh - 5} rx="10" fill={t.accent} opacity={0.35 * lift} style={{ filter: "blur(10px)" }} />
              )}
              <rect
                x="90"
                width="420"
                height={rh - 5}
                rx="10"
                fill={active ? fillRow : t.paper}
                fillOpacity={active ? highlight : 1}
                stroke={active ? t.accent : t.muted}
              />
              <circle cx="113" cy={(rh - 5) / 2} r={Math.min(13, rh * 0.3)} fill={active ? t.onAccent : t.muted} fillOpacity={active ? 0.22 : 0.7} />
              <text
                x="113"
                y={(rh - 5) / 2 + 5}
                textAnchor="middle"
                fontSize="13"
                fontWeight={650}
                fill={active && highlight > 0.5 ? txt : t.ink}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {Math.round(row) + 1}
              </text>
              <text
                x="140"
                y={(rh - 5) / 2 + 6}
                fontSize="17"
                fontWeight={active ? 650 : 450}
                fill={active && highlight > 0.5 ? txt : t.ink}
              >
                {label}
              </text>
              <text
                x="492"
                y={(rh - 5) / 2 + 5}
                textAnchor="end"
                fontSize="14"
                fill={active && highlight > 0.5 ? sub : t.inkMuted}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {active ? Math.round(420 + 640 * clamp(p)).toLocaleString("en-US") : (1000 - i * 140).toLocaleString("en-US")}
              </text>
              {active && (
                <path
                  d={`M${470 - 6} ${(rh - 5) / 2 + 4}l6 -7l6 7`}
                  fill="none"
                  stroke={sub}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="translate(-58 -1)"
                  opacity={highlight * (1 - 0.6 * phase(progress, 0.9, 1))}
                />
              )}
            </g>
          );
        })
        .sort(
          (a, b) =>
            Number(a.key === String(from)) - Number(b.key === String(from)),
        )}
    </Canvas>
  );
}


/** E084: form contracts into an envelope, seals and departs. */
export function FormSendFlight({ recipient = "hello@studio.co", message = "Let's make something great.", sendLabel = "Send", sentLabel = "Sent", style, ...props
}: InventoryProps & {recipient?: string; message?: string; sendLabel?: string; sentLabel?: string}) {
  const fx = useInv(props), t = fx.c, p = fx.t;
  const collapse = smooth(phase(p, .38, .56)), fold = smooth(phase(p, .56, .67));
  const fly = phase(p, .70, .88), done = out(phase(p, .87, .97));
  const w = lerp(410, 156, collapse), h = lerp(216, 96, collapse);
  const x = 300 + 430*fly*fly, y = 130 - 235*fly*fly;
  const content = 1 - smooth(phase(p, .38, .46));
  const press = Math.sin(phase(p, .31, .38)*Math.PI);
  const lines = message.match(/.{1,32}(?:\s|$)|.{1,32}/g) ?? [];
  return <Canvas fx={fx} style={style} label="Form folds into an envelope and sends">
    <g transform={`translate(${x} ${y}) rotate(${-18*fly})`} opacity={1-phase(p,.87,.90)}>
      <rect x={-w/2} y={-h/2} width={w} height={h} rx={lerp(14,6,collapse)} fill={t.paper} stroke={t.accent} strokeWidth={2} />
      <g opacity={content}>
        <text x={-181} y={-72} fontSize={12} fill={t.inkMuted}>TO</text>
        <text x={-150} y={-72} fontSize={14} fill={t.ink}>{recipient.slice(0,42)}</text>
        <path d="M-181 -55H181" stroke={t.muted} />
        {lines.slice(0,2).map((line,i) => <text key={i} x={-181} y={-25+i*23} fontSize={17} fill={t.ink}>{line.slice(0,Math.ceil(phase(p,.04,.28)*line.length))}</text>)}
        <g transform={`translate(126 ${68+press*3}) scale(${1-.06*press})`}>
          <rect x={-55} y={-18} width={110} height={36} rx={8} fill={t.accent} />
          <text textAnchor="middle" y={5} fill={t.onAccent} fontSize={14}>{sendLabel}</text>
        </g>
      </g>
      <g opacity={smooth(phase(p,.49,.56))}>
        <path d={`M${-w/2} ${h/2}L0 0L${w/2} ${h/2}`} fill={t.muted} stroke={t.accent} strokeWidth={1.5} />
        <path d={`M${-w/2} ${-h/2}L0 ${lerp(-h/2,12,fold)}L${w/2} ${-h/2}Z`} fill={t.accent} stroke={t.accent} strokeWidth={2} strokeLinejoin="round" />
      </g>
    </g>
    <g opacity={done} transform={`translate(300 ${130+8*(1-done)})`}>
      <circle cy={-10} r={23} fill={t.accent} />
      <Tick x={0} y={-10} p={done} color={t.onAccent} />
      <text y={40} textAnchor="middle" fontSize={24} fontWeight={600} fill={t.ink}>{sentLabel}</text>
    </g>
  </Canvas>;
}

/** E086: timed cards land behind a folder rim, producing contact pulses. */
export function FolderCatch({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  count = 5,
  label = "Inbox",
}: InventoryProps & { count?: number; label?: string }) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    n = Math.max(1, Math.min(24, Math.round(count))),
    p = clamp(progress);
  let hits = 0,
    pulse = 0;
  const cards = Array.from({ length: n }, (_, i) => {
    const a = 0.02 + (i * 0.48) / n,
      q = phase(p, a, a + 0.3);
    if (q >= 0.82) hits++;
    pulse += Math.max(0, 1 - Math.abs(q - 0.84) * 10);
    return (
      <g
        key={i}
        opacity={q > 0 && q < 1 ? 1 : 0}
        transform={`translate(${lerp(130 + (i % 3) * 165, 300, out(q))} ${lerp(-50, 205, q * q)}) rotate(${(1 - q) * (i % 2 ? 24 : -24)})`}
      >
        <Envelope x={-38} y={-24} w={76} h={48} color={t.ink} fill={t.paper} />
      </g>
    );
  });
  return (
    <Canvas fx={fx} style={style} label="Mail lands in folder">
      <path
        d="M180 114V96Q180 88 190 88H255L274 108H410Q420 108 420 118V225H180Z"
        fill={t.muted}
        stroke={t.accent}
      />
      {cards}
      <g transform={`translate(0 ${Math.min(4, pulse * 3)})`}>
        <path d="M172 137H428L413 231H187Z" fill={t.accent} />
        <text
          x="300"
          y="179"
          textAnchor="middle"
          fill={t.onAccent}
          fontSize="24"
          fontWeight="600"
        >
          {label}
        </text>
        <text x="300" y="209" textAnchor="middle" fill={t.onAccent} fontSize="15">
          {hits} / {n}
        </text>
      </g>
    </Canvas>
  );
}


/** E091: sent/delivered/seen checks, followed by expansion of the message body. */
export function DeliveryStatus({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  subject = "Your next project",
  body = ["Everything is ready.", "Let’s bring the idea to life."],
  labels = ["Sent", "Delivered", "Seen"],
}: InventoryProps & {
  subject?: string;
  body?: string[];
  labels?: [string, string, string];
}) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    p = clamp(progress),
    expand = smooth(phase(p, 0.7, 0.98));
  return (
    <Canvas fx={fx} style={style} label="Delivery status and body expansion">
      <rect
        x="92"
        y="42"
        width="416"
        height={92 + 105 * expand}
        rx="13"
        fill={t.paper}
        stroke={t.muted}
        strokeWidth="2"
      />
      <text x="115" y="72" fill={t.ink} fontSize="21" fontWeight="600">
        {subject}
      </text>
      {labels.map((l, i) => {
        const q = out(phase(p, 0.08 + i * 0.25, 0.22 + i * 0.25));
        return (
          <g key={i}>
            <circle
              cx={129 + i * 130}
              cy="108"
              r="12"
              fill={q > 0 ? t.accent : t.muted}
            />
            <Tick x={129 + i * 130} y={108} p={q} color={t.onAccent} />
            <text
              x={149 + i * 130}
              y="113"
              fontSize="13"
              fill={t.ink}
              opacity={0.35 + 0.65 * q}
            >
              {l}
            </text>
          </g>
        );
      })}
      <g opacity={expand}>
        <path d="M115 139H485" stroke={t.muted} />
        {body.map((line, i) => (
          <text key={i} x="115" y={164 + i * 24} fill={t.ink} fontSize="15">
            {line}
          </text>
        ))}
      </g>
    </Canvas>
  );
}

export type CandleDatum = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};
const exampleCandles: CandleDatum[] = Array.from({ length: 25 }, (_, i) => {
  const o = 40 + i * 1.6 + Math.sin(i * 1.1) * 5,
    c = 40 + (i + 1) * 1.6 + Math.sin((i + 1) * 1.1) * 5;
  return {
    open: o,
    close: c,
    high: Math.max(o, c) + 3,
    low: Math.min(o, c) - 3,
    volume: 10 + ((i * 13) % 28),
  };
});
/** E095: supplied OHLC data, candle-by-candle draw, live price and volume HUD. */
export function CandlestickHUD({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  data = exampleCandles,
}: InventoryProps & { data?: CandleDatum[] }) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    p = clamp(progress),
    n = data.length,
    lo = n ? Math.min(...data.map((d) => d.low)) : 0,
    hi = n ? Math.max(...data.map((d) => d.high)) : 1,
    y = (v: number) => 205 - ((v - lo) / Math.max(1e-8, hi - lo)) * 144,
    step = 496 / Math.max(1, n),
    cursor = Math.min(n - 1, Math.floor(p * n)),
    active = data[cursor];
  return (
    <Canvas fx={fx} style={style} label="Candlestick chart">
      <path
        d="M50 60V210H550M50 110H550M50 160H550"
        stroke={t.muted}
        fill="none"
      />
      {data.map((d, i) => {
        const q = clamp(p * n - i),
          x = 50 + step * (i + 0.5),
          close = lerp(d.open, d.close, q),
          col = d.close >= d.open ? t.accent : t.ink;
        return (
          <g key={i} opacity={q > 0 ? 1 : 0}>
            <path
              d={`M${x} ${lerp(y(d.open), y(d.high), q)}V${lerp(y(d.open), y(d.low), q)}`}
              stroke={col}
              strokeWidth="1.3"
            />
            <rect
              x={x - step * 0.28}
              y={Math.min(y(d.open), y(close))}
              width={step * 0.56}
              height={Math.max(1, Math.abs(y(d.open) - y(close)))}
              fill={col}
            />
            <rect
              x={x - step * 0.28}
              y={244 - (d.volume ?? 10) * 0.5 * q}
              width={step * 0.56}
              height={(d.volume ?? 10) * 0.5 * q}
              fill={col}
              opacity=".35"
            />
          </g>
        );
      })}
      <text x="50" y="31" fontSize="14" fill={t.ink}>
        {active && p > 0
          ? `O ${active.open.toFixed(1)}   H ${active.high.toFixed(1)}   L ${active.low.toFixed(1)}   C ${lerp(active.open, active.close, clamp(p * n - cursor)).toFixed(1)}`
          : "OHLC / awaiting first candle"}
      </text>
    </Canvas>
  );
}

const exampleSeries = [
  28, 34, 31, 40, 38, 45, 42, 56, 50, 63, 58, 72, 68, 74, 69, 82, 78, 91,
];
/** E097: partial series path with interpolated tip, camera tracking and fixed HUD. */
export function TrackingLineChart({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  values = exampleSeries,
  format = (v: number) => v.toFixed(1),
}: InventoryProps & { values?: number[]; format?: (value: number) => string }) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    p = clamp(progress),
    id = uid(useId()),
    n = values.length,
    lo = n ? Math.min(...values) : 0,
    hi = n ? Math.max(...values) : 1,
    point = (i: number) => ({
      x: 60 + (i * 900) / Math.max(1, n - 1),
      y: 210 - (150 * ((values[i] ?? 0) - lo)) / Math.max(1e-8, hi - lo),
    }),
    position = p * Math.max(0, n - 1),
    i = Math.floor(position),
    a = point(i),
    b = point(Math.min(n - 1, i + 1)),
    x = lerp(a.x, b.x, position - i),
    y = lerp(a.y, b.y, position - i),
    pan = Math.max(0, x - 420),
    points = Array.from({ length: Math.min(n, i + 1) }, (_, j) => point(j)),
    d =
      points.map((pt, j) => `${j ? "L" : "M"}${pt.x} ${pt.y}`).join(" ") +
      (points.length ? `L${x} ${y}` : "");
  const current = n ? lerp(values[i], values[Math.min(n - 1, i + 1)], position - i) : 0;
  const first = n ? values[0] : 0;
  const delta = first ? ((current - first) / Math.abs(first)) * 100 : 0;
  const pulse = 0.5 + 0.5 * Math.sin(p * Math.PI * 10);
  return (
    <Canvas fx={fx} style={style} label="Tracking line chart">
      <defs>
        <clipPath id={id}>
          <rect x="40" y="52" width="520" height="175" />
        </clipPath>
        <linearGradient id={id + "area"} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.accent} stopOpacity=".28" />
          <stop offset="1" stopColor={t.accent} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id + "fade"} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".12" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="1" />
        </linearGradient>
        <mask id={id + "m"}>
          <rect x="40" y="52" width="520" height="175" fill={`url(#${id}fade)`} />
        </mask>
      </defs>
      <g clipPath={`url(#${id})`} mask={`url(#${id}m)`}>
        <g transform={`translate(${-pan} 0)`}>
          {Array.from({ length: 13 }, (_, j) => (
            <path key={j} d={`M${60 + j * 80} 52V225`} stroke={t.muted} strokeDasharray="2 4" />
          ))}
          {[70, 120, 170, 220].map((v) => (
            <path key={v} d={`M0 ${v}H1000`} stroke={t.muted} />
          ))}
          {n > 0 && (
            <>
              <path d={`${d}L${x} 225L60 225Z`} fill={`url(#${id}area)`} />
              <path d={d} stroke={t.accent} fill="none" strokeWidth="8" opacity=".18" strokeLinejoin="round" style={{ filter: "blur(4px)" }} />
              <path d={d} stroke={t.accent} fill="none" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              <path d={`M${x} ${y}V225`} stroke={t.accent} strokeDasharray="3 4" opacity=".45" />
              <circle cx={x} cy={y} r={9 + 6 * pulse} fill={t.accent} opacity={0.18 * (1 - pulse) + 0.06} />
              <circle cx={x} cy={y} r="6" fill={t.paper} stroke={t.accent} strokeWidth="3" />
            </>
          )}
        </g>
      </g>
      <g>
        <circle cx="48" cy="27" r="4" fill={t.accent} opacity={0.5 + 0.5 * pulse} />
        <text x="60" y="32" fontSize="13" letterSpacing="2" fill={t.inkMuted}>
          LIVE SERIES
        </text>
      </g>
      <text x="556" y="34" textAnchor="end" fontSize="26" fontWeight="650" fill={t.ink} style={{ fontVariantNumeric: "tabular-nums" }}>
        {n ? format(current) : "No data"}
      </text>
      {n > 1 && (
        <text x="556" y="50" textAnchor="end" fontSize="12" fill={delta >= 0 ? t.accent : t.inkMuted} style={{ fontVariantNumeric: "tabular-nums" }}>
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
        </text>
      )}
    </Canvas>
  );
}

/** E099: every arriving token increments the counter and the pot fill together. */
export function TokenPotFill({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  amounts = [10, 15, 10, 20, 15, 30],
  format = (v: number) => String(v),
}: InventoryProps & { amounts?: number[]; format?: (v: number) => string }) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    p = clamp(progress),
    total = amounts.reduce((s, v) => s + Math.max(0, v), 0);
  let value = 0;
  const coins = amounts.map((v, i) => {
    const start = 0.02 + (i * 0.54) / Math.max(1, amounts.length),
      q = phase(p, start, start + 0.28),
      arrival = phase(q, 0.94, 1);
    value += Math.max(0, v) * arrival;
    const x = lerp(i % 2 ? 520 : 80, 300, q),
      y = lerp(50, 158, q) - Math.sin(q * Math.PI) * 53;
    return (
      <g
        key={i}
        opacity={q > 0 && q < 1 ? 1 : 0}
        transform={`translate(${x} ${y}) rotate(${q * 240})`}
      >
        <circle r="15" fill={t.secondary} stroke={t.ink} />
        <path d="M-5 0H5M0 -6V6" stroke={t.ink} strokeWidth="2" />
      </g>
    );
  });
  const fill = total ? value / total : 0;
  return (
    <Canvas fx={fx} style={style} label="Token pot fill">
      <rect
        x="216"
        y="78"
        width="168"
        height="151"
        rx="17"
        fill={t.paper}
        stroke={t.accent}
        strokeWidth="2"
      />
      <rect
        x="226"
        y={219 - 129 * fill}
        width="148"
        height={129 * fill}
        rx="8"
        fill={t.accent}
        opacity=".32"
      />
      {coins}
      <path
        d="M209 79H391"
        stroke={t.ink}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <text
        x="300"
        y="178"
        textAnchor="middle"
        fontSize="38"
        fontWeight="650"
        fill={t.ink}
      >
        {format(value)}
      </text>
      <text x="300" y="204" textAnchor="middle" fontSize="12" fill={t.ink}>
        ACCUMULATED
      </text>
    </Canvas>
  );
}

/** E103: sequential time segments followed by an explicitly two-point rise. */
export type TimelineSegment = { label: string; color?: string };
export type TimelineRiseProps = InventoryProps & {
  labels?: string[]; segments?: TimelineSegment[]; increase?: number;
  fromValue?: number; toValue?: number; unit?: string;
  showSegments?: boolean; showAxes?: boolean; showArea?: boolean; showValue?: boolean;
  riseStart?: number; riseEnd?: number; segmentEnd?: number;
  chartHeight?: number; lineWidth?: number;
  format?: (value: number) => string;
};
/** Standalone SVG timeline rail; compose it inside any SVG viewBox. */
export function TimelineSegments({ progress, segments, x = 70, y = 35, width = 460, color = "#FB7501", muted = "#F6E7C1", ink = "#FB4001" }: {
  progress: number; segments: TimelineSegment[]; x?: number; y?: number; width?: number; color?: string; muted?: string; ink?: string;
}) {
  const cell = width / Math.max(1, segments.length), gap = Math.min(9, cell * .15);
  return <g transform={`translate(${x} ${y})`}>{segments.map((segment, i) => {
    const q = out(clamp(progress * segments.length - i));
    return <g key={i} transform={`translate(${i * cell} 0)`}>
      <rect width={Math.max(0, cell - gap)} height={10} rx={3} fill={muted} />
      <rect width={Math.max(0, cell - gap) * q} height={10} rx={3} fill={segment.color ?? color} />
      <text y={31} fontSize={12} fill={ink}>{segment.label}</text>
    </g>;
  })}</g>;
}
/** Standalone SVG growth plot, independent of the timeline rail. */
export function RisePlot({ progress, fromValue = 0, toValue = 86, x = 70, y = 219, width = 460, height = 100, color = "#FB7501", muted = "#F6E7C1", ink = "#FB4001", lineWidth = 4, showAxes = true, showArea = true }: {
  progress: number; fromValue?: number; toValue?: number; x?: number; y?: number; width?: number; height?: number; color?: string; muted?: string; ink?: string; lineWidth?: number; showAxes?: boolean; showArea?: boolean;
}) {
  const q = smooth(progress), descending = toValue < fromValue;
  const startY = descending ? y - height : y, endY = toValue === fromValue ? startY : descending ? y : y - height;
  const tipX = x + width * q, tipY = lerp(startY, endY, q);
  return <g>
    {showAxes && <path d={`M${x} ${y-height}V${y}H${x+width}`} stroke={muted} fill="none" />}
    {showArea && <path d={`M${x} ${y}V${startY}L${tipX} ${tipY}V${y}Z`} fill={color} opacity={.12} />}
    <path d={`M${x} ${startY}L${tipX} ${tipY}`} stroke={color} strokeWidth={lineWidth} fill="none" strokeLinecap="round" />
    <path d={`M${tipX} ${tipY}V${y}`} stroke={color} opacity={.3} strokeDasharray="3 5" />
    <circle cx={tipX} cy={tipY} r={5} fill={ink} />
  </g>;
}
export function TimelineRise({ labels = ["Year 1", "Year 2", "Year 3", "Year 4"], segments, increase = 86,
  fromValue = 0, toValue, unit = "%", showSegments = true, showAxes = true, showArea = true, showValue = true,
  riseStart = .48, riseEnd = .96, segmentEnd = .45, chartHeight = 100, lineWidth = 4, format, style, ...props
}: TimelineRiseProps) {
  const fx = useInv(props), t = fx.c, end = toValue ?? increase;
  const q = phase(fx.t, riseStart, Math.max(riseStart + .001, riseEnd));
  const value = lerp(fromValue, end, smooth(q));
  return <Canvas fx={fx} style={style} label="Timeline rise">
    {showSegments && <TimelineSegments progress={clamp(fx.t / Math.max(.001, segmentEnd))} segments={segments ?? labels.map(label => ({label}))} color={t.accent} muted={t.muted} ink={t.ink} />}
    <RisePlot progress={q} fromValue={fromValue} toValue={end} height={Math.max(10, Math.min(showSegments ? 110 : 165, chartHeight))} color={t.accent} muted={t.muted} ink={t.ink} lineWidth={lineWidth} showAxes={showAxes} showArea={showArea} />
    {showValue && <text x={530} y={showSegments ? 100 : 45} textAnchor="end" fill={t.ink} fontSize={30} fontWeight={600}>{format ? format(value) : `${value >= 0 ? "+" : ""}${Math.round(value)}${unit}`}</text>}
  </Canvas>;
}


/** E109: accelerated fall, contact squash, rebound and settle, anchored at the floor. */
export function LogoLanding({
  progress: rawProgress,
  theme,
  style,
  palette,
  accent,
  fontFamily,
  background,
  scale,
  speed,
  delay,
  grain,
  grid,
  tokens,
  children,
}: InventoryProps & { children?: React.ReactNode }) {
  const fx = useInv({ progress: rawProgress, theme, palette, accent, fontFamily, background, scale, speed, delay, grain, grid, tokens });
  const progress = fx.t;
  const t = fx.c,
    p = clamp(progress),
    fall = phase(p, 0.07, 0.38),
    rebound = phase(p, 0.38, 0.84),
    impact =
      p < 0.38 ? 0 : Math.sin(rebound * 4 * Math.PI) * Math.exp(-rebound * 6),
    y = p < 0.38 ? -220 * (1 - fall * fall) : -Math.abs(impact) * 40,
    sx = p < 0.38 ? 0.84 : 1 + 0.28 * impact,
    sy = p < 0.38 ? 1.18 : 1 - 0.24 * impact,
    contact = p < 0.38 ? fall * fall : 1 - Math.abs(impact) * 0.6;
  return (
    <EffectRoot fx={fx}>
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "79%",
          width: 150 * (0.4 + 0.6 * contact),
          height: 16,
          transform: "translate(-50%,-50%)",
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${alpha(t.shadow, fx.mode === "dark" ? 0.6 : 0.28)}, transparent)`,
          opacity: 0.2 + 0.8 * contact,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "18%",
          right: "18%",
          top: "79%",
          height: 1,
          background: t.muted,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "79%",
          transform: "translate(-50%,-100%)",
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            transformOrigin: "50% 100%",
            transform: `translateY(${y}px) scale(${sx},${sy})`,
          }}
        >
          {children ?? (
            <svg width="120" height="120" viewBox="0 0 120 120">
              <rect
                x="4"
                y="4"
                width="112"
                height="112"
                rx="25"
                fill={t.accent}
              />
              <path
                d="M35 78V42L60 66L85 42V78"
                fill="none"
                stroke={t.onAccent}
                strokeWidth="9"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
    </EffectRoot>
  );
}

/** E123: browser shell resolves into a device; dark/network condition rows follow. */
export type DeviceSize = { width: number; height: number; radius?: number };
export type DeviceCondition = { label: string; at?: number; passed?: boolean };
export type DeviceConditionsProps = InventoryProps & {
  labels?: string[]; conditions?: DeviceCondition[]; fromDevice?: DeviceSize; toDevice?: DeviceSize;
  morphStart?: number; morphEnd?: number; checksStart?: number;
  showConditions?: boolean; darkScreen?: boolean;
  children?: React.ReactNode;
};
/** A responsive device shell. Children fill its screen and resize with the shell. */
export function DeviceFrame({ width, height, radius = 16, color = "#FB7501", surface = "#FFFFFE", children }: DeviceSize & {color?: string; surface?: string; children?: React.ReactNode}) {
  return <div style={{width, height, borderRadius: radius, border: `2px solid ${color}`, background: surface, padding: 12, boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", gap: 14}}>
    <div style={{display: "flex", gap: 4}}>{[0,1,2].map(i => <span key={i} style={{width: 4, height: 4, borderRadius: "50%", background: color}} />)}</div>
    <div style={{flex: 1, minHeight: 0, overflow: "hidden"}}>{children}</div>
    <div style={{width: 30, height: 3, borderRadius: 3, background: color, alignSelf: "center"}} />
  </div>;
}
/** Independent SVG checklist with per-row timing and passed/failed states. */
export function ConditionChecklist({ progress, conditions, x = 325, y = 100, color = "#FB7501", ink = "#FB4001", onAccent = "#FFFFFE", start = .64 }: {
  progress: number; conditions: DeviceCondition[]; x?: number; y?: number; color?: string; ink?: string; onAccent?: string; start?: number;
}) {
  const spacing = Math.min(46, 160 / Math.max(1, conditions.length));
  return <g transform={`translate(${x} ${y})`}>{conditions.map((condition, i) => {
    const at = condition.at ?? start + i * Math.max(0, .9-start) / Math.max(1, conditions.length);
    const q = out(phase(progress, at, at + .09));
    return <g key={i} opacity={q} transform={`translate(${12*(1-q)} ${i*spacing})`}>
      <circle r={10} fill={color} />
      {condition.passed === false ? <path d="M-3 -3L3 3M3 -3L-3 3" stroke={onAccent} strokeWidth={2} /> : <Tick x={0} y={0} p={q} color={onAccent} />}
      <text x={22} y={5} fill={ink} fontSize={15}>{condition.label}</text>
    </g>;
  })}</g>;
}
export function DeviceConditions({ labels = ["Dark mode", "Slow network"], conditions,
  fromDevice = {width:390, height:192, radius:10}, toDevice = {width:140, height:226, radius:23},
  morphStart = .24, morphEnd = .58, checksStart = .64, showConditions = true, darkScreen = true, children, style, ...props
}: DeviceConditionsProps) {
  const fx = useInv(props), t = fx.c;
  const q = smooth(phase(fx.t, morphStart, Math.max(morphStart+.001, morphEnd)));
  const rows = conditions ?? labels.map(label => ({label}));
  const checks = showConditions && rows.length > 0;
  const shift = checks ? smooth(phase(fx.t, morphStart, Math.max(morphStart+.001, morphEnd))) : 0;
  const w = Math.max(60, Math.min(550-270*shift, lerp(fromDevice.width, toDevice.width, q)));
  const h = Math.max(80, Math.min(240, lerp(fromDevice.height, toDevice.height, q)));
  const center = lerp(300, 170, shift);
  const dark = darkScreen ? smooth(phase(fx.t, checksStart, checksStart + .12)) : 0;
  const surface = mix(t.paper, rolesFor(fx.palette, "dark").surface, dark);
  return <Canvas fx={fx} style={style} label="Device conditions">
    <foreignObject x={center-w/2} y={130-h/2} width={w} height={h}>
      <DeviceFrame width={w} height={h} radius={lerp(fromDevice.radius ?? 10, toDevice.radius ?? 23, q)} color={t.accent} surface={surface}>
        {children ?? <div style={{display: "flex", flexDirection: "column", gap: 12}}><div style={{height: 52, borderRadius: 6, background: t.accent}} />{[1,1,.6].map((v,i) => <div key={i} style={{width: `${v*100}%`, height: 6, borderRadius: 3, background: t.muted}} />)}</div>}
      </DeviceFrame>
    </foreignObject>
    {checks && <ConditionChecklist progress={fx.t} conditions={rows} start={checksStart} y={130 - Math.min(46,160/rows.length)*(rows.length-1)/2} color={t.accent} ink={t.ink} onAccent={t.onAccent} />}
  </Canvas>;
}

export const INVENTORY_ADDITIONS = [
  { id: "E021", name: "Word Gap Insert", component: WordGapInsert },
  { id: "E024", name: "Glyph Selection", component: GlyphSelection },
  { id: "E043", name: "Proof Stack Tumble", component: ProofStackTumble },
  { id: "E074", name: "Selection Roulette", component: SelectionRoulette },
  {
    id: "E077",
    name: "Leaderboard Promotion",
    component: LeaderboardPromotion,
  },
  { id: "E084", name: "Form Send Flight", component: FormSendFlight },
  { id: "E086", name: "Folder Catch", component: FolderCatch },
  { id: "E091", name: "Delivery Status", component: DeliveryStatus },
  { id: "E095", name: "Candlestick HUD", component: CandlestickHUD },
  { id: "E097", name: "Tracking Line Chart", component: TrackingLineChart },
  { id: "E099", name: "Token Pot Fill", component: TokenPotFill },
  { id: "E103", name: "Timeline Rise", component: TimelineRise },
  { id: "E109", name: "Logo Landing", component: LogoLanding },
  { id: "E123", name: "Device Conditions", component: DeviceConditions },
] as const;
