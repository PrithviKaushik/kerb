import React from "react";
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

      <EvidenceCircuit
        items={EVIDENCE_ITEMS}
      />

      <LiveEvidenceSummary />

      <EvidenceSummary />
    </main>
  );
}
