from typing import Any, Literal

from pydantic import BaseModel, Field


class ReviewRequest(BaseModel):
    decision: Literal["TRACK_LIMIT_EXCEEDED", "TRACK_LIMIT_NOT_EXCEEDED"]
    reason: str | None = None
    notes: str = ""
    reviewer: str = Field(min_length=1)


class ReportsListResponse(BaseModel):
    items: list[dict[str, Any]]
    total: int


class ReportDetailResponse(BaseModel):
    report_id: str
    incident_id: str
    session: dict[str, Any]
    event: dict[str, Any]
    vehicle: dict[str, Any]
    ai_assessment: dict[str, Any]
    evidence: dict[str, Any]
    temporal: dict[str, Any]
    trust: dict[str, Any]
    rules_applied: list[str]
    review: dict[str, Any]
