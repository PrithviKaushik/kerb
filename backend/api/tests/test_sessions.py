"""Deterministic unit tests for the uploaded-session analysis flow.

These exercise the store, boundary payload round-trip, and the geometry-only
incident path with synthetic tracking records (no model, no GPU, no A5 data
files). The upload cap is tested via the pure validation helper.
"""

from __future__ import annotations

import json
import shutil
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

from backend.api import sessions as store
from backend.api.providers import session as provider
from backend.api.routes.sessions import (
    UPLOAD_CAP_SECONDS,
    BoundaryPayload,
    _validate_upload,
    run_analysis,
    set_boundary,
)
from backend.skills.incident_report.models import ContactState


def _write_records(path: Path, records: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(json.dumps(rec) for rec in records) + "\n", encoding="utf-8")


def _track(frame_index: int, x1: float, x2: float) -> dict:
    return {
        "frame_index": frame_index,
        "timestamp_seconds": frame_index / 50.0,
        "track_id": 1,
        "x1": x1,
        "y1": 400.0,
        "x2": x2,
        "y2": 500.0,
        "detector_confidence": 0.95,
    }


def _tracks_span(start_x: float, width: float, end_x: float, frames: int = 10) -> list[dict]:
    """Records moving rightwards so geometry sees a stable horizontal direction."""
    return [
        _track(i, start_x + (end_x - start_x) * i / max(frames - 1, 1), start_x + (end_x - start_x) * i / max(frames - 1, 1) + width)
        for i in range(frames)
    ]


def _write_valid_boundary(session_dir: Path) -> None:
    """Vertical line at x=400, legal track on the left of the directed line."""
    payload = {
        "video": "clip.mp4",
        "coordinate_space": "pixel",
        "camera_view": "session_test",
        "zone_id": "session_test_zone",
        "legal_side": "left",
        "boundary_semantics": "legal_track_limit_white_line",
        "line_contact_is_legal": True,
        "keyframes": [{"frame_index": 30, "points": [[400.0, 0.0], [400.0, 720.0]]}],
    }
    (session_dir / "manual_boundary.json").write_text(json.dumps(payload), encoding="utf-8")


class SessionStoreTests(unittest.TestCase):
    def setUp(self) -> None:
        self._tmp = Path(tempfile.mkdtemp(prefix="kerb-sessions-test-"))
        patchers = (
            mock.patch("backend.api.sessions.SESSIONS_ROOT", self._tmp),
        )
        for patcher in patchers:
            patcher.start()
        self._patchers = patchers

    def tearDown(self) -> None:
        for patcher in reversed(self._patchers):
            patcher.stop()
        shutil.rmtree(self._tmp, ignore_errors=True)

    def _make_session(self, session_id: str = "abc123", **overrides) -> store.SessionMeta:
        base = self._tmp / session_id
        base.mkdir(parents=True, exist_ok=True)
        (base / "session.json").write_text("{}", encoding="utf-8")
        defaults = dict(
            id=session_id,
            name="clip",
            created_at=1.0,
            source_filename="clip.mp4",
            video_fps=50.0,
            frame_count=100,
            duration_s=2.0,
            width=1920,
            height=1080,
            calibration_frame_index=50,
            model="kerb_yolo11n_plus_d3_and_a5.pt",
            status={"perception": "done", "incident": "pending"},
        )
        meta = store.SessionMeta(**{**defaults, **overrides})
        store.save_session(meta)
        return meta

    def test_create_load_save_roundtrip(self) -> None:
        source = self._tmp / "clip.mp4"
        source.write_bytes(b"not a real video")
        meta = store.create_session(
            source, "clip.mp4", width=640, height=360, fps=25.0,
            frame_count=50, duration_s=2.0, calibration_frame_index=25,
        )
        loaded = store.load_session(meta.id)
        assert loaded is not None
        self.assertEqual(loaded.id, meta.id)
        self.assertEqual(loaded.name, meta.name)
        self.assertEqual(loaded.width, 640)
        self.assertTrue(store.delete_session(meta.id))
        self.assertIsNone(store.load_session(meta.id))

    def test_session_path_rejects_traversal(self) -> None:
        with self.assertRaises(ValueError):
            store.session_path("../escape")
        with self.assertRaises(ValueError):
            store.session_path("a/b")

    def test_delete_all_sessions_removes_uploaded_session_directories(self) -> None:
        self._make_session("one111")
        self._make_session("two222")
        self.assertEqual(store.delete_all_sessions(), 2)
        self.assertEqual(store.list_sessions(), [])

    def test_boundary_endpoint_roundtrip(self) -> None:
        self._make_session()
        result = set_boundary(
            "abc123",
            BoundaryPayload(
                points=[[400.0, 0.0], [400.0, 720.0]],
                legal_side="left",
                frame_index=30,
            ),
        )
        self.assertEqual(result["points"], 2)
        meta = store.load_session("abc123")
        self.assertTrue(meta.has_boundary)

    def test_boundary_endpoint_accepts_multiple_keyframes(self) -> None:
        self._make_session()
        result = set_boundary(
            "abc123",
            BoundaryPayload(
                legal_side="left",
                keyframes=[
                    {"frame_index": 0, "points": [[400.0, 0.0], [400.0, 720.0]]},
                    {"frame_index": 50, "points": [[410.0, 0.0], [410.0, 720.0]]},
                ],
            ),
        )
        self.assertEqual(result["keyframes"], [0, 50])
        self.assertEqual(result["points"], 4)

    def test_boundary_rejects_too_few_points(self) -> None:
        self._make_session()
        with self.assertRaises(ValueError):
            BoundaryPayload(points=[[1.0, 1.0]], legal_side="left")


