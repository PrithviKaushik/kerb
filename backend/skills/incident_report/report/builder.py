from __future__ import annotations

from ..evidence.models import EvidencePackage
from .models import (
    IncidentReport,
    ReportContext,
    ReportSummary,
    StewardReview,
)


class IncidentReportBuilder:

    def build(
        self,
        package: EvidencePackage,
    ) -> IncidentReport:

        return IncidentReport(
            incident_id=package.incident_id,

            state=package.state,
            review_required=package.review_required,

            session={
                "event": package.session.event,
                "year": package.session.year,
                "session_type": package.session.session_type,
            },

            vehicle={
                "track_id": package.vehicle.track_id,
            },

            event={
                "frame_index": package.event.frame_index,
                "timestamp_s": package.event.timestamp_s,
            },

            summary=ReportSummary(
                title=self._build_title(package),
                reason=package.reason
                or "Evidence package requires steward review.",
            ),

            geometry={
                "contact_regions": package.geometry.contact_regions,
                "four_outside": package.geometry.four_outside,
                "boundary_tolerance_px": (
                    package.geometry.boundary_tolerance_px
                ),
            },

            temporal={
                "mode": package.temporal.mode,
                "window_start_s": package.temporal.window_start_s,
                "window_end_s": package.temporal.window_end_s,
                "eligible_frames": package.temporal.eligible_frames,
                "supporting_frames": package.temporal.supporting_frames,
                "temporal_support": package.temporal.temporal_support,
            },

            trust={
                "score": package.trust.score,
                "band": package.trust.band,
                "breakdown": package.trust.breakdown,
            },

            rules=package.rules.applied,

            evidence={
                "frames": [
                    {
                        "frame_index": frame.frame_index,
                        "timestamp_s": frame.timestamp_s,
                        "role": frame.role,
                    }
                    for frame in package.frames
                ],
                "video": {
                    "available": package.video.available,
                    "source": package.video.source,
                },
            },

            context=ReportContext(
                flags=package.context_flags,
                requires_contextual_review=(
                    len(package.context_flags) > 0
                ),
            ),

            steward=StewardReview(
                status=package.steward.status,
                decision=package.steward.decision,
            ),
        )

    @staticmethod
    def _build_title(
        package: EvidencePackage,
    ) -> str:

        if package.geometry.four_outside:
            return "Four-outside track-limit candidate"

        if package.state == "UNCERTAIN":
            return "Track-limit incident requiring review"

        return "Track-limit incident candidate"