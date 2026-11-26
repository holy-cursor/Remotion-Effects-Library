import React from "react";
import {
  scene,
  Label,
  Panel,
  Art,
  Bars,
  Check,
  Cursor,
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
} from "./CompletionCore";

export const CursorClick = scene("Cursor Click", ({ p, t, text, props }) => {
  const points = props.points ?? [
      { x: 100, y: 290 },
      { x: 265, y: 200 },
      { x: 380, y: 175 },
    ],
    q = span(p, 0.05, 0.65),
    index = q * Math.max(0, points.length - 1),
    i = Math.min(Math.floor(index), Math.max(0, points.length - 2)),
    a = points[i] ?? { x: 320, y: 180 },
    b = points[i + 1] ?? a,
    f = index - i,
    click = Math.sin(phase(p, 0.65, 0.78) * Math.PI);
  return (
    <g>
      <Panel
        x={220}
        y={142}
        w={200}
        h={76}
        fill={p > 0.72 ? t.secondary : t.accent}
      />
      <Label size={fontSize(text, 24)} color={t.onAccent}>
        {text}
      </Label>
      <g opacity={1 - span(p, 0.88, 1)}>
        <Cursor
          x={mixN(a.x, b.x, f)}
          y={mixN(a.y, b.y, f)}
          color={t.ink}
          press={click}
        />
        <circle
          cx={b.x}
          cy={b.y}
          r={10 + 25 * phase(p, 0.7, 0.9)}
          stroke={t.accent}
          fill="none"
          opacity={Math.sin(phase(p, 0.7, 0.9) * Math.PI)}
        />
      </g>
    </g>
  );
});
export const ButtonPress = scene("Button Press", ({ p, t, text, props }) => {
  const down = span(p, 0.45, 0.56) * (1 - span(p, 0.65, 0.8)),
    whip = props.variant === "whip" ? span(p, 0.8, 1) : 0;
  return (
    <g transform={`translate(${-whip * 800} 0)`}>
      <rect
        x={175}
        y={148}
        width={290}
        height={82}
        rx={22}
        fill="#17120F"
      />
      <g transform={`translate(0 ${9 * down})`}>
        <rect x={175} y={138} width={290} height={82} rx={22} fill={t.accent} />
        <Label y={189} size={fontSize(text, 30)} color={t.onAccent}>
          {text}
        </Label>
      </g>
      <Cursor
        x={mixN(530, 410, out(phase(p, 0, 0.4)))}
        y={mixN(300, 190, out(phase(p, 0, 0.4)))}
        color={t.ink}
        press={down}
      />
    </g>
  );
});
export const LowerThird = scene("Lower Third", ({ p, t, text, props }) => {
  const q = out(phase(p, 0, 0.25)) * (1 - span(p, 0.82, 1));
  return (
    <g opacity={q} transform={`translate(0 ${24 * (1 - q)})`}>
      <rect
        x={42}
        y={242}
        width={440}
        height={78}
        rx={12}
        fill={t.surface}
        fillOpacity={0.88}
        stroke={t.line}
      />
      <rect x={42} y={242} width={5} height={78} rx={2} fill={t.accent} />
      <Label
        x={65}
        y={290}
        anchor="start"
        size={fontSize(text, 31)}
        color={t.ink}
      >
        {text}
      </Label>
    </g>
  );
});
export const InkStamp = scene("Ink Stamp", ({ p, t, text, id, props }) => {
  const q = pop(phase(p, 0.1, 0.5)),
    size = fontSize(text, 38),
    n = 120;
  return (
    <g
      transform={`translate(320 180) rotate(${-7 + (1 - q) * 10}) scale(${Math.max(0.001, mixN(1.8, 1, q))}) translate(-320 -180)`}
      opacity={clamp(q)}
    >
      <defs>
        <mask id={id}>
          <rect width={640} height={360} fill="white" />
          {Array.from({ length: n }, (_, i) => (
            <circle
              key={i}
              cx={120 + hash01(i + (props.seed ?? 9)) * 400}
              cy={120 + hash01(i * 3) * 120}
              r={1 + hash01(i * 5) * 2}
              fill="black"
            />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${id})`}>
        <rect
          x={110}
          y={118}
          width={420}
          height={125}
          rx={5}
          fill="none"
          stroke={t.accent}
          strokeWidth={5}
        />
        <rect
          x={120}
          y={128}
          width={400}
          height={105}
          rx={3}
          fill="none"
          stroke={t.accent}
        />
        <Label y={192} size={size} color={t.accent}>
          {text}
        </Label>
      </g>
    </g>
  );
});
export const SearchJourney = scene("Search Journey", ({p,t,text,props,items}) => {
  const typing=phase(p,.04,.28), results=span(p,.3,.43), click=span(p,.72,.8), selected=Math.min(2,Math.max(0,props.selectedIndex??0));
  return <g>
    <Panel x={30} y={18} w={580} h={324} r={10} fill={t.canvas} stroke={t.line}/>
    <path d="M30 53H610" stroke={t.line}/>
    {[45,57,69].map(x=><circle key={x} cx={x} cy={35} r={3} fill={t.line}/>)}
    <rect x={99} y={26} width={402} height={19} rx={5} fill={t.surface}/><path d="M111 35h5m-2-3v6" stroke={t.ink} strokeWidth={1}/>
    <rect x={128} y={33} width={125} height={4} rx={2} fill={t.line}/>
    <circle cx={69} cy={83} r={13} fill="none" stroke={t.accent} strokeWidth={6}/>
    <rect x={103} y={64} width={407} height={37} rx={18} fill={t.surface} stroke={t.line}/>
    <Label x={122} y={88} anchor="start" size={17} color={t.ink}>{text.slice(0,Math.floor(text.length*typing))}{typing<1?'|':''}</Label>
    <circle cx={484} cy={81} r={6} fill="none" stroke={t.accent} strokeWidth={2}/><path d="M489 86l5 5" stroke={t.accent} strokeWidth={2}/>
    <g opacity={results}>
      {[105,153,206,263].map((x,i)=><rect key={x} x={x} y={115} width={i===0?28:34} height={4} rx={2} fill={i===0?t.accent:t.line}/>)}
      <path d="M103 129H578" stroke={t.line}/><path d="M103 129h32" stroke={t.accent} strokeWidth={2}/>
      {items.slice(0,3).map((item,i)=><g key={i} transform={`translate(0 ${i*62})`}>
        <circle cx={111} cy={148} r={7} fill={t.tertiary}/><rect x={126} y={143} width={86} height={4} rx={2} fill={t.ink} opacity={.55}/><rect x={126} y={151} width={133} height={3} rx={1} fill={t.line}/>
        <Label x={103} y={175} anchor="start" size={17} color={t.accent}>{props.items?item:text}</Label>
        {i===selected&&click>0&&<path d="M103 179H260" stroke={t.accent} opacity={click}/>}
        <rect x={103} y={186} width={355-i*27} height={3} rx={1} fill={t.line}/><rect x={103} y={193} width={285+i*20} height={3} rx={1} fill={t.line}/>
      </g>)}
      <Cursor x={mixN(550,235,span(p,.48,.71))} y={mixN(290,171+selected*62,span(p,.48,.71))} color={t.ink} press={click*(1-span(p,.85,.95))}/>
    </g>
    <rect x={31} y={53} width={578*span(p,.8,1)} height={2} fill={t.accent}/>
  </g>;
});

export const SplitLogo = scene("Split Logo", ({ p, t, id, props, text }) => {
  const draw = out(phase(p, 0, 0.45)),
    join = span(p, 0.2, 0.7),
    paths = props.paths ?? ["M270 110H370V250H270Z"];
  return (
    <g>
      <defs>
        <clipPath id={`${id}-a`}>
          <rect width={640} height={180} />
        </clipPath>
        <clipPath id={`${id}-b`}>
          <rect y={180} width={640} height={180} />
        </clipPath>
      </defs>
      {[0, 1].map((i) => (
        <g key={i} transform={`translate(0 ${(i ? 1 : -1) * 90 * (1 - join)})`}>
          <g clipPath={`url(#${id}-${i ? "b" : "a"})`}>
            {paths.map((d, j) => (
              <path
                key={j}
                d={d}
                stroke={t.accent}
                strokeWidth={4}
                fill={t.accent}
                fillOpacity={span(p, 0.55, 0.85)}
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={1 - draw}
              />
            ))}
          </g>
        </g>
      ))}
      {props.children && (
        <g opacity={span(p, 0.85, 1)}>
          <Art text={text} color={t.onAccent} fill={t.accent}>
            {props.children}
          </Art>
        </g>
      )}
    </g>
  );
});
