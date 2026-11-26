import React from "react";
import {
  scene,
  Label,
  Panel,
  Art,
  Bars,
  Cursor,
  Check,
  clamp,
  phase,
  smooth,
  out,
  pop,
  span,
  mixN,
  fontSize,
  alpha,
  interpolateBox,
  Waveform,
  diamond,
} from "./CompletionCore";

// Landmarks live in world coordinates, so the entire set follows the camera.
const CameraSet = ({color, accent}: {color: string; accent: string}) => <g>
  <path d="M-640 45H1280M-640 315H1280M45 -360V720M595 -360V720" fill="none" stroke={color} strokeWidth={2}/>
  {[-160,65,500,735].map((x,i)=><g key={x}><rect x={x} y={i%2?230:65} width={75} height={60} rx={8} fill="none" stroke={accent} strokeWidth={2}/><circle cx={x+38} cy={i%2?260:95} r={9} fill={color}/></g>)}
  <path d="M130 330h380M180 22h280" stroke={color} strokeWidth={3}/>
</g>;

export const CameraMove = scene("Camera Move", ({ p, t, text, props }) => {
  const q = smooth(p),
    a = props.from ?? { x: -90, y: 25, width: 1.8, height: 1.8 },
    b = props.to ?? { x: 0, y: 0, width: 1, height: 1 };
  return (
    <g
      transform={`translate(${320 + mixN(a.x, b.x, q)} ${180 + mixN(a.y, b.y, q)}) rotate(${(props.amount ?? 15) * (1 - q)}) scale(${mixN(a.width, b.width, q)} ${mixN(a.height, b.height, q)}) translate(-320 -180)`}
    >
      <CameraSet color={t.line} accent={t.secondary}/>
      <Art text={text} color={t.onAccent} fill={t.accent}>
        {props.children}
      </Art>
    </g>
  );
});
export const FadeEnvelope = scene("Fade Envelope", ({ p, t, text, props }) => (
  <g opacity={out(phase(p, 0, 0.2)) * (1 - span(p, 0.75, 1))}>
    <Art text={text} color={t.onAccent} fill={t.accent}>
      {props.children}
    </Art>
  </g>
));
export const WorldSlide = scene("World Slide", ({ p, t, text, props }) => {
  const q = span(p, 0.15, 0.9),
    horizontal = props.orientation === "horizontal";
  return (
    <g
      transform={`translate(${horizontal ? -640 * q : 0} ${horizontal ? 0 : -360 * q})`}
    >
      <Art
        box={{ x: 0, y: 0, width: 640, height: 360, radius: 0 }}
        text={text}
        color={t.onAccent}
        fill={t.accent}
      >
        {props.children}
      </Art>
      <g
        transform={`translate(${horizontal ? 640 : 0} ${horizontal ? 0 : 360})`}
      >
        <Art
          box={{ x: 0, y: 0, width: 640, height: 360, radius: 0 }}
          text={text}
          color={t.ink}
          fill={t.tertiary}
        >
          {props.secondary}
        </Art>
      </g>
    </g>
  );
});
export const GlyphZoom = scene("Glyph Zoom", ({ p, t, text, props }) => {
  const q = span(p, 0.2, 0.9),
    scale = Math.exp(q * 5.8),
    glyph = props.items?.[0] ?? "O";
  return (
    <g>
      <rect width={640} height={360} fill={t.accent} />
      <g
        transform={`translate(320 180) scale(${scale}) translate(${-320 - 55 * q} -180)`}
      >
        <CameraSet color={t.tertiary} accent={t.surface}/>
        <Label y={225} size={160} color={t.surface}>
          {glyph}
        </Label>
      </g>
      <g opacity={span(p, 0.82, 1)}>
        <Art
          box={{ x: 0, y: 0, width: 640, height: 360, radius: 0 }}
          text={text}
          color={t.ink}
          fill={t.surface}
        >
          {props.children}
        </Art>
      </g>
    </g>
  );
});
export const CardExpand = scene("Card Expand", ({ p, t, text, props }) => {
  const q = span(p, 0.2, 0.86),
    box = interpolateBox(
      props.from ?? { x: 215, y: 115, width: 210, height: 130, radius: 16 },
      props.to ?? { x: 0, y: 0, width: 640, height: 360, radius: 0 },
      q,
    );
  return (
    <g
      transform={`rotate(${(props.amount ?? -9) * (1 - q)} ${box.x + box.width / 2} ${box.y + box.height / 2})`}
    >
      <Art box={box} text={text} color={t.onAccent} fill={t.accent}>
        {props.children}
      </Art>
    </g>
  );
});
export const FormFlip = scene("Form Flip", ({ p, t, text, props }) => {
  const q = span(p, 0.35, 0.75),
    sx = Math.cos(q * Math.PI),
    back = q > 0.5;
  return (
    <g
      transform={`translate(320 180) scale(${Math.abs(sx)} 1) translate(-320 -180)`}
    >
      <Panel
        x={145}
        y={65}
        w={350}
        h={230}
        fill={back ? t.accent : t.surface}
        stroke={t.accent}
      />
      {back ? (
        <g>
          <Check
            x={320}
            y={145}
            p={phase(p, 0.62, 0.84)}
            size={28}
            color={t.onAccent}
          />
          <Label y={215} size={fontSize(text, 28)} color={t.onAccent}>
            {text}
          </Label>
        </g>
      ) : (
        <g>
          <Label x={175} y={107} size={22} anchor="start" color={t.ink}>
            {text}
          </Label>
          <Bars x={175} y={140} w={290} color={t.line} />
          <rect
            x={175}
            y={235}
            width={150}
            height={28}
            rx={6}
            fill={t.accent}
          />
        </g>
      )}
    </g>
  );
});
export const ProjectorReveal = scene(
  "Projector Reveal",
  ({ p, t, text, id, props }) => {
    const slit = span(p, 0, 0.25),
      beam = span(p, 0.22, 0.65);
    return (
      <g>
        <defs>
          <linearGradient id={id}>
            <stop stopColor={t.accent} stopOpacity={0.6} />
            <stop offset="1" stopColor={t.accent} stopOpacity={0.03} />
          </linearGradient>
          <clipPath id={`${id}-c`}>
            <path
              d={`M90 175L${90 + 500 * beam} ${175 - 135 * beam}V${185 + 135 * beam}L90 185Z`}
            />
          </clipPath>
        </defs>
        <rect
          x={75}
          y={mixN(100, 167, slit)}
          width={12}
          height={mixN(160, 26, slit)}
          rx={3}
          fill={t.accent}
        />
        <path
          d={`M90 175L${90 + 500 * beam} ${175 - 135 * beam}V${185 + 135 * beam}L90 185Z`}
          fill={`url(#${id})`}
        />
        <g clipPath={`url(#${id}-c)`}>
          <Label x={350} size={fontSize(text, 44)} color={t.ink}>
            {text}
          </Label>
        </g>
      </g>
    );
  },
);
export const ChartTipZoom = scene("Chart Tip Zoom", ({ p, t, props }) => {
  const values = props.values ?? [0.1, 0.25, 0.18, 0.5, 0.35, 0.6, 0.55, 0.86],
    n = values.length;
  if (!n) return null;
  const points = values.map((v, i) => [
    60 + (i * 520) / Math.max(1, n - 1),
    280 - clamp(v) * 210,
  ]);
  const q = out(phase(p, 0, 0.55)),
    zoom = span(p, 0.6, 1),
    last = points[n - 1],
    s = mixN(1, 5, zoom);
  return (
    <g
      transform={`translate(${mixN(last[0], 320, zoom) - last[0] * s} ${mixN(last[1], 180, zoom) - last[1] * s}) scale(${s})`}
    >
      <path d="M60 50V280H590" stroke={t.line} fill="none" />
      {[80,130,180,230].map(y=><path key={y} d={`M60 ${y}H590`} stroke={t.line} strokeDasharray="3 7"/>)}
      {[60,190,320,450,580].map(x=><path key={x} d={`M${x} 50V288`} stroke={t.line}/>)}
      <path
        d={points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ")}
        stroke={t.accent}
        strokeWidth={4}
        fill="none"
        pathLength={1}
        strokeDasharray="1 1"
        strokeDashoffset={1 - q}
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r={5}
        fill={t.ink}
        opacity={phase(p, 0.5, 0.6)}
      />
    </g>
  );
});
export const TelevisionReveal = scene("Television Reveal", ({p,t,text,props,id}) => {
  const q=span(p,.08,.8), pan=props.variant==='continue'?span(p,.82,1)*230:0;
  return <g transform={`translate(320 ${180-pan}) scale(${mixN(2.7,1,q)}) translate(-320 -180)`}>
    <path d="M-300 306H940M80 -150V306M560 -150V306" stroke={t.line} strokeWidth={2}/>
    <rect x={20} y={236} width={46} height={70} fill={t.tertiary}/><path d="M43 236v-56m0 22q-30-20-17-35m17 17q30-21 24-40" fill="none" stroke={t.accent} strokeWidth={5}/>
    <rect x={579} y={109} width={110} height={80} fill={t.surface} stroke={t.line}/>
    <ellipse cx={320} cy={308} rx={212} ry={9} fill="#000000" opacity={.16}/>
    <path d="M173 269l-19 35h31l10-35M445 269l19 35h-31l-10-35" fill="#222326"/>
    <rect x={106} y={65} width={428} height={210} rx={7} fill="#151619" stroke="#55575B" strokeWidth={2}/>
    <rect x={112} y={71} width={416} height={195} rx={2} fill="#050506"/>
    <defs><clipPath id={`${id}-tv`}><rect x={116} y={75} width={408} height={187} rx={1}/></clipPath></defs>
    <g clipPath={`url(#${id}-tv)`}><Art box={{x:116,y:75,width:408,height:187,radius:0}} text={text} color={t.onAccent} fill={t.accent}>{props.children}</Art></g>
    <path d="M113 72H527" stroke="#FFFFFF" strokeOpacity={.22}/><circle cx={320} cy={270} r={1.5} fill={t.accent}/>
  </g>;
});

// One continuous distance clock: cut at the bottom edge and resume at the
// same x at the top of the next shot, with no easing or pause at the join.
export const LineMatchCut = scene("Line Match Cut", ({p,t,text,props}) => {
  const points = [[100,70],[220,70],[320,160],[440,70],[540,70],[540,360]];
  const lengths=points.slice(1).map((b,i)=>Math.hypot(b[0]-points[i][0],b[1]-points[i][1]));
  const firstLength=lengths.reduce((a,b)=>a+b,0);
  const distance=p*(firstLength+360), second=distance>=firstLength;
  let remaining=distance, tip=points[0];
  for(let i=0;i<lengths.length;i++) {
    const f=clamp(remaining/lengths[i]);
    tip=[mixN(points[i][0],points[i+1][0],f),mixN(points[i][1],points[i+1][1],f)];
    remaining-=lengths[i];
    if(remaining<=0) break;
  }
  if(second) tip=[540,distance-firstLength];
  return <g>
    <rect width={640} height={360} fill={second?t.ink:t.canvas}/>
    {second ? <>
      {props.secondary??<Label x={285} y={200} size={32} color={t.canvas}>{text}</Label>}
      <path d={`M540 0V${tip[1]}`} fill="none" stroke={t.accent} strokeWidth={5}/>
    </> : <>
      {props.children??<Label y={220} color={t.ink} size={fontSize(text,38)}>{text}</Label>}
      <path d="M100 70H220L320 160L440 70H540V360" fill="none" stroke={t.line} strokeWidth={4}/>
      <path d="M100 70H220L320 160L440 70H540V360" fill="none" stroke={t.accent} strokeWidth={5} pathLength={firstLength} strokeDasharray={`${firstLength} ${firstLength}`} strokeDashoffset={firstLength-distance}/>
    </>}
    <circle cx={tip[0]} cy={tip[1]} r={6} fill={t.accent}/>
  </g>;
});

export const GridPress = scene("Grid Press", ({p,t,text,props}) => {
  const squeeze=span(p,.05,.35), half=mixN(220,85,squeeze);
  return <g>
    <path d={`M${320-half} 30V330M${320+half} 30V330M30 115H610M30 245H610`} fill="none" stroke={t.accent} opacity={.6}/>
    {props.children?<g transform={`translate(320 180) scale(${1-squeeze*.5}) translate(-320 -180)`}>{props.children}</g>:<Label y={194} size={32*(1-squeeze*.5)} color={t.ink}>{text}</Label>}
  </g>;
});

export const BadgeHandoff = scene("Badge Handoff", ({ p, t, text, props }) => {
  const q = span(p, 0.2, 0.85),
    x = mixN(320, 470, q),
    y = mixN(180, 126, q),
    r = mixN(60, 14, q);
  return (
    <g>
      <g opacity={q}>
        <Panel
          x={130}
          y={90}
          w={380}
          h={180}
          fill={t.surface}
          stroke={t.line}
        />
        <circle cx={175} cy={130} r={20} fill={t.tertiary} />
        <Label x={210} y={137} anchor="start" size={24} color={t.ink}>
          {text}
        </Label>
        <Bars x={165} y={185} w={300} color={t.line} />
      </g>
      <circle cx={x} cy={y} r={r} fill={t.accent} />
      <Check
        x={x}
        y={y}
        p={span(p, 0.35, 0.6)}
        size={r * 0.7}
        color={t.onAccent}
      />
    </g>
  );
});
export const BubbleExpand = scene("Bubble Expand", ({ p, t, text, props }) => {
  const q = span(p, 0.2, 0.9),
    box = interpolateBox(
      props.from ?? { x: 360, y: 200, width: 180, height: 65, radius: 24 },
      props.to ?? { x: 0, y: 0, width: 640, height: 360, radius: 0 },
      q,
    );
  return (
    <g>
      <path
        d={`M${box.x + box.width - 30} ${box.y + box.height - 3}l${22 * (1 - q)} ${18 * (1 - q)}l${-3 * (1 - q)} ${-24 * (1 - q)}Z`}
        fill={t.accent}
      />
      <Art box={box} text={text} color={t.onAccent} fill={t.accent}>
        {props.children}
      </Art>
    </g>
  );
});
