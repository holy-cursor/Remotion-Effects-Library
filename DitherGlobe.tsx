// Adapted from opencoredev/dithercn (MIT). See dither/LICENSE.
import React,{useLayoutEffect,useMemo,useRef} from 'react';
import {EffectRoot,useEffectProps,type EffectBaseProps} from './core/effect';
import {landCoverage,type LatLon} from './dither/world-land';
import {thresholdAt,type DitherMatrix} from './dither/matrices';
import {readColor} from './dither/color';
type Rgba=readonly [number,number,number,number];
type DitherColor=string;
export type GlobeMarker={at:LatLon;color?:string};
export type GlobeArc={from:LatLon;to:LatLon;color?:string};
export type DitherGlobeProps=EffectBaseProps & {
 color?:string;markers?:readonly GlobeMarker[];arcs?:readonly GlobeArc[];
 rotationSpeed?:number;startLongitude?:number;tilt?:number;light?:number;ocean?:number;
 atmosphere?:boolean;cell?:number;matrix?:DitherMatrix;animate?:boolean;seconds?:number;showArcs?:boolean;
};
const OFFICES:readonly GlobeMarker[]=[{at:[51.51,-.13]},{at:[6.52,3.38]},{at:[40.71,-74]},{at:[35.68,139.69]},{at:[1.35,103.82]}];
const ROUTES:readonly GlobeArc[]=OFFICES.slice(1).map(m=>({from:OFFICES[0].at,to:m.at}));
const RADIANS = Math.PI / 180;
const RADIUS_SHARE = 0.42;

type Vec3 = readonly [number, number, number];

interface Disc {
  columns: number;
  rows: number;
  cx: number;
  cy: number;
  radius: number;
  /** Pixel index, then the view-space normal, for every pixel on the sphere. */
  sphere: Float32Array;
  /** Pixel index and glow strength for the atmosphere ring. */
  halo: Float32Array;
}

const buildDisc = (columns: number, rows: number): Disc => {
  const cx = columns / 2;
  const cy = rows / 2;
  const radius = Math.min(columns, rows) * RADIUS_SHARE;
  const sphere: number[] = [];
  const halo: number[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const nx = (x + 0.5 - cx) / radius;
      const ny = (cy - y - 0.5) / radius;
      const r2 = nx * nx + ny * ny;
      if (r2 <= 1) {
        sphere.push(y * columns + x, nx, ny, Math.sqrt(1 - r2));
      } else if (r2 < 1.16) {
        halo.push(y * columns + x, 1 - (Math.sqrt(r2) - 1) / 0.077);
      }
    }
  }
  return {
    columns,
    cx,
    cy,
    halo: Float32Array.from(halo),
    radius,
    rows,
    sphere: Float32Array.from(sphere),
  };
};

/** The globe's orientation, as sines and cosines worked out once a frame. */
interface View {
  cosS: number;
  sinS: number;
  cosT: number;
  sinT: number;
}

/** `spin` turns about the axis, `tilt` leans it towards the viewer; radians. */
const makeView = (spin: number, tilt: number): View => ({
  cosS: Math.cos(spin),
  cosT: Math.cos(tilt),
  sinS: Math.sin(spin),
  sinT: Math.sin(tilt),
});

/** View space to the globe's own frame: undo the tilt, then the spin. */
const toWorld = ({ cosS, sinS, cosT, sinT }: View, [x, y, z]: Vec3): Vec3 => {
  const y1 = y * cosT - z * sinT;
  const z1 = y * sinT + z * cosT;
  return [x * cosS + z1 * sinS, y1, -x * sinS + z1 * cosS];
};

/** The globe's frame to view space. */
const toView = ({ cosS, sinS, cosT, sinT }: View, [x, y, z]: Vec3): Vec3 => {
  const x1 = x * cosS - z * sinS;
  const z1 = x * sinS + z * cosS;
  return [x1, y * cosT + z1 * sinT, -y * sinT + z1 * cosT];
};

const fromLatLon = ([lat, lon]: LatLon): Vec3 => {
  const phi = lat * RADIANS;
  const lambda = lon * RADIANS;
  return [
    Math.cos(phi) * Math.sin(lambda),
    Math.sin(phi),
    Math.cos(phi) * Math.cos(lambda),
  ];
};

