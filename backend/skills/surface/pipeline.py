"""Run the surface estimator + whole-bbox classifier over a clip and its
ByteTrack records, producing one structured JSONL record per vehicle/frame.

This is the only surface entry point that talks to disk. It never performs
temporal violation decisions, shot detection, evidence or trust scoring.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import cv2

from backend.skills.surface.classifier import classify_bbox
from backend.skills.surface.config import load_config
from backend.skills.surface.estimator import SurfaceEstimator


def _load_records(path: str | Path) -> list[dict]:
    records = []
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        rec = json.loads(line)
        rec["frame_index"] = int(rec["frame_index"])
        rec["timestamp_seconds"] = float(rec["timestamp_seconds"])
        rec["track_id"] = int(rec["track_id"])
        rec["x1"], rec["y1"], rec["x2"], rec["y2"] = (float(rec[k]) for k in ("x1", "y1", "x2", "y2"))
        records.append(rec)
    return records


def run_pipeline(
    video_path: str | Path,
    records_path: str | Path,
    config_path: str | Path,
    output_path: str | Path,
) -> dict:
    config = load_config(config_path)
    estimator = SurfaceEstimator(config)

    records = _load_records(records_path)
    by_frame = defaultdict(list)
    for rec in records:
        by_frame[rec["frame_index"]].append(rec)

    cap = cv2.VideoCapture(str(video_path))
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 1.0

    usable_frames = 0
    known_fractions: list[float] = []
    confidences: list[float] = []
    states: dict[str, int] = defaultdict(int)

    out_lines: list[dict] = []
    for idx in range(frame_count):
        ok, frame = cap.read()
        if not ok:
            break
        est = estimator.estimate(frame)
        known_fractions.append(est.stats.known_fraction)
        confidences.append(est.stats.confidence)
        states[est.surface_state] += 1
        if est.surface_state != "UNKNOWN":
            usable_frames += 1

        for rec in by_frame.get(idx, []):
            cl = classify_bbox(est, (rec["x1"], rec["y1"], rec["x2"], rec["y2"]), config, rec["track_id"])
            out_lines.append(
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
                    "surface_confidence": round(est.stats.confidence, 6),
                    "surface_state": est.surface_state,
                    "spatial_state": cl.spatial_state,
                    "uncertainty_reasons": cl.uncertainty_reasons,
                    "shot_id": None,
                }
            )
    cap.release()

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as fh:
        for line in out_lines:
            fh.write(json.dumps(line) + "\n")

    spatial = defaultdict(int)
    for line in out_lines:
        spatial[line["spatial_state"]] += 1

    metrics = {
        "config": config_path,
        "video": video_path,
        "records": records_path,
        "video_frames": frame_count,
        "decoded_frames": len(known_fractions),
        "surface_state_counts": dict(states),
        "usable_frames": usable_frames,
        "usable_fraction": round(usable_frames / len(known_fractions), 4) if known_fractions else 0.0,
        "mean_surface_confidence": round(sum(confidences) / len(confidences), 4) if confidences else 0.0,
        "mean_roi_known_fraction": round(sum(known_fractions) / len(known_fractions), 4) if known_fractions else 0.0,
        "spatial_state_counts": dict(spatial),
        "classified_records": len(out_lines),
    }
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Surface + whole-bbox spatial analysis")
    parser.add_argument("--video", required=True)
    parser.add_argument("--records", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--metrics-out", default=None)
    args = parser.parse_args()

    metrics = run_pipeline(
        args.video,
        args.records,
        args.config,
        args.output,
    )
    if args.metrics_out:
        Path(args.metrics_out).parent.mkdir(parents=True, exist_ok=True)
        Path(args.metrics_out).write_text(json.dumps(metrics, indent=2) + "\n")
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()