"use client";

import React from "react";

interface EvidenceMetadataItem {
  car?: string | number | null;
  lap?: string | number | null;
  turn?: string | number | null;
  timestamp?: string | number | null;
  measurement?: string | number | null;
  status?: string | null;
  state?: string | null;
  trustScore?: number | null;
  trustBand?: string | null;
}

interface FieldProps {
  label: string;
  value?: string | number | null;
}

function Field({ label, value }: FieldProps) {
  if (value == null || value === "") return null;

  return (
    <span className="inline-flex items-baseline gap-2">
      <span className="text-white/35">{label}</span>
      <span className="text-white/90">{value}</span>
    </span>
  );
}

// Contextual information for the active evidence item. Data-driven: only
// available fields render, so real system output can populate it later.
export default function EvidenceMetadata({
  item,
}: {
  item?: EvidenceMetadataItem | null;
}) {
  if (!item) return null;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 font-mono-tech text-[11px] text-white/65">
      <Field label="CAR" value={item.car} />
      <Field label="LAP" value={item.lap} />
      <Field label="TURN" value={item.turn} />
      <Field label="TIME" value={item.timestamp} />
      <Field label="DELTA" value={item.measurement} />

      <Field label="AI" value={item.state} />
      {item.trustScore != null && (
        <Field label="TRUST" value={`${item.trustScore} · ${item.trustBand ?? ""}`} />
      )}

      {item.status && (
        <span className="ml-1 rounded-full border border-kerb-red/40 bg-kerb-red/10 px-3 py-1 text-[10px] tracking-[0.2em] text-kerb-red">
          {item.status}
        </span>
      )}
    </div>
  );
}