const lightVector = (degrees: number): Vec3 => {
  const angle = degrees * RADIANS;
  const x = Math.sin(angle) * 0.75;
  const y = Math.cos(angle) * 0.75;
  const length = Math.hypot(x, y, 0.62);
  return [x / length, y / length, 0.62 / length];
};

interface Paint {
  land: Rgba;
  accent: Rgba;
  extra: ReadonlyMap<DitherColor, Rgba>;
}

interface Scene {
  disc: Disc;
  view: View;
  light: Vec3;
  ocean: number;
  matrix: DitherMatrix;
  paint: Paint;
}

const put = (data: Uint8ClampedArray, index: number, [r, g, b, a]: Rgba) => {
  const at = index * 4;
  data[at] = r * 255;
  data[at + 1] = g * 255;
  data[at + 2] = b * 255;
  data[at + 3] = a * 255;
};

const surfaceTone = (scene: Scene, normal: Vec3) => {
  const { view, light, ocean } = scene;
  const lit =
    normal[0] * light[0] + normal[1] * light[1] + normal[2] * light[2];
  // Lambert light with a short soft edge past the terminator.
  const shade = Math.min(1, Math.max(0, (lit + 0.08) / 1.08));
  const [wx, wy, wz] = toWorld(view, normal);
  const lat = Math.asin(Math.max(-1, Math.min(1, wy))) / RADIANS;
  const lon = Math.atan2(wx, wz) / RADIANS;
  if (landCoverage(lat, lon) >= 0.5) {
    return 0.07 + 0.93 * shade;
  }
  const rim = (1 - normal[2]) ** 3;
  return shade * (ocean * (0.5 + rim) + rim * 0.1);
};

/** Land, sea and terminator: one dithered tone per pixel of the sphere. */
const paintSphere = (image: ImageData, scene: Scene) => {
  const { disc, matrix, paint } = scene;
  const { sphere, columns } = disc;
  for (let i = 0; i < sphere.length; i += 4) {
    const index = sphere[i] ?? 0;
    const tone = surfaceTone(scene, [
      sphere[i + 1] ?? 0,
      sphere[i + 2] ?? 0,
      sphere[i + 3] ?? 0,
    ]);
    const x = index % columns;
    if (tone > thresholdAt(matrix, x, (index - x) / columns)) {
      put(image.data, index, paint.land);
    }
  }
};

/** A thin glow around the sphere, strongest towards the light. */
const paintAtmosphere = (image: ImageData, scene: Scene) => {
  const { disc, light, matrix, paint } = scene;
  const { halo, columns, cx, cy, radius } = disc;
  for (let i = 0; i < halo.length; i += 2) {
    const index = halo[i] ?? 0;
    const x = index % columns;
    const y = (index - x) / columns;
    const nx = (x + 0.5 - cx) / radius;
    const ny = (cy - y - 0.5) / radius;
    const facing = Math.max(
      0,
      (nx * light[0] + ny * light[1]) / Math.hypot(nx, ny)
    );
    const tone = (halo[i + 1] ?? 0) ** 2 * (0.12 + 0.5 * facing);
    if (tone > thresholdAt(matrix, x, y)) {
      put(image.data, index, paint.land);
    }
  }
};

interface Projected {
  x: number;
  y: number;
  /** Depth towards the viewer, -1 to 1 on the surface. */
  z: number;
  /** In front of the globe, or beside it where the globe can't hide it. */
  visible: boolean;
}

const projectPoint = (disc: Disc, view: View, point: Vec3): Projected => {
  const [x, y, z] = toView(view, point);
  return {
    visible: z > 0 || x * x + y * y > 1,
    x: disc.cx + x * disc.radius,
    y: disc.cy - y * disc.radius,
    z,
  };
};

const rgba = (color: Rgba) =>
  `rgba(${color[0] * 255}, ${color[1] * 255}, ${color[2] * 255}, ${color[3]})`;

const fillCell = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size = 1
) => {
  const offset = Math.floor(size / 2);
  context.fillRect(Math.round(x) - offset, Math.round(y) - offset, size, size);
};

const PULSE = 2.6;

const paintMarker = (
  context: CanvasRenderingContext2D,
  scene: Scene,
  point: Projected,
  phase: number
) => {
  // An expanding ring of dithered cells that fades as it grows.
  const ring = 2 + phase * Math.max(6, scene.disc.radius * 0.1);
  const fade = (1 - phase) ** 1.5;
  const steps = Math.ceil(ring * 6);
  for (let s = 0; s < steps; s += 1) {
    const angle = (s / steps) * Math.PI * 2;
    const x = Math.round(point.x + Math.cos(angle) * ring);
    // Flattened by depth, so rings near the limb lie on the surface.
    const y = Math.round(point.y + Math.sin(angle) * ring * point.z);
    if (fade > thresholdAt(scene.matrix, x, y)) {
      fillCell(context, x, y);
    }
  }
  fillCell(context, point.x, point.y, 3);
};

