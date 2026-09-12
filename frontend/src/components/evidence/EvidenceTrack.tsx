"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utlis";

interface ViewBox {
  w: number;
  h: number;
}

interface ActivePoint {
  x: number;
  y: number;
}

interface EvidenceTrackProps {
  pathD: string;
  viewBox: ViewBox;
  exploredPct?: number;
  activePoint?: ActivePoint | null;
  reduced?: boolean;
  className?: string;
}

// The luminous vector racing line. Base = low-opacity red (unexplored),
// overlay = white up to the explored percentage, active marker = red-white point.
const EvidenceTrack = forwardRef<
  SVGPathElement,
  EvidenceTrackProps
>(function EvidenceTrack(
  {
    pathD,
    viewBox,
    exploredPct = 0,
    activePoint,
    reduced = false,
    className,
  },
  ref
) {
  const { w, h } = viewBox;

  return (
    <svg
      className={cn(
        "absolute left-0 top-0",
        className
      )}
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <filter
          id="kerb-track-glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur
            stdDeviation="5"
            result="b"
          />

          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* base red line — unexplored */}
      <path
        ref={ref}
        d={pathD}
        stroke="hsl(var(--kerb-red-deep) / 0.5)"
        strokeWidth={2}
        strokeLinecap="round"
      />

      {/* explored white overlay */}
      <path
        d={pathD}
        stroke="hsl(var(--kerb-white))"
        strokeWidth={2}
        strokeLinecap="round"
        pathLength={100}
        strokeDasharray={`${exploredPct * 100} 100`}
        style={{
          transition: reduced
            ? "none"
            : "stroke-dasharray 0.35s ease",
        }}
      />

      {/* active red-white marker */}
      {activePoint && (
        <g filter="url(#kerb-track-glow)">
          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r={7}
            fill="hsl(var(--kerb-white))"
          />

          <circle
            cx={activePoint.x}
            cy={activePoint.y}
            r={3.5}
            fill="hsl(var(--kerb-red))"
          />
        </g>
      )}
    </svg>
  );
});

EvidenceTrack.displayName = "EvidenceTrack";

export default EvidenceTrack;