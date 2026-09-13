export const EVIDENCE_TYPES = {
  event: "EVENT FRAME",
  supporting: "SUPPORTING FRAME",
  context: "CONTEXT FRAME",
} as const;

export type EvidenceType = keyof typeof EVIDENCE_TYPES;

export const AI_STATES = {
  noViolation: "NO_VIOLATION",
  candidate: "VIOLATION_CANDIDATE",
  uncertain: "UNCERTAIN",
} as const;

export type AiState = (typeof AI_STATES)[keyof typeof AI_STATES];

export type ContactState = "INSIDE" | "ON BOUNDARY" | "OUTSIDE" | "UNKNOWN";

export interface ContactRegion {
  name: "FRONT LEFT" | "FRONT RIGHT" | "REAR LEFT" | "REAR RIGHT";
  state: ContactState;
}

export interface EvidenceItem {
  id: string;
  label: string;
  title: string;
  type: EvidenceType;
  image: string;
  incidentId: string;
  trackId: string;
  car: string;
  timestamp: string;
  frame: string;
  state: AiState;
  trustScore: number;
  trustBand: "HIGH" | "MEDIUM_HIGH" | "MEDIUM" | "LOW" | "UNCERTAIN";
  evidenceType: string;
  contactRegions: ContactRegion[];
  boundary: string;
  temporalSupport: string;
  reasons: string[];
  appliedRules: string[];
  context: string;
  summary: string;

  // Kept for the existing carousel metadata contract.
  lap?: string;
  turn?: string;
  measurement?: string;
  status?: AiState;
}

const UNKNOWN_CONTACTS: ContactRegion[] = [
  { name: "FRONT LEFT", state: "UNKNOWN" },
  { name: "FRONT RIGHT", state: "UNKNOWN" },
  { name: "REAR LEFT", state: "UNKNOWN" },
  { name: "REAR RIGHT", state: "UNKNOWN" },
];

