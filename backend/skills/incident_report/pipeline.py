from __future__ import annotations

from dataclasses import asdict
from typing import Iterable

from backend.knowledge import create_default_registry

from .evidence.builder import EvidencePackageBuilder
from .evidence.models import EvidenceEvent, EvidenceFrame, EvidenceSession, EvidenceTrack, EvidenceVehicle
from .geometry.rules import evaluate_four_outside
from .models import TemporalResult
from .perception_adapter import StandardizedObservation
from .report.builder import IncidentReportBuilder
from .temporal.search import TemporalEvidenceSearcher
from .trust.score import TrustScorer, build_trust_input


class IncidentIntelligencePipeline:
    """Orchestrates domain modules after perception has produced observations."""

    def __init__(self) -> None:
        self._rules = create_default_registry()
        self._temporal_searcher = TemporalEvidenceSearcher()
        self._trust_scorer = TrustScorer()
        self._evidence_builder = EvidencePackageBuilder()
        self._report_builder = IncidentReportBuilder()

    def build_report(
        self,
        incident_id: str,
        observation: StandardizedObservation,
        observations: Iterable[StandardizedObservation],
        *,
        session_event: str = "Development Session",
        session_year: int = 2026,
        session_type: str = "UNKNOWN",
        track_name: str = "Unknown Track",
        video_available: bool = False,
    ) -> dict:
        _, state = evaluate_four_outside(observation.contact_regions)
        temporal_input = [
            {
                "track_id": item.detection.track_id,
                "timestamp_s": item.detection.timestamp_s,
                "frame_index": item.detection.frame_index,
                "four_outside": evaluate_four_outside(item.contact_regions)[0],
            }
            for item in observations
            if item.detection.track_id == observation.detection.track_id
        ]
        temporal = self._temporal_searcher.search(observation.detection.track_id, observation.detection.timestamp_s, temporal_input)
        temporal_result = TemporalResult(temporal.eligible_frames, temporal.supporting_frames, 5, 3, temporal.temporal_support)
        stable_tracking = self._stable_tracking(observation, temporal_input)
        geometric_margin = all(region.state.value == "OUTSIDE" and region.reliability >= 0.8 for region in observation.contact_regions)
        trust = self._trust_scorer.calculate(build_trust_input(observation.contact_regions, temporal_result, stable_tracking, geometric_margin))
        rule_ids = self._applied_rules(observation, state.value, temporal.temporal_support)
        package = self._evidence_builder.build(
            incident_id=incident_id,
            event=EvidenceEvent(observation.detection.timestamp_s, observation.detection.frame_index),
            session=EvidenceSession(session_event, session_year, session_type),
            track=EvidenceTrack(track_name),
            vehicle=EvidenceVehicle(observation.detection.track_id),
            state=state,
            review_required=True,
            contact_regions=observation.contact_regions,
            four_outside=evaluate_four_outside(observation.contact_regions)[0],
            temporal=temporal_result,
            temporal_frames=tuple(EvidenceFrame(frame.frame_index, frame.timestamp_s, "event" if frame.is_event else "context") for frame in temporal.frames),
            trust=trust,
            video_available=video_available,
            applied_rules=rule_ids,
            context_flags=observation.context_flags,
            reason="Evidence assembled from standardized perception output; steward review required.",
        )
        report = asdict(self._report_builder.build(package))
        report["rules"] = list(report["rules"])
        return report

    @staticmethod
    def _stable_tracking(observation: StandardizedObservation, records: list[dict]) -> bool:
        return sum(item["track_id"] == observation.detection.track_id for item in records) >= 3

    def _applied_rules(self, observation: StandardizedObservation, state: str, temporal_support: bool) -> tuple[str, ...]:
        ids = ["CT-001", "BD-001", "TL-001" if state == "VIOLATION_CANDIDATE" else "BD-001"]
        if temporal_support:
            ids.append("TM-001")
        if any(region.state.value == "UNKNOWN" for region in observation.contact_regions):
            ids.append("UN-001")
        if observation.context_flags:
            ids.append("TL-002")
        ids.append("EV-001")
        return tuple(dict.fromkeys(rule_id for rule_id in ids if self._rules.get(rule_id)))
