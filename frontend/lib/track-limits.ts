import { Gauge, Settings, Video, type LucideIcon } from "lucide-react";

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
];

export const SECTOR_ICONS: Record<string, LucideIcon> = {
  system: Settings,
  "how-it-works": Gauge,
  evidence: Video,
};
