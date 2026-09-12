"use client";

import React from "react";
import { EVIDENCE_CHAIN } from "@/data/evidence";

export default function EvidenceSummary() {
  return (
    <section className="relative mx-auto max-w-5xl px-6 py-28 sm:py-40">
      <div className="kerb-eyebrow text-[11px] text-kerb-red">
        EVIDENCE / 02
      </div>

      <h2 className="mt-5 font-heading text-3xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
        FROM MOMENT
        <br />
        TO EVIDENCE.
      </h2>

      <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/55 sm:text-base">
        A race can produce thousands of frames. KERB isolates the moments that
        require attention and presents the relevant visual context for review.
      </p>

      <div className="mt-12 flex flex-wrap items-center gap-x-3 gap-y-3 font-mono-tech text-[11px] tracking-[0.2em] text-white/50">
        {EVIDENCE_CHAIN.map((s, i) => (
          <React.Fragment key={s}>
            <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5">
              {s}
            </span>

            {i < EVIDENCE_CHAIN.length - 1 && (
              <span className="text-kerb-red">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}