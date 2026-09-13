"""Manual legal-boundary calibration tool for the A5 remote demo.

Interactive OpenCV window: the user clicks ~8-12 points along the WHITE
track-limit line for each keyframe (0, 35, 70, 105, 140 by default).

Controls:
  Left click         add a point
  Right click / r    remove the last point
  c                  clear all points for the current keyframe
  Enter / n          confirm this keyframe, advance to the next
  q / Esc            quit (saves keyframes confirmed so far)

The boundary is the white line ONLY. Click from top to bottom; the racing
asphalt (legal) side of the line is expected on the LEFT when looking along
the click direction.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import cv2
import numpy as np

DEFAULT_KEYFRAMES = (0, 35, 70, 105, 140)
MIN_POINTS = 2


class _ClickState:
    def __init__(self, scale: float) -> None:
        self.scale = scale
        self.points: list[tuple[float, float]] = []  # full-resolution coords
        self.dirty = True

    def add(self, display_xy: tuple[int, int]) -> None:
        fx, fy = display_xy[0] / self.scale, display_xy[1] / self.scale
        self.points.append((float(fx), float(fy)))
        self.dirty = True

    def pop(self) -> None:
        if self.points:
            self.points.pop()
            self.dirty = True

    def clear(self) -> None:
        self.points.clear()
        self.dirty = True


def _draw(canvas: np.ndarray, state: _ClickState, keyframe_index: int) -> None:
    """Draw instruction overlay, clicked points and the current polyline."""
    scale = state.scale
    if state.points:
        line = [(int(p[0] * scale), int(p[1] * scale)) for p in state.points]
        for i in range(1, len(line)):
            cv2.line(canvas, line[i - 1], line[i], (0, 220, 255), 3)
        for i, (px, py) in enumerate(line):
            cv2.circle(canvas, (px, py), 7, (0, 0, 255), -1)
            cv2.putText(canvas, str(i), (px + 8, py - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 0), 4)
            cv2.putText(canvas, str(i), (px + 8, py - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    overlay = (
        f"Keyframe {keyframe_index} | {len(state.points)} pt"
        f" | LMB add | RMB/r remove | c clear | Enter next | q quit"
    )
    cv2.rectangle(canvas, (0, 0), (canvas.shape[1], 34), (0, 0, 0), -1)
    cv2.putText(canvas, overlay, (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.75, (0, 255, 255), 2)
    hint = "Click 8-12 pts ALONG THE WHITE LINE, top->bottom; asphalt on LEFT of direction"
    cv2.putText(canvas, hint, (8, canvas.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)


def _mouse(event: int, x: int, y: int, _flags: int, state: _ClickState) -> None:
    if event == cv2.EVENT_LBUTTONDOWN:
        state.add((x, y))
    elif event == cv2.EVENT_RBUTTONDOWN:
        state.pop()


def calibrate(
    video_path: str | Path,
    keyframes: tuple[int, ...] = DEFAULT_KEYFRAMES,
    output_path: str | Path = "data/audit/surface/a5_manual_boundary.json",
    scale: float = 0.7,
) -> dict:
    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"Could not open {video_path}")
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    saved: dict[int, list[list[float]]] = {}
    for keyframe_index in keyframes:
        cap.set(cv2.CAP_PROP_POS_FRAMES, keyframe_index)
        ok, frame = cap.read()
        if not ok:
            raise RuntimeError(f"Could not read keyframe {keyframe_index}")
        display = cv2.resize(frame, (int(width * scale), int(height * scale)))

        state = _ClickState(scale)
        win = f"A5 boundary calibration - frame {keyframe_index}"
        cv2.namedWindow(win, cv2.WINDOW_NORMAL)
        cv2.setMouseCallback(win, _mouse, state)
        confirmed = False
        while not confirmed:
            canvas = display.copy()
            if state.dirty:
                _draw(canvas, state, keyframe_index)
                cv2.imshow(win, canvas)
                state.dirty = False
            key = cv2.waitKey(30) & 0xFF
            if key in (27, ord("q")):
                cv2.destroyWindow(win)
                cap.release()
                return _write_boundary(video_path, saved, output_path)
            if key in (ord("r"), 8):
                state.pop()
            elif key == ord("c"):
                state.clear()
            elif key in (ord("\r"), ord("\n"), ord("n")):
                if len(state.points) < MIN_POINTS:
                    print(f"[calibrate] frame {keyframe_index}: need >= {MIN_POINTS} points, have {len(state.points)}")
                    continue
                saved[keyframe_index] = [[round(x, 1), round(y, 1)] for x, y in state.points]
                confirmed = True
            else:
                state.dirty = True  # redraw in case of msg
        cv2.destroyWindow(win)

    cap.release()
    return _write_boundary(video_path, saved, output_path)


def _write_boundary(
    video_path: str | Path, saved: dict[int, list[list[float]]], output_path: str | Path
) -> dict:
    if not saved:
        raise RuntimeError("No keyframes confirmed - boundary JSON not written")
    boundary = {
        "video": str(Path(video_path).name),
        "coordinate_space": "pixel",
        "camera_view": "a5_fixed_camera_view_1",
        "zone_id": "a5_kerb_zone_1",
        "legal_side": "left",
        "keyframes": [
            {"frame_index": int(fi), "points": pts} for fi, pts in sorted(saved.items())
        ],
        "boundary_semantics": "legal_track_limit_white_line",
        "line_contact_is_legal": True,
        "note": "Manual calibration. Clicked along the WHITE track-limit line, top->bottom; racing-asphalt side is LEFT of the click direction.",
    }
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(boundary, indent=2) + "\n")
    print(f"[calibrate] wrote {out} with keyframes {sorted(saved)}")
    return boundary


def main() -> None:
    parser = argparse.ArgumentParser(description="A5 manual legal-boundary calibration tool")
    parser.add_argument("--video", default="data/raw/a5.mp4")
    parser.add_argument(
        "--keyframes", default=",".join(str(k) for k in DEFAULT_KEYFRAMES), help="comma-separated frame indices"
    )
    parser.add_argument("--output", default=str(Path("data/audit/surface/a5_manual_boundary.json").resolve()))
    parser.add_argument("--scale", type=float, default=0.7, help="display scale (e.g. 0.7 on 1080p screens)")
    args = parser.parse_args()
    keyframes = tuple(int(k) for k in args.keyframes.split(",") if k.strip())
    calibrate(args.video, keyframes, args.output, args.scale)


if __name__ == "__main__":
    main()