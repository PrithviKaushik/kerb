"""Diagnostic A5 visualization for the surface + whole-bbox spatial analysis.

For every frame that has a surface record it draws:
- the estimated surface mask over the ROI (LEGAL_TRACK / OFF_TRACK / UNKNOWN)
- the search ROI rectangle
- the ByteTrack box, track ID, bbox fractions and surface confidence
- the per-frame spatial state

No tyre points, no boundary polyline, no violation claims are drawn.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np

from backend.skills.surface.config import load_config
from backend.skills.surface.estimator import (
    LEGAL_TRACK_LABEL,
    OFF_TRACK_LABEL,
    UNKNOWN_LABEL,
    SurfaceEstimator,
)

TRACK_BGR = (60, 170, 240)    # light blue: legal track
OFF_BGR = (60, 140, 60)       # green: off-track (grass)
UNKNOWN_BGR = (180, 60, 200)  # magenta: unknown / unestimated

COLOR_MAP = {
    LEGAL_TRACK_LABEL: TRACK_BGR,
    OFF_TRACK_LABEL: OFF_BGR,
    UNKNOWN_LABEL: UNKNOWN_BGR,
}


def _load_records(path: str | Path) -> dict[int, list[dict]]:
    by_frame: dict[int, list[dict]] = defaultdict(list)
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if not line:
            continue
        rec = json.loads(line)
        by_frame[int(rec["frame_index"])].append(rec)
    return by_frame


def _mask_overlay(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    color = np.zeros((h, w, 3), dtype=np.uint8)
    for label, bgr in COLOR_MAP.items():
        color[mask == label] = np.array(bgr, dtype=np.uint8)
    return color


def generate(
    video_path: str | Path,
    records_path: str | Path,
    config_path: str | Path,
    output_path: str | Path,
) -> Path:
    config = load_config(config_path)
    estimator = SurfaceEstimator(config)
    by_frame = _load_records(records_path)

    cap = cv2.VideoCapture(str(video_path))
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    rx1, ry1, rx2, ry2 = config.roi.to_absolute(w, h)
    fps = cap.get(cv2.CAP_PROP_FPS) or 1.0
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    writer = cv2.VideoWriter(str(output_path), fourcc, fps, (w, h))

    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        est = estimator.estimate(frame)
        canvas = frame.copy()
        ov = _mask_overlay(est.mask)
        canvas[ry1:ry2, rx1:rx2] = cv2.addWeighted(
            canvas[ry1:ry2, rx1:rx2], 0.62, ov, 0.38, 0
        )
        cv2.rectangle(canvas, (rx1, ry1), (rx2, ry2), (255, 120, 0), 2)

        for rec in by_frame.get(idx, []):
            x1, y1, x2, y2 = (int(round(rec["bbox"][i])) for i in range(4))
            cv2.rectangle(canvas, (x1, y1), (x2, y2), (255, 255, 255), 3)
            label = (
                f"track_id={rec['track_id']} {rec['spatial_state']} "
                f"conf={rec['surface_confidence']:.2f} "
                f"LT={rec['legal_track_fraction']:.2f} "
                f"OT={rec['off_track_fraction']:.2f} "
                f"UK={rec['unknown_fraction']:.2f} "
                f"surf={rec['surface_state']}"
            )
            cv2.putText(canvas, label, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 4)
            cv2.putText(canvas, label, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        writer.write(canvas)
        idx += 1

    cap.release()
    writer.release()
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    return Path(output_path)


def main() -> None:
    parser = argparse.ArgumentParser(description="Surface + spatial-state diagnostic visualization")
    parser.add_argument("--video", required=True)
    parser.add_argument("--records", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    out = generate(args.video, args.records, args.config, args.output)
    print(out)


if __name__ == "__main__":
    main()