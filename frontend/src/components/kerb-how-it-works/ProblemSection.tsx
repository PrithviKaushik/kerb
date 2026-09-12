import React from "react";
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";

// A race timeline: many low-priority dots, one highlighted incident
const MOMENTS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  risk: Math.random(),
  incident: i === 41,
}));

export default function ProblemSection() {
  return (
    <SectionShell
      id="problem"
      label="THE PROBLEM"
      title="A race contains thousands of moments. Stewards cannot inspect them all equally."
    >
      <div className="mt-8">
        <p className="max-w-2xl text-base leading-relaxed text-kerb-muted md:text-lg">
          Most frames are routine. A few carry the evidence that decides a race. KERB focuses
          attention where evidence matters.
        </p>

        <div className="mt-16 border-t border-kerb-tech pt-10">
          <div className="mb-4 flex items-center justify-between font-mono text-[10px] tracking-[0.2em] text-kerb-muted uppercase">
            <span>RACE TIMELINE · LAP 22 / 58</span>
            <span className="text-kerb-red">1 CANDIDATE SURFACED</span>
          </div>

          <div className="relative h-40 w-full">
            <div className="absolute left-0 right-0 top-1/2 h-px bg-kerb-tech" />
            <div className="relative flex h-full items-center justify-between gap-1">
              {MOMENTS.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scaleY: 0 }}
                  whileInView={{ opacity: 1, scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.012, duration: 0.3 }}
                  className="flex flex-1 flex-col items-center justify-center"
                >
                  <motion.div
                    className={
                      m.incident
                        ? "h-16 w-[3px] bg-kerb-red"
                        : m.risk > 0.7
                        ? "h-6 w-[2px] bg-kerb-muted/60"
                        : "h-2 w-[2px] bg-kerb-tech"
                    }
                  />
                  {m.incident && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.9 }}
                      className="mt-2 whitespace-nowrap font-mono text-[9px] tracking-[0.15em] text-kerb-red uppercase"
                    >
                      ◀ CANDIDATE
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-px border border-kerb-tech bg-kerb-tech">
            {[
              { k: "FRAMES / RACE", v: "~86,000" },
              { k: "INSPECTED EQUALLY", v: "IMPOSSIBLE" },
              { k: "KERB CANDIDATES", v: "PRIORITIZED" },
            ].map((s) => (
              <div key={s.k} className="bg-kerb-black p-5">
                <p className="font-mono text-[10px] tracking-[0.2em] text-kerb-muted uppercase">{s.k}</p>
                <p className="mt-2 font-display text-xl font-semibold text-kerb-white">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}