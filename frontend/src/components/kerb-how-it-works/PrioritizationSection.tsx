import React from "react";
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";
import { PRIORITIZATION_FACTORS } from "./data/kerbPipeline";

// Risk map around a stylized track
const RISK_POINTS = [
  { x: 120, y: 90, r: 0.2 },
  { x: 300, y: 70, r: 0.5 },
  { x: 480, y: 95, r: 0.92 },
  { x: 620, y: 180, r: 0.7 },
  { x: 540, y: 300, r: 0.4 },
  { x: 320, y: 320, r: 0.85 },
  { x: 150, y: 250, r: 0.3 },
];

export default function PrioritizationSection() {
  return (
    <SectionShell
      id="prioritization"
      label="INCIDENT PRIORITIZATION"
      title="Not every frame deserves equal attention."
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <p className="max-w-md text-base leading-relaxed text-kerb-muted">
            KERB weights computational attention by situational risk — corner exit, boundary
            proximity, overtaking context. Risk prioritizes attention. It does not decide the
            sporting outcome.
          </p>
          <div className="mt-10 space-y-3">
            {PRIORITIZATION_FACTORS.map((f, i) => (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] tracking-[0.15em] text-kerb-white uppercase">
                    {f.label}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-kerb-muted">
                    {Math.round(f.weight * 100)}%
                  </span>
                </div>
                <div className="mt-1.5 h-[3px] w-full bg-kerb-tech">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${f.weight * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 + 0.1, duration: 0.7, ease: "easeOut" }}
                    className={f.weight > 0.8 ? "h-full bg-kerb-red" : "h-full bg-kerb-white/70"}
                  />
                </div>
                <p className="mt-1 text-[11px] text-kerb-muted">{f.note}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative">
          <RiskMap />
        </div>
      </div>
    </SectionShell>
  );
}

function RiskMap() {
  return (
    <div className="relative aspect-square w-full border border-kerb-tech bg-kerb-near-black">
      <svg viewBox="0 0 700 400" className="h-full w-full">
        <path
          d="M80,200 C120,90 260,60 350,90 C440,120 480,60 600,110 C660,140 660,260 580,300 C460,360 300,330 200,310 C110,290 60,260 80,200 Z"
          fill="none"
          stroke="#242424"
          strokeWidth="2"
          strokeDasharray="3 5"
        />
        {RISK_POINTS.map((p, i) => {
          const hot = p.r > 0.75;
          return (
            <g key={i}>
              {hot && (
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  r="22"
                  fill="none"
                  stroke="#E10600"
                  strokeWidth="1"
                  initial={{ scale: 0.4, opacity: 0 }}
                  whileInView={{ scale: [0.4, 1.2, 1], opacity: [0, 0.8, 0.3] }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 1.2, repeat: Infinity, repeatType: "reverse" }}
                />
              )}
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={hot ? 5 : 3}
                fill={hot ? "#E10600" : p.r > 0.5 ? "#777777" : "#242424"}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
        RISK MAP · TURN 5 ZONE
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[10px] tracking-[0.15em] text-kerb-red uppercase">
        ● HIGH ATTENTION
      </div>
    </div>
  );
}