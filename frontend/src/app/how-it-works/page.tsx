"use client";

import Link from "next/link";
import { useState } from "react";
import { CommandWheel } from "@/components/command-wheel";
import { VideoStage } from "@/components/video-stage";
import { SECTORS } from "@/lib/track-limits";

const sector = SECTORS.find((s) => s.id === "how-it-works") ?? SECTORS[0];

const STEPS = [
  {
    n: "01",
    title: "Capture",
    body: "Trackside cameras, timing loops and GPS sample every car at racing speed.",
  },
  {
    n: "02",
    title: "Fuse",
    body: "Streams merge into one track model — the wheel you tapped is the whole pipeline.",
  },
  {
    n: "03",
    title: "Rule",
    body: "Breaches are flagged, evidenced and packaged for the stewards in seconds.",
  },
];

export default function HowItWorksPage() {
  const [glass, setGlass] = useState(false);

  return (
    <VideoStage glass={glass} src="/how-bg.mp4" soft>
      <Link
        href="/"
        className="absolute top-6 left-6 z-10 text-[11px] font-medium tracking-[0.32em] text-white/40 uppercase transition hover:text-white"
      >
        ← Kerb
      </Link>
      <p className="absolute top-6 right-6 z-10 hidden font-display text-sm font-semibold tracking-[0.28em] text-white/40 sm:block">
        KERB<span className="text-[#e10600]">.</span>
      </p>

      <CommandWheel activeId="how-it-works" onOpenChange={setGlass} />

      <section className="absolute inset-0 z-10 flex items-center justify-center px-5">
        <div className="w-full max-w-3xl pt-32 text-center">
          <p className="text-xs font-semibold tracking-[0.32em] text-[#ff3b4d] uppercase">
            {sector.code} · How it works
          </p>
          <h1 className="mt-3 font-display text-6xl leading-[0.95] font-semibold tracking-wide uppercase sm:text-7xl">
            How it works
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">
            {sector.description}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-white/10 bg-black/55 px-6 py-6 text-left backdrop-blur-md"
              >
                <p className="font-display text-sm font-semibold tracking-[0.3em] text-[#ff3b4d]">
                  {s.n}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-wider uppercase">
                  {s.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </VideoStage>
  );
}
