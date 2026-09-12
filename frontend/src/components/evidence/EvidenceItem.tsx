"use client";

import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utlis";

interface EvidenceItemData {
  id?: string;
  label: string;
  title: string;
  image: string;
}

interface EvidenceItemStyle {
  left: number;
  top: number;
  zIndex: number;
}

interface EvidenceItemProps {
  item: EvidenceItemData;
  style: EvidenceItemStyle;
  scale: number;
  opacity: number;
  blur: number;
  rotation: number;
  active: boolean;
  reduced: boolean;
  onClick: () => void;
}

// A single evidence frame anchored to a point on the circuit.
// Position/orientation/scale/depth are driven by the parent circuit controller.
export default function EvidenceItem({
  item,
  style,
  scale,
  opacity,
  blur,
  rotation,
  active,
  reduced,
  onClick,
}: EvidenceItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Evidence ${item.label}, ${item.title}${
        active ? ", currently active" : ""
      }`}
      aria-current={active ? "true" : undefined}
      className="absolute origin-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-kerb-red/70"
      style={{
        left: style.left,
        top: style.top,
        zIndex: style.zIndex,
        transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
        opacity,
        filter: blur
          ? `blur(${blur}px)`
          : undefined,
        transition: reduced
          ? "transform 0.3s ease, opacity 0.3s ease"
          : "none",
        willChange: "transform, opacity",
      }}
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-md border bg-kerb-charcoal",
          active
            ? "border-kerb-red/70 kerb-red-glow"
            : "border-white/10"
        )}
      >
        <div className="h-[150px] w-[260px] sm:h-[170px] sm:w-[300px]">
          <Image
            src={item.image}
            alt={item.title}
            fittingType="fill"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/75 to-transparent px-3 py-2">
          <span className="font-mono-tech text-[11px] text-kerb-red">
            {item.label}
          </span>

          <span className="font-mono-tech text-[10px] text-white/70">
            {item.title}
          </span>
        </div>
      </div>
    </button>
  );
}