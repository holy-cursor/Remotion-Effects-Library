import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";

export const RotatingCarousel: React.FC<{
  items: React.ReactNode[];
  radius?: number;
  rotationDuration?: number;
  totalRotation?: number;
  burstFrame?: number;
  burstDuration?: number;
  burstRadiusMultiplier?: number;
}> = ({
  items,
  radius = 480,
  rotationDuration = 150,
  totalRotation = 360,
  burstFrame = 125,
  burstDuration = 25,
  burstRadiusMultiplier = 6,
}) => {
  const frame = useCurrentFrame();

  const currentOrbitRotation = interpolate(
    frame,
    [0, rotationDuration],
    [0, totalRotation],
    { easing: Easing.out(Easing.exp) }
  );

  return (
    <AbsoluteFill>
      {items.map((item, index) => {
        const baseAngle = (index / items.length) * 360;

        // Faking a camera zoom-in by expanding radius and scale
        const burstOut = interpolate(
          frame,
          [burstFrame, burstFrame + burstDuration],
          [1, burstRadiusMultiplier],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.in(Easing.exp),
          }
        );

        const currentRadius = radius * burstOut;

        const finalAngle = baseAngle + currentOrbitRotation;
        const radians = (finalAngle * Math.PI) / 180;

        const x = Math.sin(radians) * currentRadius;
        const y = -Math.cos(radians) * currentRadius;

        const speedBlur = interpolate(frame, [0, 35], [4, 0], {
          extrapolateRight: "clamp",
          extrapolateLeft: "clamp",
        });

        // As they burst out, we fade opacity so they don't look awkwardly huge
        const burstOpacity = interpolate(
          burstOut,
          [burstRadiusMultiplier / 2, burstRadiusMultiplier],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(${burstOut})`,
              width: 250,
              height: 250,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: Math.floor(y),
              opacity: burstOpacity,
            }}
          >
            <div
              style={{
                position: "absolute",
                width: 180,
                height: 180,
                filter: `drop-shadow(0 20px 35px rgba(0,0,0,0.6)) blur(${speedBlur}px)`,
                backgroundColor: "#FFFFFF",
                borderRadius: 24,
                overflow: "hidden",
                border: "3px solid rgba(255, 255, 255, 0.8)",
              }}
            >
              {item}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
