export const PIPELINE_STAGES = [
  { id: "video", label: "RACE VIDEO", desc: "Raw broadcast feed ingested frame by frame." },
  { id: "discovery", label: "INCIDENT DISCOVERY", desc: "Candidate moments surfaced by attention priority." },
  { id: "perception", label: "VEHICLE PERCEPTION", desc: "Detect cars, assign persistent track IDs." },
  { id: "geometry", label: "CONTACT GEOMETRY", desc: "Estimate four observable contact regions." },
  { id: "boundary", label: "BOUNDARY RELATION", desc: "Classify each region against the legal line." },
  { id: "fouroutside", label: "FOUR-OUTSIDE RULE", desc: "Apply deterministic sporting logic." },
  { id: "temporal", label: "TEMPORAL VALIDATION", desc: "Require multi-frame support before promoting." },
  { id: "trust", label: "EVIDENCE TRUST", desc: "Score the strength of the assembled evidence." },
  { id: "context", label: "RACE CONTEXT", desc: "Fuse telemetry and situational context." },
  { id: "package", label: "EVIDENCE PACKAGE", desc: "Assemble the steward-ready case file." },
  { id: "review", label: "STEWARD REVIEW", desc: "Human steward makes the final call." },
];

export const PRIORITIZATION_FACTORS = [
  { label: "STRAIGHT", weight: 0.15, note: "Normal speed, low attention" },
  { label: "BRAKING", weight: 0.45, note: "Threshold moments" },
  { label: "CORNER ENTRY", weight: 0.70, note: "Boundary proximity rising" },
  { label: "CORNER EXIT", weight: 0.92, note: "Highest track-limit risk" },
  { label: "SIDE-BY-SIDE", weight: 0.80, note: "Overtaking context" },
];

export const TRUST_FACTORS = [
  { label: "TRACKING STABILITY", value: 15 },
  { label: "BOUNDARY CLARITY", value: 10 },
  { label: "CONTACT VISIBILITY", value: 10 },
  { label: "GEOMETRIC MARGIN", value: 10 },
  { label: "TEMPORAL SUPPORT", value: 5 },
];

export const TEMPORAL_FRAMES = [
  { id: "01", supported: true },
  { id: "02", supported: false },
  { id: "03", supported: true },
  { id: "04", supported: true },
  { id: "05", supported: false },
];

export const INCIDENT = {
  trackId: 16,
  driver: "FERRARI #16",
  timestamp: "01:24.320",
  location: "TURN 5",
  fourOutside: true,
  temporalSupport: "3 / 5",
  trust: 87,
  trustLabel: "MEDIUM-HIGH",
};