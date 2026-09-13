import type { ReactNode } from "react";
import { StateBadge } from "./StateBadge";

type StageProps = {
  index: number;
  title: string;
  skill: string;
  children: ReactNode;
  states?: Record<string, number>;
};

export function PipelineStage({ index, title, skill, states, children }: StageProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-black/55 backdrop-blur-md">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl font-semibold text-kerb-red">
            {String(index).padStart(2, "0")}
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold uppercase tracking-[0.18em]">
              {title}
            </h2>
            <p className="font-mono text-[10px] tracking-[0.12em] text-white/40">{skill}</p>
          </div>
        </div>
        {states && Object.keys(states).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {Object.entries(states).map(([state, count]) => (
              <span key={state} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/70">
                <StateBadge state={state} />
                {count}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}