import React, { useState, useEffect } from "react";
/* Supplied rule visuals are intentionally rendered as raw public assets. */
/* eslint-disable @next/next/no-img-element */
import { motion, AnimatePresence } from "framer-motion";
import SectionShell from "./SectionShell";

// State A: 3 outside, 1 on line (touching) => NOT A VIOLATION
// State B: all 4 outside => VIOLATION CANDIDATE
const STATES = [
  {
    key: "A",
    contacts: [
      { label: "FL", x: 30, y: 32, state: "OUTSIDE" },
      { label: "FR", x: 70, y: 32, state: "OUTSIDE" },
      { label: "RL", x: 30, y: 70, state: "ON LINE" },
      { label: "RR", x: 70, y: 70, state: "OUTSIDE" },
    ],
    verdict: "NOT A VIOLATION",
    sub: "ONE CONTACT REGION TOUCHES THE LINE",
    red: false,
  },
  {
    key: "B",
    contacts: [
      { label: "FL", x: 30, y: 32, state: "OUTSIDE" },
      { label: "FR", x: 70, y: 32, state: "OUTSIDE" },
      { label: "RL", x: 30, y: 70, state: "OUTSIDE" },
      { label: "RR", x: 70, y: 70, state: "OUTSIDE" },
    ],
    verdict: "VIOLATION CANDIDATE",
    sub: "ALL FOUR CONTACT REGIONS OUTSIDE",
    red: true,
  },
];

export default function FourOutsideSection() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % STATES.length), 2800);
    return () => clearInterval(t);
  }, []);

  const state = STATES[idx];

  return (
    <SectionShell
      id="four-outside"
      label="FOUR-OUTSIDE RULE"
      title="Four outside. Not two."
    >
      <p className="max-w-2xl text-base leading-relaxed text-kerb-muted md:text-lg">
        If any tire or contact region touches the legal line, it is not classified as outside. All
        four must be beyond the boundary to become a candidate. KERB never turns a geometric
        observation directly into a penalty.
      </p>

      <div className="mt-16 grid gap-12 md:grid-cols-[1.2fr_1fr] md:gap-20">
          <div className="relative aspect-video w-full overflow-hidden border border-kerb-tech bg-kerb-near-black">
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] tracking-[0.12em] text-kerb-white/30 uppercase">ASSET NOT PROVIDED</span>
            <img src={state.key === "A" ? "/how-it-works-assets/partial.jpg" : "/how-it-works-assets/full.jpg"} alt={state.key === "A" ? "Partial four-outside rule visual" : "Full four-outside rule visual"} className="relative h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
            <div className="absolute bottom-4 left-4 bg-black/75 px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-kerb-white/70 uppercase">STATE {state.key} · SUPPLIED FRAME</div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex gap-2">
            {STATES.map((s, i) => (
              <button
                key={s.key}
                onClick={() => setIdx(i)}
                className={`h-1 flex-1 transition-colors ${i === idx ? "bg-kerb-red" : "bg-kerb-tech"}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={state.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mt-8"
            >
              <p
                className={`font-mono text-[11px] tracking-[0.2em] uppercase ${
                  state.red ? "text-kerb-red" : "text-kerb-muted"
                }`}
              >
                {state.sub}
              </p>
              <p
                className={`mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl ${
                  state.red ? "text-kerb-red" : "text-kerb-white"
                }`}
              >
                {state.verdict}
              </p>
              <div className="mt-6 grid grid-cols-4 gap-px border border-kerb-tech bg-kerb-tech">
                {state.contacts.map((c) => (
                  <div key={c.label} className="bg-kerb-black p-3 text-center">
                    <p className="font-mono text-[9px] tracking-[0.15em] text-kerb-muted">{c.label}</p>
                    <p
                      className={`mt-1 font-mono text-[10px] tracking-[0.1em] ${
                        c.state === "OUTSIDE" ? "text-kerb-red" : "text-kerb-white"
                      }`}
                    >
                      {c.state}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </SectionShell>
  );
}
