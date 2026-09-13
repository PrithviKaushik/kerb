import React from "react";
import SectionShell from "./SectionShell";

export default function RaceContextSection() {
  return (
    <SectionShell
      id="race-context"
      label="RACE CONTEXT"
      title="Geometry tells us what happened. Context helps explain why it matters."
    >
      <div className="grid gap-px border border-kerb-tech bg-kerb-tech md:grid-cols-3">
        <Panel title="VIDEO" tag="CAM 04">
          <p className="font-mono text-sm tracking-[0.15em] text-kerb-white">CAR #16</p>
          <p className="mt-1 font-mono text-sm tracking-[0.15em] text-kerb-muted">TURN 5</p>
          <p className="mt-1 font-mono text-sm tracking-[0.15em] text-kerb-red">CORNER EXIT</p>
          <div className="relative mt-6 aspect-video w-full overflow-hidden border border-kerb-tech bg-kerb-black">
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] tracking-[0.12em] text-kerb-white/30 uppercase">ASSET NOT PROVIDED</span>
            <video src="/how-it-works-assets/56.mp4" autoPlay loop muted playsInline preload="auto" className="relative h-full w-full object-contain" aria-label="Annotated race context result" onError={(event) => { event.currentTarget.style.display = "none"; }} />
          </div>
        </Panel>

        <Panel title="RACE CONTEXT" tag="SITUATION">
          <p className="font-mono text-sm tracking-[0.15em] text-kerb-white">2 CARS NEARBY</p>
          <p className="mt-1 font-mono text-sm tracking-[0.15em] text-kerb-red">SIDE-BY-SIDE</p>
          <p className="mt-1 font-mono text-sm tracking-[0.15em] text-kerb-muted">OVERTAKING CONTEXT</p>
          <div className="mt-6 flex gap-2">
            <CarDot n="16" active />
            <CarDot n="04" />
          </div>
        </Panel>
      </div>

    </SectionShell>
  );
}

interface PanelProps {
  title: string;
  tag: string;
  children: React.ReactNode;
}

interface CarDotProps {
  n: string;
  active?: boolean;
}

function Panel({ title, tag, children }: PanelProps) {
  return (
    <div className="bg-kerb-black p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.2em] text-kerb-muted uppercase">{title}</span>
        <span className="font-mono text-[10px] tracking-[0.2em] text-kerb-red uppercase">{tag}</span>
      </div>
      {children}
    </div>
  );
}

function CarDot({ n, active = false }: CarDotProps) {
  return (
    <div className="flex items-center gap-2 border border-kerb-tech px-3 py-2">
      <span className={`h-2 w-2 ${active ? "bg-kerb-red" : "bg-kerb-muted"}`} />
      <span className="font-mono text-[11px] tracking-[0.15em] text-kerb-white">#{n}</span>
    </div>
  );
}
