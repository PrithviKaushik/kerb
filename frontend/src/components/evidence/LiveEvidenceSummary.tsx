"use client";

import { useEffect, useState } from "react";
import { getIncident, getIncidents, type IncidentDetail } from "@/lib/api/incidents";

export default function LiveEvidenceSummary() {
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "empty" | "error">("loading");

  useEffect(() => {
    const fetchLiveIncident = async () => {
    try {
      const list = await getIncidents();
      if (!list.items[0]) { setState("empty"); return; }
      const detail = await getIncident(list.items[0].incident_id);
      setIncident(detail);
      setState("ready");
    } catch {
      setState("error");
    }
    };
    void fetchLiveIncident();
  }, []);

  return (
    <section className="relative mx-auto max-w-5xl px-6 pb-20">
      <div className="border border-white/10 bg-white/[0.02] p-5 sm:p-7">
        <p className="font-mono text-[10px] tracking-[0.22em] text-kerb-red uppercase">LIVE EVIDENCE CONTRACT</p>
        {state === "loading" && <p className="mt-5 font-mono text-xs text-white/45">Loading incident evidence...</p>}
        {state === "empty" && <p className="mt-5 font-mono text-xs text-white/45">No backend incidents available yet.</p>}
        {state === "error" && <p className="mt-5 font-mono text-xs text-amber-300">Backend evidence feed unavailable. Showing development gallery below.</p>}
        {incident && <div className="mt-5 grid gap-5 md:grid-cols-4"><Metric label="INCIDENT" value={incident.incident_id} /><Metric label="TRACK / TIME" value={`${incident.vehicle.track_id} · ${incident.event.timestamp_s.toFixed(2)}s`} /><Metric label="AI STATE" value={incident.ai_assessment.state.replaceAll("_", " ")} /><Metric label="TRUST" value={`${incident.trust.score} · ${incident.trust.band}`} /><div className="md:col-span-4 border-t border-white/10 pt-4 font-mono text-[10px] text-white/50">{incident.evidence_frames.length} EVIDENCE FRAMES · {String(incident.temporal.supporting_frames)} / {String(incident.temporal.eligible_frames)} TEMPORAL SUPPORT · RULES {incident.rules_applied.join(" · ")}</div></div>}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) { return <div><p className="font-mono text-[9px] tracking-[0.15em] text-white/35 uppercase">{label}</p><p className="mt-2 font-mono text-xs text-white/75">{value}</p></div>; }
