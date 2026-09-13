"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { KnowledgeRule } from "@/data/rules";

export default function RuleCard({ number, rule, expanded, onToggle }: { number: string; rule: KnowledgeRule; expanded: boolean; onToggle: () => void }) {
  return (
    <motion.article layout className={`border bg-white/[0.015] transition-colors ${expanded ? "border-kerb-red/60" : "border-white/10 hover:border-white/30"}`}>
      <button type="button" onClick={onToggle} aria-expanded={expanded} className="w-full px-5 py-5 text-left">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-4"><span className="font-display text-4xl font-bold leading-none text-kerb-white/20">{number}</span><div><p className="font-mono text-[10px] tracking-[0.2em] text-kerb-red">{rule.ruleId} · {rule.category}</p><h3 className="mt-2 font-display text-2xl font-semibold uppercase">{rule.name}</h3></div></div>
          <div className="flex items-center gap-3"><span className="font-mono text-[10px] tracking-[0.16em] text-kerb-white/45 uppercase">{rule.priority}</span><span className="h-2 w-2 bg-emerald-300" /></div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-kerb-white/55">{rule.description}</p>
      </button>
      <AnimatePresence initial={false}>
        {expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="grid gap-5 border-t border-white/10 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="DEPENDENCIES" values={rule.dependencies.length ? rule.dependencies : ["NONE"]} />
          <Detail label="EVIDENCE REQUIRED" values={rule.evidenceRequired} />
          <Detail label="APPLIES TO" values={rule.appliesTo} />
          <div><p className="font-mono text-[9px] tracking-[0.18em] text-kerb-white/40 uppercase">PARAMETERS</p><div className="mt-2 space-y-1 font-mono text-[11px] text-kerb-white/70">{Object.entries(rule.parameters).length ? Object.entries(rule.parameters).map(([key, value]) => <p key={key}>{key}: <span className="text-kerb-red">{value}</span></p>) : <p>NONE</p>}</div><p className="mt-4 font-mono text-[9px] tracking-[0.18em] text-kerb-white/40 uppercase">VERSION / STATUS</p><p className="mt-2 font-mono text-[11px] text-kerb-white/70">{rule.version} · ACTIVE</p></div>
        </div></motion.div>}
      </AnimatePresence>
    </motion.article>
  );
}

function Detail({ label, values }: { label: string; values: string[] }) {
  return <div><p className="font-mono text-[9px] tracking-[0.18em] text-kerb-white/40 uppercase">{label}</p><div className="mt-2 space-y-1 font-mono text-[11px] text-kerb-white/70">{values.map((value) => <p key={value}>{value}</p>)}</div></div>;
}
