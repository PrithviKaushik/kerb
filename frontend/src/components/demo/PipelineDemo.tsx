"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest, apiUrl } from "@/lib/api/client";
import { PipelineStage } from "./PipelineStage";
import { StateBadge } from "./StateBadge";
import { StateTimeline } from "./StateTimeline";
import { IncidentCard, type KerbIncident } from "./IncidentCard";

type SpatialRow = {
  frame_index: number;
  timestamp_seconds: number;
  track_id: number;
  spatial_state: string;
  surface_state: string;
  off_track_fraction: number;
  unknown_fraction: number;
  surface_confidence: number;
  uncertainty_reasons: string[];
};

type Metrics = {
  total_track_records?: number;
  unique_track_ids?: number;
  end_to_end_fps?: number;
  detector_inference_fps?: number;
};

type Artifact = {
  kind?: string;
  count?: number;
  url?: string;
  urls?: string[];
  data?: Metrics;
};

type DemoState = {
  video?: { name: string; exists?: boolean; frames?: number };
  stages?: { id: string; name: string; skill: string; artifacts: Artifact[] }[];
  track_ids?: number[];
  spatial_state_counts?: Record<string, number>;
  boundary?: { keyframes?: number[]; legal_side?: string } | null;
  incident?: KerbIncident | null;
};

