export const EVIDENCE_TYPES = {
  frame: "RAW FRAME",
  video: "VIDEO",
  detection: "DETECTION",
  boundary: "BOUNDARY EVENT",
  reconstruction: "RECONSTRUCTION",
} as const;

export type EvidenceType = keyof typeof EVIDENCE_TYPES;

export const EVIDENCE_STATUS = {
  detected: "TRACK-LIMIT EVENT DETECTED",
  potential: "POTENTIAL VIOLATION",
  review: "REVIEW REQUIRED",
  ready: "EVIDENCE READY",
} as const;

export type EvidenceStatus =
  (typeof EVIDENCE_STATUS)[keyof typeof EVIDENCE_STATUS];

/**
 * Evidence item produced by the KERB detection/review pipeline.
 */
export interface EvidenceItem {
  id: string;
  label: string;
  title: string;
  type: EvidenceType;
  image: string;

  car?: string;
  lap?: number;
  turn?: string;
  timestamp?: string;
  measurement?: string;
  status?: EvidenceStatus;
  summary?: string;
}

export const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    id: "ev-01",
    label: "01",
    title: "RAW FRAME",
    type: "frame",
    image:
      "https://media.base44.com/images/public/6aa3a0c557dd0065cd70c834/fb17fe056_generated_image.png",
    car: "CAR 16",
    lap: 18,
    turn: "TURN 04",
    timestamp: "14:32:18.442",
    measurement: "0.00 m",
    status: EVIDENCE_STATUS.review,
    summary:
      "Source frame captured at the entry to turn four. Car 16 carries speed toward the outer edge.",
  },
  {
    id: "ev-02",
    label: "02",
    title: "POSITION",
    type: "detection",
    image:
      "https://media.base44.com/images/public/6aa3a0c557dd0065cd70c834/5237ef8dc_generated_image.png",
    car: "CAR 04",
    lap: 22,
    turn: "TURN 09",
    timestamp: "14:35:02.118",
    measurement: "0.18 m",
    status: EVIDENCE_STATUS.detected,
    summary:
      "Position snapshot isolates the moment the car runs wide against the kerb at turn nine.",
  },
  {
    id: "ev-03",
    label: "03",
    title: "BOUNDARY EVENT",
    type: "boundary",
    image:
      "https://media.base44.com/images/public/6aa3a0c557dd0065cd70c834/acbe253a7_generated_image.png",
    car: "CAR 16",
    lap: 18,
    turn: "TURN 04",
    timestamp: "14:32:18.442",
    measurement: "0.31 m",
    status: EVIDENCE_STATUS.potential,
    summary:
      "Boundary crossing detected. The luminous line marks the defined track edge at the point of contact.",
  },
  {
    id: "ev-04",
    label: "04",
    title: "ANNOTATED FRAME",
    type: "frame",
    image:
      "https://media.base44.com/images/public/6aa3a0c557dd0065cd70c834/a9a79c8d6_generated_image.png",
    car: "CAR 33",
    lap: 31,
    turn: "TURN 02",
    timestamp: "14:41:55.880",
    measurement: "0.09 m",
    status: EVIDENCE_STATUS.ready,
    summary:
      "Annotated frame with reference markers aligned to the boundary for steward orientation.",
  },
  {
    id: "ev-05",
    label: "05",
    title: "BOUNDARY ANALYSIS",
    type: "detection",
    image:
      "https://media.base44.com/images/public/6aa3a0c557dd0065cd70c834/c175e81e5_generated_image.png",
    car: "CAR 04",
    lap: 22,
    turn: "TURN 09",
    timestamp: "14:35:02.118",
    measurement: "0.18 m",
    status: EVIDENCE_STATUS.review,
    summary:
      "Close-range analysis of the contact patch against the racing line and defined boundary marker.",
  },
  {
    id: "ev-06",
    label: "06",
    title: "RECONSTRUCTION",
    type: "reconstruction",
    image:
      "https://media.base44.com/images/public/6aa3a0c557dd0065cd70c834/0b86aec56_generated_image.png",
    car: "CAR 16",
    lap: 18,
    turn: "TURN 04",
    timestamp: "14:32:18.442",
    measurement: "0.31 m",
    status: EVIDENCE_STATUS.ready,
    summary:
      "Spatial reconstruction of the moment, tracing the car and track edge for final review.",
  },
];

// The evidence chain shown in the lower explanatory section.
export const EVIDENCE_CHAIN = [
  "SOURCE",
  "POSITION",
  "BOUNDARY",
  "EVENT",
  "REVIEW",
] as const;