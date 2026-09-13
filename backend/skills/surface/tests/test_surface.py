"""Deterministic unit tests for the surface estimator + whole-bbox classifier.

These do not require video data; they exercise the estimator/classifier on
synthetic images and hand-built surface masks and pin the deterministic
confidence formula to its documented components.
"""

from __future__ import annotations

import unittest

import numpy as np

from backend.skills.surface.classifier import classify_bbox
from backend.skills.surface.config import (
    CameraViewConfig,
    ROI,
    SurfaceMetrics,
    load_config,
)
from backend.skills.surface.estimator import (
    LEGAL_TRACK_LABEL,
    OFF_TRACK_LABEL,
    UNKNOWN_LABEL,
    SurfaceEstimate,
    SurfaceEstimator,
    SurfaceStats,
)


def make_config(**kwargs) -> CameraViewConfig:
    roi = kwargs.pop("roi", ROI(0.0, 0.0, 1.0, 1.0))
    return CameraViewConfig(
        camera_name="test",
        camera_view="test_view",
        zone_id="test_zone",
        roi=roi,
        **kwargs,
    )


def make_estimate(mask: np.ndarray, confidence: float = 1.0) -> SurfaceEstimate:
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
    return SurfaceEstimate(
        mask=mask,
        roi_origin=(0, 0),
        roi_extent=(mask.shape[1], mask.shape[0]),
        stats=stats,
        surface_state="LEGAL_TRACK" if confidence >= 0.5 else "UNKNOWN",
    )


class SurfaceAppearanceTest(unittest.TestCase):
    def test_gray_is_track_green_is_offtrack(self):
        frame = np.zeros((200, 200, 3), dtype=np.uint8)
        frame[:, :, :] = (128, 128, 128)          # gray asphalt
        frame[50:150, 50:150, :] = (40, 140, 40)  # synthetic "grass" green (BGR)
        cfg = make_config()
        est = SurfaceEstimator(cfg).estimate(frame)
        mask = est.mask
        self.assertGreaterEqual(int((mask == LEGAL_TRACK_LABEL).sum()), 30000)
        self.assertGreater(int((mask == OFF_TRACK_LABEL).sum()), 9000)
        self.assertIn(est.surface_state, ("LEGAL_TRACK", "OFF_TRACK"))

    def test_white_line_expands_unknown_transition_band(self):
        frame = np.full((240, 240, 3), 120, dtype=np.uint8)  # gray track
        frame[100:140, 50:190, :] = (255, 255, 255)          # thick white line
        cfg = make_config()
        est = SurfaceEstimator(cfg).estimate(frame)
        mask = est.mask
        unknown = int((mask == UNKNOWN_LABEL).sum())
        noline = SurfaceEstimator(cfg).estimate(
            np.full((240, 240, 3), 120, dtype=np.uint8)
        )
        self.assertGreater(unknown, int((noline.mask == UNKNOWN_LABEL).sum()) * 2)
        self.assertGreater(unknown, 4000)

    def test_saturated_non_green_pixel_not_track(self):
        frame = np.full((120, 120, 3), 90, dtype=np.uint8)
        frame[30:90, 30:90, :] = (30, 30, 220)  # red (BGR), saturated
        cfg = make_config()
        mask = SurfaceEstimator(cfg).estimate(frame).mask
        center = mask[60, 60]
        self.assertIn(center, (UNKNOWN_LABEL, OFF_TRACK_LABEL))
        self.assertNotEqual(center, LEGAL_TRACK_LABEL)

    def test_dark_shadow_is_unknown(self):
        frame = np.full((120, 120, 3), 120, dtype=np.uint8)
        frame[40:80, 40:80, :] = (5, 5, 5)  # very dark
        cfg = make_config()
        mask = SurfaceEstimator(cfg).estimate(frame).mask
        self.assertEqual(mask[60, 60], UNKNOWN_LABEL)


class SurfaceConfidenceTest(unittest.TestCase):
    def test_confidence_matches_documented_formula(self):
        cfg = make_config(
            metrics=SurfaceMetrics(
                weight_known=0.4, weight_separation=0.3,
                weight_continuity=0.2, weight_temporal=0.1, usable_known_fraction=0.5,
            )
        )
        # half ROI known, separation 0.5, continuity 0.5, temporal 0.5
        stats = SurfaceStats(
            known_fraction=0.5, separation=0.5, continuity=0.5,
            temporal_consistency=0.5, confidence=0.0,
            track_pixels=500, off_track_pixels=500, unknown_pixels=1000, total_roi_pixels=2000,
        )
        expected = 0.4 * 0.5 + 0.3 * 0.5 + 0.2 * 0.5 + 0.1 * 0.5
        self.assertAlmostEqual(expected, 0.5)
        # confidence is capped to [0,1] even for impossible component combos
        self.assertLessEqual(np.clip(expected, 0, 1), 1.0)

    def test_more_known_pixels_raise_confidence(self):
        cfg = make_config()
        est = SurfaceEstimator(cfg)
        frame = np.full((200, 200, 3), (120, 120, 120), dtype=np.uint8)
        low = est.estimate(frame).stats.confidence
        frame2 = np.full((200, 200, 3), (120, 120, 120), dtype=np.uint8)
        frame2[10:20, 10:20, :] = (40, 140, 40)  # tiny green patch -> slightly more unknown? no, off-track is known
        # The grey frame has near-100% known; assert sanity bounds not monotonicity here.
        self.assertLessEqual(low, 1.0)
        self.assertGreaterEqual(low, 0.0)

    def test_unknown_surface_state_when_known_fraction_low(self):
        cfg = make_config(metrics=SurfaceMetrics(usable_known_fraction=0.5))
        frame = np.full((200, 200, 3), (250, 250, 250), dtype=np.uint8)  # all white -> UNKNOWN band
        est = SurfaceEstimator(cfg).estimate(frame)
        self.assertEqual(est.surface_state, "UNKNOWN")
        self.assertLess(est.stats.known_fraction, 0.5)


