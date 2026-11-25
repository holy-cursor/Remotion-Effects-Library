import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export type TextRevealChunk = {
  text: string;
  config?: {
    positionX?: number;
    positionY?: number;
    scale?: number;
    brightness?: number;
    contrast?: number;
  };
};

export const TextReveal: React.FC<{
  chunks: TextRevealChunk[];
  startFrame?: number;
  fontSize?: number;
  color?: string;
  staggerDelay?: number;
  rotateFrom?: number;
}> = ({
  chunks,
  startFrame = 0,
  fontSize = 65,
  color = "var(--text-main)",
  staggerDelay = 0.4,
  rotateFrom = 6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flatten chunks into a single array of letters with their specific configs
  const letters = chunks.flatMap((chunk) =>
    chunk.text.split("").map((char) => ({
      char,
      config: chunk.config || {
        positionX: 0,
        positionY: 0,
        scale: 1,
        brightness: 1,
        contrast: 1,
      },
    }))
  );

  // The entire line rotates down to 0, anchored at the left
  const lineSwing = spring({
    frame: Math.max(0, frame - startFrame),
    fps,
    config: { damping: 14, stiffness: 80, mass: 1 },
  });
  const lineRotation = interpolate(lineSwing, [0, 1], [rotateFrom, 0]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        gap: 0,
        zIndex: 10,
        padding: "10px 20px 20px 20px",
        transformOrigin: "left center",
        transform: `rotate(${lineRotation}deg)`,
      }}
    >
      {letters.map((l, index) => {
        const letterFrame = frame - startFrame - index * staggerDelay;
        const revealProgress = spring({
          frame: Math.max(0, letterFrame),
          fps,
          config: { damping: 14, stiffness: 200, mass: 1 },
        });

        const textTranslateY = interpolate(revealProgress, [0, 1], [30, 0]);

        const targetOpacity = interpolate(
          index,
          [0, letters.length],
          [1, 0.4]
        );
        const textOpacity = interpolate(
          revealProgress,
          [0, 1],
          [0, targetOpacity],
          { extrapolateRight: "clamp" }
        );

        return (
          <h1
            key={index}
            style={{
              fontSize,
              margin: 0,
              fontWeight: 400,
              letterSpacing: "-1px",
              whiteSpace: "pre",
              color,
              opacity: textOpacity,
              transform: `translateY(${textTranslateY + (l.config.positionY || 0)}px) translateX(${l.config.positionX || 0}px) scale(${l.config.scale || 1})`,
              filter: `brightness(${l.config.brightness ?? 1}) contrast(${l.config.contrast ?? 1})`,
            }}
          >
            {l.char}
          </h1>
        );
      })}
    </div>
  );
};
