from pydantic import BaseModel, Field


class AnalysisIncident(BaseModel):
    incident_id: str
    track_id: int
    timestamp_s: float
    frame_index: int
    state: str
    trust_score: int = Field(ge=0, le=100)
    review_required: bool


class AnalysisVideo(BaseModel):
    filename: str
    duration_s: float | None = None
    fps: float | None = None


class AnalysisResponse(BaseModel):
    job_id: str
    status: str
    provider: str
    video: AnalysisVideo
    incidents: list[AnalysisIncident]
