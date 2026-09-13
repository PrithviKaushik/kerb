import React from "react";
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";

/* Supplied report evidence is intentionally rendered as raw public assets. */
/* eslint-disable @next/next/no-img-element */

const EVIDENCE_FRAMES = [
  ["PRE-EVENT", "/how-it-works-assets/pre.png"],
  ["EVENT FRAME", "/how-it-works-assets/event.png"],
  ["POST-EVENT", "/how-it-works-assets/post.png"],
];

export default function EvidencePackageSection() {
  return (
    <SectionShell id="evidence-package" label="EVIDENCE PACKAGE" title="From detection to case file.">
      <p className="max-w-2xl text-base leading-relaxed text-kerb-muted md:text-lg">
        Every candidate becomes a persistent report: AI assessment, evidence, trust, rules, and a
        separate steward review record.
      </p>

      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="mx-auto mt-10 max-w-3xl border border-kerb-red/40 bg-kerb-near-black">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kerb-tech px-5 py-4">
          <div><p className="font-mono text-[10px] tracking-[0.2em] text-kerb-red uppercase">REPORT DETAIL · RPT-0027</p><p className="mt-2 font-display text-2xl font-semibold uppercase">Austrian Grand Prix · Track 16</p></div>
          <span className="border border-kerb-red/50 px-3 py-1.5 font-mono text-[9px] tracking-[0.15em] text-kerb-red uppercase">PENDING REVIEW</span>
        </div>

        <div className="grid grid-cols-2 gap-px border-b border-kerb-tech bg-kerb-tech md:grid-cols-4">
          <Field label="TIMESTAMP" value="84.32s" />
          <Field label="FRAME" value="4216" />
          <Field label="AI ASSESSMENT" value="VIOLATION CANDIDATE" red />
          <Field label="TRUST" value="100 · HIGH" />
        </div>

        <div className="p-5">
          <p className="font-mono text-[10px] tracking-[0.18em] text-kerb-red uppercase">EVIDENCE FRAMES · DEVELOPMENT ASSETS</p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {EVIDENCE_FRAMES.map(([label, src]) => <div key={label} className="relative aspect-video overflow-hidden border border-kerb-tech bg-kerb-black"><span className="absolute inset-0 flex items-center justify-center font-mono text-[8px] tracking-[0.1em] text-kerb-white/30">ASSET NOT PROVIDED</span><img src={src} alt={`${label} evidence frame`} className="relative h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /><span className="absolute bottom-2 left-2 bg-black/75 px-1.5 py-0.5 font-mono text-[8px] text-kerb-white/70">{label}</span></div>)}
          </div>
        </div>

        <div className="grid gap-px border-t border-kerb-tech bg-kerb-tech md:grid-cols-3">
          <Field label="TEMPORAL EVIDENCE" value="3 / 5 SUPPORTING" />
          <Field label="CONTACT REGIONS" value="4 / 4 OUTSIDE" red />
          <Field label="APPLIED RULES" value="TL-001 · BD-001 · TM-001" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-kerb-tech px-5 py-5">
          <div><p className="font-mono text-[10px] tracking-[0.18em] text-kerb-white/40 uppercase">STEWARD REVIEW</p><p className="mt-2 font-display text-xl font-semibold uppercase">Decision required</p></div>
          <span className="border border-kerb-red/50 bg-kerb-red/[0.05] px-4 py-2 font-mono text-[10px] tracking-[0.16em] text-kerb-red uppercase">STEWARD REVIEW REQUIRED</span>
        </div>
      </motion.div>
    </SectionShell>
  );
}

function Field({ label, value, red = false }: { label: string; value: string; red?: boolean }) {
  return <div className="bg-kerb-black px-4 py-4"><p className="font-mono text-[9px] tracking-[0.16em] text-kerb-muted uppercase">{label}</p><p className={`mt-2 font-mono text-[11px] leading-snug ${red ? "text-kerb-red" : "text-kerb-white"}`}>{value}</p></div>;
}
