import React from "react";
/* Supplied perception media is intentionally rendered as a raw public asset. */
/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";

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
    <div className="relative aspect-square w-full overflow-hidden border border-kerb-tech bg-kerb-near-black">
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] tracking-[0.12em] text-kerb-white/30 uppercase">ASSET NOT PROVIDED</span>
      <img src="/how-it-works-assets/n.png" alt="Supplied perception frame showing contact geometry" className="relative h-full w-full object-contain" onError={(event) => { event.currentTarget.style.display = "none"; }} />
      <div className="absolute bottom-4 left-4 bg-black/75 px-2 py-1 font-mono text-[10px] tracking-[0.15em] text-kerb-white/70 uppercase">
        CONTACT GEOMETRY · SUPPLIED FRAME
      </div>
    </div>
  );
}
