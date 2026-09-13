import { apiRequest } from "./client";

export type AnalysisIncident = { incident_id: string; track_id: number; timestamp_s: number; frame_index: number; state: string; trust_score: number; review_required: boolean; priority?: number };
export type AnalysisResponse = { job_id: string; status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED"; provider: string; video: { filename: string; duration_s: number | null; fps: number | null }; incidents: AnalysisIncident[] };
export type VideoProbe = { video: string; width: number; height: number; fps: number; frame_count: number; duration_seconds: number };
export type FrameExtraction = { video: string; source_fps: number; source_frames: number; duration_seconds: number; extraction_fps: number; frames_extracted: number; resolution: [number, number]; output_directory: string; frame_urls: string[]; status: string };

function videoForm(file: File, fields: Record<string, string> = {}) {
  const form = new FormData();
  form.append("file", file);
  Object.entries(fields).forEach(([key, value]) => form.append(key, value));
  return form;
}

export function probeVideo(file: File) {
  return apiRequest<VideoProbe>("/api/video/probe", { method: "POST", body: videoForm(file) });
}

export function extractFrames(file: File, options: { fps?: number; preset?: string; maxFrames?: number } = {}) {
  return apiRequest<FrameExtraction>("/api/video/extract-frames", {
    method: "POST",
    body: videoForm(file, { fps: String(options.fps ?? 1), preset: options.preset ?? "balanced", ...(options.maxFrames ? { max_frames: String(options.maxFrames) } : {}) }),
  });
}

export function submitAnalysis(file: File): Promise<AnalysisResponse> {
  return apiRequest<AnalysisResponse>("/api/analysis", { method: "POST", body: videoForm(file) });
}
