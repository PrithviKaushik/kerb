"use client";

import React from "react";

interface EvidenceProgressItem {
  title: string;
}

interface EvidenceProgressProps {
  index: number;
  total: number;
  item?: EvidenceProgressItem | null;
}

// Race-position style progress indicator (not a generic pagination row).
export default function EvidenceProgress({
  index,
  total,
  item,
}: EvidenceProgressProps) {
  const cur = String(index + 1).padStart(2, "0");
  const tot = String(total).padStart(2, "0");

  return (
    <div className="absolute left-5 top-24 z-40 sm:left-8 sm:top-28">
      <div className="font-mono-tech text-[11px] tracking-[0.3em] text-white/40">
        <span className="text-kerb-red">{cur}</span> / {tot}
      </div>

      {item && (
        <div className="mt-1 font-mono-tech text-[10px] tracking-[0.25em] text-white/55">
          {item.title}
        </div>
      )}
    </div>
  );
}