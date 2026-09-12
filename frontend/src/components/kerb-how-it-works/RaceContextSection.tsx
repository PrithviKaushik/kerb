import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";

export default function RaceContextSection() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setT((v) => (v + 1) % 100), 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <SectionShell
      id="race-context"
      label="RACE CONTEXT"
      title="Geometry tells us what happened. Context helps explain why it matters."
    >
      <div className="grid gap-px border border-kerb-tech bg-kerb-tech md:grid-cols-3">
        <Panel title="VIDEO" tag="CAM 04">
          <p className="font-mono text-sm tracking-[0.15em] text-kerb-white">CAR #16</p>
          <p className="mt-1 font-mono text-sm tracking-[0.15em] text-kerb-muted">TURN 5</p>
          <p className="mt-1 font-mono text-sm tracking-[0.15em] text-kerb-red">CORNER EXIT</p>
          <div className="mt-6 aspect-video w-full border border-kerb-tech bg-gradient-to-br from-[#1a1a1a] to-kerb-black">
            <div className="flex h-full items-center justify-center">
              <div className="h-3 w-16 rounded bg-kerb-red/70" />
            </div>
          </div>
        </Panel>

        <Panel title="TELEMETRY" tag="LIVE">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-bold text-kerb-white">214</span>
            <span className="font-mono text-[11px] tracking-[0.15em] text-kerb-muted uppercase">KM/H</span>
          </div>
          <div className="mt-4 space-y-2">
            <Bar label="BRAKING" value={t % 100} />
            <Bar label="THROTTLE" value={72} />
          </div>
        </Panel>

        <Panel title="RACE CONTEXT" tag="SITUATION">
          <p className="font-mono text-sm tracking-[0.15em] text-kerb-white">2 CARS NEARBY</p>
          <p className="mt-1 font-mono text-sm tracking-[0.15em] text-kerb-red">SIDE-BY-SIDE</p>
          <p className="mt-1 font-mono text-sm tracking-[0.15em] text-kerb-muted">OVERTAKING CONTEXT</p>
          <div className="mt-6 flex gap-2">
            <CarDot n="16" active />
            <CarDot n="04" />
          </div>
        </Panel>
      </div>

      {/* Synchronized timeline cursor */}
      <div className="relative mt-8 h-16 border border-kerb-tech bg-kerb-near-black">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-kerb-tech" />
        {[0, 25, 50, 75, 100].map((p) => (
          <div key={p} className="absolute top-1/2 h-2 w-px -translate-y-1/2 bg-kerb-muted/50" style={{ left: `${p}%` }} />
        ))}
        <motion.div
          className="absolute top-0 bottom-0 w-px bg-kerb-red"
          style={{ left: `${t}%` }}
        >
          <span className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-[0.15em] text-kerb-red uppercase">
            T = 01:24.320
          </span>
          <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 bg-kerb-red" />
        </motion.div>
        <span className="absolute bottom-1 left-3 font-mono text-[9px] tracking-[0.15em] text-kerb-muted uppercase">
          SYNCHRONIZED TIMELINE
        </span>
      </div>
    </SectionShell>
  );
}

function Panel({ title, tag, children }) {
  return (
    <div className="bg-kerb-black p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] text-kerb-muted uppercase">{title}</span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-kerb-red uppercase">{tag}</span>
      </div>
      {children}
    </div>
  );
}

function Bar({ label, value }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
        <span>{label}</span>
        <span className="text-kerb-white">{Math.round(value)}%</span>
      </div>
      <div className="mt-1 h-[3px] w-full bg-kerb-tech">
        <div className="h-full bg-kerb-red" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function CarDot({ n, active }) {
  return (
    <div className="flex items-center gap-2 border border-kerb-tech px-3 py-2">
      <span className={`h-2 w-2 ${active ? "bg-kerb-red" : "bg-kerb-muted"}`} />
      <span className="font-mono text-[11px] tracking-[0.15em] text-kerb-white">#{n}</span>
    </div>
  );
}