from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass(frozen=True)
class ReportSummary:
    title: str
    reason: str


@dataclass(frozen=True)
class ReportContext:
    flags: tuple[str, ...] = ()
    requires_contextual_review: bool = False


@dataclass(frozen=True)
class StewardReview:
    status: str = "PENDING_REVIEW"
    decision: Optional[str] = None


@dataclass(frozen=True)
class IncidentReport:
    incident_id: str

    state: str
    review_required: bool

    session: dict
    vehicle: dict
    event: dict

    summary: ReportSummary

    geometry: dict
    temporal: dict
    trust: dict

    rules: tuple[str, ...]

    evidence: dict

    context: ReportContext = field(
        default_factory=ReportContext
    )

    steward: StewardReview = field(
        default_factory=StewardReview
    )