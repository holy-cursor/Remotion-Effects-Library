import React, { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { CameraMotionBlur as RemotionCameraMotionBlur } from "@remotion/motion-blur";
import { Freeze, useCurrentFrame } from "remotion";
import { EffectRoot, useEffectProps } from "./core/effect";
import {
  type CompletionProps,
  clamp,
  phase,
  out,
  Label,
  Art,
} from "./CompletionCore";

export type GeometryCandle = {
  open: number;
  close: number;
  high: number;
  low: number;
};
const candles: GeometryCandle[] = Array.from({ length: 12 }, (_, i) => ({
  open: 2 + Math.sin(i * 0.8) + i * 0.15,
  close: 2.4 + Math.sin(i * 0.8 + 0.5) + i * 0.15,
  high: 4 + Math.sin(i * 0.8) + i * 0.15,
  low: 0.5 + Math.sin(i * 0.8) + i * 0.15,
}));
/** Optional Three.js adapter. Geometry is rendered synchronously for each progress value. */
export function CandleGeometry(
  props: CompletionProps & { data?: GeometryCandle[] },
) {
  const fx = useEffectProps(props),
    p = phase(fx.t, props.start ?? 0, props.end ?? 1),
    canvas = useRef<HTMLCanvasElement>(null),
    engine = useRef<{
      renderer: THREE.WebGLRenderer;
      scene: THREE.Scene;
      camera: THREE.Camera;
      groups: THREE.Group[];
    } | null>(null);
  const data = props.data ?? candles;
  useLayoutEffect(() => {
    if (!canvas.current) return;
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas.current,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(640, 360, false);
    renderer.setPixelRatio(1);
    const world = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(38, 640 / 360, 0.1, 500);
    const extent = Math.max(10, Math.min(60, data.length) * .85);
    const low = Math.min(0,...data.slice(0,60).map(v=>v.low));
    const high = Math.max(5,...data.slice(0,60).map(v=>v.high));
    const targetY=(low+high)/2;
    const distance=Math.max(extent*1.55,(high-low)*2.5);
    camera.position.set(extent*.65, targetY+distance*.3, distance);
    camera.lookAt(0, targetY, 0);
    world.add(new THREE.AmbientLight(0xffffff, .7));
    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(-8, 12, 10);
    world.add(light);
    const grid = new THREE.GridHelper(extent*1.8,12,fx.roles.accent,fx.roles.line);
    grid.position.y=low-.15;
    world.add(grid);
    const up = new THREE.MeshStandardMaterial({
        color: fx.roles.accent,
        roughness: 0.7,
      }),
      down = new THREE.MeshStandardMaterial({
        color: fx.roles.secondary,
        roughness: 0.7,
      });
    const groups = data.slice(0, 60).map((v, i) => {
      const group = new THREE.Group(),
        material = v.close >= v.open ? up : down;
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(
          0.55,
          Math.max(0.04, Math.abs(v.close - v.open)),
          0.55,
        ),
        material,
      );
      body.position.y = (v.open + v.close) / 2;
      const wick = new THREE.Mesh(
        new THREE.CylinderGeometry(
          0.035,
          0.035,
          Math.max(0.04, v.high - v.low),
          6,
        ),
        material,
      );
      wick.position.y = (v.high + v.low) / 2;
      group.add(body, wick);
      group.position.x = (i - (Math.min(60, data.length) - 1) / 2) * 0.85;
      world.add(group);
      return group;
    });
    engine.current = { renderer, scene: world, camera, groups };
    return () => {
      world.traverse((o) => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
      grid.geometry.dispose();
      if(Array.isArray(grid.material)) grid.material.forEach(m=>m.dispose());
      else grid.material.dispose();
      up.dispose();
      down.dispose();
      renderer.dispose();
      engine.current = null;
    };
  }, [data, fx.roles.accent, fx.roles.secondary, fx.roles.line]);
  useLayoutEffect(() => {
    const e = engine.current;
    if (!e) return;
    e.groups.forEach((g, i) => {
      const q = out(
        phase(
          p,
          (i * 0.6) / Math.max(1, e.groups.length),
          (i * 0.6) / Math.max(1, e.groups.length) + 0.3,
        ),
      );
      g.scale.y = Math.max(0.001, q);
      g.visible = q > 0;
    });
    e.renderer.render(e.scene, e.camera);
  }, [p, data, fx.roles.accent, fx.roles.secondary, fx.roles.line]);
  return (
    <EffectRoot fx={fx}>
      <canvas
        ref={canvas}
        width={640}
        height={360}
        aria-label="Three-dimensional candlestick geometry"
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </EffectRoot>
  );
}
function BlurSample({
  props,
  color,
  ink,
}: {
  props: CompletionProps;
  color: string;
  ink: string;
}) {
  const frame = useCurrentFrame(),
    p = clamp(frame / 96),
    x = 90 + 460 * p;
  // Ballistic fall, then three progressively smaller rebounds with gravity.
  const impact=.3;
  let height=0;
  if(p<impact) height=165*(1-(p/impact)**2);
  else {
    const flights=[[.3,.62,88],[.62,.82,36],[.82,.94,12]];
    for(const [a,b,h] of flights) if(p>=a&&p<b){const u=(p-a)/(b-a);height=4*h*u*(1-u);break;}
  }
  const squash=[.3,.62,.82,.94].reduce((v,hit)=>Math.max(v,Math.exp(-(((p-hit)/.014)**2))),0);
  return (
    <svg viewBox="0 0 640 360" width="100%" height="100%">
      <g transform={`translate(${-35*p} 0)`}>
      <path d="M-100 286H800M35 50V286M620 50V286" stroke={color} strokeOpacity={.25} strokeWidth={2}/>
      {[40,160,280,400,520,640].map(xx=><path key={xx} d={`M${xx} 286v12`} stroke={color} strokeOpacity={.4}/>)}
      <ellipse cx={x} cy={286} rx={40-12*height/165} ry={5} fill="#100C08" opacity={.14+.13*(1-height/165)}/>
      <g
        transform={`translate(${x} ${286-height}) scale(${1+.13*squash} ${1-.17*squash}) translate(-320 -225)`}
      >
        <Art
          box={{ x: 275, y: 135, width: 90, height: 90 }}
          text=""
          color={ink}
          fill={color}
        >
          {props.children}
        </Art>
      </g>
      </g>
    </svg>
  );
}
/** Uses Remotion's maintained temporal sampler, not an imitation blur filter. */
export function CameraMotionBlur(
  props: CompletionProps & { samples?: number; shutterAngle?: number },
) {
  const fx = useEffectProps(props);
  return (
    <EffectRoot fx={fx}>
      <Freeze frame={phase(fx.t, props.start ?? 0, props.end ?? 1) * 96}>
        <RemotionCameraMotionBlur
          samples={Math.max(1, Math.min(24, Math.round(props.samples ?? 8)))}
          shutterAngle={Math.max(0, Math.min(360, props.shutterAngle ?? 180))}
        >
          {props.children ?? (
            <BlurSample
              props={props}
              color={fx.roles.accent}
              ink={fx.roles.onAccent}
            />
          )}
        </RemotionCameraMotionBlur>
      </Freeze>
    </EffectRoot>
  );
}
