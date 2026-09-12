import React, { useRef } from "react";
import { motion } from "framer-motion";
import TechnicalLabel from "./TechnicalLabel";

// Simplified circuit path (a stylized corner-rich circuit)
const TRACK_PATH =
  "M40,160 C80,80 160,70 220,110 C260,135 280,90 340,80 C420,66 470,120 520,150 C580,185 640,150 700,170 C760,190 800,240 760,300 C720,360 620,360 540,340 C460,320 380,360 300,350 C220,340 140,360 90,320 C50,290 20,230 40,160 Z";

export default function HeroSection() {
  const ref = useRef(null);

  return (
    <section ref={ref} className="relative min-h-screen w-full overflow-hidden bg-kerb-black">
      {/* Grid backdrop */}
      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #242424 1px, transparent 1px), linear-gradient(to bottom, #242424 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      <div className="relative z-20 mx-auto flex min-h-screen max-w-[1400px] flex-col justify-center px-6 py-24 md:px-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <TechnicalLabel accent>KERB / SYSTEM OVERVIEW</TechnicalLabel>
        </motion.div>

        <div className="mt-8">
          <HeroTitle />
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-10 max-w-xl text-lg leading-relaxed text-kerb-white/80 md:text-xl"
        >
          From race footage to steward-ready evidence.
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="mt-4 max-w-xl text-sm leading-relaxed text-kerb-muted"
        >
          KERB combines computer vision, deterministic track-limit rules, temporal reasoning,
          and race context to surface potential incidents for human review.
        </motion.p>
      </div>

      {/* Track visualization */}
      <TrackViz />
    </section>
  );
}

function HeroTitle() {
  const lines = ["HOW", "KERB", "WORKS"];
  return (
    <h1 className="font-display font-extrabold leading-[0.82] tracking-tight">
      {lines.map((l, i) => (
        <motion.span
          key={l}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="block text-[18vw] text-kerb-white md:text-[12rem]"
        >
          {l === "KERB" ? <span className="text-kerb-red">{l}</span> : l}
        </motion.span>
      ))}
    </h1>
  );
}

function TrackViz() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
      <svg
        viewBox="0 0 800 400"
        className="h-full w-full opacity-60"
        preserveAspectRatio="xMidYMid meet"
      >
        <motion.path
          d={TRACK_PATH}
          fill="none"
          stroke="#242424"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, ease: "easeInOut" }}
        />
        <motion.path
          d={TRACK_PATH}
          fill="none"
          stroke="#E10600"
          strokeWidth="1.5"
          strokeDasharray="4 8"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.5, ease: "easeInOut", delay: 0.3 }}
        />
        <circle r="5" fill="#E10600">
          <animateMotion dur="6s" repeatCount="indefinite" path={TRACK_PATH} />
        </circle>
        <circle r="14" fill="none" stroke="#E10600" strokeWidth="1" opacity="0.4">
          <animateMotion dur="6s" repeatCount="indefinite" path={TRACK_PATH} />
        </circle>
      </svg>

      {/* Telemetry HUD overlays */}
      <div className="pointer-events-none absolute inset-0">
        <HudTag top="18%" left="6%" lines={["TRACK 05", "FRAME 01842"]} />
        <HudTag top="24%" right="6%" lines={["ID 16", "SPEED 214 KM/H"]} />
        <HudTag bottom="20%" left="8%" lines={["BOUNDARY +0.12M", "ANALYSIS ACTIVE"]} accent />
        <HudTag bottom="16%" right="7%" lines={["STATUS", "TRACKING LOCKED"]} />
      </div>
    </div>
  );
}

interface HudTagProps {
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  lines: string[];
  accent?: boolean;
}

function HudTag({ top, left, right, bottom, lines, accent = false }: HudTagProps) {
  return (
    <div
      className="absolute font-mono text-[10px] tracking-[0.15em] uppercase"
      style={{ top, left, right, bottom }}
    >
      <div className="border-l border-kerb-tech pl-2">
        {lines.map((l) => (
          <p key={l} className={accent ? "text-kerb-red" : "text-kerb-muted"}>
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}