const HONEST_REASONS = [
  "Vehicle image available for steward inspection",
  "Approximate contact regions cannot be established from this view",
  "No sporting decision is issued automatically",
];

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: "ev-raw",
    label: "01",
    title: "RACE EVENT",
    type: "context",
    evidenceType: EVIDENCE_TYPES.context,
    image: "/evidence/raw.png",
    incidentId: "INCIDENT-DEMO-01",
    trackId: "TRACK 01",
    car: "RED BULL #1",
    timestamp: "NOT PROVIDED",
    frame: "NOT PROVIDED",
    state: AI_STATES.uncertain,
    trustScore: 42,
    trustBand: "UNCERTAIN",
    contactRegions: UNKNOWN_CONTACTS,
    boundary: "NOT ESTABLISHED",
    temporalSupport: "NOT PROVIDED",
    reasons: HONEST_REASONS,
    appliedRules: ["UN-001", "EV-001"],
    context: "Source race image. Vehicle identity is visible; track-limit relation is not asserted from this frame alone.",
    summary: "The visual source that begins the evidence chain: identify the vehicle first, then ask what the image can actually prove.",
    status: AI_STATES.uncertain,
  },
  {
    id: "ev-position",
    label: "02",
    title: "VEHICLE OBSERVATION",
    type: "supporting",
    evidenceType: EVIDENCE_TYPES.supporting,
    image: "/evidence/pos.png",
    incidentId: "INCIDENT-DEMO-01",
    trackId: "TRACK 01",
    car: "RED BULL #1",
    timestamp: "NOT PROVIDED",
    frame: "NOT PROVIDED",
    state: AI_STATES.uncertain,
    trustScore: 48,
    trustBand: "UNCERTAIN",
    contactRegions: UNKNOWN_CONTACTS,
    boundary: "APPROXIMATE VIEW ONLY",
    temporalSupport: "NOT PROVIDED",
    reasons: HONEST_REASONS,
    appliedRules: ["CT-001", "UN-001", "EV-001"],
    context: "Vehicle detection is visible in the supplied frame; contact-region geometry is not treated as exact tire position.",
    summary: "KERB can follow the vehicle, but tracking alone is not a track-limit decision.",
    status: AI_STATES.uncertain,
  },
  {
    id: "ev-boundary",
    label: "03",
    title: "BOUNDARY CONTEXT",
    type: "event",
    evidenceType: EVIDENCE_TYPES.event,
    image: "/evidence/boundary.png",
    incidentId: "INCIDENT-DEMO-01",
    trackId: "TRACK 01",
    car: "RED BULL #1",
    timestamp: "NOT PROVIDED",
    frame: "NOT PROVIDED",
    state: AI_STATES.uncertain,
    trustScore: 46,
    trustBand: "UNCERTAIN",
    contactRegions: UNKNOWN_CONTACTS,
    boundary: "LEGAL BOUNDARY VISIBLE; RELATION UNKNOWN",
    temporalSupport: "NOT PROVIDED",
    reasons: [
      "Legal boundary context is visible",
      "Contact relation cannot be established reliably from the supplied image",
      "UNKNOWN is not treated as OUTSIDE",
    ],
    appliedRules: ["BD-001", "UN-001", "EV-001"],
    context: "The track edge is visible, but this image alone does not prove all four approximate contact regions are outside it.",
    summary: "A boundary in the image is context, not a ruling. The contact relation must remain explicit.",
    status: AI_STATES.uncertain,
  },
  {
    id: "ev-annotated",
    label: "04",
    title: "TRACKED OBSERVATION",
    type: "supporting",
    evidenceType: EVIDENCE_TYPES.supporting,
    image: "/evidence/annotated tracked.png",
    incidentId: "INCIDENT-DEMO-01",
    trackId: "TRACK 01",
    car: "RED BULL #1",
    timestamp: "NOT PROVIDED",
    frame: "NOT PROVIDED",
    state: AI_STATES.uncertain,
    trustScore: 51,
    trustBand: "UNCERTAIN",
    contactRegions: UNKNOWN_CONTACTS,
    boundary: "NOT ESTABLISHED",
    temporalSupport: "NOT PROVIDED",
    reasons: [
      "Vehicle tracking annotation is visible",
      "Tracking confidence is not contact-region confidence",
      "Critical contact information remains unavailable",
    ],
    appliedRules: ["CT-001", "TM-001", "UN-001", "EV-001"],
    context: "The annotation supports vehicle observation, not an automatic sporting conclusion.",
    summary: "Persistent tracking helps assemble evidence across frames; it does not replace boundary reasoning.",
    status: AI_STATES.uncertain,
  },
  {
    id: "ev-track",
    label: "05",
    title: "TRACK CONTEXT",
    type: "context",
    evidenceType: EVIDENCE_TYPES.context,
    image: "/evidence/track.png",
    incidentId: "INCIDENT-DEMO-01",
    trackId: "TRACK 01",
    car: "RED BULL #1",
    timestamp: "NOT PROVIDED",
    frame: "NOT PROVIDED",
    state: AI_STATES.uncertain,
    trustScore: 39,
    trustBand: "UNCERTAIN",
    contactRegions: UNKNOWN_CONTACTS,
    boundary: "LEGAL BOUNDARY VISIBLE; CONTACT UNKNOWN",
    temporalSupport: "NOT PROVIDED",
    reasons: [
      "Track boundary context is visible",
      "Vehicle contact regions are not observable enough for a ruling",
      "STEWARD REVIEW REQUIRED",
    ],
    appliedRules: ["TL-001", "BD-001", "UN-001", "EV-001"],
    context: "A wider view helps a steward understand the scene while preserving uncertainty about the exact contact relation.",
    summary: "Context completes the visual story without pretending that an unseen contact region is outside.",
    status: AI_STATES.uncertain,
  },
];

export const EVIDENCE_CHAIN = [
  "RACE EVENT",
  "VEHICLE",
  "OBSERVATION",
  "CONTACT REGIONS",
  "BOUNDARY",
  "RULE EVALUATION",
  "TEMPORAL SUPPORT",
  "TRUST",
  "STEWARD REVIEW",
] as const;
