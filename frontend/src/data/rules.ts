export type RuleCategory = "TRACK_LIMITS" | "CONTACT" | "BOUNDARY" | "TEMPORAL" | "UNCERTAINTY" | "EVIDENCE";
export type RulePriority = "CRITICAL" | "HIGH" | "MEDIUM";

export type KnowledgeRule = {
  ruleId: string;
  name: string;
  category: RuleCategory;
  description: string;
  priority: RulePriority;
  appliesTo: string[];
  dependencies: string[];
  evidenceRequired: string[];
  parameters: Record<string, string | number>;
  version: string;
  enabled: boolean;
};

export const KNOWLEDGE_RULES: KnowledgeRule[] = [
  {
    ruleId: "TL-001",
    name: "Four Outside Rule",
    category: "TRACK_LIMITS",
    description: "A track-limit violation candidate requires all four contact regions of the vehicle to be outside the legal track boundary at the evaluated observation.",
    priority: "CRITICAL",
    appliesTo: ["track_limits", "vehicle_contact"],
    dependencies: ["CT-001", "BD-001"],
    evidenceRequired: ["front_left", "front_right", "rear_left", "rear_right"],
    parameters: { required_outside_regions: 4 },
    version: "1.0",
    enabled: true,
  },
  {
    ruleId: "TL-002",
    name: "Forced Off Track",
    category: "TRACK_LIMITS",
    description: "A driver should not be treated as committing a track-limit violation when they are forced beyond the legal track boundary by another driver. The situation requires contextual steward review rather than automatic classification as a violation.",
    priority: "CRITICAL",
    appliesTo: ["track_limits", "race_context", "steward_review"],
    dependencies: ["TL-001", "EV-001"],
    evidenceRequired: ["vehicle_contact_regions", "nearby_vehicle", "relative_vehicle_motion", "event_frames"],
    parameters: { requires_contextual_review: "true" },
    version: "1.0",
    enabled: true,
  },
  {
    ruleId: "BD-001",
    name: "Boundary Contact",
    category: "BOUNDARY",
    description: "Contact with the legal track boundary must not be classified as outside. A contact region on the boundary is treated as ON_BOUNDARY.",
    priority: "CRITICAL",
    appliesTo: ["track_limits", "boundary_classification"],
    dependencies: [],
    evidenceRequired: ["legal_boundary", "contact_region"],
    parameters: { boundary_tolerance_px: 2 },
    version: "1.0",
    enabled: true,
  },
  {
    ruleId: "CT-001",
    name: "Vehicle Contact Regions",
    category: "CONTACT",
    description: "Track-limit evaluation uses four vehicle contact regions representing the front-left, front-right, rear-left and rear-right tire contact areas.",
    priority: "HIGH",
    appliesTo: ["vehicle_geometry", "track_limits"],
    dependencies: [],
    evidenceRequired: ["vehicle_detection", "vehicle_geometry"],
    parameters: { contact_y_ratio: 0.05, left_x_ratio: 0.2, right_x_ratio: 0.8 },
    version: "1.0",
    enabled: true,
  },
  {
    ruleId: "TM-001",
    name: "Temporal Support",
    category: "TEMPORAL",
    description: "Temporal support is established when at least three eligible observations within a five-observation window satisfy the four-outside condition.",
    priority: "HIGH",
    appliesTo: ["track_limits", "temporal_evidence"],
    dependencies: [],
    evidenceRequired: ["timestamp", "frame_history"],
    parameters: { window_size: 5, required_support: 3 },
    version: "1.0",
    enabled: true,
  },
  {
    ruleId: "UN-001",
    name: "Unknown Contact Handling",
    category: "UNCERTAINTY",
    description: "An unobservable critical contact region must not be assumed to be outside the legal boundary. The observation is treated as uncertain.",
    priority: "CRITICAL",
    appliesTo: ["track_limits", "vehicle_geometry", "evidence_quality"],
    dependencies: [],
    evidenceRequired: ["contact_region_observability"],
    parameters: { maximum_trust_score: 59 },
    version: "1.0",
    enabled: true,
  },
  {
    ruleId: "EV-001",
    name: "Steward Review Required",
    category: "EVIDENCE",
    description: "KERB produces evidence-backed incident candidates for human steward review. The system does not make the final sporting decision.",
    priority: "CRITICAL",
    appliesTo: ["incident_reporting", "steward_review"],
    dependencies: [],
    evidenceRequired: ["incident_state", "evidence_frames", "trust_score"],
    parameters: {},
    version: "1.0",
    enabled: true,
  },
];

export const RULE_CATEGORIES = ["ALL", "TRACK_LIMITS", "CONTACT", "BOUNDARY", "TEMPORAL", "UNCERTAINTY", "EVIDENCE"] as const;
