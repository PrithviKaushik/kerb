export type ReportState = "NO_VIOLATION" | "VIOLATION_CANDIDATE" | "UNCERTAIN";
export type ReportStatus = "PENDING" | "REVIEWED";
export type StewardDecision = "TRACK_LIMIT_EXCEEDED" | "TRACK_LIMIT_NOT_EXCEEDED" | null;

export type Report = {
  id: string;
  incidentId: string;
  session: string;
  event: string;
  track: string;
  trackId: number;
  timestamp: number;
  peakFrame: number;
  aiAssessment: { state: ReportState; confidence: number; band: "HIGH" | "MEDIUM-HIGH" | "MEDIUM" | "LOW" };
  review: { status: ReportStatus; decision: StewardDecision; notes: string | null; reviewedAt: string | null; reviewer: string | null };
  temporal: { window: string; eligible: number; supporting: number; support: boolean };
  evidence: string[];
  rules: string[];
  reasons: string[];
};

export const REPORTS: Report[] = [
  { id: "RPT-0027", incidentId: "INC-0027", session: "QUALIFYING", event: "Austrian Grand Prix", track: "Red Bull Ring", trackId: 16, timestamp: 84.32, peakFrame: 4216, aiAssessment: { state: "VIOLATION_CANDIDATE", confidence: 94, band: "HIGH" }, review: { status: "PENDING", decision: null, notes: null, reviewedAt: null, reviewer: null }, temporal: { window: "84.12s — 84.52s", eligible: 5, supporting: 3, support: true }, evidence: ["pre-event frame", "event frame", "post-event frame", "boundary overlay"], rules: ["TL-001", "BD-001", "TM-001", "EV-001"], reasons: ["4 / 4 contact regions outside", "Temporal support established"] },
  { id: "RPT-0026", incidentId: "INC-0026", session: "FP3", event: "Austrian Grand Prix", track: "Red Bull Ring", trackId: 11, timestamp: 61.18, peakFrame: 3059, aiAssessment: { state: "VIOLATION_CANDIDATE", confidence: 82, band: "HIGH" }, review: { status: "REVIEWED", decision: "TRACK_LIMIT_NOT_EXCEEDED", notes: "Vehicle was forced beyond the boundary by another car.", reviewedAt: "2026-06-28 14:42 UTC", reviewer: "STEWARDS / 02" }, temporal: { window: "60.98s — 61.38s", eligible: 5, supporting: 3, support: true }, evidence: ["event frame", "nearby vehicle frame", "boundary overlay"], rules: ["TL-001", "TL-002", "EV-001"], reasons: ["Nearby vehicle present", "Contextual review required"] },
  { id: "RPT-0025", incidentId: "INC-0025", session: "QUALIFYING", event: "Austrian Grand Prix", track: "Red Bull Ring", trackId: 44, timestamp: 58.71, peakFrame: 2935, aiAssessment: { state: "UNCERTAIN", confidence: 48, band: "LOW" }, review: { status: "PENDING", decision: null, notes: null, reviewedAt: null, reviewer: null }, temporal: { window: "58.51s — 58.91s", eligible: 5, supporting: 1, support: false }, evidence: ["event frame", "observability mask"], rules: ["CT-001", "UN-001", "EV-001"], reasons: ["Rear-left contact region unobservable", "Trust capped below review threshold"] },
  { id: "RPT-0024", incidentId: "INC-0024", session: "FP2", event: "Austrian Grand Prix", track: "Red Bull Ring", trackId: 4, timestamp: 42.06, peakFrame: 2103, aiAssessment: { state: "NO_VIOLATION", confidence: 91, band: "HIGH" }, review: { status: "REVIEWED", decision: "TRACK_LIMIT_NOT_EXCEEDED", notes: "Contact region remained on the legal boundary.", reviewedAt: "2026-06-28 12:20 UTC", reviewer: "STEWARDS / 01" }, temporal: { window: "41.86s — 42.26s", eligible: 5, supporting: 0, support: false }, evidence: ["event frame", "boundary overlay"], rules: ["BD-001", "EV-001"], reasons: ["Boundary contact is not outside"] },
  { id: "RPT-0023", incidentId: "INC-0023", session: "FP2", event: "Austrian Grand Prix", track: "Red Bull Ring", trackId: 16, timestamp: 35.44, peakFrame: 1772, aiAssessment: { state: "VIOLATION_CANDIDATE", confidence: 76, band: "MEDIUM-HIGH" }, review: { status: "REVIEWED", decision: "TRACK_LIMIT_EXCEEDED", notes: "All four contact regions clear of the boundary across the supported window.", reviewedAt: "2026-06-28 11:54 UTC", reviewer: "STEWARDS / 01" }, temporal: { window: "35.24s — 35.64s", eligible: 5, supporting: 4, support: true }, evidence: ["pre-event frame", "event frame", "post-event frame"], rules: ["TL-001", "TM-001", "EV-001"], reasons: ["4 / 4 contact regions outside", "Clear boundary margin"] },
];
