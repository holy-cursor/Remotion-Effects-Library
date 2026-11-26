import React from "react";
import {
  scene,
  Label,
  Panel,
  Art,
  Bars,
  Check,
  Waveform,
  clamp,
  phase,
  smooth,
  out,
  pop,
  span,
  mixN,
  fontSize,
  hash01,
  alpha,
  sequence,
  interpolateBox,
} from "./CompletionCore";

export const OrbitBurst = scene(
  "Orbit Burst",
  ({ p, t, text, props, items }) => {
    const burst = span(p, 0.7, 1),
      radius = (props.radius ?? 165) * (1 + burst * 3),
      turn = p * Math.PI * 2;
    return (
      <g>
        {items
          .map((item, i) => {
            const a = (i / Math.max(1, items.length)) * Math.PI * 2 + turn,
              z = Math.sin(a),
              s = 0.65 + (0.25 * (z + 1)) / 2;
            return {
              item,
              i,
              x: 320 + Math.cos(a) * radius,
              y: 180 + z * radius * 0.4,
              s,
              z,
            };
          })
          .sort((a, b) => a.z - b.z)
          .map(({ item, i, x, y, s }) => (
            <g
              key={i}
              transform={`translate(${x} ${y}) scale(${s * (1 + burst)}) translate(-320 -180)`}
              opacity={out(phase(p, 0, 0.18)) * (1 - burst)}
            >
              <Art
                box={{ x: 265, y: 145, width: 110, height: 70 }}
                text={props.items ? item : text}
                color={t.onAccent}
                fill={i % 2 ? t.secondary : t.accent}
              />
            </g>
          ))}
      </g>
    );
  },
);
export const FloatingToken = scene(
  "Floating Token",
  ({ p, t, text, id, props }) => {
    const q = out(phase(p, 0, 0.25)),
      y = 180 + Math.sin(p * 6.28) * (props.amount ?? 16),
      r = props.radius ?? 56;
    return (
      <g opacity={q}>
        <ellipse
          cx={320}
          cy={280}
          rx={70 - Math.sin(p * 6.28) * 10}
          ry={8}
          fill={t.line}
        />
        <g transform={`translate(320 ${y + 90 * (1 - q)})`}>
          <circle
            r={r + 14}
            fill={t.accent}
            opacity={0.08 + 0.08 * Math.sin(p * 6.28)}
          />
          <circle r={r} fill={t.accent} />
          <circle r={r - 8} fill="none" stroke={t.tertiary} strokeWidth={2} />
          <path d="M0 -25L22 0L0 25L-22 0Z" fill={t.onAccent} />
        </g>
      </g>
    );
  },
);
export const CardRise = scene("Card Rise", ({ p, t, text, props, items }) => {
  const q = out(phase(p, 0, 0.5)),
    focus = Math.floor(phase(p, 0.5, 1) * items.length);
  return (
    <g
      transform={`translate(320 ${180 + 290 * (1 - q)}) skewX(${-10 * (1 - q)}) scale(1 ${0.65 + 0.35 * q}) translate(-320 -180)`}
    >
      <Panel
        x={130}
        y={55}
        w={380}
        h={250}
        fill={t.surface}
        stroke={t.accent}
      />
      <Label y={100} size={fontSize(text, 30)} color={t.ink}>
        {text}
      </Label>
      {items.slice(0, 5).map((item, i) => (
        <g key={i}>
          <rect
            x={160}
            y={125 + i * 30}
            width={320}
            height={23}
            rx={5}
            fill={i === Math.min(items.length - 1, focus) ? t.accent : t.line}
          />
          {props.items && (
            <Label
              x={175}
              y={142 + i * 30}
              size={13}
              anchor="start"
              color={i === focus ? t.onAccent : t.ink}
            >
              {item}
            </Label>
          )}
        </g>
      ))}
    </g>
  );
});
export const CardFocus = scene("Card Focus", ({ p, t, text, props, items }) => {
  const q = span(p, 0.25, 0.75),
    selected = Math.max(
      0,
      Math.min(items.length - 1, props.selectedIndex ?? 1),
    );
  const order = items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => (a.i === selected ? 1 : 0) - (b.i === selected ? 1 : 0));
  return (
    <g>
      {order.map(({ item, i }) => {
        const chosen = i === selected,
          x = 100 + (i * 440) / Math.max(1, items.length - 1),
          s = chosen ? mixN(0.6, 1.4, q) : 0.6;
        return (
          <g
            key={i}
            transform={`translate(${chosen ? mixN(x, 320, q) : x} 180) scale(${s}) translate(-320 -180)`}
            opacity={chosen ? 1 : 1 - 0.82 * q}
          >
            <Art
              box={{ x: 230, y: 110, width: 180, height: 140 }}
              text={props.items ? item : text}
              color={t.onAccent}
              fill={t.accent}
            />
            {chosen && (
              <path
                d={`M${180 + 280 * phase(p, 0.65, 0.95)} 110l40 140`}
                stroke={t.tertiary}
                strokeWidth={18}
                opacity={Math.sin(phase(p, 0.65, 0.95) * Math.PI) * 0.4}
              />
            )}
          </g>
        );
      })}
    </g>
  );
});
export const DepthCallouts = scene(
  "Depth Callouts",
  ({ p, t, text, props, items }) => (
    <g>
      {items.slice(0, 6).map((item, i) => {
        const q = sequence(p, i, items.length, 0.55),
          active = Math.min(items.length - 1, Math.floor(p * items.length)),
          s = mixN(0.2, 1, q);
        return (
          <g
            key={i}
            transform={`translate(320 ${75 + i * 43}) scale(${s}) translate(-320 ${-(75 + i * 43)})`}
            opacity={q}
          >
            <rect
              x={130}
              y={55 + i * 43}
              width={380}
              height={35}
              rx={6}
              fill={i === active ? t.accent : t.surface}
              stroke={t.line}
            />
            <Label
              y={79 + i * 43}
              size={20}
              color={i === active ? t.onAccent : t.ink}
            >
              {props.items ? item : text}
            </Label>
          </g>
        );
      })}
    </g>
  ),
);
export const DepthStream = scene(
  "Depth Stream",
  ({ p, t, text, props, items }) => {
    const mode = props.variant ?? "corridor",
      n = Math.max(1, items.length);
    const cards = items
      .map((item, i) => {
        const z = (i / n + p * 0.7) % 1,
          s = 0.25 + z * 0.8;
        return { item, i, z, s };
      })
      .sort((a, b) => a.z - b.z);
    return (
      <g>
        {cards.map(({ item, i, z, s }) => {
          const x =
              mode === "search"
                ? 100 + (i % 3) * 220
                : 320 + (i % 2 ? 1 : -1) * (60 + z * 220),
            y =
              mode === "search"
                ? ((((i * 90 - p * (140 + 50 * (i % 3))) % 420) + 420) % 420) -
                  30
                : 180 + ((i % 3) - 1) * 85 * z;
          return (
            <g
              key={i}
              transform={`translate(${x} ${y}) scale(${s}) translate(-320 -180)`}
              opacity={Math.sin(z * Math.PI) * 0.85}
              style={{
                filter: z < 0.35 ? `blur(${(1 - z) * 2}px)` : undefined,
              }}
            >
              <Panel
                x={225}
                y={125}
                w={190}
                h={110}
                fill={t.surface}
                stroke={t.accent}
              />
              {mode === "mail" ? (
                <path
                  d="M235 137L320 190L405 137"
                  stroke={t.accent}
                  strokeWidth={2}
                  fill="none"
                />
              ) : (
                <>
                  <circle cx={250} cy={150} r={9} fill={t.accent} />
                  <Bars x={270} y={145} w={120} rows={2} color={t.line} />
                </>
              )}
              <Label y={215} size={17} color={t.ink}>
                {props.items ? item : text}
              </Label>
            </g>
          );
        })}
        {mode === "mail" && (
          <g transform={`translate(${-100 + 840 * span(p, .25, .85)} ${210 - 130 * span(p, .25, .85)}) rotate(-12) scale(${.6 + 1.2 * span(p, .25, .85)})`}>
            <path d="M-45 -22L52 0L-45 26L-24 0Z" fill={t.accent} stroke={t.tertiary} strokeWidth={2} strokeLinejoin="round" />
            <path d="M-24 0H52" stroke={t.tertiary} strokeWidth={2} />
          </g>
        )}
      </g>
    );
  },
);
export const PhoneTurn = scene("Phone Turn", ({ p, t, text, props, id }) => {
  const q = smooth(phase(p, .06, .86));
  return <foreignObject x={0} y={0} width={640} height={360}>
    <div style={{width:640,height:360,perspective:900,display:'grid',placeItems:'center'}}>
      <div style={{width:148,height:302,position:'relative',transformStyle:'preserve-3d',transform:`rotateY(${180*(1-q)}deg) rotateZ(${-8*(1-q)}deg)`}}>
        {[false,true].map(back=><svg key={String(back)} viewBox="0 0 148 302" width="148" height="302" style={{position:'absolute',inset:0,backfaceVisibility:'hidden',transform:back?'rotateY(180deg) translateZ(4px)':'translateZ(4px)',filter:'drop-shadow(0 8px 8px #00000035)'}}>
          <defs><linearGradient id={`${id}-metal-${back}`}><stop stopColor="#787B80"/><stop offset=".12" stopColor="#E2E3E5"/><stop offset=".5" stopColor="#595C61"/><stop offset=".92" stopColor="#C4C6C9"/><stop offset="1" stopColor="#45474B"/></linearGradient><clipPath id={`${id}-screen`}><rect x={8} y={8} width={132} height={286} rx={23}/></clipPath></defs>
          <rect x={0} y={64} width={3} height={21} rx={1} fill="#505258"/><rect x={0} y={96} width={3} height={31} rx={1} fill="#505258"/><rect x={145} y={84} width={3} height={42} rx={1} fill="#505258"/>
          <rect x={2} y={1} width={144} height={300} rx={29} fill={`url(#${id}-metal-${back})`}/>
          <rect x={5} y={4} width={138} height={294} rx={26} fill={back?'#24262A':'#08090B'} stroke="#777A80" strokeWidth={.5}/>
          {back?<><rect x={13} y={14} width={66} height={72} rx={17} fill="#35373C" stroke="#66686D"/>{[[31,33],[31,65],[60,49]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={13} fill="#101114" stroke="#8A8C91" strokeWidth={2}/><circle cx={x} cy={y} r={8} fill="#17212C"/><circle cx={x-2} cy={y-2} r={3} fill="#587086" opacity={.65}/></g>)}<circle cx={61} cy={24} r={5} fill="#E4DCC3"/><circle cx={74} cy={165} r={13} fill="#4A4C51"/></>:
          <><g clipPath={`url(#${id}-screen)`}><rect x={8} y={8} width={132} height={286} fill={t.surface}/>{props.children??<><rect x={17} y={61} width={114} height={95} rx={13} fill={t.accent}/><path d="M49 109l18 18 32-39" fill="none" stroke={t.onAccent} strokeWidth={5} strokeLinecap="round"/><rect x={19} y={175} width={78} height={7} rx={3} fill={t.ink}/>{[195,216,237].map(y=><g key={y}><circle cx={25} cy={y} r={5} fill={t.accent}/><rect x={38} y={y-3} width={82} height={6} rx={3} fill={t.line}/></g>)}<text x={74} y={277} textAnchor="middle" fill={t.ink} fontSize={11}>{text}</text></>}</g><rect x={49} y={14} width={50} height={14} rx={7} fill="#08090B"/><circle cx={90} cy={21} r={3} fill="#1B2937"/><path d="M116 34h11v5h-11z" fill={t.ink}/><path d="M108 39v-5m-4 5v-3m-4 3v-2" stroke={t.ink}/><rect x={52} y={286} width={44} height={3} rx={2} fill={t.ink}/></>}
        </svg>)}
        <div style={{position:'absolute',left:70,top:25,width:8,height:252,background:'#74777C',transform:'translateX(74px) rotateY(90deg)',borderRadius:4}}/>
      </div>
    </div>
  </foreignObject>;
});

