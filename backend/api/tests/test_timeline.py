"""Deterministic tests for measured spatial timeline aggregation."""

from __future__ import annotations

import unittest

from backend.api.timeline import aggregate_spatial_timeline


def row(frame: int, timestamp: float, track_id: int, state: str, off_track: float = 0.0) -> dict:
    return {
        "frame_index": frame,
        "timestamp_seconds": timestamp,
        "track_id": track_id,
        "spatial_state": state,
        "off_track_fraction": off_track,
    }


class SpatialTimelineTests(unittest.TestCase):
    def test_finds_first_and_last_outside_and_boundary(self) -> None:
        result = aggregate_spatial_timeline(
            [
                row(10, 1.0, 1, "INSIDE"),
                row(11, 1.5, 1, "BOUNDARY"),
                row(12, 2.0, 1, "OUTSIDE", 0.4),
                row(13, 2.7, 1, "OUTSIDE", 0.8),
                row(14, 3.2, 1, "INSIDE"),
            ]
        )[0]
        self.assertEqual(result["first_boundary_frame"], 11)
        self.assertEqual(result["first_outside_frame"], 12)
        self.assertEqual(result["last_outside_frame"], 13)
        self.assertAlmostEqual(result["outside_duration_seconds"], 0.7)
        self.assertEqual(result["peak_frame"], 13)

    def test_no_outside_returns_null_markers(self) -> None:
        result = aggregate_spatial_timeline([row(1, 0.1, 1, "INSIDE")])[0]
        self.assertIsNone(result["first_outside_frame"])
        self.assertIsNone(result["first_outside_time"])
        self.assertIsNone(result["last_outside_frame"])
        self.assertIsNone(result["peak_frame"])
        self.assertEqual(result["outside_duration_seconds"], 0.0)

    def test_unknown_and_uncertain_never_become_outside(self) -> None:
        result = aggregate_spatial_timeline(
            [row(1, 0.0, 1, "UNKNOWN"), row(2, 1.0, 1, "UNCERTAIN")]
        )[0]
        self.assertIsNone(result["first_outside_frame"])
        self.assertEqual(result["state_counts"]["UNKNOWN"], 1)
        self.assertEqual(result["state_counts"]["UNCERTAIN"], 1)
        self.assertEqual(result["state_counts"]["OUTSIDE"], 0)

    def test_track_ids_remain_separate(self) -> None:
        results = aggregate_spatial_timeline(
            [row(1, 0.0, 2, "OUTSIDE"), row(2, 1.0, 1, "BOUNDARY")]
        )
        self.assertEqual([result["track_id"] for result in results], [1, 2])
        self.assertIsNone(results[0]["first_outside_frame"])
        self.assertEqual(results[1]["first_outside_frame"], 1)

    def test_duration_uses_timestamps_not_frame_count(self) -> None:
        result = aggregate_spatial_timeline(
            [row(20, 10.0, 1, "OUTSIDE"), row(21, 10.2, 1, "OUTSIDE"), row(22, 11.7, 1, "INSIDE")]
        )[0]
        self.assertAlmostEqual(result["outside_duration_seconds"], 0.2)

    def test_non_consecutive_outside_intervals_are_not_bridged(self) -> None:
        result = aggregate_spatial_timeline(
            [
                row(1, 0.0, 1, "OUTSIDE"),
                row(2, 0.5, 1, "INSIDE"),
                row(3, 2.0, 1, "OUTSIDE"),
                row(4, 2.25, 1, "INSIDE"),
            ]
        )[0]
        self.assertEqual(result["outside_duration_seconds"], 0.0)


if __name__ == "__main__":
    unittest.main()
