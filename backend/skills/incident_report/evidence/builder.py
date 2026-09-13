from __future__ import annotations

from ..models import (
    ContactRegion,
    IncidentState,
    TemporalResult,
    TrustResult,
)
from .models import (
    EvidenceEvent,
    EvidenceFrame,
    EvidenceGeometry,
    EvidencePackage,
    EvidenceRules,
    EvidenceSession,
    EvidenceSteward,
    EvidenceTemporal,
    EvidenceTrack,
    EvidenceTrust,
    EvidenceVehicle,
    EvidenceVideo,
)


class EvidencePackageBuilder:

    def build(
        self,
        *,
        incident_id: str,
        event: EvidenceEvent,
        session: EvidenceSession,
        track: EvidenceTrack,
        vehicle: EvidenceVehicle,
        state: IncidentState,
        review_required: bool,
        contact_regions: tuple[ContactRegion, ...],
        four_outside: bool | None,
        temporal: TemporalResult,
        temporal_frames: tuple[EvidenceFrame, ...],
        trust: TrustResult,
        video_available: bool = True,
        video_source: str | None = None,
        applied_rules: tuple[str, ...] = (),
        context_flags: tuple[str, ...] = (),
        reason: str | None = None,
        boundary_tolerance_px: float = 2.0,
    ) -> EvidencePackage:

        contact_states = {
            region.name: region.state.value
            for region in contact_regions
        }

        return EvidencePackage(
            incident_id=incident_id,

            session=session,
            track=track,
            vehicle=vehicle,
            event=event,

            state=state.value,
            review_required=review_required,

            geometry=EvidenceGeometry(
                contact_regions=contact_states,
                four_outside=four_outside,
                boundary_tolerance_px=boundary_tolerance_px,
            ),

            temporal=EvidenceTemporal(
                mode="SINGLE_VIEW",
                window_start_s=event.timestamp_s - 0.20,
                window_end_s=event.timestamp_s + 0.20,
                eligible_frames=temporal.eligible_frames,
                supporting_frames=temporal.outside_frames,
                temporal_support=temporal.satisfied,
            ),

            trust=EvidenceTrust(
                score=trust.score,
                band=trust.band.value,
                breakdown=trust.breakdown,
            ),

            frames=temporal_frames,

            video=EvidenceVideo(
                available=video_available,
                source=video_source,
            ),

            rules=EvidenceRules(
                applied=applied_rules,
            ),

            steward=EvidenceSteward(
                status="PENDING_REVIEW",
                decision=None,
            ),

            context_flags=context_flags,
            reason=reason,
        )