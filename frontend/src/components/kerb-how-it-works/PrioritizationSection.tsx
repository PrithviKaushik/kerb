import React, { useEffect, useState } from "react";
/* Supplied prioritization visuals are intentionally rendered as raw public assets. */
/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";
import { PRIORITIZATION_FACTORS } from "./data/kerbPipeline";

const PRIORITY_IMAGES = ["/how-it-works-assets/1.png", "/how-it-works-assets/2.png", "/how-it-works-assets/3.png"];

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
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveImage((current) => (current + 1) % PRIORITY_IMAGES.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative aspect-square w-full overflow-hidden border border-kerb-tech bg-kerb-near-black">
      <div className="absolute inset-0 flex items-center justify-center font-mono text-[9px] tracking-[0.12em] text-kerb-white/30 uppercase">ASSET NOT PROVIDED</div>
      {PRIORITY_IMAGES.map((src, index) => <img key={src} src={src} alt={`Incident prioritization visual ${index + 1}`} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${index === activeImage ? "opacity-100" : "opacity-0"}`} onError={(event) => { event.currentTarget.style.display = "none"; }} />)}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 to-transparent p-4"><span className="font-mono text-[10px] tracking-[0.15em] text-kerb-white/70 uppercase">INCIDENT PRIORITIZATION · {activeImage + 1} / 3</span><span className="font-mono text-[10px] tracking-[0.15em] text-kerb-red uppercase">● REVIEW PRIORITY</span></div>
    </div>
  );
}
