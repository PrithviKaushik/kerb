"use client";

import { useEffect, useMemo, useState } from "react";
import RadialNav from "@/components/kerb/RadialNav";
import { RULE_CATEGORIES, type KnowledgeRule } from "@/data/rules";
import { getKnowledge } from "@/lib/api/knowledge";
import KnowledgeGraph from "./KnowledgeGraph";
import RuleCard from "./RuleCard";

export default function KnowledgeBasePage() {
  const [category, setCategory] = useState<(typeof RULE_CATEGORIES)[number]>("ALL");
  const [selectedId, setSelectedId] = useState("TL-001");
  const [expandedId, setExpandedId] = useState("TL-001");
  const [rules, setRules] = useState<KnowledgeRule[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => { getKnowledge().then((items) => { setRules(items); setLoadState("ready"); }).catch(() => setLoadState("error")); }, []);
  const filteredRules = useMemo(
    () => category === "ALL" ? rules : rules.filter((rule) => rule.category === category),
    [category, rules],
  );
  const selected = rules.find((rule) => rule.ruleId === selectedId) ?? rules[0];

  const selectRule = (id: string) => {
    setSelectedId(id);
    setExpandedId(id);
    document.getElementById(`rule-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main className="min-h-screen bg-[hsl(var(--kerb-bg))] text-kerb-white">
      <RadialNav active="knowledge" />
      <div className="mx-auto max-w-[1500px] px-5 pt-28 pb-24 sm:px-8 lg:px-12">
        <header className="border-b border-white/10 pb-10">
          <p className="font-mono text-[10px] tracking-[0.25em] text-kerb-red uppercase">KERB / RULE INTELLIGENCE</p>
          <div className="mt-4 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <h1 className="font-display text-6xl font-bold leading-none tracking-tight uppercase sm:text-8xl">Knowledge Base</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-kerb-white/60">The rules KERB operates under, presented as a living technical rulebook for steward review.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-l border-white/15 pl-5 sm:grid-cols-4 lg:min-w-[500px]">
              <Meta label="RULES" value={`${rules.length} ACTIVE`} />
              <Meta label="VERSION" value="1.0" />
              <Meta label="DOMAIN" value="TRACK LIMITS" />
              <Meta label="STATUS" value="ACTIVE" accent />
            </div>
          </div>
        </header>

        {loadState === "loading" && <div className="mt-12 border border-white/10 px-6 py-16 text-center font-mono text-xs text-white/45">Loading Knowledge Base rules...</div>}
        {loadState === "error" && <div className="mt-12 border border-amber-300/30 px-6 py-16 text-center font-mono text-xs text-amber-300">Knowledge Base unavailable.</div>}
        {loadState === "ready" && selected ? (<>
          <section className="mt-12">
          <div className="mb-6 flex flex-col justify-between gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] text-kerb-red uppercase">RULE DECK · {filteredRules.length} CARDS</p>
              <h2 className="mt-2 font-display text-4xl font-semibold uppercase">The operating rules</h2>
              <p className="mt-1 font-mono text-[9px] tracking-[0.15em] text-kerb-white/35 uppercase">SELECT A RULE TO INSPECT ITS LOGIC AND EVIDENCE CONTRACT</p>
            </div>
            <div className="flex flex-wrap gap-2">{RULE_CATEGORIES.map((item) => <button type="button" key={item} onClick={() => setCategory(item)} className={`border px-3 py-2 font-mono text-[9px] tracking-[0.14em] uppercase transition-colors ${category === item ? "border-kerb-red bg-kerb-red/[0.08] text-kerb-red" : "border-white/15 text-kerb-white/45 hover:border-white/40 hover:text-kerb-white"}`}>{item.replace("_", " ")}</button>)}</div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-4">
              {filteredRules.map((rule, index) => <div id={`rule-${rule.ruleId}`} key={rule.ruleId} className="scroll-mt-24"><RuleCard number={String(index + 1).padStart(2, "0")} rule={rule} expanded={expandedId === rule.ruleId} onToggle={() => { setExpandedId(expandedId === rule.ruleId ? "" : rule.ruleId); setSelectedId(rule.ruleId); }} /></div>)}
            </div>
            <aside className="h-fit border border-white/10 bg-white/[0.02] xl:sticky xl:top-8">
              <div className="border-b border-white/10 px-5 py-5"><p className="font-mono text-[10px] tracking-[0.2em] text-kerb-red uppercase">RULE INSPECTOR</p><p className="mt-3 font-display text-3xl font-semibold uppercase">{selected.name}</p><p className="mt-2 font-mono text-[10px] tracking-[0.16em] text-kerb-white/45">{selected.ruleId} · {selected.category}</p></div>
              <div className="space-y-5 px-5 py-5"><div><p className="font-mono text-[9px] tracking-[0.18em] text-kerb-white/40 uppercase">DESCRIPTION</p><p className="mt-2 text-sm leading-relaxed text-kerb-white/65">{selected.description}</p></div><InspectorList label="DEPENDENCIES" values={selected.dependencies.length ? selected.dependencies : ["NONE"]} /><InspectorList label="EVIDENCE REQUIRED" values={selected.evidenceRequired} /><InspectorList label="APPLIES TO" values={selected.appliesTo} /><div className="flex justify-between border-t border-white/10 pt-4 font-mono text-[10px] tracking-[0.14em] uppercase"><span className="text-kerb-white/40">PRIORITY</span><span className={selected.priority === "CRITICAL" ? "text-kerb-red" : "text-kerb-white/70"}>{selected.priority}</span></div><div className="flex justify-between font-mono text-[10px] tracking-[0.14em] uppercase"><span className="text-kerb-white/40">STATUS</span><span className="text-emerald-300">ACTIVE · V{selected.version}</span></div><p className="border border-kerb-red/30 bg-kerb-red/[0.05] px-3 py-3 font-mono text-[10px] tracking-[0.13em] text-kerb-red uppercase">STEWARD REVIEW REQUIRED</p></div>
            </aside>
          </div>
        </section>

          <section className="mt-20 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div><div className="mb-5"><p className="font-mono text-[10px] tracking-[0.22em] text-kerb-red uppercase">DEPENDENCY MAP</p><h2 className="mt-2 font-display text-3xl font-semibold uppercase">How the rules connect</h2></div><KnowledgeGraph rules={rules} selectedId={selectedId} onSelect={selectRule} /></div>
            <div className="h-fit border border-kerb-red/30 bg-kerb-red/[0.04] p-6 lg:mt-11"><p className="font-mono text-[10px] tracking-[0.2em] text-kerb-red uppercase">OPERATING PRINCIPLE</p><p className="mt-6 font-display text-4xl font-semibold leading-[0.95] uppercase">AI finds the incident.<br /><span className="text-kerb-red">The steward makes the decision.</span></p><p className="mt-6 text-sm leading-relaxed text-kerb-white/55">Every rule exists to make evidence inspectable. KERB produces candidates and uncertainty states, never an automatic sporting decision.</p></div>
          </section>
        </>) : null}
      </div>
    </main>
  );
}

function Meta({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div><p className="font-mono text-[9px] tracking-[0.18em] text-kerb-white/40 uppercase">{label}</p><p className={`mt-1 font-mono text-xs tracking-[0.12em] uppercase ${accent ? "text-emerald-300" : "text-kerb-white/75"}`}>{value}</p></div>; }
function InspectorList({ label, values }: { label: string; values: string[] }) { return <div className="border-t border-white/10 pt-4"><p className="font-mono text-[9px] tracking-[0.18em] text-kerb-white/40 uppercase">{label}</p><div className="mt-2 flex flex-wrap gap-2">{values.map((value) => <span key={value} className="border border-white/15 px-2 py-1 font-mono text-[10px] text-kerb-white/65">{value}</span>)}</div></div>; }
