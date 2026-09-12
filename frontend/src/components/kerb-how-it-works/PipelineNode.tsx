import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utlis";

export default function PipelineNode({ stage, index, active, complete }) {
  return (
    <div className="group relative">
      <div
        className={cn(
          "flex items-center gap-3 border-l-2 pl-4 py-3 transition-colors duration-500",
          active
            ? "border-kerb-red bg-kerb-red/[0.04]"
            : complete
            ? "border-kerb-white/80"
            : "border-kerb-tech group-hover:border-kerb-muted/40"
        )}
      >
        <span
          className={cn(
            "font-mono text-[11px] tracking-tighter tabular-nums",
            active ? "text-kerb-red" : complete ? "text-kerb-white" : "text-kerb-muted/50"
          )}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <span
          className={cn(
            "font-mono text-[12px] tracking-[0.18em] uppercase transition-colors duration-500",
            active ? "text-kerb-white" : complete ? "text-kerb-white/80" : "text-kerb-muted/40"
          )}
        >
          {stage.label}
        </span>
        {complete && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto h-[6px] w-[6px] bg-kerb-red"
          />
        )}
      </div>
      <div className="pointer-events-none absolute left-4 top-full z-20 w-64 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="mt-2 border border-kerb-tech bg-kerb-near-black p-3">
          <p className="font-mono text-[10px] tracking-[0.15em] text-kerb-red uppercase">
            STAGE {String(index + 1).padStart(2, "0")}
          </p>
          <p className="mt-1 text-[12px] leading-snug text-kerb-white/80">{stage.desc}</p>
        </div>
      </div>
    </div>
  );
}
