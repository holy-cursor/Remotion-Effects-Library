export type EasingCurve = readonly [number, number, number, number];
export const LINEAR_CURVE:EasingCurve=[0,0,1,1];
/** Progress curves are bounded so scene cuts and visibility gates remain valid. */
export function normalizeEasing(value:unknown):EasingCurve {
 if(!Array.isArray(value)||value.length!==4||!value.every(v=>typeof v==='number'&&Number.isFinite(v)))return LINEAR_CURVE;
 return value.map(v=>Math.max(0,Math.min(1,v))) as unknown as EasingCurve;
}
/** Solve time (Bezier x), then evaluate progress (Bezier y). */
export function applyEasing(progress:number,curve?:unknown):number {
 const x=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
 if(x===0||x===1)return x;
 const [x1,y1,x2,y2]=normalizeEasing(curve);
 if(x1===y1&&x2===y2)return x;
 const sample=(t:number,a:number,b:number)=>3*(1-t)*(1-t)*t*a+3*(1-t)*t*t*b+t*t*t;
 let lo=0,hi=1;
 for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(sample(mid,x1,x2)<x)lo=mid;else hi=mid;}
 return sample((lo+hi)/2,y1,y2);
}
