"use client";

import { useState } from "react";
import Link from "next/link";
import { CommandWheel } from "@/components/command-wheel";
import { VideoStage } from "@/components/video-stage";


export default function Home() {
  const [glass, setGlass] = useState(false);

  return (
    <VideoStage glass={glass}>
      {/* hint */}
      <p className="absolute top-6 right-6 z-10 text-[15px] font-medium tracking-[0.32em] text-white/40 uppercase">
        {glass ? "Tap hub to dock" : " Preserve the curve "}
      </p>
      <p className="absolute top-6 left-6 z-10 hidden font-display text-5xl font-semibold tracking-[0.4em] text-white/40 sm:block">
        KERB<span className="text-[#e10600]">.</span>
      </p>

      <CommandWheel onOpenChange={setGlass} />

      {/* hero — yields the stage when the wheel opens */}
      <section
        className={`absolute inset-0 z-10 flex items-center justify-center transition-all duration-500 ${
          glass ? "pointer-events-none -translate-y-6 opacity-0" : "opacity-100"
        }`}
      >
        <div className="pointer-events-auto max-w-3xl px-5 pt-28 text-center">
          <p className="py-2 text-lg font-semibold tracking-[0.45em] text-[#ff3b4d] uppercase">
            Kerb · Preserve the Curve
          </p>
          <p className="text-xs font-semibold tracking-[0.32em] text-[#ffffff] uppercase">
            F1 Track-Limit Intelligence
          </p>
          <h1 className="mt-4 font-display text-6xl leading-[0.95] font-semibold tracking-wide uppercase sm:text-8xl">
            Every millimetre
            <br />
            <span className="text-[#ff2e43]">under race control</span>
          </h1>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Link
              href="/demo"
              className="rounded-lg bg-[#ff2e43] px-6 py-3 text-xs font-bold uppercase tracking-[0.24em] text-white transition hover:brightness-110"
            >
              Run the live demo →
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-lg border border-white/20 px-6 py-3 text-xs font-bold uppercase tracking-[0.24em] text-white/80 transition hover:border-white/50"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

    </VideoStage>
  );
}
