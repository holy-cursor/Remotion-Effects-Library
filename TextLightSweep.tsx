import React from 'react';
import {interpolateColors} from 'remotion';
import {EffectRoot,useEffectProps,type EffectBaseProps} from './core/effect';
import {clamp,phase} from './CompletionCore';

export type TextLightSweepProps = EffectBaseProps & {
  text?: string; baseColor?: string; highlightColor?: string; trailColor?: string;
  sweepStart?: number; sweepEnd?: number; retainLastWord?: boolean; fontSize?: number;
};
/** Per-letter light sweep: a bright front, a coloured wake and a return to the base colour. */
export function TextLightSweep(props:TextLightSweepProps) {
  const fx=useEffectProps(props), text=props.text??'Text Light Sweep';
  const original=false;
  const words=text.split(/\s+/);
  const base=props.baseColor??'#ffffff', highlight=props.highlightColor??'#C2F1FF', trail=props.trailColor??'#0095C2';
  const start=props.sweepStart??.18, end=props.sweepEnd??.8;
  const wipeX=100+1200*phase(fx.t,start,end);
  let offset=0;
  const positions=words.map(w=>{const x=214+offset/Math.max(1,text.length)*852;offset+=w.length+1;return x;});
  const color=(wi:number,ci:number)=>{
    if(fx.t<start)return base;
    // Preserve the source's exact spatial sampling for its original sentence.
    const starts=original?[214,358,652,946]:positions;
    const widths=original?[120,270,270,120]:words.map(w=>w.length/Math.max(1,text.length)*852);
    const x=starts[wi]+ci/words[wi].length*widths[wi];
    const dist=x-wipeX;
    if(dist>0)return interpolateColors(Math.min(150,dist),[0,150],[highlight,base]);
    if((props.retainLastWord??true)&&wi===words.length-1)
      return interpolateColors(Math.max(-150,dist),[-150,0],[trail,highlight]);
    if(dist>-150)return interpolateColors(dist,[-150,0],[trail,highlight]);
    return interpolateColors(Math.max(-300,dist),[-300,-150],[base,trail]);
  };
  return <EffectRoot fx={fx}><svg viewBox="0 0 1280 720" width="100%" height="100%" role="img" aria-label={text}>
    <foreignObject x={40} y={250} width={1200} height={220}>
      <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:'.26em',fontFamily:fx.font??'Inter, sans-serif',fontWeight:500,letterSpacing:-1,fontSize:props.fontSize??(original?64:Math.min(80,1120/Math.max(1,text.length)*1.65)),whiteSpace:'nowrap'}}>
        {words.map((word,wi)=><span key={wi}>{Array.from(word).map((ch,ci)=><span key={ci} style={{color:color(wi,ci)}}>{ch}</span>)}</span>)}</div>
    </foreignObject>
  </svg></EffectRoot>;
}
