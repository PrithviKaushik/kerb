from fastapi import APIRouter, HTTPException

from backend.api.schemas.reports import ReportDetailResponse, ReportsListResponse, ReviewRequest
from backend.reports.repository import repository

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("", response_model=ReportsListResponse)
def list_reports():
    reports = repository.list()
    items = [{"report_id": report["report_id"], "incident_id": report["incident_id"], "session": report["session"], "track_id": report["vehicle"]["track_id"], "timestamp_s": report["event"]["timestamp_s"], "ai_state": report["state"], "trust_score": report["trust"]["score"], "review_status": report["review"]["status"], "steward_decision": report["review"]["decision"]} for report in reports]
    return {"items": items, "total": len(items)}


@router.get("/{report_id}", response_model=ReportDetailResponse)
def get_report(report_id: str):
    report = repository.get(report_id)
    if not report: raise HTTPException(status_code=404, detail="Report not found")
    return {"report_id": report_id, "incident_id": report["incident_id"], "session": report["session"], "event": report["event"], "vehicle": report["vehicle"], "ai_assessment": {"state": report["state"], "trust_score": report["trust"]["score"]}, "evidence": report["evidence"], "temporal": report["temporal"], "trust": report["trust"], "rules_applied": report["rules"], "review": report["review"]}


@router.post("/{report_id}/review", response_model=ReportDetailResponse)
def review_report(report_id: str, request: ReviewRequest):
    if not repository.get(report_id): raise HTTPException(status_code=404, detail="Report not found")
    report = repository.update_review(report_id, request.model_dump())
    return get_report(report["report_id"])
