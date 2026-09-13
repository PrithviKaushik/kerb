import { apiRequest } from "./client";

export type ReportListItem = { report_id: string; incident_id: string; session: Record<string, unknown>; track_id: number; timestamp_s: number; ai_state: string; trust_score: number; review_status: string; steward_decision: string | null };
export type ReportDetail = { report_id: string; incident_id: string; session: Record<string, unknown>; event: { timestamp_s: number; frame_index: number }; vehicle: { track_id: number }; ai_assessment: { state: string; trust_score: number }; evidence: { frames: { frame_index: number; timestamp_s: number; role: string }[]; video: { available: boolean; source: string | null } }; temporal: Record<string, unknown>; trust: { score: number; band: string; breakdown: Record<string, number> }; rules_applied: string[]; review: { status: string; decision: string | null; reason?: string | null; notes?: string | null; reviewer?: string | null; reviewed_at?: string | null } };
export type ReviewPayload = { decision: "TRACK_LIMIT_EXCEEDED" | "TRACK_LIMIT_NOT_EXCEEDED"; reason?: string; notes: string; reviewer: string };

export function getReports() { return apiRequest<{ items: ReportListItem[]; total: number }>("/api/reports"); }
export function getReport(id: string) { return apiRequest<ReportDetail>(`/api/reports/${encodeURIComponent(id)}`); }
export function submitReportReview(id: string, review: ReviewPayload) { return apiRequest<ReportDetail>(`/api/reports/${encodeURIComponent(id)}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(review) }); }
