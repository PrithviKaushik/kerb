import React, { useState } from "react";
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";
import { TRUST_FACTORS } from "./data/kerbPipeline";

export default function TrustSection() {
  const [hovered, setHovered] = useState(null);
  const total = TRUST_FACTORS.reduce((a, f) => a + f.value, 0);

  return (
    <SectionShell
      id="trust"
      label="EVIDENCE TRUST"
      title="How strong is the evidence?"
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div className="flex flex-col items-center justify-center">
          <TrustMeter value={87} label="MEDIUM-HIGH" />
          <p className="mt-6 max-w-xs text-center text-[11px] leading-relaxed text-kerb-muted">
            A heuristic evidence-quality score, not a calibrated probability.
          </p>
        </div>

        <div>
          <p className="mb-6 font-mono text-[10px] tracking-[0.2em] text-kerb-muted uppercase">
            CONTRIBUTING FACTORS
          </p>
          <div className="space-y-px border-y border-kerb-tech">
            {TRUST_FACTORS.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                className={`flex items-center gap-4 py-4 transition-colors ${
                  hovered === i ? "bg-kerb-red/[0.04]" : ""
                }`}
              >
                <span className="font-mono text-[11px] tracking-[0.15em] text-kerb-white uppercase">
                  {f.label}
                </span>
                <div className="ml-auto flex items-center gap-3">
                  <div className="h-[3px] w-24 bg-kerb-tech">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(f.value / 15) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 + 0.1, duration: 0.6 }}
                      className="h-full bg-kerb-red"
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-sm tabular-nums text-kerb-red">
                    +{f.value}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between border border-kerb-tech bg-kerb-near-black px-5 py-4">
            <span className="font-mono text-[11px] tracking-[0.2em] text-kerb-muted uppercase">
              TOTAL
            </span>
            <span className="font-mono text-2xl font-bold text-kerb-white">{total}</span>
          </div>

          <div className="mt-4 border border-kerb-red/40 bg-kerb-red/[0.06] px-5 py-4">
            <p className="font-mono text-[11px] tracking-[0.2em] text-kerb-red uppercase">
              IF CONTACT REGIONS UNOBSERVABLE → TRUST CAPPED · UNCERTAIN
            </p>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function TrustMeter({ value, label }) {
  const r = 90;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="relative h-64 w-64">
      <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
        <circle cx="110" cy="110" r={r} fill="none" stroke="#242424" strokeWidth="6" />
        <motion.circle
          cx="110"
          cy="110"
          r={r}
          fill="none"
          stroke="#E10600"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, type: "spring" }}
          className="font-display text-6xl font-bold text-kerb-white"
        >
          {value}
        </motion.span>
        <span className="mt-1 font-mono text-[11px] tracking-[0.2em] text-kerb-red uppercase">
          {label}
        </span>
      </div>
    </div>
  );
}