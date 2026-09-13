import unittest
from collections import deque
from pathlib import Path

import backend.skills.geometry.geometry as geometry_module
from backend.skills.geometry.geometry import (
    BoundaryConfig,
    GeometryConfig,
    _classify_footprint,
    geometry_record,
    load_config,
    process_records,
)


def record(frame, x1=100, y1=100, x2=200, y2=200, track_id=1, confidence=0.9):
    return {
        "frame_index": frame,
        "timestamp_seconds": frame / 50,
        "track_id": track_id,
        "x1": x1,
        "y1": y1,
        "x2": x2,
        "y2": y2,
        "detector_confidence": confidence,
    }


VERTICAL_BOUNDARY = BoundaryConfig(
    boundary_type="polyline",
    points=((300.0, 0.0), (300.0, 1000.0)),
    note="test boundary",
    inside_side="right_of_direction",
)


def ok_records(frames=5, **bbox):
    return [record(i, **_bbox_kwargs(i, bbox)) for i in range(frames)]


def _bbox_kwargs(i, base):
    kwargs = dict(base)
    kwargs["x1"] = base.get("x1", 100) + i * 5
    kwargs["x2"] = base.get("x2", 200) + i * 5
    return kwargs


class FootprintTests(unittest.TestCase):
    def test_tall_narrow_box_is_full_box(self):
        config = GeometryConfig()
        footprint, mode = geometry_module._footprint((100.0, 100.0, 150.0, 200.0), config)
        self.assertEqual(mode, "FULL_BOX")
        self.assertEqual(footprint, {"x1": 100.0, "y1": 100.0, "x2": 150.0, "y2": 200.0})

    def test_wide_low_box_is_lower_box(self):
        config = GeometryConfig()
        footprint, mode = geometry_module._footprint((100.0, 100.0, 300.0, 200.0), config)
        self.assertEqual(mode, "LOWER_BOX")
        self.assertEqual(footprint, {"x1": 100.0, "y1": 150.0, "x2": 300.0, "y2": 200.0})

    def test_equal_box_is_lower_box(self):
        config = GeometryConfig()
        footprint, mode = geometry_module._footprint((100.0, 100.0, 200.0, 200.0), config)
        self.assertEqual(mode, "LOWER_BOX")
        self.assertEqual(footprint, {"x1": 100.0, "y1": 150.0, "x2": 200.0, "y2": 200.0})

    def test_custom_lower_box_fraction(self):
        config = GeometryConfig(lower_box_fraction=0.4)
        footprint, mode = geometry_module._footprint((100.0, 100.0, 300.0, 200.0), config)
        self.assertEqual(mode, "LOWER_BOX")
        self.assertEqual(footprint, {"x1": 100.0, "y1": 140.0, "x2": 300.0, "y2": 200.0})


class UncertaintyTests(unittest.TestCase):
    def test_invalid_box_is_uncertain(self):
        output = process_records(ok_records(x1=100, x2=100), GeometryConfig(), VERTICAL_BOUNDARY)
        self.assertEqual(output[-1]["geometry_status"], "UNCERTAIN")
        self.assertEqual(output[-1]["spatial_state"], "UNCERTAIN")
        self.assertIn("invalid_bbox_dimensions", output[-1]["uncertainty_reasons"])

    def test_small_box_is_uncertain(self):
        output = process_records(ok_records(x1=100, x2=110, y1=100, y2=110), GeometryConfig(), VERTICAL_BOUNDARY)
        self.assertEqual(output[-1]["geometry_status"], "UNCERTAIN")
        self.assertIn("bbox_below_minimum_size", output[-1]["uncertainty_reasons"])

    def test_insufficient_history_is_uncertain(self):
        output = process_records([record(0)], GeometryConfig(), VERTICAL_BOUNDARY)
        self.assertEqual(output[0]["motion_status"], "unstable_insufficient_history")
        self.assertEqual(output[0]["geometry_status"], "UNCERTAIN")
        self.assertEqual(output[0]["spatial_state"], "UNCERTAIN")

    def test_near_zero_displacement_is_uncertain(self):
        output = process_records([record(i, x1=100) for i in range(5)], GeometryConfig(), VERTICAL_BOUNDARY)
        self.assertEqual(output[-1]["geometry_status"], "UNCERTAIN")
        self.assertIn("unstable_near_zero_displacement", output[-1]["uncertainty_reasons"])

    def test_low_confidence_is_uncertain(self):
        output = process_records(ok_records(confidence=0.1), GeometryConfig(), VERTICAL_BOUNDARY)
        self.assertEqual(output[-1]["geometry_status"], "UNCERTAIN")
        self.assertIn("low_detector_confidence", output[-1]["uncertainty_reasons"])

    def test_unusable_boundary_is_uncertain(self):
        record_data = ok_records()[-1]
        state, relation = _classify_footprint(
            {"x1": 400.0, "y1": 100.0, "x2": 500.0, "y2": 200.0},
            BoundaryConfig(boundary_type="polyline", points=((100.0, 100.0),), note="incomplete"),
            GeometryConfig(),
        )
        self.assertEqual(state, "UNCERTAIN")
        self.assertIsNone(relation)


