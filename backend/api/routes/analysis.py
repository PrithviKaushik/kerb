from pathlib import Path
import shutil
import tempfile

from fastapi import APIRouter, File, UploadFile

from backend.api.providers.development import DevelopmentAnalysisProvider
from backend.skills.video.frame_extraction import probe_video
from backend.reports.repository import repository

router = APIRouter(prefix="/api/analysis", tags=["Analysis"])
provider = DevelopmentAnalysisProvider()


@router.post("", response_model=dict)
async def run_analysis(file: UploadFile = File(...)):
    suffix = Path(file.filename or "video.mp4").suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp_path = Path(temp.name)
        shutil.copyfileobj(file.file, temp)
    try:
        metadata = probe_video(temp_path)
        result = provider.analyze(file.filename or "video.mp4", metadata.duration_seconds, metadata.fps)
        for incident in result["incidents"]:
            report = incident.pop("report")
            repository.create({"report_id": f"KERB-{incident['incident_id'].split('-')[-1]}", "incident_id": incident["incident_id"], **report, "review": {"status": "PENDING_REVIEW", "decision": None, "reason": None, "notes": None, "reviewer": None, "reviewed_at": None}})
        return result
    finally:
        temp_path.unlink(missing_ok=True)
