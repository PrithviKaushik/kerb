from __future__ import annotations

import json

from ..evidence.builder import EvidencePackageBuilder
from ..evidence.models import (
    EvidenceEvent,
    EvidenceFrame,
    EvidenceSession,
    EvidenceTrack,
    EvidenceVehicle,
)
from ..evidence.serializer import serialize_evidence_package

from ..models import (
    ContactMethod,
    ContactRegion,
    ContactState,
    IncidentState,
    Point,
    TemporalResult,
    TrustBand,
    TrustResult,
)

from .builder import IncidentReportBuilder
from .serializer import serialize_incident_report


def main() -> None:

    # ----------------------------------------
    # CONTACT GEOMETRY
    # ----------------------------------------

    contact_regions = (
        ContactRegion(
            name="front_left",
            point=Point(780, 675),
            state=ContactState.OUTSIDE,
            observability=1.0,
            method=ContactMethod.BBOX_PROXY,
            reliability=0.95,
        ),
        ContactRegion(
            name="front_right",
            point=Point(850, 675),
            state=ContactState.OUTSIDE,
            observability=1.0,
            method=ContactMethod.BBOX_PROXY,
            reliability=0.95,
        ),
        ContactRegion(
            name="rear_left",
            point=Point(790, 678),
            state=ContactState.OUTSIDE,
            observability=1.0,
            method=ContactMethod.BBOX_PROXY,
            reliability=0.95,
        ),
        ContactRegion(
            name="rear_right",
            point=Point(860, 678),
            state=ContactState.OUTSIDE,
            observability=1.0,
            method=ContactMethod.BBOX_PROXY,
            reliability=0.95,
        ),
    )

    # ----------------------------------------
    # TEMPORAL
    # ----------------------------------------

    temporal = TemporalResult(
        eligible_frames=5,
        outside_frames=3,
        window_size=5,
        required=3,
        satisfied=True,
    )

    # ----------------------------------------
    # TRUST
    # ----------------------------------------

    trust = TrustResult(
        score=100,
        band=TrustBand.HIGH,
        stable_tracking=True,
        clear_boundary=True,
        contact_visibility=True,
        geometric_margin=True,
        temporal_support=True,
        breakdown={
            "base": 50,
            "stable_tracking": 15,
            "clear_boundary": 10,
            "contact_visibility": 10,
            "geometric_margin": 10,
            "temporal_support": 5,
        },
    )

    # ----------------------------------------
    # EVIDENCE FRAMES
    # ----------------------------------------

    frames = (
        EvidenceFrame(
            frame_index=4211,
            timestamp_s=84.22,
            role="PRE_EVENT",
        ),
        EvidenceFrame(
            frame_index=4216,
            timestamp_s=84.32,
            role="EVENT",
        ),
        EvidenceFrame(
            frame_index=4221,
            timestamp_s=84.42,
            role="POST_EVENT",
        ),
    )

    # ----------------------------------------
    # BUILD EVIDENCE PACKAGE
    # ----------------------------------------

    evidence_builder = EvidencePackageBuilder()

    evidence_package = evidence_builder.build(

        incident_id="INC-0016",

        event=EvidenceEvent(
            timestamp_s=84.32,
            frame_index=4216,
        ),

        session=EvidenceSession(
            event="Austrian Grand Prix",
            year=2023,
            session_type="QUALIFYING",
        ),

        track=EvidenceTrack(
            name="Red Bull Ring",
            lap=12,
        ),

        vehicle=EvidenceVehicle(
            track_id=16,
        ),

        state=IncidentState.VIOLATION_CANDIDATE,
        review_required=True,

        contact_regions=contact_regions,
        four_outside=True,

        temporal=temporal,
        temporal_frames=frames,

        trust=trust,

        video_available=True,
        video_source="race_session.mp4",

        applied_rules=(
            "TL-001",
            "BD-001",
            "CT-001",
            "TM-001",
            "EV-001",
        ),

        reason=(
            "All four contact regions were classified as "
            "outside the legal track boundary with temporal "
            "support across the evaluation window."
        ),
    )

    # ----------------------------------------
    # BUILD INCIDENT REPORT
    # ----------------------------------------

    report_builder = IncidentReportBuilder()

    report = report_builder.build(
        evidence_package
    )

    # ----------------------------------------
    # SERIALIZE FOR FRONTEND / API
    # ----------------------------------------

    output = serialize_incident_report(report)

    print("\n")
    print("=" * 60)
    print("KERB INCIDENT REPORT")
    print("=" * 60)
    print()

    print(
        json.dumps(
            output,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()