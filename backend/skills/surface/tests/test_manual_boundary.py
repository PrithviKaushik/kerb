"""Unit tests for the manual legal-boundary calibration pieces:

- polyline re-sampling and keyframe interpolation (exact at keyframes, linear
  between them, clamping outside the calibrated range)
- boundary rasterisation: legal side, off side, transition band = UNKNOWN
- UNKNOWN invariant: UNKNOWN pixels are never converted to OFF_TRACK
- whole-bbox classification against a fused boundary mask (INSIDE / BOUNDARY /
  OUTSIDE), tested via the unchanged classifier
"""

from __future__ import annotations

import unittest

import numpy as np

from backend.skills.surface.classifier import classify_bbox
from backend.skills.surface.config import CameraViewConfig, ROI, load_config
from backend.skills.surface.estimator import (
    LEGAL_TRACK_LABEL,
    OFF_TRACK_LABEL,
    UNKNOWN_LABEL,
    SurfaceEstimate,
    SurfaceStats,
)
from backend.skills.surface.manual_boundary import (
    ManualBoundary,
    Keyframe,
    boundary_label_mask,
    interpolate_polyline,
    load_manual_boundary,
    resample_polyline,
)


def make_boundary() -> ManualBoundary:
    # A vertical white line at x=60 with asphalt on the LEFT, directed top->bottom.
    return ManualBoundary(
        video="test.mp4",
        coordinate_space="pixel",
        camera_view="view",
        zone_id="zone",
        legal_side="left",
        keyframes=(
            Keyframe(0, ((60.0, 0.0), (60.0, 100.0))),
            Keyframe(100, ((100.0, 0.0), (100.0, 100.0))),
        ),
        boundary_semantics="legal_track_limit_white_line",
        line_contact_is_legal=True,
    )


def make_fused_est(mask: np.ndarray, confidence: float = 1.0) -> SurfaceEstimate:
    stats = SurfaceStats(
        known_fraction=float(np.mean(mask != UNKNOWN_LABEL)),
        separation=0.5,
        continuity=1.0,
        temporal_consistency=1.0,
        confidence=confidence,
        track_pixels=0,
        off_track_pixels=0,
        unknown_pixels=0,
        total_roi_pixels=mask.size,
    )
    return SurfaceEstimate(mask=mask, roi_origin=(0, 0), roi_extent=(mask.shape[1], mask.shape[0]), stats=stats, surface_state="LEGAL_TRACK")


class ResampleTest(unittest.TestCase):
    def test_resample_preserves_endpoints(self):
        pts = np.array([[0.0, 0.0], [10.0, 0.0], [20.0, 0.0]])
        out = resample_polyline(pts, 5)
        self.assertEqual(out.shape, (5, 2))
        np.testing.assert_allclose(out[0], [0.0, 0.0])
        np.testing.assert_allclose(out[-1], [20.0, 0.0])


class InterpolationTest(unittest.TestCase):
    def test_exact_at_keyframes(self):
        b = make_boundary()
        p0 = interpolate_polyline(b, 0)
        np.testing.assert_allclose(p0[0], [60.0, 0.0])
        p100 = interpolate_polyline(b, 100)
        np.testing.assert_allclose(p100[0], [100.0, 0.0])

    def test_linear_between_keyframes(self):
        b = make_boundary()
        p50 = interpolate_polyline(b, 50)
        np.testing.assert_allclose(p50[0], [80.0, 0.0], atol=1e-6)

    def test_clamps_outside_range(self):
        b = make_boundary()
        np.testing.assert_allclose(interpolate_polyline(b, -5)[0], [60.0, 0.0])
        np.testing.assert_allclose(interpolate_polyline(b, 999)[0], [100.0, 0.0])


