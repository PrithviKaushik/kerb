"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RadialNav from "@/components/kerb/RadialNav";
import { apiRequest } from "@/lib/api/client";

const STAGES = [
  ["VIDEO INPUT", "Existing ingestion and frame extraction infrastructure"],
  ["PERCEPTION", "YOLO + ByteTrack · waiting for final perception adapter output"],
  ["VEHICLE GEOMETRY", "Contact-region observations"],
  ["TRACK-LIMIT REASONING", "Boundary + four-outside evaluation"],
  ["TEMPORAL EVIDENCE", "Single-view event window · 3 of 5 reliability filter"],
  ["TRUST", "Heuristic evidence-quality score"],
  ["KNOWLEDGE", "Explicit steward-assist rules"],
  ["EVIDENCE", "Structured evidence package"],
  ["INCIDENT REPORT", "Historical candidate record"],
  ["PRIORITY", "Trust-led review ordering"],
  ["STEWARD REVIEW", "Human decision required"],
];

export default function SystemPage() {
  const [backend, setBackend] = useState<"CHECKING" | "ONLINE" | "UNAVAILABLE">("CHECKING");
  useEffect(() => { apiRequest<{ status: string }>("/api/health").then(() => setBackend("ONLINE")).catch(() => setBackend("UNAVAILABLE")); }, []);
  return <main className="min-h-screen bg-[hsl(var(--kerb-bg))] text-kerb-white"><RadialNav active="system" /><div className="mx-auto max-w-[1200px] px-5 pt-28 pb-20 sm:px-8 lg:px-12"><header className="border-b border-white/10 pb-10"><Link href="/" className="font-mono text-[10px] tracking-[0.2em] text-kerb-white/40 uppercase">← KERB / OVERVIEW</Link><p className="mt-8 font-mono text-[10px] tracking-[0.25em] text-kerb-red uppercase">KERB / SYSTEM ARCHITECTURE</p><div className="mt-4 flex flex-wrap items-end justify-between gap-6"><div><h1 className="font-display text-6xl font-bold uppercase sm:text-8xl">System</h1><p className="mt-5 max-w-2xl text-base leading-relaxed text-kerb-white/60">From existing video infrastructure through perception and evidence to a steward decision. KERB shows candidates, never autonomous rulings.</p></div><div className="border border-white/15 px-5 py-4"><p className="font-mono text-[9px] tracking-[0.16em] text-kerb-white/40 uppercase">BACKEND HEALTH</p><p className={`mt-2 font-mono text-xs ${backend === "ONLINE" ? "text-emerald-300" : backend === "UNAVAILABLE" ? "text-amber-300" : "text-white/60"}`}>{backend}</p></div></div></header><section className="mt-12"><p className="font-mono text-[10px] tracking-[0.22em] text-kerb-red uppercase">CURRENT INTELLIGENCE PIPELINE</p><div className="mt-5 border border-white/10">{STAGES.map(([name, description], index) => <div key={name} className="grid gap-3 border-b border-white/10 px-5 py-5 last:border-0 sm:grid-cols-[46px_220px_1fr_100px] sm:items-center"><span className="font-mono text-xs text-kerb-red">{String(index + 1).padStart(2, "0")}</span><span className="font-display text-2xl font-semibold uppercase">{name}</span><span className="text-sm text-kerb-white/50">{description}</span><span className={`font-mono text-[9px] tracking-[0.14em] uppercase ${name === "PERCEPTION" ? "text-amber-300" : name === "STEWARD REVIEW" ? "text-kerb-red" : "text-emerald-300"}`}>{name === "PERCEPTION" ? "ADAPTER READY" : name === "STEWARD REVIEW" ? "REQUIRED" : "READY"}</span></div>)}</div></section><section className="mt-10 grid gap-5 md:grid-cols-2"><div className="border border-white/10 p-5"><p className="font-mono text-[10px] tracking-[0.18em] text-kerb-red uppercase">SUPPORTING INFRASTRUCTURE</p><p className="mt-4 text-sm leading-relaxed text-kerb-white/55">Video ingestion, FFmpeg probing, frame extraction, training-data labelling, and model preparation are completed supporting systems. Detailed inspection remains available through Swagger.</p></div><div className="border border-kerb-red/30 bg-kerb-red/[0.04] p-5"><p className="font-mono text-[10px] tracking-[0.18em] text-kerb-red uppercase">PRODUCT PRINCIPLE</p><p className="mt-4 font-display text-3xl font-semibold uppercase">AI finds the incident.<br /><span className="text-kerb-red">The steward makes the decision.</span></p></div></section></div></main>;
}
