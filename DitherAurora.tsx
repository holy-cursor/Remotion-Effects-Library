import React,{useLayoutEffect,useRef} from 'react';
import {EffectRoot,useEffectProps,type EffectBaseProps} from './core/effect';
import {getThresholdMap,type DitherMatrix} from './dither/matrices';
import {readColor} from './dither/color';
import {AURORA_FRAGMENT} from './dither/aurora-shader';

export type DitherAuroraProps=EffectBaseProps & {
 color?:string;tipColor?:string;skyColor?:string;curtains?:number;height?:number;spread?:number;sway?:number;
 turbulence?:number;rays?:number;length?:number;glow?:number;tilt?:number;drift?:number;
 direction?:'up'|'down';mask?:'none'|'top'|'bottom'|'edges';matrix?:DitherMatrix;cell?:number;
 animate?:boolean;seconds?:number;stillTime?:number;intensity?:number;shimmer?:number;foldScale?:number;
};
const bounded=(x:number,a:number,b:number)=>Math.min(b,Math.max(a,x));
type Engine={gl:WebGLRenderingContext;program:WebGLProgram;buffer:WebGLBuffer;texture:WebGLTexture;vertex:WebGLShader;fragment:WebGLShader};
/** Original dithercn curtain field with a synchronous progress-driven renderer. */
export function DitherAurora(props:DitherAuroraProps){
 const fx=useEffectProps(props),canvas=useRef<HTMLCanvasElement>(null),engine=useRef<Engine|null>(null);
 const cell=bounded(props.cell??2,1,8),width=Math.floor(640/cell),height=Math.floor(360/cell);
 useLayoutEffect(()=>{
  const gl=canvas.current?.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!gl)throw new Error('Dither Aurora requires WebGL. Enable hardware acceleration.');
  const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(error??'Aurora shader compile failed');}return shader;};
  const vertex=compile(gl.VERTEX_SHADER,'attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}');
  const fragment=compile(gl.FRAGMENT_SHADER,AURORA_FRAGMENT),program=gl.createProgram()!;
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)??'Aurora link failed');
  const buffer=gl.createBuffer()!,texture=gl.createTexture()!;
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  engine.current={gl,program,buffer,texture,vertex,fragment};
  return()=>{gl.deleteBuffer(buffer);gl.deleteTexture(texture);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);engine.current=null;};
 },[]);
 useLayoutEffect(()=>{
  const e=engine.current;if(!e)return;const {gl,program,buffer,texture}=e;
  gl.viewport(0,0,width,height);gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const map=getThresholdMap(props.matrix??'bayer8'),data=Uint8Array.from(map.thresholds,v=>Math.round(v*255));
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,map.size,map.size,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,data);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
  const at=(name:string)=>gl.getUniformLocation(program,name),set=(name:string,v:number)=>gl.uniform1f(at(name),v);
  gl.uniform1i(at('thresholds'),0);gl.uniform2f(at('res'),width,height);set('matrixSize',map.size);
  set('time',props.animate===false?(props.stillTime??4):fx.t*(props.seconds??16));
  for(const [name,color] of Object.entries({paper:props.skyColor??fx.roles.canvas,tip:props.tipColor??fx.roles.tertiary,ink:props.color??fx.roles.accent,peak:fx.roles.ink})){
    const c=readColor(color);gl.uniform3f(at(name),c[0],c[1],c[2]);
  }
  const uniforms={auroraCurtains:Math.round(bounded(props.curtains??3,1,6)),auroraHeight:bounded(props.height??.42,0,1),auroraSpread:bounded(props.spread??.11,0,.5),auroraSway:bounded(props.sway??1,0,3),auroraTurbulence:bounded(props.turbulence??.6,0,2),auroraRays:bounded(props.rays??8,1,32),auroraLength:bounded(props.length??.45,0,1),auroraGlow:bounded(props.glow??.9,0,2),auroraTilt:bounded(props.tilt??-8,-45,45)*Math.PI/180,auroraDrift:bounded(props.drift??.5,-2,2),auroraFlip:props.direction==='down'?1:0,auroraMask:{none:0,top:1,bottom:2,edges:3}[props.mask??'edges'],auroraIntensity:bounded(props.intensity??.95,0,1),auroraShimmer:bounded(props.shimmer??.2,0,1),auroraScale:bounded(props.foldScale??1,.1,5)};
  for(const [name,v] of Object.entries(uniforms))set(name,v);
  gl.drawArrays(gl.TRIANGLES,0,6);gl.flush();
 });
 return <EffectRoot fx={fx}><canvas ref={canvas} width={width} height={height} aria-label="Dithered aurora curtains" style={{width:'100%',height:'100%',imageRendering:'pixelated',objectFit:'fill'}}/></EffectRoot>;
}
