import React from "react";
import SectionShell from "./SectionShell";

export default function ProblemSection() {
  return (
    <SectionShell
      id="problem"
      label="THE PROBLEM"
      title="A race contains thousands of moments. Stewards cannot inspect them all equally."
    >
      <div className="mt-8">
        <p className="max-w-2xl text-base leading-relaxed text-kerb-muted md:text-lg">
          Most frames are routine. A few carry the evidence that decides a race. KERB focuses
          attention where evidence matters.
        </p>

        <div className="mt-16 border-t border-kerb-tech pt-10">
          <div className="grid grid-cols-3 gap-px border border-kerb-tech bg-kerb-tech">
            {[
              { k: "FRAMES / RACE", v: "~294,300" },
              { k: "INSPECTED EQUALLY", v: "IMPOSSIBLE" },
              { k: "KERB CANDIDATES", v: "PRIORITIZED" },
            ].map((s) => (
              <div key={s.k} className="bg-kerb-black p-5">
                <p className="font-mono text-[10px] tracking-[0.2em] text-kerb-muted uppercase">{s.k}</p>
                <p className="mt-2 font-display text-xl font-semibold text-kerb-white">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
