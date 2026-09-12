import React from "react";
import { cn } from "@/lib/utlis";

export default function TechnicalLabel({ children, className, accent = false }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.2em] uppercase",
        accent ? "text-kerb-red" : "text-kerb-muted",
        className
      )}
    >
      <span className={cn("h-[6px] w-[6px]", accent ? "bg-kerb-red" : "bg-kerb-muted/60")} />
      {children}
    </span>
  );
}

export function HudCoord({ x, y, className }) {
  return (
    <span className={cn("font-mono text-[10px] tracking-tighter text-kerb-muted/70", className)}>
      [X: {x} · Y: {y}]
    </span>
  );
}
