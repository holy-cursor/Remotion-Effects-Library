import React from "react";

export type SurfaceExtrudeProps = {
  children: React.ReactNode;
  width: number;
  height: number;
  depth: number;
  pitch?: number;
  yaw?: number;
  roll?: number;
  light?: number;
  color?: string;
  faceColor?: string;
  sideColor?: string;
  highlightColor?: string;
};

/** A content surface with connected side faces and independently controlled light. */
export function SurfaceExtrude({
  children,
  width,
  height,
  depth,
  pitch = 18,
  yaw = -24,
  roll = -4,
  light = 1,
  color = "#72edc0",
  faceColor = "#123b32",
  sideColor = "#081c19",
  highlightColor = "#ffffff",
}: SurfaceExtrudeProps) {
  const edge = "1px solid " + color;
  const wall: React.CSSProperties = {
    position: "absolute",
    border: edge,
    boxSizing: "border-box",
    background: "linear-gradient(90deg," + sideColor + "," + color + ")",
  };
  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        transformStyle: "preserve-3d",
        transform: `rotateX(${pitch}deg) rotateY(${yaw}deg) rotateZ(${roll}deg)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: sideColor,
          border: edge,
        }}
      />
      {[0, height].map((top) => (
        <div
          key={"h" + top}
          style={{
            ...wall,
            top,
            left: 0,
            width,
            height: depth,
            transformOrigin: "top",
            transform: "rotateX(90deg)",
          }}
        />
      ))}
      {[0, width].map((left) => (
        <div
          key={"v" + left}
          style={{
            ...wall,
            top: 0,
            left,
            width: depth,
            height,
            transformOrigin: "left",
            transform: "rotateY(-90deg)",
          }}
        />
      ))}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translateZ(${depth}px)`,
          border: edge,
          overflow: "hidden",
          background: faceColor,
          boxShadow: `0 0 ${light * 7}px ${color}99,0 0 ${light * 27}px ${color}30`,
        }}
      >
        {children}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: light * 0.7,
            background:
              "linear-gradient(112deg,transparent 30%," +
              highlightColor +
              "2a 42%," +
              highlightColor +
              "80 47%,transparent 54%)",
            transform: `translateX(${(1 - light) * 150}%)`,
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
