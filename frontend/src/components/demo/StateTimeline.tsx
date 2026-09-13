type TimelineItem = {
  frame_index: number;
  spatial_state: string;
  off_track_fraction: number;
};

const COLOR: Record<string, string> = {
  OUTSIDE: "#e10600",
  BOUNDARY: "#fbbf24",
  INSIDE: "#34d399",
  UNCERTAIN: "#52525b",
  UNKNOWN: "#52525b",
};

/** Compact full-clip bar strip: one cell per tracked frame, colored by state. */
export function StateTimeline({ rows }: { rows: TimelineItem[] }) {
  if (rows.length === 0) return null;
  const width = Math.max(320, rows.length * 8);
  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} 34`}
        className="h-[34px] min-w-full"
        role="img"
        aria-label="Spatial state per frame"
      >
        {rows.map((row, index) => {
          const x = index * 8;
          return (
            <rect
              key={row.frame_index}
              x={x}
              y={10}
              width={7}
              height={14}
              rx={1}
              fill={COLOR[row.spatial_state] ?? COLOR.UNKNOWN}
            >
              <title>{`#${row.frame_index} ${row.spatial_state} ${row.off_track_fraction}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex items-center gap-4 font-mono text-[10px] tracking-[0.14em] text-white/45">
        {Object.entries(COLOR).map(([state, color]) => (
          <span key={state} className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
            {state}
          </span>
        ))}
        <span className="ml-auto">frame {rows[0]?.frame_index} → {rows[rows.length - 1]?.frame_index}</span>
      </div>
    </div>
  );
}