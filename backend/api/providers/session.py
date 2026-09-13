"""Incident analysis for arbitrary uploaded clips.

Mirror of ``RealA5AnalysisProvider`` for uploads that skip the surface color
stage: geometry (YOLO bbox + manual-boundary signed distance, hand-calibrated
in the browser) is the only spatial evidence. The same four-outside / temporal
/ trust / evidence pipeline runs unchanged, so the report shape is identical to
the A5 demo and the frontend consumes it the same way.

Honesty rule inherited from the sprint contract: when geometry is UNCERTAIN the
synthesized spatial state is UNKNOWN/PoorObservability and no contact region is
ever assumed to sit outside the track.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from backend.api.providers.real import (
    contact_regions_for_frame,
    spatial_state_to_contact,
)
from backend.skills.incident_report.models import ContactState
from backend.skills.incident_report.perception_adapter import (
    StandardizedObservation,
    adapt_perception_record,
)
from backend.skills.incident_report.pipeline import IncidentIntelligencePipeline


def read_geometry(path: str | Path) -> list[dict]:
    rows = [
        json.loads(line)
        for line in Path(path).read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    return sorted(rows, key=lambda item: int(item["frame_index"]))


def geometry_by_frame(geometry: list[dict]) -> dict[int, dict]:
    return {int(rec["frame_index"]): rec for rec in geometry}


def synthesize_spatial(geo: dict[str, Any]) -> dict[str, Any]:
    """Project a geometry record onto the spatial vocabulary the pipeline uses.

    Only three measured things flow through: the geometry spatial_state, the
    geometry certainty, and a binary off-track fraction derived from OUTSIDE.
    Nothing else is invented.
    """
    state = str(geo.get("spatial_state", "UNCERTAIN"))
    uncertain = geo.get("geometry_status") == "UNCERTAIN"
    return {
        "spatial_state": state,
        "off_track_fraction": 1.0 if state == "OUTSIDE" else 0.0,
        "unknown_fraction": 1.0 if uncertain else 0.0,
        "surface_confidence": 0.0 if uncertain else 1.0,
        "surface_state": "UNKNOWN" if uncertain else "LEGAL_TRACK",
    }


def _track_records(path: str | Path) -> list[dict]:
    rows = [
        json.loads(line)
        for line in Path(path).read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]
    return [
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
        for rec in rows
    ]


def _direction_dx(tracks: list[dict], index: int) -> float:
    """Image-horizontal displacement component between consecutive detections.

    Mirrors the A5 bridge: horizontal when |dx| >= |dy|, otherwise treated as
    vertical (0.0) which flips the front/rear proxy axis.
    """
    if index == 0:
        return 1.0
    previous = tracks[index - 1]["bbox"]
    current = tracks[index]["bbox"]
    dx = current[0] - previous[0]
    dy = current[1] - previous[1]
    return dx if abs(dx) >= abs(dy) else 0.0


def build_observations(
    tracks_path: str | Path,
    geometry_path: str | Path,
) -> list[StandardizedObservation]:
    """One standardized observation per tracked frame, sorted by time."""
    tracks = _track_records(tracks_path)
    by_frame = geometry_by_frame(read_geometry(geometry_path))

    observations = []
    for index, rec in enumerate(tracks):
        geo = by_frame.get(rec["frame_index"])
        if geo is None:
            geo = {"frame_index": rec["frame_index"], "spatial_state": "UNCERTAIN", "geometry_status": "UNCERTAIN"}
        spatial = synthesize_spatial(geo)
        contact_regions = contact_regions_for_frame(
            rec["bbox"], spatial, _direction_dx(tracks, index)
        )
        context_flags = (
            ("POOR_OBSERVABILITY",)
            if spatial["surface_state"] == "UNKNOWN"
            else ()
        )
        observations.append(
            adapt_perception_record(
                rec,
                contact_regions,
                context_flags=context_flags,
                reliability={"tracking": float(spatial["surface_confidence"])},
                geometry_method="BBOX_PROXY",
            )
        )
    return observations


def peak_observation(
    tracks_path: str | Path,
    geometry_path: str | Path,
    observations: list[StandardizedObservation],
) -> StandardizedObservation:
    """Event frame = the OUTSIDE frame with the most measured off-track margin.

    Falls back to the widest-margin frame when nothing is OUTSIDE so the
    pipeline still produces an honest NO_VIOLATION / UNCERTAIN report.
    """
    by_frame = geometry_by_frame(read_geometry(geometry_path))

    def margin(obs: StandardizedObservation) -> float:
        relation = by_frame.get(obs.detection.frame_index, {}).get("boundary_relation")
        if not relation:
            return 0.0
        return float(relation.get("signed_distances_min", 0.0))

    outside = [
        obs
        for obs in observations
        if spatial_state_to_contact(
            str(by_frame.get(obs.detection.frame_index, {}).get("spatial_state", "UNCERTAIN"))
        )
        == ContactState.OUTSIDE
    ]
    pool = outside or list(observations)
    return max(pool, key=margin)


class SessionAnalysisProvider:
    """Runs the incident-intelligence pipeline on an uploaded clip's artifacts."""

    def __init__(self, tracks_path: str | Path, geometry_path: str | Path) -> None:
        self._tracks = tracks_path
        self._geometry = geometry_path
        self._pipeline = IncidentIntelligencePipeline()

    def observe(self) -> list[StandardizedObservation]:
        return build_observations(self._tracks, self._geometry)

    def analyze(
        self,
        incident_id: str,
        report_id: str,
        filename: str,
        duration_s: float | None,
        fps: float | None,
        track_name: str,
    ) -> dict[str, Any]:
        observations = self.observe()
        if not observations:
            raise RuntimeError("No tracking records for this clip")
        peak = peak_observation(self._tracks, self._geometry, observations)
        report = self._pipeline.build_report(
            incident_id,
            peak,
            observations,
            session_event="Uploaded Session Analysis",
            session_year=2026,
            session_type="USER_UPLOAD",
            track_name=track_name,
            video_available=True,
        )
        incident = {
            "incident_id": incident_id,
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
            "job_id": f"SESSION-{incident_id}",
            "status": "COMPLETED",
            "provider": "SESSION_UPLOAD_GEOMETRY",
            "video": {"filename": filename, "duration_s": duration_s, "fps": fps},
            "incidents": [incident],
        }