import React, { useRef } from "react";
import { motion, useScroll } from "framer-motion";
import SectionShell from "./SectionShell";
import PipelineNode from "./PipelineNode";
import { PIPELINE_STAGES } from "./data/kerbPipeline";

export default function PipelineSection() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });

  return (
    <SectionShell
      id="pipeline"
      label="THE PIPELINE"
      title="One frame's journey from camera to steward."
      ref={ref}
    >
      <p className="max-w-2xl text-base leading-relaxed text-kerb-muted md:text-lg">
        Each stage is deterministic and inspectable. Nothing is a black box. Scroll to advance the
        pipeline.
      </p>

      <div className="mt-16 grid gap-10 md:grid-cols-[1fr_320px]">
        {/* Vertical pipeline */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-kerb-tech" />
          <motion.div
            style={{ scaleY: scrollYProgress }}
            className="absolute left-0 top-0 bottom-0 w-px origin-top bg-kerb-red"
          />
          <div className="space-y-1">
            {PIPELINE_STAGES.map((stage, i) => (
              <PipelineNode
                key={stage.id}
                stage={stage}
                index={i}
                active={false}
                complete={false}
              />
            ))}
          </div>
        </div>

        {/* Stage readout */}
        <div className="sticky top-24 h-fit border border-kerb-tech bg-kerb-near-black p-6">
          <p className="font-mono text-[10px] tracking-[0.2em] text-kerb-red uppercase">PIPELINE</p>
          <p className="mt-3 font-display text-2xl font-bold text-kerb-white">11 STAGES</p>
          <p className="mt-3 text-sm leading-relaxed text-kerb-muted">
            Deterministic. Inspectable. No black boxes. The red line tracks your scroll through the
            processing chain.
          </p>
          <div className="mt-6 flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
            <span className="h-[6px] w-[6px] animate-pulse bg-kerb-red" />
            SYSTEM PROCESSING
          </div>
        </div>
      </div>
    </SectionShell>
  );
}