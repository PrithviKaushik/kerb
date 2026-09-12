import React, { useState, useEffect } from "react";
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
        <div className="relative aspect-video w-full border border-kerb-tech bg-kerb-near-black">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c] to-kerb-black" />
          {/* Legal boundary */}
          <div className="absolute left-0 right-0 top-1/2 h-px bg-kerb-white" />
          <span className="absolute left-3 top-1/2 -translate-y-6 font-mono text-[9px] tracking-[0.15em] text-kerb-white/70 uppercase">
            LEGAL BOUNDARY
          </span>

          {/* Car body */}
          <div className="absolute left-1/2 top-1/2 h-16 w-32 -translate-x-1/2 -translate-y-1/2">
            <div className="h-full w-full rounded bg-[#1f1f1f]" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={state.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0"
            >
              {state.contacts.map((c) => (
                <div
                  key={c.label}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${c.x}%`, top: `${c.y}%` }}
                >
                  <span
                    className={`block h-5 w-5 rounded-full ${
                      c.state === "OUTSIDE"
                        ? "bg-kerb-red shadow-[0_0_24px_rgba(225,6,0,0.7)]"
                        : "bg-kerb-white ring-2 ring-kerb-red"
                    }`}
                  />
                  <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-[0.15em] text-kerb-muted uppercase">
                    {c.label} · {c.state}
                  </span>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
            STATE {state.key} · CONTACT REGIONS
          </div>
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