type GeometryResult = {
  records?: number;
  uncertain_geometry?: number;
  spatial_states?: Record<string, number>;
  geometry_modes?: Record<string, number>;
  boundary?: { type?: string; points?: number; inside_side?: string };
};

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 120;
  const h = 28;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / span) * (h - 2) - 1}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[28px] w-[120px]">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function PipelineDemo() {
  const [state, setState] = useState<DemoState | null>(null);
  const [geometry, setGeometry] = useState<GeometryResult | null>(null);
  const [spatial, setSpatial] = useState<SpatialRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDemo = useCallback(async () => {
    const [demoState, demoGeometry, demoSpatial] = await Promise.all([
      apiRequest<DemoState>("/api/demo/state"),
      apiRequest<GeometryResult>("/api/demo/geometry"),
      apiRequest<SpatialRow[]>("/api/demo/spatial"),
    ]);
    return { demoState, demoGeometry, demoSpatial };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDemo()
      .then((res) => {
        if (cancelled) return;
        setState(res.demoState);
        setGeometry(res.demoGeometry);
        setSpatial(res.demoSpatial);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load demo pipeline");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchDemo]);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDemo();
      setState(res.demoState);
      setGeometry(res.demoGeometry);
      setSpatial(res.demoSpatial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load demo pipeline");
    } finally {
      setLoading(false);
    }
  }, [fetchDemo]);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="font-mono text-xs tracking-[0.32em] text-white/50">RUNNING A5 PIPELINE…</p>
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-kerb-red/40 bg-black/55 p-6 text-center">
        <p className="text-sm text-white/70">{error ?? "Demo pipeline unavailable"}</p>
        <p className="mt-2 font-mono text-[11px] text-white/40">
          Start the backend: uv run uvicorn backend.api.main:app --port 8000
        </p>
        <button
          onClick={retry}
          className="mt-4 rounded-lg bg-kerb-red px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const stages = state.stages ?? [];
  const byId = (id: string) => stages.find((s) => s.id === id);
  const keyframes = byId("extraction")?.artifacts?.[0]?.urls ?? [];
  const trackIds = state.track_ids ?? [];
  const incident = state.incident ?? null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-black/35 px-5 py-4 backdrop-blur-md">
        <p className="kerb-eyebrow">Real footage · Audit clip a5</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
          <span>
            Source <span className="font-mono text-white/90">a5.mp4</span>
          </span>
          <span>
            Frames <span className="font-mono text-white/90">{state.video?.frames ?? "—"}</span>
          </span>
          <span>
            Track IDs <span className="font-mono text-white/90">{trackIds.join(", ") || "—"}</span>
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-white/40">
            BOUNDARY KEYFRAMES {state.boundary?.keyframes?.join(" · ") ?? "—"}
          </span>
        </div>
      </div>

      <PipelineStage index={1} title="Frame Extraction" skill="backend.skills.video.frame_extraction" states={state.spatial_state_counts}>
        <div className="flex flex-wrap gap-2">
          {keyframes.length === 0 && (
            <p className="font-mono text-xs text-white/45">No keyframe thumbnails on disk yet.</p>
          )}
          {keyframes.map((url: string, i: number) => (
            <figure key={url} className="w-40 overflow-hidden rounded-lg border border-white/10">
              <img src={apiUrl(url)} alt={`keyframe ${i}`} className="aspect-video w-full object-cover" />
              <figcaption className="bg-black/60 px-2 py-1 font-mono text-[10px] text-white/60">
                keyframe {url.split("_").pop()?.replace(".png", "")}
              </figcaption>
            </figure>
          ))}
        </div>
      </PipelineStage>

      <PipelineStage index={2} title="Perception — YOLO + ByteTrack" skill="backend.skills.perception.tracking">
        <div className="grid gap-4 lg:grid-cols-2">
          <video src={apiUrl("/api/demo/perception/video")} controls muted playsInline className="w-full rounded-lg border border-white/10" />
          <div className="space-y-3">
            {(byId("perception")?.artifacts ?? []).map((artifact) =>
              artifact.data ? (
                <div key="metrics" className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">TRACK RECORDS</p>
                    <p className="mt-1 font-mono text-lg text-white/90">{artifact?.count ?? artifact.data.total_track_records ?? "—"}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">UNIQUE IDS</p>
                    <p className="mt-1 font-mono text-lg text-white/90">{artifact.data.unique_track_ids ?? "—"}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">END-TO-END FPS</p>
                    <p className="mt-1 font-mono text-lg text-white/90">{artifact.data.end_to_end_fps?.toFixed(1) ?? "—"}</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">DETECTOR INF FPS</p>
                    <p className="mt-1 font-mono text-lg text-white/90">{artifact.data.detector_inference_fps?.toFixed(1) ?? "—"}</p>
                  </div>
                </div>
              ) : null
            )}
            <a
              href={apiUrl("/api/demo/tracks")}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-xs font-medium tracking-[0.16em] text-kerb-red underline-offset-4 hover:underline"
            >
              tracking JSONL →
            </a>
          </div>
        </div>
      </PipelineStage>

      <PipelineStage
        index={3}
        title="Vehicle Geometry"
        skill="backend.skills.geometry.geometry"
        states={geometry?.spatial_states}
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-white/5 p-3">
            <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">FOOTPRINT MODE</p>
            <p className="mt-1 font-mono text-sm text-white/80">
              {Object.entries(geometry?.geometry_modes ?? {})
                .map(([mode, count]) => `${mode} ${count}`)
                .join(" · ") || "—"}
            </p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">UNCERTAIN GEOMETRY</p>
            <p className="mt-1 font-mono text-sm text-white/80">{geometry?.uncertain_geometry ?? "—"}</p>
          </div>
          <div className="rounded-lg bg-white/5 p-3">
            <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">BOUNDARY</p>
            <p className="mt-1 font-mono text-sm text-white/80">
              {geometry?.boundary?.type} · {geometry?.boundary?.points}pts · {geometry?.boundary?.inside_side}
            </p>
          </div>
        </div>
        <p className="mt-3 font-mono text-[10px] leading-relaxed text-white/40">
          Boundary relation computed live over the real A5 tracks from the calibrated white-line polyline
          (interpolated at keyframe 70).
        </p>
      </PipelineStage>

      <PipelineStage
        index={4}
        title="Surface + Calibrated Boundary"
        skill="backend.skills.surface"
        states={state.spatial_state_counts}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <video src={apiUrl("/api/demo/surface/video")} controls muted playsInline className="w-full rounded-lg border border-white/10" />
          <div className="flex flex-col justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(state.spatial_state_counts ?? {}).map(([s, c]) => (
                <span key={s} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/70">
                  <StateBadge state={s} /> {c}
                </span>
              ))}
            </div>
            <p className="font-mono text-[10px] leading-relaxed text-white/40">
              Whole-bbox classifier applied to the boundary-fused label mask from the manually calibrated
              white track-limit line (legal side {state.boundary?.legal_side}). No state is manufactured —
              UNKNOWN regions stay UNKNOWN.
            </p>
            <a
              href={apiUrl("/api/demo/spatial")}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-medium tracking-[0.16em] text-kerb-red underline-offset-4 hover:underline"
            >
              spatial JSONL →
            </a>
          </div>
        </div>
        {spatial && <div className="mt-4"><StateTimeline rows={spatial} /></div>}
      </PipelineStage>

      <PipelineStage index={5} title="Incident Intelligence" skill="backend.skills.incident_report" states={state.spatial_state_counts}>
        {incident ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <IncidentCard incident={incident} href={`/incidents/${incident.incident_id}`} />
              {spatial && spatial.length > 1 && (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-white/45">OFF-TRACK FRACTION</span>
                  <Sparkline values={spatial.map((r) => r.off_track_fraction)} color="#e10600" />
                  <span className="font-mono text-[10px] tracking-[0.18em] text-white/45">CONFIDENCE</span>
                  <Sparkline values={spatial.map((r) => r.surface_confidence)} color="#34d399" />
                </div>
              )}
            </div>
            <div className="rounded-xl border border-white/10 bg-kerb-charcoal/70 p-4">
              <p className="font-mono text-[10px] tracking-[0.2em] text-white/45">EVIDENCE FRAMES</p>
              <ul className="mt-2 space-y-1 font-mono text-[11px] text-white/70">
                {(incident.evidence?.frames ?? []).slice(0, 9).map((frame) => (
                  <li key={frame.frame_index} className="flex items-center justify-between">
                    <span>
                      #{frame.frame_index} · {frame.timestamp_s?.toFixed(2)}s
                    </span>
                    <span className="text-white/40">{frame.role}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 font-mono text-[10px] leading-relaxed text-white/40">
                {incident.summary?.reason}
              </p>
            </div>
          </div>
        ) : (
          <p className="font-mono text-xs text-white/45">No incident generated.</p>
        )}
      </PipelineStage>

      <PipelineStage index={6} title="Steward Review" skill="human">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl font-semibold uppercase tracking-[0.2em] text-kerb-red">
              STEWARD REVIEW REQUIRED
            </p>
            <p className="mt-1 font-mono text-xs text-white/55">
              Kerb flags candidates for human review — it never issues penalties.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/incidents"
              className="rounded-lg border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white/80 transition hover:border-white/40"
            >
              Incidents
            </Link>
            <Link
              href="/reports"
              className="rounded-lg bg-kerb-red px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
            >
              Reports
            </Link>
          </div>
        </div>
      </PipelineStage>
    </div>
  );
}