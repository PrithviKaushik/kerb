import Link from "next/link";
import { PipelineDemo } from "@/components/demo/PipelineDemo";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[hsl(var(--kerb-bg))] text-kerb-white">
      <div className="kerb-atmosphere" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-5 py-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-[11px] font-medium tracking-[0.32em] text-white/40 uppercase transition hover:text-white"
          >
            ← Kerb
          </Link>
          <p className="hidden font-display text-sm font-semibold tracking-[0.28em] text-white/40 sm:block">
            KERB<span className="text-[#e10600]">.</span>
          </p>
        </div>

        <header className="mt-10 mb-8">
          <p className="kerb-eyebrow">Live pipeline · every skill in order</p>
          <h1 className="mt-2 font-display text-5xl font-semibold uppercase tracking-[0.16em] sm:text-6xl">
            The A5 <span className="text-kerb-red">Track-Limit</span> Demo
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">
            One real race clip flows through the full Kerb skill chain — frame extraction,
            YOLO + ByteTrack, vehicle geometry, calibrated surface analysis, and incident
            intelligence — straight from the recorded A5 footage. Every number below is
            measured, not simulated.
          </p>
        </header>

        <PipelineDemo />
      </div>
    </main>
  );
}