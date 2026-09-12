import React from "react";
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";

const OBSERVATIONS = [
  { label: "CORNER EXIT", active: true },
  { label: "NEARBY VEHICLE", active: true },
  { label: "BOUNDARY VISIBLE", active: true },
  { label: "PARTIAL OCCLUSION", active: false },
];

export default function VisionReasoningSection() {
  return (
    <SectionShell
      id="vision-reasoning"
      label="MULTIMODAL VISUAL REASONING"
      title="Vision provides context. Rules make the decision logic inspectable."
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <p className="max-w-md text-base leading-relaxed text-kerb-muted">
            The multimodal model describes and contextualizes evidence — what the clip shows, what
            the situation is. Deterministic geometry and sporting rules remain inspectable and
            final. The model is not the sporting decision-maker.
          </p>

          <div className="mt-10 space-y-px border-y border-kerb-tech">
            {OBSERVATIONS.map((o, i) => (
              <motion.div
                key={o.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 py-4"
              >
                <span
                  className={`h-2 w-2 ${o.active ? "bg-kerb-red" : "border border-kerb-muted"}`}
                />
                <span
                  className={`font-mono text-sm tracking-[0.15em] ${
                    o.active ? "text-kerb-white" : "text-kerb-muted/50"
                  }`}
                >
                  {o.label}
                </span>
                <span className="ml-auto font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
                  {o.active ? "OBSERVED" : "N/A"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div className="space-y-3">
            <FlowBlock label="INCIDENT CLIP" />
            <Arrow />
            <FlowBlock label="VISUAL CONTEXT" />
            <Arrow />
            <FlowBlock label="RACE CONTEXT" />
            <Arrow />
            <FlowBlock label="STEWARD SUMMARY" highlight />
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function FlowBlock({ label, highlight }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`border px-5 py-4 ${
        highlight ? "border-kerb-red bg-kerb-red/[0.06]" : "border-kerb-tech bg-kerb-near-black"
      }`}
    >
      <p
        className={`font-mono text-sm tracking-[0.15em] ${
          highlight ? "text-kerb-red" : "text-kerb-white"
        }`}
      >
        {label}
      </p>
    </motion.div>
  );
}

function Arrow() {
  return <div className="ml-3 font-mono text-kerb-muted">↓</div>;
}