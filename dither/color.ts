/** Resolve CSS colors only while drawing, never at module import time. */
export function readColor(color:string):readonly [number,number,number,number]{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
 const context=canvas.getContext('2d')!;context.fillStyle=color;context.fillRect(0,0,1,1);
 const d=context.getImageData(0,0,1,1).data;return [d[0]/255,d[1]/255,d[2]/255,d[3]/255];
}
