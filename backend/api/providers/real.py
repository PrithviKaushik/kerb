"""Real A5 perception provider.

Feeds the actually recorded A5 artifacts through the skill chain in order:

    perception (YOLO+ByteTrack JSONL)
      -> surface (calibrated manual-boundary spatial JSONL)
      -> four-outside / temporal / trust / evidence (incident intelligence)

No synthetic contact states are invented. Each frame's four box-proxy contact
markers (sprint-locked hierarchy: contact_y = y2 - 0.05*h, left_x/right_x =
0.20/0.80 of width, front/rear from tracked displacement) inherit the state
measured by the unchanged whole-bbox spatial classifier on the manually
calibrated white-line boundary.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.skills.incident_report.models import (
    ContactMethod,
    ContactRegion,
    ContactState,
    Point,
)
from backend.skills.incident_report.perception_adapter import (
    StandardizedObservation,
    adapt_perception_record,
)
from backend.skills.incident_report.pipeline import IncidentIntelligencePipeline

_REPO_ROOT = Path(__file__).resolve().parents[3]

A5_VIDEO = _REPO_ROOT / "data/raw/a5.mp4"
A5_TRACKS = _REPO_ROOT / "data/audit/perception_tracking/a5_adapt/a5_tracks.jsonl"
A5_SPATIAL = _REPO_ROOT / "data/audit/surface/a5_manual/a5_manual_spatial.jsonl"

SPATIAL_TO_CONTACT = {
    "INSIDE": ContactState.INSIDE,
    "BOUNDARY": ContactState.ON_BOUNDARY,
    "OUTSIDE": ContactState.OUTSIDE,
    "UNCERTAIN": ContactState.UNKNOWN,
}

REGION_NAMES = ("front_left", "front_right", "rear_left", "rear_right")


def spatial_state_to_contact(state: str) -> ContactState:
    """Map the whole-bbox spatial vocabulary to the four-contact vocabulary.

    OUTSIDE/BOUNDARY/INSIDE/UNCERTAIN map 1:1; anything else is treated as
    UNKNOWN because an unmeasured contact region must never look inside.
    """
    return SPATIAL_TO_CONTACT.get(state, ContactState.UNKNOWN)


def contact_regions_for_frame(
    bbox: tuple[float, float, float, float],
    spatial: dict[str, Any],
    direction_dx: float,
) -> tuple[ContactRegion, ...]:
    """Box-proxy contact markers for one frame.

    contact_y sits just above the box bottom (sprint hierarchy), left/right split
    at 0.20/0.80 of the width, front/rear follow the tracked displacement axis
    (image-horizontal fallback when motion is unstable). All four inherit the
    frame's spatial state; observability/reliability come from the measured
    unknown fraction and surface confidence.
    """
    x1, y1, x2, y2 = bbox
    width = max(float(x2 - x1), 1.0)
    height = max(float(y2 - y1), 1.0)

    contact_y = y2 - 0.05 * height
    left_x = x1 + 0.20 * width
    right_x = x1 + 0.80 * width

    horizontal = abs(direction_dx) >= 1e-9
    if horizontal:
        front_x = x2 if direction_dx >= 0 else x1
        rear_x = x1 if direction_dx >= 0 else x2
        points = {
            "front_left": (front_x, contact_y),
            "front_right": (front_x, contact_y + 0.02 * height),
            "rear_left": (rear_x, contact_y),
            "rear_right": (rear_x, contact_y + 0.02 * height),
        }
    else:
        front_y = y2 if float(direction_dx) >= 0 else y1
        rear_y = y1 if float(direction_dx) >= 0 else y2
        points = {
            "front_left": (left_x, front_y),
            "front_right": (right_x, front_y),
            "rear_left": (left_x, rear_y),
            "rear_right": (right_x, rear_y),
        }
    state = spatial_state_to_contact(str(spatial.get("spatial_state", "UNCERTAIN")))
    unknown_fraction = float(spatial.get("unknown_fraction", 1.0)) if spatial else 1.0
    surface_confidence = float(spatial.get("surface_confidence", 0.0)) if spatial else 0.0

    observability = round(max(0.0, min(1.0, 1.0 - unknown_fraction)), 4)
    reliability = round(max(0.0, min(1.0, surface_confidence)), 4)

    return tuple(
        ContactRegion(
            name=name,
            point=Point(*points[name]),
            state=state,
            observability=observability,
            method=ContactMethod.BBOX_PROXY,
            reliability=reliability,
        )
        for name in REGION_NAMES
    )


def _read_jsonl(path: Path) -> list[dict]:
    if not path.is_file():
        raise FileNotFoundError(f"Missing A5 artifact: {path}")
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]


def load_tracks() -> list[dict]:
    """Track JSONL normalized to the perception-adapter record shape."""
    records = []
    for rec in _read_jsonl(A5_TRACKS):
        records.append(
            {
                "frame_index": int(rec["frame_index"]),
                "timestamp_s": float(rec["timestamp_seconds"]),
                "track_id": int(rec["track_id"]),
                "bbox": (
                    float(rec["x1"]),
                    float(rec["y1"]),
                    float(rec["x2"]),
                    float(rec["y2"]),
                ),
                "confidence": float(rec["detector_confidence"]),
            }
        )
    return records


def load_spatial_by_frame() -> dict[int, dict]:
    return {int(rec["frame_index"]): rec for rec in _read_jsonl(A5_SPATIAL)}


def build_observations() -> list[StandardizedObservation]:  # noqa: C901
    """One standardized observation per tracked frame, sorted by time."""
    tracks = load_tracks()
    spatial = load_spatial_by_frame()

    direction: dict[int, float] = {}
    for index, rec in enumerate(tracks):
        previous = tracks[index - 1] if index > 0 else None
        if previous is None:
            direction[rec["frame_index"]] = 1.0
            continue
        dx = rec["bbox"][0] - previous["bbox"][0]
        dy = rec["bbox"][1] - previous["bbox"][1]
        direction[rec["frame_index"]] = dx if abs(dx) >= abs(dy) else 0.0

    observations = []
    for rec in sorted(tracks, key=lambda item: item["frame_index"]):
        spatial_rec = spatial.get(rec["frame_index"], {})
        contact_regions = contact_regions_for_frame(
            rec["bbox"], spatial_rec, direction.get(rec["frame_index"], 1.0)
        )
        reliability = float(spatial_rec.get("surface_confidence", 0.0)) if spatial_rec else 0.0
        context_flags = (
            ("POOR_OBSERVABILITY",)
            if (spatial_rec or {}).get("surface_state") == "UNKNOWN"
            else ()
        )
        observations.append(
            adapt_perception_record(
                rec,
                contact_regions,
                context_flags=context_flags,
                reliability={"tracking": round(reliability, 4)},
                geometry_method="BBOX_PROXY",
            )
        )
    return observations


def peak_observation(observations: list[StandardizedObservation]) -> StandardizedObservation:
    """Event frame = maximum measured off-track fraction among OUTSIDE frames.

    Never fabricates a candidate: if no frame is OUTSIDE, the frame with the
    largest off-track fraction is used and the pipeline decides from real data.
    """
    spatial = load_spatial_by_frame()
    outside = [
        obs
        for obs in observations
        if spatial_state_to_contact(
            str(spatial.get(obs.detection.frame_index, {}).get("spatial_state", "UNCERTAIN"))
        )
        == ContactState.OUTSIDE
    ]
    pool = outside or list(observations)
    return max(
        pool,
        key=lambda obs: float(
            spatial.get(obs.detection.frame_index, {}).get("off_track_fraction", 0.0)
        ),
    )


class RealA5AnalysisProvider:
    """Runs the incident-intelligence pipeline on the recorded A5 clip."""

    def __init__(self) -> None:
        self._pipeline = IncidentIntelligencePipeline()

    def observe(self) -> list[StandardizedObservation]:
        return build_observations()

    def analyze(self, filename: str, duration_s: float | None, fps: float | None) -> dict[str, Any]:
        observations = self.observe()
        if not observations:
            raise RuntimeError("No A5 tracking records available")
        peak = peak_observation(observations)
        report = self._pipeline.build_report(
            "A5-KERB-0001",
            peak,
            observations,
            session_event="Kerb Development Demo",
            session_year=2026,
            session_type="DEMO_CLIP",
            track_name="Audit Clip A5",
            video_available=True,
        )
        incident = {
            "incident_id": "A5-KERB-0001",
            "track_id": peak.detection.track_id,
            "timestamp_s": peak.detection.timestamp_s,
            "frame_index": peak.detection.frame_index,
            "state": report["state"],
            "trust_score": report["trust"]["score"],
            "review_required": report["review_required"],
            "priority": report["trust"]["score"],
            "report": report,
        }
        return {
            "job_id": "A5-REAL-PIPELINE",
            "status": "COMPLETED",
            "provider": "REAL_A5_PERCEPTION",
            "video": {"filename": str(A5_VIDEO.name), "duration_s": duration_s, "fps": fps},
            "incidents": [incident],
        }