const paintMarkers = (
  context: CanvasRenderingContext2D,
  scene: Scene,
  markers: readonly GlobeMarker[],
  time: number
) => {
  const { disc, view, paint } = scene;
  for (const [index, marker] of markers.entries()) {
    const point = projectPoint(disc, view, fromLatLon(marker.at));
    if (point.z > 0.05) {
      context.fillStyle = rgba(
        (marker.color && paint.extra.get(marker.color)) || paint.accent
      );
      paintMarker(context, scene, point, (time / PULSE + index * 0.37) % 1);
    }
  }
};

/** A point on the great circle from `a` to `b`, lifted in the middle. */
const arcPoint = (a: Vec3, b: Vec3, angle: number, s: number): Vec3 => {
  const sin = Math.sin(angle) || 1;
  const wa = Math.sin((1 - s) * angle) / sin;
  const wb = Math.sin(s * angle) / sin;
  const lift = 1 + Math.sin(Math.PI * s) * (0.06 + angle * 0.1);
  return [
    (a[0] * wa + b[0] * wb) * lift,
    (a[1] * wa + b[1] * wb) * lift,
    (a[2] * wa + b[2] * wb) * lift,
  ];
};

const paintArcs = (
  context: CanvasRenderingContext2D,
  scene: Scene,
  arcs: readonly GlobeArc[],
  time: number
) => {
  const { disc, view, paint } = scene;
  for (const [index, arc] of arcs.entries()) {
    const a = fromLatLon(arc.from);
    const b = fromLatLon(arc.to);
    const angle = Math.acos(
      Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])
    );
    context.fillStyle = rgba(
      (arc.color && paint.extra.get(arc.color)) || paint.accent
    );
    const steps = Math.max(12, Math.ceil(angle * disc.radius * 1.3));
    // A bright stretch travels along each arc; the rest is dotted.
    const head = (time / 3.2 + index * 0.41) % 1.5;
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const point = projectPoint(disc, view, arcPoint(a, b, angle, t));
      const lit = t <= head && t > head - 0.25;
      if (point.visible && (lit || s % 3 === 0)) {
        fillCell(context, point.x, point.y);
      }
    }
  }
};


export function DitherGlobe(props:DitherGlobeProps){
 const fx=useEffectProps(props), canvas=useRef<HTMLCanvasElement>(null);
 const cell=Math.max(1,Math.min(8,props.cell??2)), columns=Math.floor(640/cell), rows=Math.floor(360/cell);
 const disc=useMemo(()=>buildDisc(columns,rows),[columns,rows]);
 useLayoutEffect(()=>{
  const ctx=canvas.current?.getContext('2d'); if(!ctx)return;
  const time=props.animate===false?0:fx.t*(props.seconds??12), markers=props.markers??OFFICES, arcs=props.showArcs===false?[]:props.arcs??ROUTES;
  const extra=new Map<string,Rgba>();
  for(const m of [...markers,...arcs])if(m.color)extra.set(m.color,readColor(m.color));
  const scene:Scene={disc,view:makeView(((props.startLongitude??10)+time*(props.rotationSpeed??6))*RADIANS,-(props.tilt??18)*RADIANS),light:lightVector(props.light??300),ocean:Math.max(0,Math.min(1,props.ocean??.18)),matrix:props.matrix??'bayer4',paint:{land:readColor(props.color??fx.roles.accent),accent:readColor(props.accent??fx.roles.ink),extra}};
  const image=ctx.createImageData(columns,rows);paintSphere(image,scene);
  if(props.atmosphere!==false)paintAtmosphere(image,scene);
  ctx.putImageData(image,0,0);paintArcs(ctx,scene,arcs,time);paintMarkers(ctx,scene,markers,time);
 });
 return <EffectRoot fx={fx}><canvas ref={canvas} width={columns} height={rows} aria-label="Rotating dithered world with geographic routes" style={{width:'100%',height:'100%',objectFit:'contain',imageRendering:'pixelated'}}/></EffectRoot>;
}