class SpatialClassificationTests(unittest.TestCase):
    def test_footprint_clearly_inside(self):
        output = process_records(ok_records(x1=400, y1=100, x2=500, y2=200), GeometryConfig(), VERTICAL_BOUNDARY)
        self.assertEqual(output[-1]["geometry_status"], "OK")
        self.assertEqual(output[-1]["spatial_state"], "INSIDE")

    def test_footprint_touching_boundary_is_not_outside(self):
        output = process_records(ok_records(x1=230, y1=100, x2=300, y2=200), GeometryConfig(), VERTICAL_BOUNDARY)
        self.assertEqual(output[-1]["spatial_state"], "BOUNDARY")

    def test_footprint_within_touch_tolerance_is_not_outside(self):
        config = GeometryConfig(boundary_touch_tolerance_pixels=5.0)
        output = process_records(ok_records(x1=200, y1=100, x2=296, y2=200), config, VERTICAL_BOUNDARY)
        self.assertEqual(output[-1]["spatial_state"], "BOUNDARY")

    def test_footprint_intersecting_boundary_is_not_outside(self):
        output = process_records(ok_records(x1=250, y1=100, x2=400, y2=200), GeometryConfig(), VERTICAL_BOUNDARY)
        self.assertEqual(output[-1]["spatial_state"], "BOUNDARY")

    def test_entire_footprint_beyond_boundary_is_outside(self):
        output = process_records(ok_records(x1=100, y1=100, x2=200, y2=200), GeometryConfig(), VERTICAL_BOUNDARY)
        self.assertEqual(output[-1]["spatial_state"], "OUTSIDE")

    def test_inside_side_flip_swaps_inside_and_outside(self):
        flipped = BoundaryConfig(
            boundary_type="polyline",
            points=((300.0, 0.0), (300.0, 1000.0)),
            note="test boundary",
            inside_side="left_of_direction",
        )
        inside = process_records(ok_records(x1=400, y1=100, x2=500, y2=200), GeometryConfig(), flipped)
        outside = process_records(ok_records(x1=100, y1=100, x2=200, y2=200), GeometryConfig(), flipped)
        self.assertEqual(inside[-1]["spatial_state"], "OUTSIDE")
        self.assertEqual(outside[-1]["spatial_state"], "INSIDE")


class RegressionTests(unittest.TestCase):
    def test_no_old_four_point_contact_geometry(self):
        self.assertFalse(hasattr(geometry_module, "_contact_regions"))
        self.assertFalse(hasattr(geometry_module, "_marker"))
        for name in ("front_left", "front_right", "rear_left", "rear_right"):
            self.assertFalse(hasattr(geometry_module, name))
        output = process_records(ok_records(x1=400, y1=100, x2=500, y2=200), GeometryConfig(), VERTICAL_BOUNDARY)
        self.assertNotIn("contact_regions", output[-1])

    def test_output_includes_footprint_and_spatial_state(self):
        output = process_records(ok_records(x1=400, y1=100, x2=500, y2=200), GeometryConfig(), VERTICAL_BOUNDARY)
        record = output[-1]
        self.assertIn("footprint", record)
        self.assertIn("geometry_mode", record)
        self.assertIn("spatial_state", record)
        self.assertIsNotNone(record["boundary_relation"])
        self.assertIn("signed_distances", record["boundary_relation"])

    def test_boundary_configuration_loads(self):
        config, boundary = load_config(Path("backend/skills/geometry/config/d5_manual_boundary.json"))
        self.assertTrue(config.fixed_camera_horizontal_fallback)
        self.assertEqual(boundary.boundary_type, "polyline")
        self.assertIn(boundary.inside_side, {"left_of_direction", "right_of_direction"})
        self.assertGreaterEqual(len(boundary.points), 2)
        self.assertAlmostEqual(config.lower_box_fraction, 0.5)


if __name__ == "__main__":
    unittest.main()