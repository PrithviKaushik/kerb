import { apiRequest } from "./client";

export type IncidentListItem = { incident_id: string; session: { event: string; year: number; session_type: string }; track_id: number; timestamp_s: number; frame_index: number; state: string; trust_score: number; priority: number; review_required: boolean; review_status: string };
export type IncidentDetail = { incident_id: string; report_id: string; session: Record<string, unknown>; event: { timestamp_s: number; frame_index: number }; vehicle: { track_id: number }; ai_assessment: { state: string; trust_score: number }; contact_regions: { name: string; state: string }[]; boundary: { tolerance_px: number; four_outside: boolean | null }; temporal: Record<string, unknown>; trust: { score: number; band: string; breakdown: Record<string, number> }; evidence_frames: { frame_index: number; timestamp_s: number; role: string }[]; reasons: string[]; context_flags: string[]; rules_applied: string[]; review: Record<string, unknown> };
export type IncidentFilters = { state?: string; session?: string; track_id?: number; review_status?: string };

export function getIncidents(filters: IncidentFilters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => value !== undefined && params.set(key, String(value)));
  return apiRequest<{ items: IncidentListItem[]; total: number }>(`/api/incidents${params.size ? `?${params}` : ""}`);
}

export function getIncident(id: string) { return apiRequest<IncidentDetail>(`/api/incidents/${encodeURIComponent(id)}`); }
