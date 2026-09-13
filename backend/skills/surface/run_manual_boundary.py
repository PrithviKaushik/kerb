"""Run the calibrated-A5 whole-bbox spatial demo.

Consumes the MANUALLY calibrated boundary JSON (data/audit/surface/
a5_manual_boundary.json), the unchanged SurfaceEstimator (for appearance
UNKNOWN/OFF_TRACK cues) and the unchanged whole-bbox classifier.

Per frame:
  appearance mask  = SurfaceEstimator.estimate(frame).mask   (unchanged)
  boundary poly    = interpolated manual boundary polyline   (clicks only)
  fused mask       = boundary side raster
                     + transition band = UNKNOWN
                     + appearance UNKNOWN/OFF preserved      (UNKNOWN never -> OFF)
  classification   = classify_bbox(fused mask, bbox)          (unchanged)
  confidence       = surface_stats(fused, ...)               (same formula)

Writes spatial JSONL, metrics, annotated visualization and a concise report
into --output-dir.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np

from backend.skills.surface.classifier import classify_bbox
from backend.skills.surface.config import load_config
from backend.skills.surface.estimator import (
    SurfaceEstimate,
    SurfaceEstimator,
    surface_stats,
    surface_state,
)
from backend.skills.surface.manual_boundary import (
    DEFAULT_TRANSITION_BAND_PIXELS as TRANSITION_BAND_PIXELS,
    boundary_label_mask,
    interpolate_polyline,
    load_manual_boundary,
)

from backend.skills.surface.visualize_manual import generate_visualization


def _load_records(path: str | Path) -> dict[int, list[dict]]:
    by_frame: dict[int, list[dict]] = defaultdict(list)
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        rec = json.loads(line)
        rec = {k: v for k, v in rec.items() if k in ("frame_index", "timestamp_seconds", "track_id", "x1", "y1", "x2", "y2")}
        rec["frame_index"] = int(rec["frame_index"])
        rec["track_id"] = int(rec["track_id"])
        by_frame[rec["frame_index"]].append(rec)
    return by_frame


def run(
    video_path: str | Path,
    records_path: str | Path,
    boundary_path: str | Path,
    config_path: str | Path,
    output_dir: str | Path,
) -> dict:
    cfg = load_config(config_path)
    estimator = SurfaceEstimator(cfg)
    boundary = load_manual_boundary(boundary_path)
    by_frame = _load_records(records_path)

    cap = cv2.VideoCapture(str(video_path))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 1.0
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    records_out: list[dict] = []
    prev_fused: np.ndarray | None = None
    frames_with_records = 0
    surface_states: dict[str, int] = defaultdict(int)

    for idx in range(frame_count):
        ok, frame = cap.read()
        if not ok:
            break
        appearance = estimator.estimate(frame)   # unchanged estimator, full-frame ROI
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        poly = interpolate_polyline(boundary, idx)
        fused = boundary_label_mask(
            (height, width), poly, boundary.legal_side, TRANSITION_BAND_PIXELS, appearance.mask
        )
        stats = surface_stats(fused, hsv, cfg.metrics, prev_fused)
        prev_fused = fused
        ss = surface_state(stats, cfg.metrics.usable_known_fraction)
        surface_states[ss] += 1

        fused_est = SurfaceEstimate(
            mask=fused,
            roi_origin=(0, 0),
            roi_extent=(width, height),
            stats=stats,
            surface_state=ss,
        )

        for rec in by_frame.get(idx, []):
            frames_with_records += 1
            cl = classify_bbox(fused_est, (rec["x1"], rec["y1"], rec["x2"], rec["y2"]), cfg, rec["track_id"])
            records_out.append(
                {
                    "frame_index": idx,
                    "timestamp_seconds": round(idx / fps, 6),
                    "track_id": cl.track_id,
                    "bbox": [rec["x1"], rec["y1"], rec["x2"], rec["y2"]],
                    "bbox_area": cl.bbox_area,
                    "legal_track_pixel_count": cl.legal_track_pixels,
                    "off_track_pixel_count": cl.off_track_pixels,
                    "unknown_pixel_count": cl.unknown_pixels,
                    "legal_track_fraction": cl.legal_track_fraction,
                    "off_track_fraction": cl.off_track_fraction,
                    "unknown_fraction": cl.unknown_fraction,
                    "surface_confidence": round(stats.confidence, 6),
                    "surface_state": ss,
                    "spatial_state": cl.spatial_state,
                    "uncertainty_reasons": cl.uncertainty_reasons,
                    "boundary_frame_index": idx,
                }
            )
    cap.release()

    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    jsonl_path = out / "a5_manual_spatial.jsonl"
    with open(jsonl_path, "w") as fh:
        for line in records_out:
            fh.write(json.dumps(line) + "\n")

    spatial = defaultdict(int)
    for line in records_out:
        spatial[line["spatial_state"]] += 1

    metrics = {
        "video": str(video_path),
        "records": str(records_path),
        "boundary": str(boundary_path),
        "config": str(config_path),
        "video_frames": frame_count,
        "decoded_frames": frame_count,
        "classified_records": len(records_out),
        "surface_state_counts": dict(surface_states),
        "spatial_state_counts": dict(spatial),
        "transition_band_pixels": TRANSITION_BAND_PIXELS,
        "boundary_keyframe_indices": [k.frame_index for k in boundary.keyframes],
        "boundary_legal_side": boundary.legal_side,
    }
    metrics_path = out / "a5_manual_metrics.json"
    metrics_path.write_text(json.dumps(metrics, indent=2) + "\n")

    viz_path = out / "a5_manual_visualization.mp4"
    generate_visualization(video_path, records_out, boundary, output_dir, cfg)

    report = _report(metrics, out)
    (out / "REPORT.md").write_text(report)

    return metrics


def _report(metrics: dict, out: Path) -> str:
    return (
        "# A5 manual-boundary demo\n\n"
        f"- boundary: `{metrics['boundary']}` (keyframes {metrics['boundary_keyframe_indices']}, "
        f"legal side = {metrics['boundary_legal_side']})\n"
        f"- records classified: {metrics['classified_records']}\n"
        f"- spatial states: {metrics['spatial_state_counts']}\n"
        f"- surface states: {metrics['surface_state_counts']}\n"
        f"- transition band: {metrics['transition_band_pixels']}px\n\n"
        "Classification came from the unchanged whole-bbox classifier applied to a "
        "boundary-fused label mask (manual polyline + estimator appearance cues) - "
        "no state was manufactured.\n"
        f"- artifacts: `{out.name}`\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the calibrated A5 whole-bbox spatial demo")
    parser.add_argument("--video", default="data/raw/a5.mp4")
    parser.add_argument("--records", default="data/audit/perception_tracking/a5_adapt/a5_tracks.jsonl")
    parser.add_argument("--boundary", default="data/audit/surface/a5_manual_boundary.json")
    parser.add_argument("--config", default="backend/skills/surface/config/a5_manual_demo.json")
    parser.add_argument("--output-dir", default="data/audit/surface/a5_manual")
    args = parser.parse_args()
    metrics = run(args.video, args.records, args.boundary, args.config, args.output_dir)
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()