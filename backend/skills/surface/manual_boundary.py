"""Manual legal-track-limit polyline boundary for the A5 remote demo.

The white track-limit line (not the kerb, not the runoff) defines legal track.
This module stores, temporally interpolates and rasterises that boundary into a
per-frame label mask that the existing whole-bbox classifier consumes.

No boundary is ever inferred automatically: every polyline originates from the
calibration tool output. What happens here is (a) arclength re-sampling of the
clicked polyline, (b) linear interpolation between neighbouring keyframe
polylines, and (c) rasterisation to LEGAL_TRACK / OFF_TRACK / UNKNOWN.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np

from backend.skills.surface.estimator import (
    LEGAL_TRACK_LABEL,
    OFF_TRACK_LABEL,
    UNKNOWN_LABEL,
)

RESAMPLE_POINTS = 32
DEFAULT_TRANSITION_BAND_PIXELS = 26


@dataclass(frozen=True)
class Keyframe:
    frame_index: int
    points: tuple[tuple[float, float], ...]

    def as_array(self) -> np.ndarray:
        return np.asarray(self.points, dtype=np.float64)


@dataclass(frozen=True)
class ManualBoundary:
    video: str
    coordinate_space: str
    camera_view: str
    zone_id: str
    legal_side: str
    keyframes: tuple[Keyframe, ...]
    boundary_semantics: str
    line_contact_is_legal: bool
    note: str = field(default="")


def load_manual_boundary(path: str | Path) -> ManualBoundary:
    raw = json.loads(Path(path).read_text())
    if raw.get("coordinate_space") != "pixel":
        raise ValueError(f"Expected coordinate_space='pixel', got {raw.get('coordinate_space')!r}")
    legal_side = raw.get("legal_side", "left")
    if legal_side not in ("left", "right"):
        raise ValueError("legal_side must be 'left' or 'right' of the directed polyline")
    keyframes = []
    for kf in raw["keyframes"]:
        pts = tuple((float(x), float(y)) for x, y in kf["points"])
        if len(pts) < 2:
            raise ValueError(f"Keyframe {kf['frame_index']} needs >=2 points")
        keyframes.append(Keyframe(frame_index=int(kf["frame_index"]), points=pts))
    keyframes.sort(key=lambda k: k.frame_index)
    if not keyframes:
        raise ValueError("Boundary needs at least one keyframe")
    return ManualBoundary(
        video=raw.get("video", "a5.mp4"),
        coordinate_space="pixel",
        camera_view=raw.get("camera_view", "a5_fixed_camera_view_1"),
        zone_id=raw.get("zone_id", "a5_kerb_zone_1"),
        legal_side=legal_side,
        keyframes=tuple(keyframes),
        boundary_semantics=raw.get("boundary_semantics", "legal_track_limit_white_line"),
        line_contact_is_legal=bool(raw.get("line_contact_is_legal", True)),
        note=raw.get("note", ""),
    )


def resample_polyline(points: np.ndarray, n: int = RESAMPLE_POINTS) -> np.ndarray:
    """Re-sample a polyline to n points, equally spaced along its arclength.

    Needed so keyframes clicked with different point counts can be
    linearly interpolated against each other.
    """
    pts = np.asarray(points, dtype=np.float64)
    if len(pts) < 2:
        raise ValueError("resample_polyline needs >=2 points")
    if len(pts) == n:
        return pts.copy()
    seg = np.linalg.norm(np.diff(pts, axis=0), axis=1)
    cum = np.concatenate([[0.0], np.cumsum(seg)])
    total = cum[-1]
    if total <= 0:
        return pts.copy()
    t = np.linspace(0.0, total, n)
    return np.array([np.interp(t, cum, pts[:, 0]), np.interp(t, cum, pts[:, 1])]).T


def interpolate_polyline(
    boundary: ManualBoundary,
    frame_index: int,
    n: int = RESAMPLE_POINTS,
) -> np.ndarray:
    """Frame-index linear interpolation between neighbouring keyframe polylines.

    Clamps to the first/last keyframe outside the calibrated range.
    """
    kfs = boundary.keyframes
    if frame_index <= kfs[0].frame_index:
        return resample_polyline(kfs[0].as_array(), n)
    if frame_index >= kfs[-1].frame_index:
        return resample_polyline(kfs[-1].as_array(), n)
    for a, b in zip(kfs, kfs[1:]):
        if a.frame_index <= frame_index <= b.frame_index:
            span = b.frame_index - a.frame_index
            t = (frame_index - a.frame_index) / span if span else 0.0
            pa = resample_polyline(a.as_array(), n)
            pb = resample_polyline(b.as_array(), n)
            return (1.0 - t) * pa + t * pb
    raise RuntimeError("interpolate_polyline fell through")  # pragma: no cover


def _side_of_polyline(poly: np.ndarray) -> dict[int, list[tuple[float, bool]]]:
    """Per-row polyline crossing events.

    For every pixel row, find each polyline crossing and whether the segment
    crossing it runs downward (segment_down True) so rasterisation can place
    the off-track half-line on the correct side of the crossing.
    """
    events: dict[int, list[tuple[float, bool]]] = {}
    for (x0, y0), (x1, y1) in zip(poly[:-1], poly[1:]):
        dy = y1 - y0
        if dy == 0:
            continue
        y_start, y_end = sorted((y0, y1))
        y0f = int(np.floor(y_start))
        y1f = int(np.ceil(y_end))
        for yy in range(y0f, y1f + 1):
            frac = (yy - y0) / dy if dy != 0 else 0.0
            x_cross = x0 + frac * (x1 - x0)
            # Segment direction downward (dy>0): right of direction == x > x_cross.
            right_is_off_candidate = dy > 0
            events.setdefault(yy, []).append((x_cross, right_is_off_candidate))
    return events


def boundary_label_mask(
    frame_size: tuple[int, int],
    poly: np.ndarray,
    legal_side: str,
    transition_band_pixels: int,
    appearance_mask: np.ndarray | None = None,
) -> np.ndarray:
    """Rasterise the boundary polyline into a per-pixel label mask.

    - Pixels on the legal side        -> LEGAL_TRACK
    - Pixels beyond the line          -> OFF_TRACK (the demo's off-track)
    - Pixels within the transition band around the line -> UNKNOWN
      (the white line itself is legal; contact is never forcibly off-track,
       and appearance-UNKNOWN pixels such as the car body stay UNKNOWN)

    appearance_mask (optional, from the unchanged SurfaceEstimator) is fused
    so that UNKNOWN never becomes OFF_TRACK and grass stays OFF_TRACK.
    """
    h, w = frame_size
    mask = np.full((h, w), LEGAL_TRACK_LABEL, dtype=np.uint8)
    events = _side_of_polyline(poly)
    off_pixels = np.zeros((h, w), dtype=bool)
    off_on_right_side = legal_side == "left"  # legal on left -> off on right of direction

    for yy, evs in events.items():
        if not (0 <= yy < h):
            continue
        for x_cross, segment_down in evs:
            if not (0 < x_cross < w):
                continue
            if segment_down:
                # right-of-direction == x > x_cross
                if off_on_right_side:
                    off_pixels[yy, int(np.ceil(x_cross)):] = True
                else:
                    off_pixels[yy, : max(0, int(np.floor(x_cross)))] = True
            else:
                # right-of-direction == x < x_cross (segment runs upward)
                if off_on_right_side:
                    off_pixels[yy, : max(0, int(np.floor(x_cross)))] = True
                else:
                    off_pixels[yy, int(np.ceil(x_cross)):] = True
    mask[off_pixels] = OFF_TRACK_LABEL

    # Transition band around the drawn boundary (white line = legal, but its
    # immediate vicinity is not confidently either side).
    line = np.zeros((h, w), dtype=np.uint8)
    cv2.polylines(
        line,
        [poly.astype(np.int32).reshape(-1, 1, 2)],
        isClosed=False,
        color=1,
        thickness=max(3, transition_band_pixels // 2),
        lineType=cv2.LINE_AA,
    )
    band = cv2.dilate(line, np.ones((transition_band_pixels, transition_band_pixels), np.uint8)) > 0
    mask[band] = UNKNOWN_LABEL

    if appearance_mask is not None:
        if appearance_mask.shape != mask.shape:
            raise ValueError("appearance_mask must match frame_size")
        mask[appearance_mask == UNKNOWN_LABEL] = UNKNOWN_LABEL
        mask[appearance_mask == OFF_TRACK_LABEL] = OFF_TRACK_LABEL
    return mask