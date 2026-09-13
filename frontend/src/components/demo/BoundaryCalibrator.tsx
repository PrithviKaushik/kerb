"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, apiRequest, apiUrl } from "@/lib/api/client";

type Point = { x: number; y: number };

type BoundaryCalibratorProps = {
  sessionId: string;
  frameCount: number;
  fps: number;
  keyframes: number[];
  onDone: () => void;
};

/** Browser equivalent of surface.calibrate.py: confirm a polyline per keyframe. */
export function BoundaryCalibrator({ sessionId, frameCount, fps, keyframes, onDone }: BoundaryCalibratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [keyframePosition, setKeyframePosition] = useState(0);
  const [imageVersion, setImageVersion] = useState(0);
  const [points, setPoints] = useState<Point[]>([]);
  const [savedKeyframes, setSavedKeyframes] = useState<Record<number, Point[]>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const frameIndex = keyframes[keyframePosition] ?? 0;

  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      imageRef.current = image;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      setImageVersion((version) => version + 1);
    };
    image.onerror = () => setError(`Could not load frame ${frameIndex}`);
    image.src = apiUrl(`/api/sessions/${sessionId}/calibrate/frame?frame_index=${frameIndex}`);
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [sessionId, frameIndex]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (imageRef.current) ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    else {
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    if (!points.length) return;
    ctx.strokeStyle = "#00dcff";
    ctx.lineWidth = Math.max(3, canvas.width / 480);
    ctx.beginPath();
    points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
    ctx.stroke();
    points.forEach((point, index) => {
      ctx.fillStyle = "#e10600";
      ctx.beginPath();
      ctx.arc(point.x, point.y, Math.max(5, canvas.width / 300), 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = `${Math.max(14, canvas.width / 80)}px monospace`;
      ctx.fillText(String(index), point.x + 8, point.y - 8);
    });
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.max(14, canvas.width / 70)}px monospace`;
    ctx.fillText(`KEYFRAME ${frameIndex} | ${points.length} pt`, 12, 28);
  }, [frameIndex, points]);

  useEffect(() => draw(), [draw, imageVersion]);

  const sourcePoint = (event: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round((event.clientX - rect.left) * canvas.width / rect.width),
      y: Math.round((event.clientY - rect.top) * canvas.height / rect.height),
    };
  };

  const selectKeyframe = (position: number) => {
    const next = Math.max(0, Math.min(keyframes.length - 1, position));
    setKeyframePosition(next);
    setPoints(savedKeyframes[keyframes[next]] ?? []);
    setError(null);
  };

  const confirmKeyframe = () => {
    if (points.length < 2) return;
    setSavedKeyframes((saved) => ({ ...saved, [frameIndex]: points }));
    if (keyframePosition < keyframes.length - 1) selectKeyframe(keyframePosition + 1);
  };

  const saveBoundary = async () => {
    const all = { ...savedKeyframes, ...(points.length >= 2 ? { [frameIndex]: points } : {}) };
    if (Object.keys(all).length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/api/sessions/${sessionId}/boundary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legal_side: "left",
          keyframes: Object.entries(all).map(([index, framePoints]) => ({
            frame_index: Number(index),
            points: framePoints.map((point) => [point.x, point.y]),
          })),
        }),
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const confirmedCount = Object.keys(savedKeyframes).length;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => selectKeyframe(keyframePosition - 1)} disabled={keyframePosition === 0 || saving} className="rounded-lg border border-white/15 px-3 py-1.5 font-mono text-[11px] text-white/70 disabled:opacity-40">PREV KEYFRAME</button>
          <button type="button" onClick={() => selectKeyframe(keyframePosition + 1)} disabled={keyframePosition === keyframes.length - 1 || saving} className="rounded-lg border border-white/15 px-3 py-1.5 font-mono text-[11px] text-white/70 disabled:opacity-40">NEXT KEYFRAME</button>
          <button type="button" onClick={() => setPoints((current) => current.slice(0, -1))} className="rounded-lg border border-white/15 px-3 py-1.5 font-mono text-[11px] text-white/70">UNDO</button>
          <button type="button" onClick={() => setPoints([])} className="rounded-lg border border-white/15 px-3 py-1.5 font-mono text-[11px] text-white/70">CLEAR</button>
        </div>
        <span className="font-mono text-[10px] text-white/45">
          KEYFRAME {keyframePosition + 1}/{keyframes.length} · FRAME {frameIndex} · {(frameIndex / Math.max(fps, 1)).toFixed(2)}s
        </span>
      </div>
      <div className="overflow-hidden rounded-lg border border-white/10">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair"
          onClick={(event) => setPoints((current) => [...current, sourcePoint(event)])}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[10px] text-white/45">CONFIRMED {confirmedCount}/{keyframes.length} · SOURCE FRAMES 0–{Math.max(frameCount - 1, 0)}</p>
        <div className="flex gap-2">
          <button type="button" onClick={confirmKeyframe} disabled={points.length < 2 || saving} className="rounded-lg bg-white/10 px-3 py-1.5 font-mono text-[11px] text-white disabled:opacity-40">CONFIRM KEYFRAME</button>
          <button type="button" onClick={saveBoundary} disabled={confirmedCount === 0 || saving} className="rounded-lg bg-kerb-red px-3 py-1.5 font-mono text-[11px] font-bold text-white disabled:opacity-40">{saving ? "SAVING…" : "SAVE BOUNDARY"}</button>
        </div>
      </div>
      <p className="font-mono text-[10px] leading-relaxed text-white/40">
        Click 8–12 points along the WHITE track-limit line, top-to-bottom. Racing asphalt is on the LEFT of the click direction. Confirm each keyframe; the boundary is interpolated between confirmed keyframes.
      </p>
      {error && <p className="font-mono text-[11px] text-kerb-red">{error}</p>}
    </div>
  );
}
