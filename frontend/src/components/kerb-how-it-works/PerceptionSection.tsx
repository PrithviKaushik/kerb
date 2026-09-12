import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SectionShell from "./SectionShell";

const FRAMES = [
  { id: "01840", x: 38, y: 42, w: 26, h: 30 },
  { id: "01841", x: 40, y: 44, w: 26, h: 30 },
  { id: "01842", x: 42, y: 46, w: 26, h: 30 },
];

export default function PerceptionSection() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <SectionShell
      id="perception"
      label="VEHICLE PERCEPTION"
      title="Find the car. Follow the car."
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <p className="max-w-md text-base leading-relaxed text-kerb-muted">
            Detection tells us what is visible. Tracking tells us which car we&apos;re following. A
            bounding box persists across frames while the track ID stays locked.
          </p>

          <div className="mt-10 space-y-6">
            <FlowStep label="YOLO" sub="DETECTION" />
            <FlowStep label="BYTE TRACK" sub="PERSISTENT ID" />
          </div>

          <div className="mt-10 border border-kerb-tech bg-kerb-near-black p-5">
            <p className="font-mono text-[10px] tracking-[0.2em] text-kerb-muted uppercase">TRACK ID</p>
            <div className="mt-2 flex items-baseline gap-3">
              <span className="font-display text-5xl font-bold text-kerb-red">16</span>
              <span className="font-mono text-[11px] tracking-[0.15em] text-kerb-muted uppercase">
                LOCKED · CONF 0.94
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="relative aspect-video w-full overflow-hidden border border-kerb-tech bg-kerb-near-black">
            {/* Mock race frame */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-kerb-black to-[#0f0f0f]" />
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 50% 60%, #242424 0%, transparent 70%)" }} />

            {/* Car silhouette */}
            <div className="absolute left-1/2 top-1/2 h-12 w-24 -translate-x-1/2 -translate-y-1/2">
              <div className="h-full w-full rounded-[3px] bg-kerb-red/80 shadow-[0_0_30px_rgba(225,6,0,0.4)]" />
              <div className="absolute -top-1 left-1/2 h-3 w-10 -translate-x-1/2 rounded-t-full bg-kerb-red/60" />
            </div>

            {/* Bounding box */}
            <AnimatePresence mode="wait">
              <motion.div
                key={frame}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute border border-kerb-white"
                style={{
                  left: `${FRAMES[frame].x}%`,
                  top: `${FRAMES[frame].y}%`,
                  width: `${FRAMES[frame].w}%`,
                  height: `${FRAMES[frame].h}%`,
                }}
              >
                <span className="absolute -top-5 left-0 whitespace-nowrap bg-kerb-white px-1.5 py-0.5 font-mono text-[9px] tracking-tighter text-kerb-black">
                  CAR #16 · ID 16 · 0.94
                </span>
                <span className="absolute -top-1 -left-1 h-2 w-2 border-l border-t border-kerb-white" />
                <span className="absolute -top-1 -right-1 h-2 w-2 border-r border-t border-kerb-white" />
                <span className="absolute -bottom-1 -left-1 h-2 w-2 border-l border-b border-kerb-white" />
                <span className="absolute -bottom-1 -right-1 h-2 w-2 border-r border-b border-kerb-white" />
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
              FRAME {FRAMES[frame].id}
            </div>
          </div>

          <div className="mt-3 flex gap-1.5">
            {FRAMES.map((f, i) => (
              <div
                key={f.id}
                className={`h-1 flex-1 ${i === frame ? "bg-kerb-red" : "bg-kerb-tech"}`}
              />
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

function FlowStep({ label, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="flex items-center gap-4"
    >
      <div className="border border-kerb-tech bg-kerb-near-black px-5 py-3">
        <p className="font-mono text-sm font-semibold tracking-[0.15em] text-kerb-white">{label}</p>
        <p className="font-mono text-[10px] tracking-[0.2em] text-kerb-muted uppercase">{sub}</p>
      </div>
      <div className="font-mono text-kerb-muted">↓</div>
    </motion.div>
  );
}
