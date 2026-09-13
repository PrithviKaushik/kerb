from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2

from .geometry import BoundaryConfig, load_config

_STATE_COLORS = {
    "INSIDE": (0, 210, 0),
    "BOUNDARY": (255, 191, 0),
    "OUTSIDE": (0, 0, 255),
    "UNCERTAIN": (128, 128, 128),
}


def _draw_boundary(frame, boundary: BoundaryConfig) -> None:
    points = [(int(x), int(y)) for x, y in boundary.points]
    for start, end in zip(points, points[1:]):
        cv2.line(frame, start, end, (255, 180, 0), 3)
    if boundary.boundary_type == "polygon":
        cv2.line(frame, points[-1], points[0], (255, 180, 0), 3)
    cv2.putText(frame, "MANUAL BOUNDARY (CONFIG ONLY)", (20, 42), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 180, 0), 2, cv2.LINE_AA)


def _draw_record(frame, record: dict) -> None:
    bbox = record["bbox"]
    footprint = record["footprint"]
    state = record.get("spatial_state", "UNCERTAIN")
    mode = record.get("geometry_mode", "FULL_BOX")
    color = _STATE_COLORS.get(state, (128, 128, 128))

    fx1, fy1, fx2, fy2 = (int(round(footprint[key])) for key in ("x1", "y1", "x2", "y2"))
    x1, y1, x2, y2 = (int(round(bbox[key])) for key in ("x1", "y1", "x2", "y2"))

    overlay = frame.copy()
    cv2.rectangle(overlay, (fx1, fy1), (fx2, fy2), color, -1)
    cv2.addWeighted(overlay, 0.35, frame, 0.65, 0, frame)
    cv2.rectangle(frame, (fx1, fy1), (fx2, fy2), color, 2)
    cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 255, 255), 1)

    label = f"Car #{record['track_id']} | {mode} | {state}"
    cv2.putText(frame, label, (x1, max(25, y1 - 12)), cv2.FONT_HERSHEY_SIMPLEX, 0.65, color, 2, cv2.LINE_AA)


def visualize(source: str | Path, geometry_records: str | Path, config_path: str | Path, output: str | Path) -> None:
    _, boundary = load_config(config_path)
    by_frame: dict[int, list[dict]] = {}
    for line in Path(geometry_records).read_text().splitlines():
        if line.strip():
            record = json.loads(line)
            by_frame.setdefault(int(record["frame_index"]), []).append(record)
    capture = cv2.VideoCapture(str(source))
    if not capture.isOpened():
        raise RuntimeError(f"Could not open source video: {source}")
    fps = capture.get(cv2.CAP_PROP_FPS)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    output_path = Path(output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(str(output_path), cv2.VideoWriter_fourcc(*"mp4v"), fps, (width, height))
    frame_index = 0
    try:
        while True:
            ok, frame = capture.read()
            if not ok:
                break
            _draw_boundary(frame, boundary)
            for record in by_frame.get(frame_index, []):
                _draw_record(frame, record)
            writer.write(frame)
            frame_index += 1
    finally:
        capture.release()
        writer.release()


def main() -> None:
    parser = argparse.ArgumentParser(description="Visualize Kerb geometry records.")
    parser.add_argument("--source", required=True)
    parser.add_argument("--geometry", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    visualize(args.source, args.geometry, args.config, args.output)


if __name__ == "__main__":
    main()