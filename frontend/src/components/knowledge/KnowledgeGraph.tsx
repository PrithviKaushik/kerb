"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import type { KnowledgeRule } from "@/data/rules";

type GraphNode = { id: string; label: string; x: number; y: number };

const GRAPH_NODES: GraphNode[] = [
  { id: "CT-001", label: "CONTACT", x: 20, y: 24 },
  { id: "BD-001", label: "BOUNDARY", x: 20, y: 68 },
  { id: "TL-001", label: "FOUR OUTSIDE", x: 50, y: 30 },
  { id: "TL-002", label: "FORCED OFF TRACK", x: 74, y: 19 },
  { id: "TM-001", label: "TEMPORAL SUPPORT", x: 72, y: 52 },
  { id: "UN-001", label: "UNCERTAINTY", x: 51, y: 78 },
  { id: "EV-001", label: "STEWARD REVIEW", x: 80, y: 82 },
];

const NODE_RADIUS: Record<string, number> = { CRITICAL: 44, HIGH: 40, MEDIUM: 36 };

export default function KnowledgeGraph({ rules, selectedId, onSelect }: { rules: KnowledgeRule[]; selectedId: string; onSelect: (id: string) => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const ruleMap = new Map(rules.map((rule) => [rule.ruleId, rule]));
  const focusId = hoveredId ?? selectedId;
  const focusedRule = ruleMap.get(focusId);
  const connectedIds = new Set([
    focusId,
    ...(focusedRule?.dependencies ?? []),
    ...rules.filter((rule) => rule.dependencies.includes(focusId)).map((rule) => rule.ruleId),
  ]);
  const edges = rules.flatMap((rule) => rule.dependencies.map((dependency) => ({ from: rule.ruleId, to: dependency })));

  const handleSelect = (id: string) => {
    setHoveredId(null);
    onSelect(id);
  };

  return (
    <div className="relative min-h-[650px] overflow-hidden border border-white/15 bg-[#08090c] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(225,6,0,0.08),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(255,255,255,0.06),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(to right, #303136 1px, transparent 1px), linear-gradient(to bottom, #303136 1px, transparent 1px)", backgroundSize: "72px 72px" }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-kerb-red/70 to-transparent" />

      <div className="relative min-h-[650px] p-5 sm:p-8">
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.22em] text-kerb-red uppercase"><span className="h-1.5 w-1.5 animate-pulse bg-kerb-red" />DEPENDENCY GRAPH · LIVE LOGIC</div>
            <p className="mt-2 max-w-md text-xs leading-relaxed text-kerb-white/45">Hover or select a node to isolate the rules governing its decision path.</p>
          </div>
          <div className="hidden text-right font-mono text-[9px] tracking-[0.15em] text-kerb-white/35 uppercase sm:block"><p>REGISTRY ONLINE</p><p className="mt-1">{rules.length} NODES · {edges.length} LINKS</p></div>
        </div>

        <div className="relative mt-4 h-[510px]">
          <div className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[8px] tracking-[0.18em] text-kerb-white/20 [writing-mode:vertical-rl] uppercase">EVIDENCE LOGIC / 01—07</div>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" aria-hidden>
            <defs>
              <filter id="knowledge-line-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              <linearGradient id="knowledge-line" x1="0" x2="1"><stop stopColor="#e10600" stopOpacity="0.2" /><stop offset="0.5" stopColor="#ff3b4d" stopOpacity="0.9" /><stop offset="1" stopColor="#e10600" stopOpacity="0.2" /></linearGradient>
            </defs>
            {edges.map(({ from, to }, index) => {
              const source = GRAPH_NODES.find((node) => node.id === from);
              const target = GRAPH_NODES.find((node) => node.id === to);
              if (!source || !target) return null;
              const active = connectedIds.has(from) && connectedIds.has(to);
              const lineId = `knowledge-edge-${index}`;
              return (
                <g key={`${from}-${to}`} opacity={active ? 1 : 0.24}>
                  <line id={lineId} x1={`${source.x}%`} y1={`${source.y}%`} x2={`${target.x}%`} y2={`${target.y}%`} stroke={active ? "url(#knowledge-line)" : "#4b4c52"} strokeWidth={active ? 1.5 : 1} strokeDasharray={active ? "1 0" : "3 8"} filter={active ? "url(#knowledge-line-glow)" : undefined} />
                  {active && <motion.circle r="2.5" fill="#ff3b4d" filter="url(#knowledge-line-glow)" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], offsetDistance: ["0%", "100%"] }} transition={{ duration: 2.8, delay: index * 0.35, repeat: Infinity, ease: "linear" }} style={{ offsetPath: `path("M ${source.x} ${source.y} L ${target.x} ${target.y}")` }} />}
                </g>
              );
            })}
          </svg>

          {GRAPH_NODES.map((node, index) => {
            const rule = ruleMap.get(node.id);
            if (!rule) return null;
            const radius = NODE_RADIUS[rule.priority];
            const active = node.id === focusId;
            const connected = connectedIds.has(node.id);
            return (
              <motion.button type="button" key={node.id} onClick={() => handleSelect(node.id)} onMouseEnter={() => setHoveredId(node.id)} onMouseLeave={() => setHoveredId(null)} onFocus={() => setHoveredId(node.id)} onBlur={() => setHoveredId(null)} initial={{ opacity: 0, scale: 0.72, y: 10 }} animate={{ opacity: connected ? 1 : 0.3, scale: active ? 1.08 : 1, y: 0 }} transition={{ delay: index * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kerb-red" style={{ left: `${node.x}%`, top: `${node.y}%`, width: radius * 2, height: radius * 2, zIndex: active ? 20 : 10 }} aria-label={`${node.id} ${node.label}`}>
                {active && <motion.span className="absolute inset-[-9px] rounded-full border border-kerb-red/60" initial={{ opacity: 0.2, scale: 0.86 }} animate={{ opacity: [0.2, 0.65, 0.2], scale: [0.86, 1.12, 0.86] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }} />}
                <span className="absolute inset-0 rounded-full border border-white/15 bg-[#101116]/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_14px_28px_rgba(0,0,0,0.5)]" />
                <span className={`absolute inset-1 rounded-full border ${active ? "border-kerb-red/80" : connected ? "border-white/25" : "border-white/10"}`} />
                <span className="relative block pt-[27%] font-mono text-[8px] tracking-[0.13em] text-kerb-red">{node.id}</span>
                <span className="relative mt-1 block px-2 font-display text-sm font-semibold leading-[0.9] tracking-tight uppercase sm:text-base">{node.label}</span>
                <span className="relative mt-1 block font-mono text-[7px] tracking-[0.12em] text-kerb-white/35 uppercase">{rule.priority}</span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 font-mono text-[9px] tracking-[0.14em] text-kerb-white/35 uppercase">
          <div className="flex flex-wrap gap-x-5 gap-y-2"><span><i className="mr-2 inline-block h-2 w-2 rounded-full border border-kerb-red" />ACTIVE PATH</span><span><i className="mr-2 inline-block h-2 w-2 rounded-full border border-white/35" />CONNECTED</span><span><i className="mr-2 inline-block h-2 w-2 rounded-full border border-white/15" />LOWER EMPHASIS</span></div>
          <span>FOCUS <b className="font-normal text-kerb-red">{focusedRule?.ruleId}</b> · {focusedRule?.priority}</span>
        </div>
      </div>
    </div>
  );
}
