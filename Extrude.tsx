import React, { useId } from "react";
import { SolidExtrude } from "./SolidExtrude";

/** Draw any SVG silhouette (including text or multiple paths) with solid depth.
 * Face artwork uses the same local coordinates as the silhouette.
 * dx and dy project the depth onto the composition plane, in SVG units.
 */
function ProjectedExtrude({
  silhouette,
  children,
  dx = 12,
  dy = 18,
  side = "#46404d",
  face = "#f7f3eb",
}: {
  silhouette: React.ReactNode;
  children?: React.ReactNode;
  dx?: number;
  dy?: number;
  side?: string;
  face?: string;
}) {
  const id = "extrude" + useId().replace(/:/g, "");
  const steps = Math.ceil(Math.hypot(dx, dy) * 2);
  return (
    <g>
      <defs>
        <g id={id}>{silhouette}</g>
        <mask id={id + "Mask"} style={{ maskType: "alpha" }}>
          <use href={"#" + id} fill="white" />
        </mask>
      </defs>
      {Array.from({ length: steps }, (_, index) => {
        const fraction = (steps - index) / steps;
        return (
          <use
            key={index}
            href={"#" + id}
            fill={side}
            transform={"translate(" + dx * fraction + " " + dy * fraction + ")"}
          />
        );
      })}
      <use href={"#" + id} fill={face} />
      {children && <g mask={"url(#" + id + "Mask)"}>{children}</g>}
    </g>
  );
}

/** Use contour input for rotating, individually lit extrusion walls. */
export function Extrude(
  props:
    | React.ComponentProps<typeof SolidExtrude>
    | React.ComponentProps<typeof ProjectedExtrude>,
) {
  return "contours" in props ? (
    <SolidExtrude {...props} />
  ) : (
    <ProjectedExtrude {...props} />
  );
}
