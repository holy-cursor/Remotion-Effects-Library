import React,{useRef} from 'react';
import {normalizeEasing,type EasingCurve} from '../../../core/easing';
const presets:Record<string,EasingCurve>={Linear:[0,0,1,1],Ease:[.25,.1,.25,1],'Ease in':[.42,0,1,1],'Ease out':[0,0,.58,1],'Ease in-out':[.42,0,.58,1],'Fast settle':[.16,1,.3,1]};
type Props={value:unknown;set:(key:string,value:unknown)=>void;beginGesture:()=>void;updateGesture:(key:string,value:unknown)=>void;endGesture:()=>void};
export function EasingEditor({value,set,beginGesture,updateGesture,endGesture}:Props){
 const curve=normalizeEasing(value), svg=useRef<SVGSVGElement>(null),drag=useRef<number|null>(null);
 const current=useRef(curve);current.current=curve;
 const X=(x:number)=>24+x*212,Y=(y:number)=>236-y*212;
 const change=(index:number,v:number,live=false)=>{const next=[...current.current];next[index]=Math.round(Math.max(0,Math.min(1,v))*1000)/1000;current.current=next as unknown as EasingCurve;(live?updateGesture:set)('easingCurve',next);};
 const move=(e:React.PointerEvent<SVGSVGElement>)=>{
  if(drag.current===null||!svg.current)return;
  const matrix=svg.current.getScreenCTM();if(!matrix)return;
  const point=new DOMPoint(e.clientX,e.clientY).matrixTransform(matrix.inverse());
  change(drag.current,(point.x-24)/212,true);change(drag.current+1,(236-point.y)/212,true);
 };
 const end=()=>{if(drag.current!==null){drag.current=null;endGesture();}};
 return <details className="group easing-editor"><summary>Easing</summary>
  <p className="easing-note">Drag the handles to retime the whole effect. Its built-in springs and stagger stay intact.</p>
  <div className="easing-presets">{Object.entries(presets).map(([name,c])=><button key={name} className={'chip'+(JSON.stringify(c)===JSON.stringify(curve)?' on':'')} onClick={()=>set('easingCurve',c)}>{name}</button>)}</div>
  <svg ref={svg} viewBox="0 0 260 266" className="easing-graph" aria-label="Easing graph: time horizontally, animation progress vertically" onPointerMove={move} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}>
   <rect x={24} y={24} width={212} height={212} fill="var(--surface, transparent)" stroke="var(--line)"/>
   {[.25,.5,.75].map(v=><path key={v} d={`M${X(v)} 24V236M24 ${Y(v)}H236`} stroke="var(--line)" strokeDasharray="2 4"/>)}
   <path d="M24 236L236 24" stroke="var(--line)" strokeDasharray="4 4"/>
   <path d={`M24 236L${X(curve[0])} ${Y(curve[1])}M236 24L${X(curve[2])} ${Y(curve[3])}`} stroke="var(--ink)" opacity={.4}/>
   <path d={`M24 236C${X(curve[0])} ${Y(curve[1])} ${X(curve[2])} ${Y(curve[3])} 236 24`} fill="none" stroke="#FB7501" strokeWidth={3}/>
   {[0,2].map((i)=><circle key={i} cx={X(curve[i])} cy={Y(curve[i+1])} r={8} fill={i===0?'#FB7501':'#FBA107'} stroke="var(--ink)" strokeWidth={1.5} tabIndex={0} role="button" aria-label={`Control point ${i/2+1}. Use arrow keys to adjust; shift for larger steps.`}
    onPointerDown={e=>{e.preventDefault();beginGesture();drag.current=i;svg.current?.setPointerCapture(e.pointerId);}}
    onKeyDown={e=>{const step=e.shiftKey?.1:.01;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const horizontal=e.key==='ArrowLeft'||e.key==='ArrowRight';const k=i+(horizontal?0:1);change(k,curve[k]+(e.key==='ArrowLeft'||e.key==='ArrowDown'?-step:step));}}}/>)}
   <text x={130} y={258} textAnchor="middle" fill="var(--muted)" fontSize={11}>Time →</text>
   <text x={12} y={130} textAnchor="middle" transform="rotate(-90 12 130)" fill="var(--muted)" fontSize={11}>Progress →</text>
  </svg>
  <div className="easing-numbers">{['x1','y1','x2','y2'].map((name,i)=><label key={name}>{name}<input aria-label={`Easing ${name}`} type="number" min={0} max={1} step={.01} value={curve[i]} onChange={e=>{if(e.target.value!==''&&Number.isFinite(e.target.valueAsNumber))change(i,e.target.valueAsNumber);}}/></label>)}</div>
  <code className="easing-value">cubic-bezier({curve.join(', ')})</code>
  <button className="btn" onClick={()=>set('easingCurve',undefined)}>Reset to original timing</button>
 </details>;
}