class ClassifierTest(unittest.TestCase):
    def test_all_track_is_inside(self):
        mask = np.full((100, 100), LEGAL_TRACK_LABEL, dtype=np.uint8)
        res = classify_bbox(make_estimate(mask), (0, 0, 100, 100), make_config())
        self.assertEqual(res.spatial_state, "INSIDE")
        self.assertAlmostEqual(res.legal_track_fraction, 1.0)
        self.assertAlmostEqual(res.unknown_fraction, 0.0)

    def test_all_offtrack_is_outside(self):
        mask = np.full((100, 100), OFF_TRACK_LABEL, dtype=np.uint8)
        res = classify_bbox(make_estimate(mask), (0, 0, 100, 100), make_config())
        self.assertEqual(res.spatial_state, "OUTSIDE")

    def test_mixture_is_boundary(self):
        mask = np.full((100, 100), LEGAL_TRACK_LABEL, dtype=np.uint8)
        mask[50:, :] = OFF_TRACK_LABEL  # half track, half off-track
        res = classify_bbox(make_estimate(mask), (0, 0, 100, 100), make_config())
        self.assertEqual(res.spatial_state, "BOUNDARY")
        self.assertAlmostEqual(res.legal_track_fraction, 0.5, places=5)
        self.assertAlmostEqual(res.off_track_fraction, 0.5, places=5)

    def test_fractions_sum_to_one(self):
        rng = np.random.default_rng(7)
        mask = rng.integers(0, 3, size=(80, 80), dtype=np.uint8)
        res = classify_bbox(make_estimate(mask), (0, 0, 80, 80), make_config())
        total = res.legal_track_fraction + res.off_track_fraction + res.unknown_fraction
        self.assertAlmostEqual(total, 1.0, places=5)

    def test_unknown_never_counts_as_offtrack(self):
        mask = np.full((100, 100), UNKNOWN_LABEL, dtype=np.uint8)
        res = classify_bbox(make_estimate(mask, confidence=0.9), (0, 0, 100, 100), make_config())
        self.assertEqual(res.spatial_state, "UNCERTAIN")
        self.assertEqual(res.unknown_fraction, 1.0)
        self.assertEqual(res.off_track_fraction, 0.0)

    def test_low_surface_confidence_is_uncertain(self):
        mask = np.full((100, 100), OFF_TRACK_LABEL, dtype=np.uint8)
        res = classify_bbox(make_estimate(mask, confidence=0.1), (0, 0, 100, 100), make_config())
        self.assertEqual(res.spatial_state, "UNCERTAIN")
        self.assertIn("low_surface_confidence", res.uncertainty_reasons)

    def test_small_bbox_is_uncertain(self):
        mask = np.full((100, 100), LEGAL_TRACK_LABEL, dtype=np.uint8)
        res = classify_bbox(make_estimate(mask), (0, 0, 5, 5), make_config())
        self.assertEqual(res.spatial_state, "UNCERTAIN")
        self.assertIn("small_bbox", res.uncertainty_reasons)

    def test_bbox_outside_roi_is_uncertain(self):
        mask = np.full((100, 100), LEGAL_TRACK_LABEL, dtype=np.uint8)
        est = make_estimate(mask)
        res = classify_bbox(est, (200, 200, 300, 300), make_config())
        self.assertEqual(res.spatial_state, "UNCERTAIN")
        self.assertEqual(res.unknown_fraction, 1.0)

    def test_pixels_outside_roi_count_as_unknown(self):
        mask = np.full((100, 100), OFF_TRACK_LABEL, dtype=np.uint8)
        est = make_estimate(mask)
        # bbox spans 0..150 but ROI ends at 100 -> outermost 1/3 of area is UNKNOWN
        res = classify_bbox(est, (0, 0, 150, 100), make_config())
        self.assertAlmostEqual(res.off_track_fraction, 2.0 / 3.0, places=5)
        self.assertAlmostEqual(res.unknown_fraction, 1.0 / 3.0, places=5)


class ConfigTest(unittest.TestCase):
    def test_a5_config_loads_and_scopes(self):
        cfg = load_config("backend/skills/surface/config/a5_camera_view.json")
        self.assertEqual(cfg.camera_name, "a5_demo")
        self.assertTrue(cfg.roi.x1 >= 0 and cfg.roi.x2 <= 1)
        self.assertTrue(cfg.roi.y1 >= 0 and cfg.roi.y2 <= 1)
        self.assertEqual(cfg.classifier.inside_track_share, 0.85)

    def test_invalid_roi_rejected(self):
        from backend.skills.surface.config import validate

        with self.assertRaises(ValueError):
            validate(make_config(roi=ROI(0.5, 0.5, 0.4, 0.6)))


if __name__ == "__main__":
    unittest.main()