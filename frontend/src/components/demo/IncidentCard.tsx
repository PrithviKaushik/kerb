import { StateBadge } from "./StateBadge";

export type EvidenceFrame = { frame_index?: number; timestamp_s?: number; role?: string };

export type KerbIncident = {
  incident_id?: string;
  state?: string;
  review_required?: boolean;
  vehicle?: { track_id?: number };
  event?: { frame_index?: number };
  summary?: { reason?: string };
  geometry?: {
    four_outside?: boolean | null;
    contact_regions?: Record<string, string>;
  };
  temporal?: { eligible_frames?: number; supporting_frames?: number };
  evidence?: { frames?: EvidenceFrame[] };
  rules?: string[];
  trust?: { score?: number; band?: string };
};

type IncidentProps = {
  incident: KerbIncident;
  href?: string;
};

export function IncidentCard({ incident, href }: IncidentProps) {
  if (!incident) return null;
  const trust = incident.trust ?? {};
  const temporal = incident.temporal ?? {};
  const geometry = incident.geometry ?? {};
  const evidence = incident.evidence ?? {};
  return (
    <div className="rounded-xl border border-white/10 bg-kerb-charcoal/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-white/45">
            {incident.incident_id} · TRACK {incident.vehicle?.track_id} · EVENT FRAME{" "}
            {incident.event?.frame_index}
          </p>
          <div className="mt-1 flex items-center gap-3">
            <StateBadge state={incident.state === "VIOLATION_CANDIDATE" ? "OUTSIDE" : incident.state ?? "UNKNOWN"} />
            <p className="font-display text-sm font-semibold uppercase tracking-[0.16em]">
              {incident.state?.replace("_", " ")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl font-semibold text-kerb-white">{trust.score}</p>
          <p className="font-mono text-[10px] tracking-[0.2em] text-white/45">
            TRUST · {trust.band}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-white/5 p-3">
          <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">FOUR OUTSIDE</p>
          <p className="mt-1 font-mono text-sm text-white/80">
            {geometry.four_outside === true ? "yes" : geometry.four_outside === false ? "no" : "blocked"}
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">TEMPORAL SUPPORT</p>
          <p className="mt-1 font-mono text-sm text-white/80">
            {temporal.eligible_frames} eligible · {temporal.supporting_frames} outside
          </p>
        </div>
        <div className="rounded-lg bg-white/5 p-3">
          <p className="font-mono text-[10px] tracking-[0.18em] text-white/45">EVIDENCE FRAMES</p>
          <p className="mt-1 font-mono text-sm text-white/80">{evidence.frames?.length ?? 0}</p>
        </div>
      </div>

      {geometry.contact_regions && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] tracking-[0.18em] text-white/45">CONTACTS:</span>
          {Object.entries(geometry.contact_regions).map(([name, state]) => (
            <span key={name} className="inline-flex items-center gap-1.5">
              <span className="font-mono text-[10px] text-white/60">{name}</span>
              <StateBadge state={String(state)} />
            </span>
          ))}
        </div>
      )}

      {incident.rules && incident.rules.length > 0 && (
        <p className="mt-3 font-mono text-[10px] tracking-[0.14em] text-white/40">
          RULES {incident.rules.join(" · ")}
        </p>
      )}

      {href ? (
        <a
          href={href}
          className="mt-4 inline-block rounded-lg bg-kerb-red px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:brightness-110"
        >
          Open in steward queue →
        </a>
      ) : null}
    </div>
  );
}