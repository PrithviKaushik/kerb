from typing import Any

from pydantic import BaseModel


class IncidentListResponse(BaseModel):
    items: list[dict[str, Any]]
    total: int


class IncidentDetailResponse(BaseModel):
    incident_id: str
    report_id: str
    session: dict[str, Any]
    event: dict[str, Any]
    vehicle: dict[str, Any]
    ai_assessment: dict[str, Any]
    contact_regions: list[dict[str, Any]]
    boundary: dict[str, Any]
    temporal: dict[str, Any]
    trust: dict[str, Any]
    evidence_frames: list[dict[str, Any]]
    reasons: list[str]
    context_flags: list[str]
    rules_applied: list[str]
    review: dict[str, Any]
