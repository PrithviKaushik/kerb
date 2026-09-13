from fastapi import APIRouter, HTTPException, Query

from backend.api.schemas.incidents import IncidentDetailResponse, IncidentListResponse
from backend.reports.repository import repository

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("", response_model=IncidentListResponse)
def list_incidents(state: str | None = Query(None), session: str | None = Query(None), track_id: int | None = Query(None), review_status: str | None = Query(None)):
    items = []
    for report in repository.list():
        if state and report["state"] != state: continue
        if session and report["session"].get("session_type") != session: continue
        if track_id and report["vehicle"].get("track_id") != track_id: continue
        if review_status and report["review"].get("status") != review_status: continue
        items.append({"incident_id": report["incident_id"], "session": report["session"], "track_id": report["vehicle"]["track_id"], "timestamp_s": report["event"]["timestamp_s"], "frame_index": report["event"]["frame_index"], "state": report["state"], "trust_score": report["trust"]["score"], "priority": report["trust"]["score"], "review_required": report["review_required"], "review_status": report["review"]["status"]})
    return {"items": items, "total": len(items)}


@router.get("/{incident_id}", response_model=IncidentDetailResponse)
def get_incident(incident_id: str):
    report = repository.get_by_incident(incident_id)
    if not report: raise HTTPException(status_code=404, detail="Incident not found")
    return {"incident_id": incident_id, "report_id": report["report_id"], "session": report["session"], "event": report["event"], "vehicle": report["vehicle"], "ai_assessment": {"state": report["state"], "trust_score": report["trust"]["score"]}, "contact_regions": [{"name": name, "state": state} for name, state in report["geometry"]["contact_regions"].items()], "boundary": {"tolerance_px": report["geometry"]["boundary_tolerance_px"], "four_outside": report["geometry"]["four_outside"]}, "temporal": report["temporal"], "trust": report["trust"], "evidence_frames": report["evidence"]["frames"], "reasons": [report["summary"]["reason"]], "context_flags": report["context"]["flags"], "rules_applied": report["rules"], "review": report["review"]}
