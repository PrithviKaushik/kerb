import React from "react";
/* Supplied media is intentionally rendered as raw assets from public/how-it-works-assets. */
/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";

const FRAMES = [
  { id: "PRE", src: "/how-it-works-assets/perception-frame-01.jpg" },
  { id: "EVENT", src: "/how-it-works-assets/perception-frame-02.jpg" },
  { id: "POST", src: "/how-it-works-assets/perception-frame-03.jpg" },
];

export default function PerceptionSection() {
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
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tracking-[0.15em] text-kerb-white/35 uppercase">ASSET NOT PROVIDED</span>
            <video src="/how-it-works-assets/57.mp4" autoPlay loop muted playsInline preload="auto" className="relative h-full w-full object-contain" aria-label="Supplied vehicle perception video" onError={(event) => { event.currentTarget.style.display = "none"; }} />
            <span className="absolute top-3 left-3 pointer-events-none bg-black/70 px-2 py-1 font-mono text-[9px] tracking-[0.15em] text-kerb-red uppercase">VEHICLE PERCEPTION · SUPPLIED VIDEO</span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            {FRAMES.map((frame) => <div key={frame.id} className="relative aspect-video overflow-hidden border border-kerb-tech bg-kerb-near-black"><span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] tracking-[0.1em] text-kerb-white/30">ASSET NOT PROVIDED</span><img src={frame.src} alt={`Perception ${frame.id} supplied frame`} className="relative h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /><span className="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 font-mono text-[8px] text-kerb-white/70">{frame.id}</span></div>)}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

interface FlowStepProps {
  label: string;
  sub: string;
}

function FlowStep({ label, sub }: FlowStepProps) {
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
