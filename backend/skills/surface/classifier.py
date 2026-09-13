"""Whole-bbox spatial classification (Phase 1b).

Given a surface estimate for the frame and a ByteTrack box, samples the ENTIRE
det box (never the bottom edge only, never tyre points) and derives:

    legal_track_fraction + off_track_fraction + unknown_fraction = 1

Classification invariants:
- UNKNOWN never counts as OFF_TRACK.
- Pixels outside the estimated ROI count as UNKNOWN (unestimated evidence).
- A collision-free invariant: surface_confidence too low OR too few known
  pixels in the box OR an invalid/tiny box all yield spatial_state UNCERTAIN.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from backend.skills.surface.config import CameraViewConfig
from backend.skills.surface.estimator import (
    LEGAL_TRACK_LABEL,
    OFF_TRACK_LABEL,
    UNKNOWN_LABEL,
    SurfaceEstimate,
)

SPATIAL_STATES = ("INSIDE", "OUTSIDE", "BOUNDARY", "UNCERTAIN")


@dataclass(frozen=True)
class BboxClassification:
    track_id: int | None
    legal_track_pixels: int
    off_track_pixels: int
    unknown_pixels: int
    bbox_area: int
    legal_track_fraction: float
    off_track_fraction: float
    unknown_fraction: float
    spatial_state: str
    uncertainty_reasons: list[str]


def _fraction(count: int, area: int) -> float:
    return round(count / area, 6) if area > 0 else 0.0


def classify_bbox(
    estimate: SurfaceEstimate,
    bbox: tuple[float, float, float, float],
    config: CameraViewConfig,
    track_id: int | None = None,
) -> BboxClassification:
    cc = config.classifier
    reasons: list[str] = []

    x1, y1, x2, y2 = bbox
    width = x2 - x1
    height = y2 - y1
    bbox_area = int(round(width * height))
    if width <= 0 or height <= 0:
        return _uncertain(bbox_area, 0, 0, bbox_area, track_id, ["invalid_bbox"])

    if width < cc.minimum_box_width or height < cc.minimum_box_height:
        return _uncertain(bbox_area, 0, 0, bbox_area, track_id, ["small_bbox"])

    # Intersection of the bbox with the estimated ROI; outside-ROI pixels are
    # unestimated and therefore UNKNOWN.
    rx0, ry0 = estimate.roi_origin
    rw, rh = estimate.roi_extent
    i_x1 = max(int(round(x1)), rx0)
    i_y1 = max(int(round(y1)), ry0)
    i_x2 = min(int(round(x2)), rx0 + rw)
    i_y2 = min(int(round(y2)), ry0 + rh)

    if i_x2 <= i_x1 or i_y2 <= i_y1:
        return _uncertain(bbox_area, 0, 0, bbox_area, track_id, ["bbox_outside_roi"])

    region = estimate.mask[i_y1 - ry0 : i_y2 - ry0, i_x1 - rx0 : i_x2 - rx0]
    lt = int((region == LEGAL_TRACK_LABEL).sum())
    ot = int((region == OFF_TRACK_LABEL).sum())
    unk = int((region == UNKNOWN_LABEL).sum())
    inside_area = region.size
    unk += bbox_area - inside_area  # non-overlapping bbox area is UNKNOWN

    lt_f = _fraction(lt, bbox_area)
    ot_f = _fraction(ot, bbox_area)
    uk_f = _fraction(unk, bbox_area)

    if estimate.stats.confidence < cc.min_surface_confidence:
        reasons.append("low_surface_confidence")

    known_fraction = lt_f + ot_f
    if known_fraction < cc.min_known_fraction:
        reasons.append("insufficient_known_pixels")

    if reasons:
        return BboxClassification(
            track_id=track_id,
            legal_track_pixels=lt,
            off_track_pixels=ot,
            unknown_pixels=unk,
            bbox_area=bbox_area,
            legal_track_fraction=lt_f,
            off_track_fraction=ot_f,
            unknown_fraction=uk_f,
            spatial_state="UNCERTAIN",
            uncertainty_reasons=reasons,
        )

    track_share = lt_f / known_fraction
    if track_share >= cc.inside_track_share and lt_f >= cc.min_dominant_fraction:
        spatial_state = "INSIDE"
    elif track_share <= cc.outside_track_share and ot_f >= cc.min_dominant_fraction:
        spatial_state = "OUTSIDE"
    else:
        spatial_state = "BOUNDARY"

    return BboxClassification(
        track_id=track_id,
        legal_track_pixels=lt,
        off_track_pixels=ot,
        unknown_pixels=unk,
        bbox_area=bbox_area,
        legal_track_fraction=lt_f,
        off_track_fraction=ot_f,
        unknown_fraction=uk_f,
        spatial_state=spatial_state,
        uncertainty_reasons=reasons,
    )


def _uncertain(
    bbox_area: int,
    lt: int,
    ot: int,
    unk: int,
    track_id: int | None,
    reasons: list[str],
) -> BboxClassification:
    return BboxClassification(
        track_id=track_id,
        legal_track_pixels=lt,
        off_track_pixels=ot,
        unknown_pixels=unk,
        bbox_area=bbox_area,
        legal_track_fraction=_fraction(lt, bbox_area),
        off_track_fraction=_fraction(ot, bbox_area),
        unknown_fraction=_fraction(unk, bbox_area),
        spatial_state="UNCERTAIN",
        uncertainty_reasons=reasons,
    )