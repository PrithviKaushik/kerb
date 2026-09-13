"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getOverview, type OverviewData } from "@/lib/api/overview";

export default function OverviewLivePanel() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => { getOverview().then(setData).catch(() => setError(true)); }, []);
  if (error) return <p className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 font-mono text-[9px] tracking-[0.16em] text-white/35 uppercase">LIVE INTELLIGENCE FEED UNAVAILABLE</p>;
  if (!data) return <p className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 font-mono text-[9px] tracking-[0.16em] text-white/35 uppercase">CONNECTING TO KERB INTELLIGENCE</p>;
  const pending = data.reports.filter((report) => report.review_status === "PENDING_REVIEW").length;
  const uncertain = data.incidents.filter((incident) => incident.state === "UNCERTAIN").length;
  const highTrust = data.incidents.filter((incident) => incident.trust_score >= 75 && incident.state === "VIOLATION_CANDIDATE").length;
  const priority = data.incidents[0];
  return <div className="absolute bottom-5 left-1/2 z-10 w-[min(92vw,720px)] -translate-x-1/2 border border-white/15 bg-black/55 p-4 backdrop-blur-sm"><div className="grid grid-cols-3 gap-4 sm:grid-cols-5"><Metric label="INCIDENTS" value={String(data.incidents.length)} /><Metric label="PENDING" value={String(pending)} /><Metric label="HIGH TRUST" value={String(highTrust)} /><Metric label="UNCERTAIN" value={String(uncertain)} />{priority && <Link href={`/incidents/${priority.incident_id}`} className="border-l border-white/15 pl-4 text-left transition hover:text-kerb-red"><p className="font-mono text-[8px] tracking-[0.12em] text-kerb-red uppercase">PRIORITY · TRACK {priority.track_id}</p><p className="mt-1 font-mono text-[10px] text-white/70">{priority.state.replaceAll("_", " ")}</p></Link>}</div></div>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="font-mono text-[8px] tracking-[0.12em] text-white/40 uppercase">{label}</p><p className="mt-1 font-display text-xl text-white/80">{value}</p></div>; }
