"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest, apiUrl } from "@/lib/api/client";
import { PipelineStage } from "./PipelineStage";
import { StateBadge } from "./StateBadge";
import { StateTimeline } from "./StateTimeline";
import { IncidentCard, type KerbIncident } from "./IncidentCard";
import { SessionsPanel } from "./SessionsPanel";
import { BoundaryCalibrator } from "./BoundaryCalibrator";
import { IncidentTimeline, type SpatialTrackTimeline } from "./IncidentTimeline";

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
  text?: string;
};

type DemoState = {
  kind?: "demo" | "session";
  id?: string;
  name?: string;
  video?: { name: string; exists?: boolean; frames?: number; fps?: number };
  stages?: { id: string; name: string; skill: string; artifacts: Artifact[] }[];
  track_ids?: number[];
  spatial_state_counts?: Record<string, number>;
  boundary?: { keyframes?: number[]; legal_side?: string; points?: number } | null;
  incident?: KerbIncident | null;
  job?: SessionJob | null;
  tracking_records?: number;
  status?: Record<string, string>;
  calibration_frame_index?: number;
  calibration_keyframes?: number[];
};

type TimelineResponse = { tracks: SpatialTrackTimeline[] };

type SessionJob = {
  state: string;
  progress?: number | null;
  message?: string | null;
  stage?: string;
  error?: string | null;
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<DemoState | null>(null);
  const [spatial, setSpatial] = useState<SpatialRow[] | null>(null);
  const [timeline, setTimeline] = useState<SpatialTrackTimeline[] | null>(null);
  const [sessionJob, setSessionJob] = useState<SessionJob | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDemo = useCallback(async () => {
    const request = Promise.all([
      apiRequest<DemoState>("/api/demo/state"),
      apiRequest<SpatialRow[]>("/api/demo/spatial"),
      apiRequest<TimelineResponse>("/api/demo/timeline"),
    ]);
    const timeout = new Promise<never>((_, reject) => {
      window.setTimeout(() => reject(new Error("Demo API did not respond within 15 seconds")), 15000);
    });
    const [demoState, demoSpatial, demoTimeline] = await Promise.race([request, timeout]);
    return { demoState, demoSpatial, demoTimeline: demoTimeline.tracks };
  }, []);

  const load = useCallback(
    async (id: string | null) => {
      if (!id) return fetchDemo();
      const [sessionState, sessionSpatial] = await Promise.all([
        apiRequest<DemoState>(`/api/sessions/${id}`),
        apiRequest<SpatialRow[]>(`/api/sessions/${id}/spatial`).catch(() => null),
      ]);
      return { demoState: sessionState, demoSpatial: sessionSpatial, demoTimeline: null };
    },
    [fetchDemo]
  );

  useEffect(() => {
    let cancelled = false;
    load(sessionId)
      .then((res) => {
        if (cancelled) return;
        setState(res.demoState);
        setSpatial(res.demoSpatial);
        setTimeline(res.demoTimeline);
        setSessionJob(res.demoState.job ?? null);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load pipeline");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load, sessionId, refreshTick]);

  useEffect(() => {
    if (!sessionId || !sessionJob) return;
    if (sessionJob.state !== "queued" && sessionJob.state !== "running") return;
    const timer = setInterval(async () => {
      try {
        const job = await apiRequest<SessionJob>(`/api/sessions/${sessionId}/job`);
        setSessionJob(job);
        if (job.state === "done" || job.state === "error") {
          clearInterval(timer);
          setTimeout(() => setRefreshTick((tick) => tick + 1), 600);
        }
      } catch {
        // transient read; the next tick retries.
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [sessionId, sessionJob]);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await load(sessionId);
      setState(res.demoState);
      setSpatial(res.demoSpatial);
      setTimeline(res.demoTimeline);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pipeline");
    } finally {
      setLoading(false);
    }
  }, [load, sessionId]);

  const selectSession = useCallback((id: string | null) => {
    setSessionId(id);
    setSpatial(null);
    setTimeline(null);
    setSessionJob(null);
    setError(null);
  }, []);

  const startTracking = useCallback(async (id: string) => {
    setActionBusy(true);
    setError(null);
    try {
      const res = await apiRequest<{ job: SessionJob }>(`/api/sessions/${id}/track`, { method: "POST" });
      setSessionJob(res.job);
      setRefreshTick((tick) => tick + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start tracking");
    } finally {
      setActionBusy(false);
    }
  }, []);

  const runAnalysis = useCallback(async (id: string) => {
    setActionBusy(true);
    setError(null);
    try {
      await apiRequest(`/api/sessions/${id}/run`, { method: "POST" });
      setRefreshTick((tick) => tick + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run analysis");
    } finally {
      setActionBusy(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="font-mono text-xs tracking-[0.32em] text-white/50">
          {sessionId ? "LOADING SESSION…" : "RUNNING A5 PIPELINE…"}
        </p>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-kerb-red/40 bg-black/55 p-6 text-center">
        <p className="text-sm text-white/70">{error ?? "Pipeline unavailable"}</p>
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

  if (!state) return null;

  const isSession = state.kind === "session" || sessionId !== null;
  const stages = state.stages ?? [];
  const byId = (id: string) => stages.find((s) => s.id === id);
  const artifactUrl = (stageId: string, kind: string) =>
    byId(stageId)?.artifacts?.find((a) => a.kind === kind)?.url;
  const keyframes = byId("extraction")?.artifacts?.[0]?.urls ?? [];
  const trackIds = state.track_ids ?? [];
  const incident = state.incident ?? null;
  const boundary = state.boundary ?? null;
  const perceptionSrc = artifactUrl("perception", "video");
  const surfaceSrc = artifactUrl("surface", "video") ?? "/api/demo/surface/video";
  const trackingRecords = state.tracking_records ?? 0;
  const calibrationReady = trackingRecords > 0 && !boundary;
  const analysisReady = trackingRecords > 0 && !!boundary && !incident;
  const perceptionMetrics = byId("perception")?.artifacts?.find((a) => a.kind === "metrics")?.data;
  const trackingJobRunning =
    sessionJob && (sessionJob.state === "queued" || sessionJob.state === "running");
  const spatialCounts = state.spatial_state_counts ?? {};
  const hasConfidence = spatial?.[0] && "surface_confidence" in spatial[0] ? true : false;

  return (
    <div className="space-y-6">
      <SessionsPanel value={sessionId} onSelect={selectSession} onChanged={() => setRefreshTick((t) => t + 1)} />

      {error && (
        <p className="rounded-lg border border-kerb-red/40 bg-kerb-red/10 px-4 py-2 font-mono text-[11px] text-white/80">
          {error}
        </p>
      )}

      <div className="rounded-2xl border border-white/10 bg-black/35 px-5 py-4 backdrop-blur-md">
        <p className="kerb-eyebrow">{isSession ? `Uploaded clip · ${state.name ?? "session"}` : "Real footage · Audit clip a5"}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/70">
          <span>
            Source <span className="font-mono text-white/90">{state.video?.name ?? "a5.mp4"}</span>
          </span>
          <span>
            Frames <span className="font-mono text-white/90">{state.video?.frames ?? "—"}</span>
          </span>
          <span>
            Track IDs <span className="font-mono text-white/90">{trackIds.join(", ") || "—"}</span>
          </span>
          <span className="font-mono text-[10px] tracking-[0.2em] text-white/40">
            BOUNDARY KEYFRAMES {boundary?.keyframes?.join(" · ") ?? "—"}
          </span>
        </div>
        {isSession && (
          <p className="mt-2 font-mono text-[10px] text-white/35">
            Surface visualization uses the manual boundary and the existing surface-classifier skill.
          </p>
        )}
      </div>

      <PipelineStage index={1} title="Frame Extraction" skill="backend.skills.video.frame_extraction" states={spatialCounts}>
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
          <div>
            {perceptionSrc ? (
              <video src={apiUrl(perceptionSrc)} controls muted playsInline className="w-full rounded-lg border border-white/10" />
            ) : (
              <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-dashed border-white/15">
                <p className="px-6 text-center font-mono text-xs text-white/45">
                  {perceptionMetrics
                    ? "No f1_car detections in this clip."
                    : trackingJobRunning
                      ? "Tracking…"
                      : "Perception not run yet."}
                </p>
              </div>
            )}
            {trackingJobRunning && (
              <div className="mt-2">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-kerb-red transition-all"
                    style={{ width: `${Math.round((sessionJob.progress ?? 0) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 font-mono text-[10px] text-white/45">
                  {sessionJob.message ?? "tracking in progress"}
                </p>
              </div>
            )}
            {!perceptionSrc && !trackingJobRunning && isSession && trackingRecords === 0 && (
              <button
                type="button"
                onClick={() => startTracking(sessionId as string)}
                disabled={actionBusy}
                className="mt-3 rounded-lg bg-kerb-red px-4 py-2 font-mono text-[11px] font-bold tracking-[0.18em] text-white transition enabled:hover:brightness-110 disabled:opacity-40"
              >
                {actionBusy ? "STARTING…" : "RUN YOLO + BYTETRACK"}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {perceptionMetrics ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">TRACK RECORDS</p>
                  <p className="mt-1 font-mono text-lg text-white/90">
                    {(trackingRecords || perceptionMetrics.total_track_records) ?? "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">UNIQUE IDS</p>
                  <p className="mt-1 font-mono text-lg text-white/90">{perceptionMetrics.unique_track_ids ?? "—"}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">END-TO-END FPS</p>
                  <p className="mt-1 font-mono text-lg text-white/90">{perceptionMetrics.end_to_end_fps?.toFixed(1) ?? "—"}</p>
                </div>
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">DETECTOR INF FPS</p>
                  <p className="mt-1 font-mono text-lg text-white/90">{perceptionMetrics.detector_inference_fps?.toFixed(1) ?? "—"}</p>
                </div>
              </div>
            ) : (
              <p className="font-mono text-xs text-white/45">
                {byId("perception")?.artifacts?.find((a) => a.kind === "notice")?.text ?? "No tracking metrics yet."}
              </p>
            )}
            <a
              href={apiUrl(isSession ? `/api/sessions/${state.id}/tracks` : "/api/demo/tracks")}
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
        title={isSession ? "Manual Boundary Calibration" : "Surface + Calibrated Boundary"}
        skill={isSession ? "backend.skills.surface.manual_boundary" : "backend.skills.surface"}
        states={spatialCounts}
      >
        {isSession ? (
          <div className="space-y-4">
            {calibrationReady && (
              <BoundaryCalibrator
                key={`${state.id}-${state.calibration_frame_index ?? "mid"}`}
                sessionId={state.id as string}
                frameCount={state.video?.frames ?? 1}
                fps={state.video?.fps ?? 30}
                keyframes={state.calibration_keyframes ?? [state.calibration_frame_index ?? Math.floor((state.video?.frames ?? 1) / 2)]}
                onDone={() => setRefreshTick((t) => t + 1)}
              />
            )}
            {boundary && (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-3">
                  {artifactUrl("surface", "video") && (
                    <video
                      src={apiUrl(artifactUrl("surface", "video") as string)}
                      controls
                      muted
                      playsInline
                      className="w-full rounded-lg border border-white/10"
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {Object.entries(spatialCounts).map(([s, c]) => (
                      <span key={s} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/70">
                        <StateBadge state={s} /> {c}
                      </span>
                    ))}
                    {Object.keys(spatialCounts).length === 0 && <span className="font-mono text-xs text-white/40">No geometry yet.</span>}
                  </div>
                </div>
                <p className="font-mono text-[10px] leading-relaxed text-white/40">
                  Boundary saved: {boundary.points} points at keyframe {boundary.keyframes?.[0]}, legal side{" "}
                  {boundary.legal_side}. Contact with the line counts as not outside.
                </p>
              </div>
            )}
            {analysisReady && (
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[10px] leading-relaxed text-white/45">
                  Ready to evaluate the four-outside rule, 3-of-5 temporal filter, trust score, and evidence package.
                </p>
                <button
                  type="button"
                  onClick={() => runAnalysis(state.id as string)}
                  disabled={actionBusy}
                  className="shrink-0 rounded-lg bg-kerb-red px-4 py-2 font-mono text-[11px] font-bold tracking-[0.18em] text-white transition enabled:hover:brightness-110 disabled:opacity-40"
                >
                  {actionBusy ? "RUNNING…" : "RUN ANALYSIS"}
                </button>
              </div>
            )}
            {incident && boundary && (
              <p className="font-mono text-[10px] text-white/40">
                Analysis complete — see the Incident Intelligence stage below.
              </p>
            )}
            {!calibrationReady && !boundary && (
              <p className="font-mono text-xs text-white/45">
                Run perception first — the boundary can only be judged once a car is being tracked.
              </p>
            )}
            {spatial && spatial.length > 0 && <div className="mt-2"><StateTimeline rows={spatial} /></div>}
            {timeline && timeline.length > 0 && <div className="mt-5"><IncidentTimeline tracks={timeline} /></div>}
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <video src={apiUrl(surfaceSrc)} controls muted playsInline className="w-full rounded-lg border border-white/10" />
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
            {timeline && timeline.length > 0 && <div className="mt-5"><IncidentTimeline tracks={timeline} /></div>}
          </>
        )}
      </PipelineStage>

      <PipelineStage index={4} title="Incident Intelligence" skill="backend.skills.incident_report" states={spatialCounts}>
        {incident ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <IncidentCard incident={incident} href={`/incidents/${incident.incident_id}`} />
              {spatial && spatial.length > 1 && (
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-white/45">OFF-TRACK FRACTION</span>
                  <Sparkline values={spatial.map((r) => r.off_track_fraction)} color="#e10600" />
                  {hasConfidence && (
                    <>
                      <span className="font-mono text-[10px] tracking-[0.18em] text-white/45">CONFIDENCE</span>
                      <Sparkline values={spatial.map((r) => r.surface_confidence)} color="#34d399" />
                    </>
                  )}
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
          <p className="font-mono text-xs text-white/45">
            {isSession && trackingRecords > 0 ? "No incident generated yet — calibrate the boundary and run analysis." : "No incident generated."}
          </p>
        )}
      </PipelineStage>

      <PipelineStage index={5} title="Steward Review" skill="human">
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
