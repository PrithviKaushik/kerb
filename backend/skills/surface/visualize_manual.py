"""Annotated visualization for the calibrated A5 demo.

Shows per frame: the boundary-fused label mask (legal/off/unknown), the
interpolated manual white-line boundary polyline, the YOLO/ByteTrack bbox,
fractions, surface confidence and the spatial state. No tyre points, no
manufactured violation labels.
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np

from backend.skills.surface.config import CameraViewConfig
from backend.skills.surface.estimator import (
    LEGAL_TRACK_LABEL,
    OFF_TRACK_LABEL,
    UNKNOWN_LABEL,
    SurfaceEstimator,
)
from backend.skills.surface.manual_boundary import (
    DEFAULT_TRANSITION_BAND_PIXELS as TRANSITION_BAND_PIXELS,
    ManualBoundary,
    boundary_label_mask,
    interpolate_polyline,
)

COLOR_MAP = {
    LEGAL_TRACK_LABEL: (60, 170, 240),
    OFF_TRACK_LABEL: (60, 140, 60),
    UNKNOWN_LABEL: (180, 60, 200),
}


def _mask_overlay(mask: np.ndarray) -> np.ndarray:
    h, w = mask.shape
    color = np.zeros((h, w, 3), dtype=np.uint8)
    for label, bgr in COLOR_MAP.items():
        color[mask == label] = np.array(bgr, dtype=np.uint8)
    return color


def generate_visualization(
    video_path: str | Path,
    records_out: list[dict],
    boundary: ManualBoundary,
    output_dir: str | Path,
    cfg: CameraViewConfig,
) -> Path:
    by_frame: dict[int, list[dict]] = defaultdict(list)
    for r in records_out:
        by_frame[int(r["frame_index"])].append(r)

    estimator = SurfaceEstimator(cfg)
    cap = cv2.VideoCapture(str(video_path))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 1.0
    writer = cv2.VideoWriter(
        str(Path(output_dir) / "a5_manual_visualization.mp4"),
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (width, height),
    )

    idx = 0
    while True:
        ok, frame = cap.read()
        if not ok:
            break
        appearance = estimator.estimate(frame)
        poly = interpolate_polyline(boundary, idx)
        fused = boundary_label_mask(
            (height, width), poly, boundary.legal_side, TRANSITION_BAND_PIXELS, appearance.mask
        )
        canvas = frame.copy()
        ov = _mask_overlay(fused)
        canvas = cv2.addWeighted(canvas, 0.62, ov, 0.38, 0)

        outline = poly.astype(np.int32).reshape(-1, 1, 2)
        cv2.polylines(canvas, [outline], isClosed=False, color=(0, 0, 0), thickness=7)
        cv2.polylines(canvas, [outline], isClosed=False, color=(255, 255, 255), thickness=3)

        for r in by_frame.get(idx, []):
            x1, y1, x2, y2 = (int(round(r["bbox"][i])) for i in range(4))
            cv2.rectangle(canvas, (x1, y1), (x2, y2), (255, 255, 255), 3)
            text = (
                f"track_id={r['track_id']} {r['spatial_state']} "
                f"conf={r['surface_confidence']:.2f} "
                f"LT={r['legal_track_fraction']:.2f} OT={r['off_track_fraction']:.2f} "
                f"UK={r['unknown_fraction']:.2f} f={idx}"
            )
            cv2.putText(canvas, text, (x1, max(24, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (0, 0, 0), 5)
            cv2.putText(canvas, text, (x1, max(24, y1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.85, (255, 255, 255), 2)

        writer.write(canvas)
        idx += 1

    cap.release()
    writer.release()
    out = Path(output_dir) / "a5_manual_visualization.mp4"
    return out