export const CoinDrop = scene("Coin Drop", ({ p, t, text, props }) => {
  const fall = phase(p, 0.1, 0.56),
    bounce = phase(p, 0.56, 1),
    h =
      bounce === 1
        ? 0
        : Math.abs(Math.sin(bounce * Math.PI * 3)) * Math.exp(-4 * bounce) * 75;
  const y = fall < 1 ? 30 + 230 * fall * fall : 260 - h,
    squash = Math.exp(-(((p - 0.56) / 0.025) ** 2)),
    sx = Math.cos(phase(p, 0.05, 0.54) * Math.PI * 4);
  return (
    <g>
      <ellipse
        cx={320}
        cy={300}
        rx={48 + 20 * (1 - h / 75)}
        ry={7}
        fill={t.line}
      />
      <g
        transform={`translate(320 ${y}) rotate(${(props.amount ?? 360) * fall}) scale(${Math.max(0.08, Math.abs(sx)) * (1 + 0.15 * squash)} ${1 - 0.16 * squash})`}
      >
        <circle r={40} fill={t.accent} />
        <circle r={32} fill="none" stroke={t.tertiary} strokeWidth={2} />
        <path d="M0 -19L17 0L0 19L-17 0Z" fill={t.onAccent} />
      </g>
    </g>
  );
});
export const LogoPair = scene("Logo Pair", ({ p, t, text, props }) => {
  const q = pop(phase(p, 0, 0.6)),
    beat = span(p, 0.55, 0.8);
  return (
    <g>
      <g transform={`translate(${-300 * (1 - q)} 0)`}>
        <Art
          box={{ x: 150, y: 125, width: 130, height: 110 }}
          text={props.items?.[0] ?? text}
          color={t.onAccent}
          fill={t.accent}
        >
          {props.children}
        </Art>
      </g>
      <g transform={`translate(${300 * (1 - q)} 0)`}>
        <Art
          box={{ x: 360, y: 125, width: 130, height: 110 }}
          text={props.items?.[1] ?? text}
          color={t.ink}
          fill={t.tertiary}
        >
          {props.secondary}
        </Art>
      </g>
      <path
        d="M300 180H340M320 160V200"
        stroke={t.accent}
        strokeWidth={3}
        opacity={beat}
      />
    </g>
  );
});
