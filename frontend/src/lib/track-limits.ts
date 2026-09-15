import { Activity, BookOpen, FileText, Gauge, ListChecks, Settings, Video, type LucideIcon } from "lucide-react";

export type Sector = {
  id: string;
  label: string;
  code: string;
  description: string;
};

export const SECTORS: Sector[] = [
  {
    id: "system",
    label: "SYSTEM",
    code: "SEC-01",
    description:
      "Core platform status — timing feeds, track sensors and review services, all nominal and streaming.",
  },
  {
    id: "how-it-works",
    label: "HOW IT WORKS",
    code: "SEC-02",
    description:
      "Cameras, timing loops and GPS fuse into one model — the wheel you just opened is the whole pipeline.",
  },
  {
    id: "evidence",
    label: "EVIDENCE",
    code: "SEC-03",
    description:
      "Frame-accurate case files for every breach — video, position and ruling, sealed together.",
  },
  {
    id: "knowledge",
    label: "KNOWLEDGE",
    code: "SEC-04",
    description:
      "The explicit rules governing contact, boundary, temporal support, uncertainty and steward review.",
  },
  {
    id: "reports",
    label: "REPORTS",
    code: "SEC-05",
    description:
      "Historical incident records preserving evidence, AI assessment and the steward's final review.",
  },
  {
    id: "demo",
    label: "DEMO",
    code: "SEC-06",
    description: "Run race footage through the KERB intelligence pipeline and inspect its returned candidates.",
  },
  {
    id: "incidents",
    label: "INCIDENTS",
    code: "SEC-07",
    description: "Prioritized evidence-backed incidents waiting for steward attention.",
  },
];

export const SECTOR_ICONS: Record<string, LucideIcon> = {
  system: Settings,
  "how-it-works": Gauge,
  evidence: Video,
  knowledge: BookOpen,
  reports: FileText,
  demo: Activity,
  incidents: ListChecks,
};
