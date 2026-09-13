from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass(frozen=True)
class EvidenceFrame:
    frame_index: int
    timestamp_s: float
    role: str


@dataclass(frozen=True)
class EvidenceVideo:
    available: bool
    source: Optional[str] = None


@dataclass(frozen=True)
class EvidenceSession:
    event: str
    year: int
    session_type: str


@dataclass(frozen=True)
class EvidenceTrack:
    name: str
    lap: Optional[int] = None


@dataclass(frozen=True)
class EvidenceVehicle:
    track_id: int


@dataclass(frozen=True)
class EvidenceEvent:
    timestamp_s: float
    frame_index: int


@dataclass(frozen=True)
class EvidenceGeometry:
    contact_regions: dict[str, str]
    four_outside: Optional[bool]
    boundary_tolerance_px: float


@dataclass(frozen=True)
class EvidenceTemporal:
    mode: str
    window_start_s: float
    window_end_s: float
    eligible_frames: int
    supporting_frames: int
    temporal_support: bool


@dataclass(frozen=True)
class EvidenceTrust:
    score: int
    band: str
    breakdown: dict[str, int]


@dataclass(frozen=True)
class EvidenceRules:
    applied: tuple[str, ...] = ()


@dataclass(frozen=True)
class EvidenceSteward:
    status: str = "PENDING_REVIEW"
    decision: Optional[str] = None


@dataclass(frozen=True)
class EvidencePackage:
    incident_id: str

    session: EvidenceSession
    track: EvidenceTrack
    vehicle: EvidenceVehicle
    event: EvidenceEvent

    state: str
    review_required: bool

    geometry: EvidenceGeometry
    temporal: EvidenceTemporal
    trust: EvidenceTrust

    frames: tuple[EvidenceFrame, ...] = ()
    video: EvidenceVideo = field(
        default_factory=lambda: EvidenceVideo(available=False)
    )

    rules: EvidenceRules = field(
        default_factory=EvidenceRules
    )

    steward: EvidenceSteward = field(
        default_factory=EvidenceSteward
    )

    context_flags: tuple[str, ...] = ()
    reason: Optional[str] = None