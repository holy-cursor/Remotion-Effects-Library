import React from "react";
export type Outline = ReadonlyArray<readonly [number, number]>;
/** Closed contours in centered artwork coordinates. Holes use opposite winding. */
export function SolidExtrude({
  contours,
  depth = 24,
  yaw = -24,
  pitch = 15,
  face = "#eaf4ec",
  hue = 152,
}: {
  contours: readonly Outline[];
  depth?: number;
  yaw?: number;
  pitch?: number;
  face?: string;
  hue?: number;
}) {
  const radians = Math.PI / 180,
    y = yaw * radians,
    x = pitch * radians;
  const project = ([u, v]: readonly [number, number], z: number) => {
    const a = u * Math.cos(y) + z * Math.sin(y),
      b = z * Math.cos(y) - u * Math.sin(y);
    return [
      a,
      v * Math.cos(x) - b * Math.sin(x),
      v * Math.sin(x) + b * Math.cos(x),
    ];
  };
  const path = (z: number) =>
    contours
      .map(
        (loop) =>
          "M" +
          loop.map((pt) => project(pt, z).slice(0, 2).join(",")).join("L") +
          "Z",
      )
      .join(" ");
  const walls = contours
    .flatMap((loop) =>
      loop.map((pt, i) => {
        const next = loop[(i + 1) % loop.length],
          du = next[0] - pt[0],
          dv = next[1] - pt[1];
        const quad = [
          project(pt, 0),
          project(next, 0),
          project(next, depth),
          project(pt, depth),
        ];
        const light =
          32 + (18 * (dv * 0.65 + du * 0.75)) / Math.max(1, Math.hypot(du, dv));
        return {
          points: quad.map((v) => v.slice(0, 2).join(",")).join(" "),
          z: quad.reduce((sum, v) => sum + v[2], 0),
          color: "hsl(" + hue + " 35% " + light + "%)",
        };
      }),
    )
    .sort((a, b) => a.z - b.z);
  return (
    <g>
      <path d={path(0)} fill={face} fillRule="evenodd" />
      {walls.map((w, i) => (
        <polygon
          key={i}
          points={w.points}
          fill={w.color}
          stroke={w.color}
          strokeWidth=".45"
        />
      ))}
      <path
        d={path(depth)}
        fill={face}
        fillRule="evenodd"
        stroke="#fff"
        strokeWidth=".6"
      />
    </g>
  );
}