class UploadValidationTests(unittest.TestCase):
    def test_cap_rejects_long_clip(self) -> None:
        probe = SimpleNamespace(duration_seconds=UPLOAD_CAP_SECONDS + 1, fps=25.0, width=640, height=360)
        with self.assertRaises(Exception) as ctx:
            _validate_upload(probe)
        self.assertIn("upload limit", str(ctx.exception))

    def test_cap_accepts_short_clip(self) -> None:
        _validate_upload(
            SimpleNamespace(duration_seconds=UPLOAD_CAP_SECONDS - 1, fps=25.0, width=640, height=360)
        )


class SessionAnalysisTests(SessionStoreTests):
    def test_uncertain_geometry_is_never_fabricated_inside(self) -> None:
        state = provider.synthesize_spatial(
            {"spatial_state": "UNCERTAIN", "geometry_status": "UNCERTAIN"}
        )
        self.assertEqual(state["unknown_fraction"], 1.0)
        self.assertEqual(state["surface_state"], "UNKNOWN")
        self.assertEqual(state["off_track_fraction"], 0.0)

    def test_four_outside_clip_yields_violation_candidate(self) -> None:
        meta = self._make_session(status={"perception": "done", "incident": "pending"})
        _write_valid_boundary(self._tmp / "abc123")
        _write_records(self._tmp / "abc123" / "tracks.jsonl", _tracks_span(600.0, 50.0, 700.0))
        report = run_analysis(meta.id)
        self.assertEqual(report["state"], "VIOLATION_CANDIDATE")
        refreshed = store.load_session("abc123")
        self.assertIsNotNone(refreshed.incident)
        geometry_lines = (self._tmp / "abc123" / "geometry.jsonl").read_text().splitlines()
        last_geometry = json.loads(geometry_lines[-1])
        self.assertEqual(last_geometry["spatial_state"], "OUTSIDE")

    def test_inside_clip_yields_no_violation(self) -> None:
        meta = self._make_session(status={"perception": "done", "incident": "pending"})
        _write_valid_boundary(self._tmp / "abc123")
        _write_records(self._tmp / "abc123" / "tracks.jsonl", _tracks_span(200.0, 50.0, 250.0))
        report = run_analysis(meta.id)
        self.assertEqual(report["state"], "NO_VIOLATION")

    def test_tiny_bbox_yields_uncertain(self) -> None:
        meta = self._make_session(status={"perception": "done", "incident": "pending"})
        _write_valid_boundary(self._tmp / "abc123")
        records = [
            {
                "frame_index": i,
                "timestamp_seconds": i / 50.0,
                "track_id": 1,
                "x1": 250.0,
                "y1": 400.0,
                "x2": 255.0,
                "y2": 500.0,
                "detector_confidence": 0.95,
            }
            for i in range(10)
        ]
        _write_records(self._tmp / "abc123" / "tracks.jsonl", records)
        report = run_analysis(meta.id)
        self.assertEqual(report["state"], "UNCERTAIN")
        self.assertIn("UN-001", report["rules"])

    def test_contact_states_inherit_geometry(self) -> None:
        meta = self._make_session(status={"perception": "done", "incident": "pending"})
        _write_valid_boundary(self._tmp / "abc123")
        _write_records(self._tmp / "abc123" / "tracks.jsonl", _tracks_span(600.0, 50.0, 700.0))
        run_analysis(meta.id)
        observations = provider.build_observations(
            self._tmp / "abc123" / "tracks.jsonl", self._tmp / "abc123" / "geometry.jsonl"
        )
        self.assertEqual(len(observations), 10)
        self.assertTrue(
            all(region.state == ContactState.OUTSIDE for region in observations[-1].contact_regions)
        )


if __name__ == "__main__":
    unittest.main()
