import React from "react";
import { motion } from "framer-motion";
import SectionShell from "./SectionShell";
import { INCIDENT } from "./data/kerbPipeline";

const PIECES = [
  { label: "VIDEO FRAME", delay: 0 },
  { label: "TRACK ID", delay: 0.1 },
  { label: "TIMESTAMP", delay: 0.2 },
  { label: "CONTACT REGIONS", delay: 0.3 },
  { label: "BOUNDARY", delay: 0.4 },
  { label: "TEMPORAL SUPPORT", delay: 0.5 },
  { label: "TRUST", delay: 0.6 },
  { label: "TELEMETRY", delay: 0.7 },
  { label: "RACE CONTEXT", delay: 0.8 },
];

export default function EvidencePackageSection() {
  return (
    <SectionShell
      id="evidence-package"
      label="EVIDENCE PACKAGE"
      title="From detection to case file."
    >
      <p className="max-w-2xl text-base leading-relaxed text-kerb-muted md:text-lg">
        Evidence pieces assemble into a single steward-ready incident card. Illustrative mock data
        — not live.
      </p>

      {/* Assembling pieces */}
      <div className="mt-12 flex flex-wrap gap-2">
        {PIECES.map((p) => (
          <motion.span
            key={p.label}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: p.delay, type: "spring", stiffness: 200 }}
            className="border border-kerb-tech bg-kerb-near-black px-3 py-1.5 font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase"
          >
            + {p.label}
          </motion.span>
        ))}
      </div>

      <div className="mx-auto mt-3 h-px max-w-md bg-gradient-to-r from-transparent via-kerb-red to-transparent" />

      {/* The incident card */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="mx-auto mt-10 max-w-2xl border border-kerb-red/40 bg-kerb-near-black"
      >
        <div className="flex items-center justify-between border-b border-kerb-tech px-6 py-4">
          <span className="font-mono text-[11px] tracking-[0.2em] text-kerb-red uppercase">
            POTENTIAL TRACK-LIMIT INCIDENT
          </span>
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.15em] text-kerb-muted uppercase">
            <span className="h-1.5 w-1.5 animate-pulse bg-kerb-red" /> MOCK DATA
          </span>
        </div>

        <div className="grid grid-cols-2 gap-px bg-kerb-tech">
          <Field k="CAR" v={INCIDENT.driver} />
          <Field k="TRACK ID" v={String(INCIDENT.trackId)} />
          <Field k="TIMESTAMP" v={INCIDENT.timestamp} />
          <Field k="LOCATION" v={INCIDENT.location} />
        </div>

        <div className="grid grid-cols-3 gap-px bg-kerb-tech">
          <Field k="FOUR OUTSIDE" v="CONFIRMED" red />
          <Field k="TEMPORAL" v={INCIDENT.temporalSupport} />
          <Field k="TRUST" v={`${INCIDENT.trust} · ${INCIDENT.trustLabel}`} />
        </div>

        {/* Frame strip */}
        <div className="grid grid-cols-3 gap-px bg-kerb-tech">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-video bg-gradient-to-br from-[#161616] to-kerb-black">
              <div className="flex h-full items-center justify-center">
                <div className="h-2 w-10 rounded bg-kerb-red/50" />
              </div>
              <span className="absolute m-2 font-mono text-[8px] tracking-[0.15em] text-kerb-muted uppercase">
                F0184{i}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-5">
          <span className="font-mono text-[11px] tracking-[0.2em] text-kerb-white uppercase">
            STEWARD REVIEW REQUIRED
          </span>
          <span className="border border-kerb-red px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-kerb-red uppercase">
            REQUEST REVIEW
          </span>
        </div>
      </motion.div>
    </SectionShell>
  );
}

function Field({ k, v, red }) {
  return (
    <div className="bg-kerb-black px-5 py-4">
      <p className="font-mono text-[10px] tracking-[0.2em] text-kerb-muted uppercase">{k}</p>
      <p className={`mt-1 font-mono text-sm tracking-[0.1em] ${red ? "text-kerb-red" : "text-kerb-white"}`}>
        {v}
      </p>
    </div>
  );
}