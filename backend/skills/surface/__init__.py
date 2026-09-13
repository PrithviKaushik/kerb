"""Whole-bbox track-surface spatial analysis (Phase 1) + A5 manual-boundary demo.

Phase 1: classical-CV baseline that estimates a per-frame surface label over a
configured search ROI, computes a deterministic surface_confidence, and
classifies the ENTIRE det bbox as INSIDE / OUTSIDE / BOUNDARY / UNCERTAIN.

A5 demo: a manually calibrated white-line legal boundary (polyline keyframes +
linear interpolation) fused with the same surface/classifier pipeline.
"""

from backend.skills.surface.config import CameraViewConfig, load_config
from backend.skills.surface.estimator import (
    LEGAL_TRACK_LABEL,
    OFF_TRACK_LABEL,
    UNKNOWN_LABEL,
    SurfaceEstimate,
    SurfaceEstimator,
    SurfaceStats,
    surface_state,
    surface_stats,
)
from backend.skills.surface.classifier import SPATIAL_STATES, classify_bbox

__all__ = [
    "CameraViewConfig",
    "load_config",
    "SurfaceEstimator",
    "SurfaceEstimate",
    "SurfaceStats",
    "surface_stats",
    "surface_state",
    "LEGAL_TRACK_LABEL",
    "OFF_TRACK_LABEL",
    "UNKNOWN_LABEL",
    "SPATIAL_STATES",
    "classify_bbox",
]