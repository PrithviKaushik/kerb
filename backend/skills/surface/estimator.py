"""Classical-CV per-frame surface estimator (Phase 1a).

For every video frame, over the configured search ROI, it labels each pixel as
LEGAL_TRACK / OFF_TRACK / UNKNOWN and computes a deterministic, interpretable
surface_confidence.

Why classical CV: this is an explicit baseline. No neural segmentation model
is trained; the target footage has visually distinguishable track/off-track
regions, so simple appearance heuristics should provide a coherent mask to
validate the whole-bbox hypothesis before any heavier machinery.

Why UNKNOWN is first-class: UNKNOWN is never evidence of off-track. Cars,
graphics, saturated markings, very dark/shadows, saturated non-green regions
and (a dilated band around) the white transition cue are all labelled UNKNOWN
rather than forced into either surface class.
"""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np

from backend.skills.surface.config import CameraViewConfig, SurfaceMetrics

LEGAL_TRACK_LABEL = 1
OFF_TRACK_LABEL = 0
UNKNOWN_LABEL = 2

# Human-readable surface states, matching the output vocabulary.
SURFACE_STATES = ("LEGAL_TRACK", "OFF_TRACK", "UNKNOWN")


@dataclass
class SurfaceStats:
    """Deterministic mask-quality signals feeding surface_confidence.

    confidence = w_known * known_fraction + w_sep * separation
               + w_cont * continuity + w_temp * temporal_consistency
    """

    known_fraction: float
    separation: float
    continuity: float
    temporal_consistency: float
    confidence: float
    track_pixels: int
    off_track_pixels: int
    unknown_pixels: int
    total_roi_pixels: int


@dataclass
class SurfaceEstimate:
    mask: np.ndarray
    roi_origin: tuple[int, int]
    roi_extent: tuple[int, int]
    stats: SurfaceStats
    surface_state: str


def _surface_state(stats: SurfaceStats, usable_known_fraction: float) -> str:
    if stats.known_fraction < usable_known_fraction:
        return "UNKNOWN"
    if stats.track_pixels >= stats.off_track_pixels:
        return "LEGAL_TRACK"
    return "OFF_TRACK"


def surface_state(stats: SurfaceStats, usable_known_fraction: float) -> str:
    """Public alias so boundary-fused masks reuse the identical rule."""
    return _surface_state(stats, usable_known_fraction)


def surface_stats(
    mask: np.ndarray,
    hsv: np.ndarray,
    metrics: SurfaceMetrics,
    previous_mask: np.ndarray | None,
) -> SurfaceStats:
    """Deterministic mask-quality signals -> surface_confidence components.

    Extracted verbatim from SurfaceEstimator._stats so external masks (e.g. a
    manual-boundary fusion) share the exact same confidence formula.
    """
    total = mask.size
    track = int((mask == LEGAL_TRACK_LABEL).sum())
    off = int((mask == OFF_TRACK_LABEL).sum())
    unknown = int((mask == UNKNOWN_LABEL).sum())
    known = track + off
    known_fraction = known / total

    v = hsv[..., 2].astype(np.float32)
    v_track = v[mask == LEGAL_TRACK_LABEL]
    v_off = v[mask == OFF_TRACK_LABEL]
    if v_track.size and v_off.size:
        separation = float(np.clip(abs(v_track.mean() - v_off.mean()) / 255.0, 0.0, 1.0))
    elif v_track.size or v_off.size:
        separation = 0.5
    else:
        separation = 0.0

    if track > 0:
        _, labels = cv2.connectedComponents(
            (mask == LEGAL_TRACK_LABEL).astype(np.uint8), connectivity=8
        )
        counts = np.bincount(labels.ravel())
        largest = int(counts[1:].max()) if counts.size > 1 else 0
        continuity = largest / track
    else:
        continuity = 0.0

    if previous_mask is not None and previous_mask.shape == mask.shape:
        temporal_consistency = float(np.mean(mask == previous_mask))
    else:
        temporal_consistency = 1.0

    confidence = float(
        np.clip(
            metrics.weight_known * known_fraction
            + metrics.weight_separation * separation
            + metrics.weight_continuity * continuity
            + metrics.weight_temporal * temporal_consistency,
            0.0,
            1.0,
        )
    )

    return SurfaceStats(
        known_fraction=known_fraction,
        separation=separation,
        continuity=continuity,
        temporal_consistency=temporal_consistency,
        confidence=confidence,
        track_pixels=track,
        off_track_pixels=off,
        unknown_pixels=unknown,
        total_roi_pixels=total,
    )


