from __future__ import annotations

from pathlib import Path
from typing import Any
from uuid import uuid4

from backend.skills.incident_report.models import ContactMethod, ContactRegion, ContactState, Point
from backend.skills.incident_report.perception_adapter import StandardizedObservation, adapt_perception_record
from backend.skills.incident_report.pipeline import IncidentIntelligencePipeline


class AnalysisProvider:
    def analyze(self, filename: str, duration_s: float | None, fps: float | None) -> dict[str, Any]:
        raise NotImplementedError


class DevelopmentAnalysisProvider(AnalysisProvider):
    """Deterministic development provider; no YOLO/ByteTrack inference is claimed."""

    def __init__(self) -> None:
        self._pipeline = IncidentIntelligencePipeline()

    def analyze(self, filename: str, duration_s: float | None, fps: float | None) -> dict[str, Any]:
        definitions = (
            ("INC-0001", 16, 84.32, 4216, [ContactState.OUTSIDE] * 4, (), True),
            ("INC-0002", 4, 42.06, 2103, [ContactState.ON_BOUNDARY, ContactState.OUTSIDE, ContactState.OUTSIDE, ContactState.OUTSIDE], (), True),
            ("INC-0003", 44, 58.71, 2935, [ContactState.UNKNOWN, ContactState.OUTSIDE, ContactState.OUTSIDE, ContactState.OUTSIDE], (), False),
            ("INC-0004", 27, 61.18, 3059, [ContactState.OUTSIDE] * 4, ("POSSIBLE_FORCED_OFF_TRACK",), True),
        )
        observations_by_incident: dict[str, list[StandardizedObservation]] = {}
        for incident_id, track_id, timestamp, frame_index, states, context_flags, stable in definitions:
            observations_by_incident[incident_id] = [
                self._observation(track_id, timestamp + offset, frame_index + int(offset * 50), states, context_flags, stable)
                for offset in (-0.2, -0.1, 0.0, 0.1, 0.2)
            ]

        incidents = []
        for incident_id, *_ in definitions:
            observations = observations_by_incident[incident_id]
            report = self._pipeline.build_report(incident_id, observations[2], observations, session_event="Austrian Grand Prix", session_year=2026, session_type="QUALIFYING", track_name="Red Bull Ring")
            incidents.append({
                "incident_id": incident_id,
                "track_id": observations[2].detection.track_id,
                "timestamp_s": observations[2].detection.timestamp_s,
                "frame_index": observations[2].detection.frame_index,
                "state": report["state"],
                "trust_score": report["trust"]["score"],
                "review_required": report["review_required"],
                "priority": report["trust"]["score"],
                "report": report,
            })
        return {"job_id": f"JOB-{uuid4().hex[:8].upper()}", "status": "COMPLETED", "provider": "DEVELOPMENT_MOCK", "video": {"filename": Path(filename).name, "duration_s": duration_s, "fps": fps}, "incidents": incidents}

    @staticmethod
    def _observation(track_id: int, timestamp: float, frame_index: int, states: list[ContactState], context_flags: tuple[str, ...], stable: bool) -> StandardizedObservation:
        regions = tuple(ContactRegion(name=name, point=Point(float(index), float(index)), state=state, observability=0.4 if state == ContactState.UNKNOWN else 1.0, method=ContactMethod.BBOX_PROXY, reliability=0.4 if state == ContactState.UNKNOWN else 1.0) for index, (name, state) in enumerate(zip(("front_left", "front_right", "rear_left", "rear_right"), states)))
        record = {"frame_index": frame_index, "timestamp_s": timestamp, "track_id": track_id, "bbox": (0.0, 0.0, 100.0, 100.0), "confidence": 0.95 if stable else 0.65}
        return adapt_perception_record(record, regions, context_flags=context_flags, reliability={"tracking": 1.0 if stable else 0.5})
