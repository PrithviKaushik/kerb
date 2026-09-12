import React from "react";
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";
import { TEMPORAL_FRAMES } from "./data/kerbPipeline";

export default function TemporalSection() {
  const supported = TEMPORAL_FRAMES.filter((f) => f.supported).length;

  return (
    <SectionShell
      id="temporal"
      label="TEMPORAL VALIDATION"
      title="One frame is not enough."
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <p className="max-w-md text-base leading-relaxed text-kerb-muted">
            A single observation can be noise, motion blur, or occlusion. KERB requires temporal
            support across multiple frames before promoting an observation to an incident
            candidate.
          </p>

          <div className="mt-10 flex items-end gap-4">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-7xl font-bold text-kerb-red"
            >
              {supported}
            </motion.span>
            <span className="mb-2 font-mono text-2xl text-kerb-muted">/ 5</span>
            <span className="mb-3 font-mono text-[11px] tracking-[0.2em] text-kerb-white uppercase">
              SUPPORTED
            </span>
          </div>
          <div className="mt-2 h-1 w-full bg-kerb-tech">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(supported / 5) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-kerb-red"
            />
          </div>
        </div>

        <div>
          <div className="grid grid-cols-5 gap-px border border-kerb-tech bg-kerb-tech">
            {TEMPORAL_FRAMES.map((f, i) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="flex aspect-square flex-col items-center justify-center bg-kerb-near-black"
              >
                <span className="font-mono text-xs tracking-[0.15em] text-kerb-muted">{f.id}</span>
                <motion.span
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 + 0.2, type: "spring" }}
                  className={`mt-2 text-2xl ${f.supported ? "text-kerb-red" : "text-kerb-muted/40"}`}
                >
                  {f.supported ? "✓" : "✗"}
                </motion.span>
                <span className="mt-1 font-mono text-[8px] tracking-[0.15em] text-kerb-muted uppercase">
                  {f.supported ? "SUPPORT" : "NO"}
                </span>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
            <span>FRAME SEQUENCE</span>
            <span className="text-kerb-red">SIGNAL VALIDATION</span>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}