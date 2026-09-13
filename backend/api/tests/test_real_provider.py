"""Deterministic unit tests for the real A5 -> incident intelligence bridge.

These test the pure mapping logic only; they never depend on the data/audit
artifact files existing on disk.
"""

from __future__ import annotations

import unittest

from backend.api.providers.real import (
    contact_regions_for_frame,
    spatial_state_to_contact,
)
from backend.skills.incident_report.geometry.rules import evaluate_four_outside
from backend.skills.incident_report.models import ContactMethod, ContactState


class SpatialStateMappingTests(unittest.TestCase):
    def test_spatial_vocabulary_maps_one_to_one(self) -> None:
        self.assertIs(spatial_state_to_contact("INSIDE"), ContactState.INSIDE)
        self.assertIs(spatial_state_to_contact("BOUNDARY"), ContactState.ON_BOUNDARY)
        self.assertIs(spatial_state_to_contact("OUTSIDE"), ContactState.OUTSIDE)
        self.assertIs(spatial_state_to_contact("UNCERTAIN"), ContactState.UNKNOWN)

    def test_unknown_spatial_state_never_maps_to_inside(self) -> None:
        for stray in ("", "LEGAL_TRACK", "UNKNOWN", "???", None):
            self.assertIs(spatial_state_to_contact(stray), ContactState.UNKNOWN)


class ContactRegionMappingTests(unittest.TestCase):
    def _regions(self, spatial_state: str, unknown_fraction: float = 0.0) -> tuple:
        return contact_regions_for_frame(
            (100.0, 200.0, 300.0, 400.0),
            {"spatial_state": spatial_state, "unknown_fraction": unknown_fraction, "surface_confidence": 0.5},
            10.0,
        )

    def test_four_regions_with_approved_names_and_method(self) -> None:
        regions = self._regions("OUTSIDE")
        self.assertEqual(len(regions), 4)
        self.assertEqual(
            [region.name for region in regions],
            ["front_left", "front_right", "rear_left", "rear_right"],
        )
        self.assertTrue(all(region.method == ContactMethod.BBOX_PROXY for region in regions))

    def test_all_regions_inherit_frame_state(self) -> None:
        regions = self._regions("OUTSIDE")
        self.assertTrue(all(region.state == ContactState.OUTSIDE for region in regions))

    def test_observability_and_reliability_from_measurements(self) -> None:
        regions = self._regions("UNCERTAIN", unknown_fraction=0.25)
        self.assertAlmostEqual(regions[0].observability, 0.75, places=4)
        self.assertAlmostEqual(regions[0].reliability, 0.5, places=4)

    def test_contact_y_uses_box_proxy_hierarchy(self) -> None:
        regions = self._regions("INSIDE")
        ys = {region.point.y for region in regions}
        # contact_y = y2 - 0.05 * h = 400 - 0.05 * 200 = 390, plus a 0.02*h
        # visual offset (4px) on one of each front/rear pair so markers separate.
        self.assertEqual(ys, {390.0, 394.0})

    def test_box_proxy_yields_distinct_markers(self) -> None:
        regions = self._regions("INSIDE")
        points = {(region.name, region.point.x, region.point.y) for region in regions}
        self.assertEqual(len(points), 4)

    def test_four_outside_violation_candidate(self) -> None:
        regions = self._regions("OUTSIDE")
        four_outside, incident_state = evaluate_four_outside(regions)
        self.assertTrue(four_outside)
        self.assertEqual(incident_state.value, "VIOLATION_CANDIDATE")

    def test_boundary_touch_is_not_outside(self) -> None:
        regions = self._regions("BOUNDARY")
        four_outside, incident_state = evaluate_four_outside(regions)
        self.assertFalse(four_outside)
        self.assertEqual(incident_state.value, "NO_VIOLATION")

    def test_unobservable_region_blocks_high_trust_claim(self) -> None:
        regions = self._regions("UNCERTAIN")
        four_outside, incident_state = evaluate_four_outside(regions)
        self.assertIsNone(four_outside)
        self.assertEqual(incident_state.value, "UNCERTAIN")


if __name__ == "__main__":
    unittest.main()