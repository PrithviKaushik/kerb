"use client";

import React from "react";
import { motion } from "framer-motion";
import { Image } from "@/components/ui/image";
import { X } from "lucide-react";

interface EvidenceDetailItem {
  title: string;
  type: string;
  evidenceType?: string;
  image: string;
  label: string;
  trackId?: string;
  frame?: string;
  state?: string;
  trustScore?: number;
  trustBand?: string;
  contactRegions?: { name: string; state: string }[];
  boundary?: string;
  temporalSupport?: string;
  reasons?: string[];
  appliedRules?: string[];
  context?: string;

  summary?: string | null;
  car?: string | number | null;
  lap?: string | number | null;
  turn?: string | number | null;
  timestamp?: string | number | null;
  measurement?: string | number | null;
  status?: string | null;
}

interface EvidenceOrigin {
  x: number;
  y: number;
}

interface EvidenceDetailProps {
  item: EvidenceDetailItem;
  origin?: EvidenceOrigin | null;
  onClose: () => void;
  reduced: boolean;
}

interface FieldProps {
  label: string;
  value?: string | number | null;
}

function Field({ label, value }: FieldProps) {
  if (value == null || value === "") return null;

  return (
    <div>
      <div className="font-mono-tech text-[10px] tracking-[0.25em] text-white/35">
        {label}
      </div>

      <div className="mt-1 font-mono-tech text-sm text-white/90">
        {value}
      </div>
    </div>
  );
}

// Modular evidence detail panel. Expands from the active item's screen position.
// Renders only available fields so it supports image/video/annotated/telemetry/
// reconstructed evidence without hardcoding a single format.
export default function EvidenceDetail({
  item,
  origin,
  onClose,
  reduced,
}: EvidenceDetailProps) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const ox = origin
    ? origin.x - vw / 2
    : 0;

  const oy = origin
    ? origin.y - vh / 2
    : 0;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: reduced ? 0 : 0.3,
      }}
    >
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Evidence detail — ${item.title}`}
        initial={{
          opacity: 0,
          scale: 0.82,
          x: ox * 0.5,
          y: oy * 0.5,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          x: 0,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.85,
          x: ox * 0.35,
          y: oy * 0.35,
        }}
        transition={{
          duration: reduced ? 0 : 0.5,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="relative grid max-h-[90vh] w-full max-w-6xl grid-cols-1 overflow-hidden rounded-xl border border-white/12 bg-kerb-charcoal/95 sm:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close evidence detail"
          className="absolute right-3 top-3 z-10 rounded-full border border-white/15 bg-black/40 p-2 text-white/70 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-black/40 sm:min-h-0">
          <Image
            src={item.image}
            alt={item.title}
            fittingType="fit"
            className="h-auto max-h-[82vh] w-auto max-w-full object-contain"
          />

          <div className="absolute left-4 top-4 font-mono-tech text-[11px] tracking-[0.25em] text-kerb-red">
            {item.label}
          </div>
        </div>

        <div className="flex min-h-0 max-h-[90vh] flex-col gap-6 overflow-y-auto p-6 sm:p-8">
          <div>
            <div className="font-mono-tech text-[10px] tracking-[0.3em] text-white/40">
              {item.title}
            </div>

            <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              {item.evidenceType ?? item.type}
            </h3>
          </div>

          {item.summary && (
            <p className="text-sm leading-relaxed text-white/55">
              {item.summary}
            </p>
          )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-5">
            <Field label="CAR" value={item.car} />
            <Field label="TRACK" value={item.trackId} />
            <Field label="LAP" value={item.lap} />
            <Field label="TURN" value={item.turn} />
            <Field
              label="TIMESTAMP"
              value={item.timestamp}
            />
            <Field label="FRAME" value={item.frame} />
            <Field
              label="BOUNDARY DELTA"
              value={item.measurement}
            />
          </div>

          {item.context && (
            <p className="border-l border-kerb-red/60 pl-4 text-sm leading-relaxed text-white/65">
              {item.context}
            </p>
          )}

          {item.contactRegions && (
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.25em] text-white/35">
                APPROXIMATE CONTACT REGIONS
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {item.contactRegions.map((region) => (
                  <div key={region.name} className="border border-white/10 px-3 py-2">
                    <div className="font-mono-tech text-[9px] tracking-[0.12em] text-white/35">
                      {region.name}
                    </div>
                    <div className="mt-1 font-mono-tech text-[11px] text-white/80">
                      {region.state}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-y border-white/10 py-4">
            <Field label="AI ASSESSMENT" value={item.state} />
            <Field label="TRUST SCORE" value={item.trustScore != null ? `${item.trustScore} · ${item.trustBand ?? ""}` : undefined} />
            <Field label="BOUNDARY" value={item.boundary} />
            <Field label="TEMPORAL SUPPORT" value={item.temporalSupport} />
          </div>

          {item.reasons && item.reasons.length > 0 && (
            <div>
              <div className="font-mono-tech text-[10px] tracking-[0.25em] text-white/35">
                WHY KERB SURFACED THIS
              </div>
              <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-white/55">
                {item.reasons.map((reason) => <li key={reason}>+ {reason}</li>)}
              </ul>
            </div>
          )}

          {item.appliedRules && item.appliedRules.length > 0 && (
            <div className="font-mono-tech text-[10px] tracking-[0.18em] text-white/40">
              APPLIED RULES <span className="text-white/75">{item.appliedRules.join(" · ")}</span>
            </div>
          )}

          {item.status && (
            <div className="mt-1 inline-flex w-fit items-center rounded-full border border-kerb-red/40 bg-kerb-red/10 px-4 py-2 font-mono-tech text-[11px] tracking-[0.2em] text-kerb-red">
              {item.status}
            </div>
          )}

          <p className="mt-auto border-t border-white/10 pt-4 text-[11px] leading-relaxed text-white/35">
            STEWARD REVIEW REQUIRED · HUMAN DECISION: TRACK LIMIT EXCEEDED OR
            TRACK LIMIT NOT EXCEEDED.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}