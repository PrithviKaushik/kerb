import React from "react";
/* Supplied boundary media is intentionally rendered as a raw public asset. */
/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";

const STATES = [
  { label: "INSIDE", color: "bg-kerb-white", dot: "#F5F5F5", desc: "Region within legal track surface" },
  { label: "ON LINE", color: "bg-kerb-white/60", dot: "#777777", desc: "Touching the legal boundary" },
  { label: "OUTSIDE", color: "bg-kerb-red", dot: "#E10600", desc: "Region beyond the legal line" },
  { label: "UNCERTAIN", color: "bg-kerb-muted/40", dot: "#242424", desc: "Visibility insufficient to classify" },
];

export default function BoundaryRelationSection() {
  return (
    <SectionShell
      id="boundary-relation"
      label="BOUNDARY RELATION"
      title="Where does each region sit relative to the legal line?"
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <p className="max-w-md text-base leading-relaxed text-kerb-muted">
            A single thin white line defines the legal track boundary. KERB classifies each contact
            region against it. Red marks OUTSIDE — the state that drives critical analysis.
          </p>
          <div className="mt-10 space-y-px">
            {STATES.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex items-center gap-4 border-l-2 border-kerb-tech py-4 pl-4"
              >
                <span className={`h-3 w-3 ${s.color}`} />
                <div>
                  <p className="font-mono text-sm tracking-[0.15em] text-kerb-white">{s.label}</p>
                  <p className="text-[11px] text-kerb-muted">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <BoundaryDiagram />
      </div>
    </SectionShell>
  );
}

function BoundaryDiagram() {
  return (
    <div className="relative aspect-square w-full overflow-hidden border border-kerb-tech bg-kerb-near-black">
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] tracking-[0.12em] text-kerb-white/30 uppercase">ASSET NOT PROVIDED</span>
      <img src="/how-it-works-assets/br.jpeg" alt="Supplied boundary relation visual" className="relative h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} />
      <div className="absolute bottom-4 left-4 bg-black/75 px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-kerb-white/70 uppercase">BOUNDARY RELATION · SUPPLIED FRAME</div>
    </div>
  );
}