class SurfaceEstimator:
    """Estimates the per-frame surface mask over the configured ROI."""

    def __init__(self, config: CameraViewConfig):
        self.config = config
        self._previous_mask: np.ndarray | None = None

    def estimate(self, frame_bgr: np.ndarray) -> SurfaceEstimate:
        h, w = frame_bgr.shape[:2]
        rx1, ry1, rx2, ry2 = self.config.roi.to_absolute(w, h)
        rx1 = max(0, rx1)
        ry1 = max(0, ry1)
        rx2 = min(w, rx2)
        ry2 = min(h, ry2)
        roi = frame_bgr[ry1:ry2, rx1:rx2]
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        mask = self._classify_pixels(hsv)
        stats = self._stats(mask, hsv)
        state = _surface_state(stats, self.config.metrics.usable_known_fraction)
        self._previous_mask = mask
        return SurfaceEstimate(
            mask=mask,
            roi_origin=(rx1, ry1),
            roi_extent=(rx2 - rx1, ry2 - ry1),
            stats=stats,
            surface_state=state,
        )

    def _classify_pixels(self, hsv: np.ndarray) -> np.ndarray:
        """Label every ROI pixel as LEGAL_TRACK / OFF_TRACK / UNKNOWN.

        Priority order (later assignments win over earlier ones):
        1. baseline gray/mid-bright, low-saturation pixels -> LEGAL_TRACK
        2. grass-green hue with enough saturation/value   -> OFF_TRACK
        3. very dark (deep shadow / obscured)             -> UNKNOWN
        4. saturated non-green colour (cars/graphics/kerb)-> UNKNOWN
        5. white band dilated around it (transition cue)  -> UNKNOWN

        The white line / kerb only widens an UNKNOWN transition zone; it is
        never itself asserted to be "the boundary".
        """
        ap = self.config.appearance
        h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]

        green = (
            (h >= ap.grass_hue_min)
            & (h <= ap.grass_hue_max)
            & (s >= ap.grass_min_saturation)
            & (v >= ap.grass_min_value)
        )
        g = green.astype(np.uint8)
        close_k = self.config.morphology.green_close_kernel
        open_k = self.config.morphology.green_open_kernel
        g = cv2.morphologyEx(g, cv2.MORPH_CLOSE, np.ones((close_k, close_k), np.uint8))
        g = cv2.morphologyEx(g, cv2.MORPH_OPEN, np.ones((open_k, open_k), np.uint8))
        green_solid = g > 0

        white = (v >= ap.white_min_value) & (s <= ap.white_max_saturation)
        dil_k = self.config.morphology.transition_dilation_kernel
        transition = cv2.dilate(white.astype(np.uint8), np.ones((dil_k, dil_k), np.uint8)) > 0

        dark = v <= ap.dark_max_value
        colored = (s >= ap.color_sat_unknown_min) & ~green_solid

        mask = np.full(hsv.shape[:2], LEGAL_TRACK_LABEL, dtype=np.uint8)
        mask[green_solid] = OFF_TRACK_LABEL
        mask[dark] = UNKNOWN_LABEL
        mask[colored] = UNKNOWN_LABEL
        mask[transition] = UNKNOWN_LABEL
        return mask

    def _stats(self, mask: np.ndarray, hsv: np.ndarray) -> SurfaceStats:
        return surface_stats(mask, hsv, self.config.metrics, self._previous_mask)