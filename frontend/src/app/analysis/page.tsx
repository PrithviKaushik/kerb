"use client";

/* Extracted frames are served by the backend at runtime and are intentionally rendered as raw images. */
/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import RadialNav from "@/components/kerb/RadialNav";
import { apiUrl } from "@/lib/api/client";
import { extractFrames, probeVideo, submitAnalysis, type AnalysisResponse, type FrameExtraction, type VideoProbe } from "@/lib/api/analysis";

type RunStatus = "IDLE" | "PROBING" | "EXTRACTING" | "ANALYZING" | "COMPLETED" | "FAILED";

export default function AnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [probe, setProbe] = useState<VideoProbe | null>(null);
  const [extraction, setExtraction] = useState<FrameExtraction | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [status, setStatus] = useState<RunStatus>("IDLE");
  const [error, setError] = useState<string | null>(null);
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null);

  const run = async () => {
    if (!file) return;
    setError(null); setProbe(null); setExtraction(null); setResult(null); setSelectedFrame(null);
    try {
      setStatus("PROBING");
      setProbe(await probeVideo(file));
      setStatus("EXTRACTING");
      setExtraction(await extractFrames(file, { fps: 1, preset: "balanced" }));
      setStatus("ANALYZING");
      setResult(await submitAnalysis(file));
      setStatus("COMPLETED");
    } catch (cause) { setStatus("FAILED"); setError(cause instanceof Error ? cause.message : "Analysis request failed"); }
  };
  const incidents = result?.incidents ?? [];
  const busy = ["PROBING", "EXTRACTING", "ANALYZING"].includes(status);

  return <main className="min-h-screen bg-[hsl(var(--kerb-bg))] text-kerb-white"><RadialNav active="analysis" /><div className="mx-auto max-w-[1200px] px-5 pt-28 pb-20 sm:px-8 lg:px-12"><header className="border-b border-white/10 pb-10"><p className="font-mono text-[10px] tracking-[0.25em] text-kerb-red uppercase">KERB / ANALYSIS WORKSTATION</p><h1 className="mt-4 font-display text-6xl font-bold uppercase sm:text-8xl">Analysis</h1><p className="mt-5 max-w-2xl text-base leading-relaxed text-kerb-white/60">Probe race footage, extract its frames, then run the KERB intelligence pipeline. Results remain evidence-backed candidates for steward review.</p></header><section className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]"><div className="border border-white/10 bg-white/[0.02] p-6"><p className="font-mono text-[10px] tracking-[0.2em] text-kerb-red uppercase">VIDEO INPUT</p><div className="mt-6 border border-dashed border-white/20 p-10 text-center"><input type="file" accept="video/*" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setProbe(null); setExtraction(null); setResult(null); setStatus("IDLE"); }} className="mx-auto block max-w-full font-mono text-xs text-kerb-white/60 file:mr-4 file:border file:border-white/20 file:bg-transparent file:px-3 file:py-2 file:font-mono file:text-[10px] file:text-kerb-white" />{file && <p className="mt-4 font-mono text-[10px] text-kerb-white/45">SELECTED · {file.name}</p>}</div><button type="button" onClick={run} disabled={!file || busy} className="mt-5 w-full border border-kerb-red/60 bg-kerb-red/[0.08] px-4 py-3 font-mono text-[10px] font-semibold tracking-[0.18em] text-kerb-red uppercase disabled:cursor-not-allowed disabled:opacity-30">{busy ? `${status} · PLEASE WAIT` : "PROBE · EXTRACT · RUN ANALYSIS"}</button>{error && <p className="mt-4 border border-amber-300/30 p-3 font-mono text-[10px] text-amber-300">{error}</p>}</div><div className="border border-white/10 bg-white/[0.02] p-6"><p className="font-mono text-[10px] tracking-[0.2em] text-kerb-red uppercase">PIPELINE STATE</p><div className="mt-6 space-y-4">{[["VIDEO PROBE", "PROBING"], ["FRAME EXTRACTION", "EXTRACTING"], ["KERB ANALYSIS", "ANALYZING"], ["RESULT PACKAGE", "COMPLETED"]].map(([stage, stageStatus]) => <div key={stage} className="flex items-center gap-3 border-b border-white/10 pb-3 font-mono text-[10px] text-kerb-white/55"><span className={`h-1.5 w-1.5 ${status === stageStatus || (status === "COMPLETED" && stageStatus === "COMPLETED") ? "animate-pulse bg-kerb-red" : status === "COMPLETED" || (stageStatus === "PROBING" && probe) || (stageStatus === "EXTRACTING" && extraction) ? "bg-emerald-300" : "bg-white/20"}`} />{stage}</div>)}</div></div></section>{probe && <section className="mt-8 border border-white/10 bg-white/[0.02] p-5"><p className="font-mono text-[10px] tracking-[0.2em] text-kerb-red uppercase">VIDEO PROBE RESULT</p><div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4"><Metric label="FRAMES" value={probe.frame_count.toLocaleString()} /><Metric label="DURATION" value={`${probe.duration_seconds.toFixed(2)}S`} /><Metric label="FPS" value={String(probe.fps)} /><Metric label="RESOLUTION" value={`${probe.width}×${probe.height}`} /></div></section>}{extraction && <section className="mt-8 border border-white/10 bg-white/[0.02] p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] tracking-[0.2em] text-kerb-red uppercase">EXTRACTED FRAME RESULT</p><p className="mt-2 font-mono text-xs text-kerb-white/55">{extraction.frames_extracted} frames extracted · {extraction.extraction_fps} FPS · source contains {extraction.source_frames} frames</p></div><span className="font-mono text-[10px] text-emerald-300 uppercase">{extraction.status}</span></div><div className="mt-5 flex gap-3 overflow-x-auto pb-3">{extraction.frame_urls.map((path, index) => { const url = apiUrl(path); return <button type="button" key={path} onClick={() => setSelectedFrame(url)} className="group min-w-40 overflow-hidden border border-white/10 bg-[#101116] text-left transition hover:border-kerb-red"><img src={url} alt={`Extracted frame ${index + 1}`} className="aspect-video w-40 object-cover opacity-80 transition group-hover:opacity-100" /><span className="block px-3 py-2 font-mono text-[9px] text-kerb-white/45">FRAME {index + 1}</span></button>; })}</div></section>}{result && <section className="mt-8"><div className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 lg:grid-cols-5"><Metric label="STATUS" value={result.status} /><Metric label="JOB" value={result.job_id} /><Metric label="INCIDENTS" value={String(incidents.length)} /><Metric label="CANDIDATES" value={String(incidents.filter((item) => item.state === "VIOLATION_CANDIDATE").length)} /><Metric label="UNCERTAIN" value={String(incidents.filter((item) => item.state === "UNCERTAIN").length)} /></div></section>}{selectedFrame && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-5" onClick={() => setSelectedFrame(null)}><div className="max-h-[90vh] max-w-5xl border border-white/15 bg-[#0b0c0f] p-3" onClick={(event) => event.stopPropagation()}><img src={selectedFrame} alt="Expanded extracted frame" className="max-h-[80vh] max-w-full object-contain" /><button type="button" onClick={() => setSelectedFrame(null)} className="mt-3 w-full border border-white/20 px-3 py-2 font-mono text-[10px] text-white/65">CLOSE FRAME</button></div></div>}</div></main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="bg-[hsl(var(--kerb-bg))] px-4 py-4"><p className="font-mono text-[9px] tracking-[0.15em] text-kerb-white/40 uppercase">{label}</p><p className="mt-2 font-mono text-xs text-kerb-white/75">{value}</p></div>; }
