import React from "react";
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
    <div className="relative aspect-square w-full border border-kerb-tech bg-kerb-near-black">
      {/* Track surface */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c0c] to-kerb-black" />
      {/* Legal boundary line */}
      <div className="absolute left-0 right-0 top-1/2 h-px bg-kerb-white" />
      <span className="absolute left-3 top-1/2 -translate-y-6 font-mono text-[9px] tracking-[0.15em] text-kerb-white/70 uppercase">
        LEGAL BOUNDARY
      </span>
      <span className="absolute left-3 top-1/2 translate-y-2 font-mono text-[9px] tracking-[0.15em] text-kerb-muted uppercase">
        OUTSIDE
      </span>

      {/* Contact regions at various positions */}
      <Dot x={22} y={38} state="INSIDE" label="INSIDE" />
      <Dot x={42} y={50} state="ON LINE" label="ON LINE" />
      <Dot x={64} y={62} state="OUTSIDE" label="OUTSIDE" red />
      <Dot x={82} y={40} state="UNCERTAIN" label="UNCERTAIN" />

      <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
        BOUNDARY RELATION
      </div>
    </div>
  );
}

interface DotProps {
  x: number;
  y: number;
  state: string;
  label: string;
  red?: boolean;
}

function Dot({ x, y, label, red }: DotProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 200 }}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span
        className={`block h-4 w-4 rounded-full ${
          red ? "bg-kerb-red shadow-[0_0_20px_rgba(225,6,0,0.6)]" : "bg-kerb-white"
        }`}
      />
      <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-mono text-[9px] tracking-[0.15em] text-kerb-muted uppercase">
        {label}
      </span>
    </motion.div>
  );
}