class BoundaryMaskTest(unittest.TestCase):
    def test_vertical_line_legal_left_off_right(self):
        poly = np.array([[60.0, 0.0], [60.0, 200.0]])
        mask = boundary_label_mask((200, 200), poly, "left", transition_band_pixels=6)
        self.assertEqual(mask[100, 10], LEGAL_TRACK_LABEL)   # well left = asphalt
        self.assertEqual(mask[100, 190], OFF_TRACK_LABEL)    # well right = kerb/runoff
        self.assertEqual(mask[100, 60], UNKNOWN_LABEL)       # on line = transition band
        self.assertEqual(mask[0, 10], LEGAL_TRACK_LABEL)     # top-left corner legal
        self.assertEqual(mask[199, 190], OFF_TRACK_LABEL)    # bottom-right off

    def test_unknown_never_converted_to_off(self):
        poly = np.array([[60.0, 0.0], [60.0, 200.0]])
        appearance = np.full((200, 200), LEGAL_TRACK_LABEL, dtype=np.uint8)
        # A saturated car-like blob on the off side stays UNKNOWN, not OFF_TRACK.
        appearance[120:160, 150:190] = UNKNOWN_LABEL
        mask = boundary_label_mask((200, 200), poly, "left", transition_band_pixels=6, appearance_mask=appearance)
        self.assertEqual(mask[140, 170], UNKNOWN_LABEL)
        self.assertEqual(mask[100, 150], OFF_TRACK_LABEL)   # unobstructed off side

    def test_grass_stays_offtrack_when_fused(self):
        poly = np.array([[60.0, 0.0], [60.0, 200.0]])
        appearance = np.full((200, 200), LEGAL_TRACK_LABEL, dtype=np.uint8)
        appearance[80:120, 70:200] = OFF_TRACK_LABEL
        mask = boundary_label_mask((200, 200), poly, "left", transition_band_pixels=6, appearance_mask=appearance)
        self.assertEqual(mask[100, 100], OFF_TRACK_LABEL)


class FusedClassificationTest(unittest.TestCase):
    def test_box_left_is_inside(self):
        poly = np.array([[60.0, 0.0], [60.0, 300.0]])
        mask = boundary_label_mask((300, 300), poly, "left", transition_band_pixels=8)
        res = classify_bbox(make_fused_est(mask), (5, 100, 40, 260), load_config("backend/skills/surface/config/a5_manual_demo.json"))
        self.assertEqual(res.spatial_state, "INSIDE")

    def test_box_right_is_outside(self):
        poly = np.array([[60.0, 0.0], [60.0, 300.0]])
        mask = boundary_label_mask((300, 300), poly, "left", transition_band_pixels=8)
        res = classify_bbox(make_fused_est(mask), (120, 100, 200, 260), load_config("backend/skills/surface/config/a5_manual_demo.json"))
        self.assertEqual(res.spatial_state, "OUTSIDE")

    def test_straddling_box_is_boundary(self):
        poly = np.array([[60.0, 0.0], [60.0, 300.0]])
        mask = boundary_label_mask((300, 300), poly, "left", transition_band_pixels=8)
        # box roughly half-and-half across the line
        res = classify_bbox(make_fused_est(mask), (20, 100, 110, 260), load_config("backend/skills/surface/config/a5_manual_demo.json"))
        self.assertEqual(res.spatial_state, "BOUNDARY")

    def test_unknown_only_box_is_uncertain(self):
        mask = np.full((200, 200), UNKNOWN_LABEL, dtype=np.uint8)
        res = classify_bbox(make_fused_est(mask, confidence=0.9), (20, 20, 80, 80), load_config("backend/skills/surface/config/a5_manual_demo.json"))
        self.assertEqual(res.spatial_state, "UNCERTAIN")
        self.assertEqual(res.off_track_fraction, 0.0)


class BoundaryJsonTest(unittest.TestCase):
    def test_loads_calibration_schema(self):
        import json
        import tempfile
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as fh:
            json.dump(
                {
                    "video": "a5.mp4",
                    "coordinate_space": "pixel",
                    "keyframes": [
                        {"frame_index": 0, "points": [[10, 10], [10, 200], [12, 400]]},
                        {"frame_index": 140, "points": [[30, 10], [30, 200], [32, 400], [30, 500]]},
                    ],
                    "boundary_semantics": "legal_track_limit_white_line",
                    "line_contact_is_legal": True,
                    "legal_side": "left",
                },
                fh,
            )
            path = fh.name
        b = load_manual_boundary(path)
        self.assertEqual(b.legal_side, "left")
        self.assertEqual([k.frame_index for k in b.keyframes], [0, 140])
        self.assertGreater(len(b.keyframes[1].points), 0)


if __name__ == "__main__":
    unittest.main()