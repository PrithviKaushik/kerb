import React from "react";
import Link from "next/link";
import RadialNav from "@/components/kerb/RadialNav";
import EvidenceIntro from "@/components/evidence/EvidenceIntro";
import EvidenceCircuit from "@/components/evidence/EvidenceCircuit";
import EvidenceSummary from "@/components/evidence/EvidenceSummary";
import LiveEvidenceSummary from "@/components/evidence/LiveEvidenceSummary";
import { EVIDENCE_ITEMS } from "@/data/evidence";

export default function Evidence() {
  return (
    <main className="relative min-h-screen bg-[hsl(var(--kerb-bg))] text-kerb-white">
      <RadialNav active="evidence" />

      <EvidenceIntro />

      <div className="mx-auto max-w-5xl px-5 py-4">
        <Link
          href="/demo"
          className="kerb-eyebrow inline-flex items-center gap-2 text-kerb-red transition hover:text-white"
        >
          See the real A5 clip run through every skill → /demo
        </Link>
      </div>

      <EvidenceCircuit
        items={EVIDENCE_ITEMS}
      />

      <LiveEvidenceSummary />

      <EvidenceSummary />
    </main>
  );
}
