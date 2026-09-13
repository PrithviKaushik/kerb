import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utlis";

interface PipelineStage {
  label: string;
  desc: string;
}

interface PipelineNodeProps {
  stage: PipelineStage;
  index: number;
  active?: boolean;
  complete?: boolean;
}

export default function PipelineNode({ stage, index, active = false, complete = false }: PipelineNodeProps) {
  return (
    <div className="group relative">
      <div
        className={cn(
          "flex items-center gap-3 border-l-2 py-3 pl-4 transition-all duration-500",
          active
            ? "border-kerb-red bg-kerb-red/[0.04]"
            : complete
            ? "border-kerb-white/80"
            : "border-kerb-tech group-hover:translate-x-1 group-hover:border-kerb-red/70 group-hover:bg-kerb-white/[0.02]"
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
      <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-72 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100">
        <div className="relative overflow-hidden border border-kerb-red/30 bg-kerb-near-black/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
          <div className="absolute inset-y-0 left-0 w-px bg-kerb-red" />
          <div className="mb-3 flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-kerb-red shadow-[0_0_12px_rgba(225,6,0,0.8)]" />
            <p className="font-mono text-[10px] tracking-[0.18em] text-kerb-red uppercase">
              STAGE {String(index + 1).padStart(2, "0")}
            </p>
          </div>
          <p className="font-mono text-[12px] tracking-[0.12em] text-kerb-white uppercase">
            {stage.label}
          </p>
          <p className="mt-2 text-[12px] leading-relaxed text-kerb-white/60">{stage.desc}</p>
        </div>
      </div>
    </div>
  );
}
