"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";

type SessionSummary = {
  id: string;
  name: string;
  created_at: number;
  duration_s: number;
  has_incident: boolean;
};

type SessionsPanelProps = {
  value: string | null;
  onSelect: (id: string | null) => void;
  onChanged: () => void;
};

/** A5 toggle + uploaded-clip selector and upload control. */
export function SessionsPanel({ value, onSelect, onChanged }: SessionsPanelProps) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    try {
      const list = await apiRequest<SessionSummary[]>("/api/sessions");
      setSessions(list);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sessions");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    apiRequest<SessionSummary[]>("/api/sessions")
      .then((list) => {
        if (!cancelled) setSessions(list);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load sessions");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const upload = useCallback(
    async (file: File) => {
      setUploading(true);
      setError(null);
      try {
        const body = new FormData();
        body.append("file", file);
        const created = await apiRequest<{ id: string }>("/api/sessions", {
          method: "POST",
          body,
          headers: { Accept: "application/json" },
        });
        onSelect(created.id);
        onChanged();
        await refresh();
        if (inputRef.current) inputRef.current.value = "";
      } catch (err) {
        setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onSelect, onChanged, refresh]
  );

  const clearUploads = useCallback(async () => {
    if (sessions.length === 0 || !window.confirm("Delete all uploaded clips and generated artifacts?")) return;
    setClearing(true);
    setError(null);
    try {
      await apiRequest<{ deleted: number }>("/api/sessions", { method: "DELETE" });
      onSelect(null);
      await refresh();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not clear uploads");
    } finally {
      setClearing(false);
    }
  }, [onChanged, onSelect, refresh, sessions.length]);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 px-5 py-4 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="kerb-eyebrow">Clip selector · A5 or your upload</p>
        <label className="cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] text-white/80 transition hover:border-white/40">
          {uploading ? "UPLOADING…" : "UPLOAD CLIP"}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/x-matroska,video/quicktime,video/x-msvideo,video/webm,.mp4,.mkv,.mov,.avi,.webm"
            className="hidden"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`rounded-lg px-3 py-1.5 font-mono text-[11px] tracking-[0.16em] transition ${
            value === null
              ? "bg-kerb-red text-white"
              : "border border-white/15 text-white/70 hover:border-white/40"
          }`}
        >
          DEMO
        </button>
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            className={`max-w-[260px] truncate rounded-lg px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] transition ${
              value === session.id
                ? "bg-kerb-red text-white"
                : "border border-white/15 text-white/70 hover:border-white/40"
            }`}
            title={session.name}
          >
            {session.name} · {session.duration_s.toFixed(1)}s{session.has_incident ? " ✓" : ""}
          </button>
        ))}
        {sessions.length === 0 && (
          <span className="font-mono text-[11px] text-white/35">No uploaded sessions yet.</span>
        )}
        {sessions.length > 0 && (
          <button
            type="button"
            onClick={() => void clearUploads()}
            disabled={clearing || uploading}
            className="rounded-lg border border-kerb-red/40 px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] text-kerb-red transition hover:bg-kerb-red/10 disabled:opacity-40"
          >
            {clearing ? "CLEARING…" : "CLEAR UPLOADS"}
          </button>
        )}
      </div>
      <p className="mt-2 font-mono text-[10px] text-white/35">
        Uploads ≤ 30 s · manual boundary calibration required before analysis · copied locally, never LEAKED to a dataset.
      </p>
      {error && <p className="mt-2 font-mono text-[11px] text-kerb-red">{error}</p>}
    </div>
  );
}
