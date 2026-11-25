import React from "react";
import { useCurrentFrame } from "remotion";

export const TypingEffect: React.FC<{
  text: string;
  startFrame?: number;
  speed?: number;
  showCursor?: boolean;
  cursorColor?: string;
  style?: React.CSSProperties;
  className?: string;
}> = ({
  text,
  startFrame = 0,
  speed = 2,
  showCursor = true,
  cursorColor = "inherit",
  style = {},
  className = "",
}) => {
  const frame = useCurrentFrame();

  const typeProgress = Math.max(0, Math.min(text.length, Math.floor((frame - startFrame) / speed)));
  const currentText = text.substring(0, typeProgress);
  
  // Blinking cursor logic (every 15 frames)
  const isBlinking = Math.floor(frame / 15) % 2 === 0;
  const isTypingFinished = typeProgress >= text.length;

  return (
    <span style={style} className={className}>
      {currentText}
      {showCursor && (!isTypingFinished || isBlinking) && (
        <span style={{ color: cursorColor, marginLeft: "2px" }}>|</span>
      )}
    </span>
  );
};
