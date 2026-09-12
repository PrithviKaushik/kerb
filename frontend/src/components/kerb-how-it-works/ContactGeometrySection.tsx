import React from "react";
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";

const CONTACTS = [
  { label: "FRONT LEFT", x: 28, y: 32, state: "OBSERVABLE" },
  { label: "FRONT RIGHT", x: 72, y: 32, state: "RELIABLE" },
  { label: "REAR LEFT", x: 28, y: 72, state: "OBSERVABLE" },
  { label: "REAR RIGHT", x: 72, y: 72, state: "UNCERTAIN" },
];

export default function ContactGeometrySection() {
  return (
    <SectionShell
      id="contact-geometry"
      label="CONTACT GEOMETRY"
      title="A bounding box is not a tire."
    >
      <div className="grid gap-12 md:grid-cols-2 md:gap-20">
        <div>
          <p className="max-w-md text-base leading-relaxed text-kerb-muted">
            KERB estimates four observable contact regions from vehicle geometry. Each region
            carries a visibility state — and a critical principle:{" "}
            <span className="text-kerb-white">invisible does not mean outside.</span>
          </p>

          <div className="mt-10 space-y-px border-y border-kerb-tech">
            {["OBSERVABLE", "RELIABLE", "UNCERTAIN"].map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 py-4"
              >
                <span
                  className={`h-2 w-2 ${
                    s === "UNCERTAIN" ? "bg-kerb-red" : s === "RELIABLE" ? "bg-kerb-white" : "bg-kerb-muted"
                  }`}
                />
                <span className="font-mono text-sm tracking-[0.15em] text-kerb-white">{s}</span>
                <span className="ml-auto font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
                  {s === "UNCERTAIN" ? "TRUST CAPPED" : s === "RELIABLE" ? "HIGH CONFIDENCE" : "USABLE"}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <VehicleWithContacts />
        </div>
      </div>
    </SectionShell>
  );
}

function VehicleWithContacts() {
  return (
    <div className="relative aspect-square w-full border border-kerb-tech bg-kerb-near-black">
      {/* Bounding box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 0.4 }}
        viewport={{ once: true }}
        className="absolute inset-[18%] border border-dashed border-kerb-white/40"
      >
        <span className="absolute -top-5 left-0 font-mono text-[9px] tracking-tighter text-kerb-muted">
          BOUNDING BOX
        </span>
      </motion.div>

      {/* Car body */}
      <div className="absolute left-1/2 top-1/2 h-20 w-40 -translate-x-1/2 -translate-y-1/2">
        <div className="relative h-full w-full rounded-md bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a]">
          <div className="absolute -top-2 left-1/2 h-6 w-24 -translate-x-1/2 rounded-t-lg bg-[#222]" />
          <div className="absolute left-2 top-1/2 h-1 w-6 -translate-y-1/2 bg-kerb-red/40" />
        </div>
      </div>

      {/* Contact regions */}
      {CONTACTS.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, scale: 0 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 200 }}
          className="group absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${c.x}%`, top: `${c.y}%` }}
        >
          <div className="relative">
            <span
              className={`block h-4 w-4 rounded-full ${
                c.state === "UNCERTAIN"
                  ? "border-2 border-dashed border-kerb-red bg-kerb-red/20"
                  : "bg-kerb-red"
              }`}
            />
            {c.state === "UNCERTAIN" && (
              <span className="absolute inset-0 animate-ping rounded-full border border-kerb-red/40" />
            )}
          </div>
          <div className="pointer-events-none absolute left-1/2 top-full mt-2 w-max -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="border border-kerb-tech bg-kerb-black px-2 py-1 text-center">
              <p className="font-mono text-[9px] tracking-[0.15em] text-kerb-white">{c.label}</p>
              <p className="font-mono text-[8px] tracking-[0.15em] text-kerb-red">{c.state}</p>
            </div>
          </div>
        </motion.div>
      ))}

      <div className="absolute bottom-4 left-4 font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
        CONTACT GEOMETRY · 4 REGIONS
      </div>
    </div>
  );
}