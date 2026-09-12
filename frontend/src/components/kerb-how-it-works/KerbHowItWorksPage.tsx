"use client";

import React from "react";
import { ArrowUp } from "lucide-react";
import RadialNav from "@/components/kerb/RadialNav";
import HeroSection from "./HeroSection";
import ProblemSection from "./ProblemSection";
import PipelineSection from "./PipelineSection";
import PrioritizationSection from "./PrioritizationSection";
import PerceptionSection from "./PerceptionSection";
import ContactGeometrySection from "./ContactGeometrySection";
import BoundaryRelationSection from "./BoundaryRelationSection";
import FourOutsideSection from "./FourOutsideSection";
import TemporalSection from "./TemporalSection";
import TrustSection from "./TrustSection";
import RaceContextSection from "./RaceContextSection";
import VisionReasoningSection from "./VisionReasoningSection";
import EvidencePackageSection from "./EvidencePackageSection";
import StewardSection from "./StewardSection";
import FinalStatement from "./FinalStatement";

export default function KerbHowItWorksPage() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen w-full bg-kerb-black text-kerb-white antialiased selection:bg-kerb-red selection:text-kerb-white">
      <RadialNav active="how-it-works" />
      <HeroSection />
      <ProblemSection />
      <PipelineSection />
      <PrioritizationSection />
      <PerceptionSection />
      <ContactGeometrySection />
      <BoundaryRelationSection />
      <FourOutsideSection />
      <TemporalSection />
      <TrustSection />
      <RaceContextSection />
      <VisionReasoningSection />
      <EvidencePackageSection />
      <StewardSection />
      <FinalStatement />
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Back to top"
        className="fixed right-5 bottom-5 z-30 flex h-11 w-11 items-center justify-center border border-kerb-white/20 bg-kerb-near-black/90 text-kerb-white backdrop-blur-sm transition-colors hover:border-kerb-red hover:text-kerb-red focus-visible:ring-2 focus-visible:ring-kerb-red focus-visible:outline-none md:right-8 md:bottom-8"
      >
        <ArrowUp size={18} strokeWidth={1.8} />
      </button>
    </main>
  );
}
