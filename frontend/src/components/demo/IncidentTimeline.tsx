import { useState } from "react";

type TimelineState = {
  frame: number;
  time: number;
  state: string;
};

export type SpatialTrackTimeline = {
  track_id: number;
  first_boundary_frame: number | null;
  first_boundary_time: number | null;
  first_outside_frame: number | null;
  first_outside_time: number | null;
  last_outside_frame: number | null;
  last_outside_time: number | null;
  outside_duration_seconds: number;
  peak_frame: number | null;
  peak_time: number | null;
  states: TimelineState[];
  state_counts: Record<string, number>;
  state_durations_seconds: Record<string, number>;
};

const COLORS: Record<string, string> = {
  OUTSIDE: "#e10600",
  BOUNDARY: "#fbbf24",
  INSIDE: "#34d399",
  UNCERTAIN: "#71717a",
  UNKNOWN: "#71717a",
};

function seconds(value: number | null) {
  return value === null ? "—" : `${value.toFixed(2)}s`;
}

function StateStrip({ states }: { states: TimelineState[] }) {
  return (
    <div className="mt-4">
      <div className="flex h-3 overflow-hidden rounded-full bg-white/10" aria-label="Spatial state timeline">
        {states.map((item) => (
          <span
            key={`${item.frame}-${item.time}`}
            className="min-w-[2px] flex-1"
            style={{ backgroundColor: COLORS[item.state] ?? COLORS.UNKNOWN }}
            title={`Frame ${item.frame} @ ${seconds(item.time)} · ${item.state}`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.12em] text-white/45">
        {Object.entries(COLORS).map(([state, color]) => (
          <span key={state} className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
            {state}
          </span>
        ))}
      </div>
    </div>
  );
}

export function IncidentTimeline({ tracks }: { tracks: SpatialTrackTimeline[] }) {
  const [selectedTrackId, setSelectedTrackId] = useState(tracks[0]?.track_id ?? null);
  const selected = tracks.find((track) => track.track_id === selectedTrackId) ?? tracks[0];

  if (!selected) return null;
  const hasOutside = selected.first_outside_frame !== null;

  return (
    <section className="rounded-xl border border-white/10 bg-kerb-charcoal/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-white/45">SPATIAL EVENT</p>
          <h3 className="mt-1 font-display text-xl font-semibold uppercase tracking-[0.16em]">Incident Timeline</h3>
        </div>
        {tracks.length > 1 && (
          <label className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-white/45">
            TRACK ID
            <select
              value={selected.track_id}
              onChange={(event) => setSelectedTrackId(Number(event.target.value))}
              className="rounded border border-white/15 bg-black/50 px-2 py-1 text-xs text-white"
            >
              {tracks.map((track) => (
                <option key={track.track_id} value={track.track_id}>
                  {track.track_id}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <p className="mt-3 font-mono text-xs tracking-[0.14em] text-white/65">CAR / TRACK ID {selected.track_id}</p>
      <StateStrip states={selected.states} />

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="font-mono text-[10px] tracking-[0.14em] text-white/45">FIRST BOUNDARY</p>
          <p className="mt-1 font-mono text-lg text-white/85">{seconds(selected.first_boundary_time)}</p>
          <p className="font-mono text-[10px] text-white/35">
            {selected.first_boundary_frame === null ? "" : `Frame ${selected.first_boundary_frame}`}
          </p>
        </div>
        <div className={`rounded-lg border p-3 ${hasOutside ? "border-kerb-red/50 bg-kerb-red/10" : "border-white/10 bg-white/5"}`}>
          <p className="font-mono text-[10px] tracking-[0.14em] text-white/55">FIRST CLASSIFIED OUTSIDE</p>
          <p className={`mt-1 font-mono text-2xl font-semibold ${hasOutside ? "text-kerb-red" : "text-white/70"}`}>
            {hasOutside ? seconds(selected.first_outside_time) : "None"}
          </p>
          <p className="font-mono text-[10px] text-white/40">
            {hasOutside ? `Frame ${selected.first_outside_frame}` : "No OUTSIDE classification observed."}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="font-mono text-[10px] tracking-[0.14em] text-white/45">LAST CLASSIFIED OUTSIDE</p>
          <p className="mt-1 font-mono text-lg text-white/85">{seconds(selected.last_outside_time)}</p>
          <p className="font-mono text-[10px] text-white/35">
            {selected.last_outside_frame === null ? "" : `Frame ${selected.last_outside_frame}`}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="font-mono text-[10px] tracking-[0.14em] text-white/45">SPATIAL OUTSIDE DURATION</p>
          <p className="mt-1 font-mono text-lg text-white/85">{selected.outside_duration_seconds.toFixed(2)}s</p>
          <p className="font-mono text-[10px] text-white/35">Observed same-state intervals</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] text-white/45">
        <span>PEAK FRAME {selected.peak_frame === null ? "—" : selected.peak_frame}</span>
        <span>PEAK TIME {seconds(selected.peak_time)}</span>
        <span>STEWARD REVIEW REQUIRED</span>
      </div>
    </section>
  );
}
