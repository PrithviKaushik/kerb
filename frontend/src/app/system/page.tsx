"use client";

import Link from "next/link";
import { useState } from "react";
import { CommandWheel } from "@/components/command-wheel";
import { VideoStage } from "@/components/video-stage";
import { SECTORS } from "@/lib/track-limits";

const sector = SECTORS.find((s) => s.id === "system") ?? SECTORS[0];

const FEEDS = [
  { name: "Timing feed", meta: "FIA loop · 500 Hz", latency: "12 ms" },
  { name: "Track sensors", meta: "28 kerb arrays", latency: "18 ms" },
  { name: "Review service", meta: "3 stewards online", latency: "24 ms" },
];

export default function SystemPage() {
  const [glass, setGlass] = useState(false);

  return (
    <VideoStage glass={glass} src="/sys-bg.mp4">
      <Link
        href="/"
        className="absolute top-6 left-6 z-10 text-[11px] font-medium tracking-[0.32em] text-white/40 uppercase transition hover:text-white"
      >
        ← Kerb
      </Link>
      <p className="absolute top-6 right-6 z-10 hidden font-display text-sm font-semibold tracking-[0.28em] text-white/40 sm:block">
        KERB<span className="text-[#e10600]">.</span>
      </p>

      <CommandWheel activeId="system" onOpenChange={setGlass} />

      <section className="absolute inset-0 z-10 flex items-center justify-center px-5">
        <div className="w-full max-w-2xl pt-32 text-center">
          <p className="text-xs font-semibold tracking-[0.32em] text-[#ff3b4d] uppercase">
            {sector.code} · System
          </p>
          <h1 className="mt-3 font-display text-6xl leading-[0.95] font-semibold tracking-wide uppercase sm:text-7xl">
            System
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">
            {sector.description}
          </p>

          <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-black/55 backdrop-blur-md">
            {FEEDS.map((f, i) => (
              <div
                key={f.name}
                className={`flex items-center justify-between px-6 py-4 text-left ${
                  i > 0 ? "border-t border-white/10" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-semibold">{f.name}</p>
                  <p className="text-xs text-white/45">{f.meta}</p>
                </div>
                <div className="text-right">
                  <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    LIVE
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-white/45">{f.latency}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-5 font-mono text-xs tracking-[0.2em] text-white/40">
            99.99% UPTIME · 20 MS MEDIAN LATENCY
          </p>
        </div>
      </section>
    </VideoStage>
  );
}
