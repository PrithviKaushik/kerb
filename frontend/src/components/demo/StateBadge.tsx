const STYLE: Record<string, string> = {
  OUTSIDE: "bg-[#e10600] text-white",
  BOUNDARY: "bg-amber-400/90 text-black",
  INSIDE: "bg-emerald-400/90 text-black",
  UNCERTAIN: "bg-neutral-600/80 text-neutral-100",
  UNKNOWN: "bg-neutral-600/80 text-neutral-100",
};

export function StateBadge({ state }: { state: string }) {
  const label = state === "BOUNDARY" ? "ON BOUNDARY" : state;
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 font-mono text-[10px] font-bold tracking-[0.18em] ${
        STYLE[state] ?? STYLE.UNKNOWN
      }`}
    >
      {label}
    </span>
  );
}