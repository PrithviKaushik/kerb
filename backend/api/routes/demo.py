"""Live A5 pipeline demo endpoints.

Exposes the recorded A5 clip through every skill in its current order:

  extraction (keyframes) -> perception (YOLO+ByteTrack records + video)
  -> geometry (footprint/boundary relation) -> surface (calibrated spatial
  classifier) -> incident intelligence (four-outside/temporal/trust/evidence)
  -> steward review.

Everything served here comes from the real A5 artifacts under data/audit/*;
nothing is synthesized at request time except the cheap geometry pass.
"""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from backend.api.providers.real import (
    A5_SPATIAL,
    A5_TRACKS,
    A5_VIDEO,
    RealA5AnalysisProvider,
)
from backend.reports.repository import repository
from backend.skills.geometry.geometry import (
    BoundaryConfig,
    GeometryConfig,
    process_records,
)
from backend.skills.surface.manual_boundary import (
    interpolate_polyline,
    load_manual_boundary,
)

_REPO_ROOT = Path(__file__).resolve().parents[3]

TRACKING_VIDEO = _REPO_ROOT / "data/audit/perception_tracking/a5_adapt/a5_bytetrack.mp4"
TRACKING_METRICS = _REPO_ROOT / "data/audit/perception_tracking/a5_adapt/a5_tracks_metrics.json"
SURFACE_DIR = _REPO_ROOT / "data/audit/surface/a5_manual"
KEYFRAMES_DIR = _REPO_ROOT / "data/audit/surface/a5_manual_keyframes"
BOUNDARY_JSON = _REPO_ROOT / "data/audit/surface/a5_manual_boundary.json"
GEOMETRY_CONFIG = _REPO_ROOT / "backend/skills/geometry/config/a5_demo_boundary.json"

INCIDENT_ID = "A5-KERB-0001"

router = APIRouter(prefix="/api/demo", tags=["Demo"])

_provider = RealA5AnalysisProvider()


def _read_json(path: Path) -> dict:
    if not path.is_file():
        raise HTTPException(status_code=404, detail=f"Artifact not found: {path.name}")
    return json.loads(path.read_text())


def _read_jsonl(path: Path, limit: int = 5000) -> list[dict]:
    if not path.is_file():
        raise HTTPException(status_code=404, detail=f"Artifact not found: {path.name}")
    rows = [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
    return rows[:limit]


def _tracks_raw() -> list[dict]:
    return _read_jsonl(A5_TRACKS)


def _ensure_incident() -> dict:
    """Run the real A5 pipeline once, storing the report in the repository."""
    result = _provider.analyze(A5_VIDEO.name, None, None)
    report = result["incidents"][0].pop("report")
    repository.create(
        {
            "report_id": f"KERB-{INCIDENT_ID.split('-')[-1]}",
            "incident_id": INCIDENT_ID,
            **report,
            "review": {
                "status": "PENDING_REVIEW",
                "decision": None,
                "reason": None,
                "notes": None,
                "reviewer": None,
                "reviewed_at": None,
            },
        }
    )
    return result


@router.get("/state")
def demo_state() -> dict:
    """One-shot overview of every pipeline stage and its real artifacts."""
    metrics = _read_json(SURFACE_DIR / "a5_manual_metrics.json") if (SURFACE_DIR / "a5_manual_metrics.json").is_file() else {}
    tracking_metrics = _read_json(TRACKING_METRICS) if TRACKING_METRICS.is_file() else {}
    tracks = _tracks_raw()
    spatial = _read_jsonl(A5_SPATIAL)
    boundary = _read_json(BOUNDARY_JSON) if BOUNDARY_JSON.is_file() else {}

    incident = repository.get_by_incident(INCIDENT_ID)
    if incident is None:
        _ensure_incident()
        incident = repository.get_by_incident(INCIDENT_ID)

    framenames = sorted(p.name for p in KEYFRAMES_DIR.glob("*.png")) if KEYFRAMES_DIR.is_dir() else []

    from collections import Counter

    spatial_counts = Counter(rec.get("spatial_state") for rec in spatial)
    track_ids = sorted({rec["track_id"] for rec in tracks})
    video_uri = "/api/demo/perception/video" if TRACKING_VIDEO.is_file() else None
    surface_uri = "/api/demo/surface/video" if (SURFACE_DIR / "a5_manual_visualization.mp4").is_file() else None

    return {
        "video": {"name": "a5.mp4", "exists": A5_VIDEO.is_file(), "frames": metrics.get("video_frames")},
        "stages": [
            {"id": "extraction", "name": "Frame Extraction", "skill": "backend.skills.video.frame_extraction", "artifacts": [{"ke": "keyframes", "count": len(framenames), "urls": [f"/api/demo/frames/{n}" for n in framenames]}]},
            {"id": "perception", "name": "YOLO + ByteTrack", "skill": "backend.skills.perception.tracking", "artifacts": [{"kind": "records", "count": len(tracks), "url": "/api/demo/tracks"}, {"kind": "video", "url": video_uri}, {"kind": "metrics", "data": tracking_metrics}]},
            {"id": "geometry", "name": "Vehicle Geometry", "skill": "backend.skills.geometry.geometry", "artifacts": [{"kind": "relation", "url": "/api/demo/geometry"}]},
            {"id": "surface", "name": "Surface + Boundary", "skill": "backend.skills.surface", "artifacts": [{"kind": "spatial", "count": len(spatial), "url": "/api/demo/spatial"}, {"kind": "video", "url": surface_uri}, {"kind": "metrics", "data": metrics}]},
            {"id": "incident", "name": "Incident Intelligence", "skill": "backend.skills.incident_report", "artifacts": [{"kind": "incident", "url": "/api/demo/incident"}]},
        ],
        "track_ids": track_ids,
        "spatial_state_counts": dict(spatial_counts),
        "boundary": {"keyframes": [k["frame_index"] for k in boundary.get("keyframes", [])], "legal_side": boundary.get("legal_side")} if boundary else None,
        "incident": incident,
    }


@router.get("/geometry")
def demo_geometry() -> dict:
    """Live geometry-skill pass: footprint + boundary relation on real A5 tracks.

    Uses the uniformly interpolated calibrated white-line polyline (frame 70,
    a keyframe) as the boundary, so geometry consumes the same man-calibrated
    line as the surface stage.
    """
    geometry_file = _read_json(GEOMETRY_CONFIG)
    geometry_config = GeometryConfig(
        **geometry_file["geometry"],
        fixed_camera_horizontal_fallback=bool(
            geometry_file.get("fixed_camera_horizontal_fallback", True)
        ),
    )
    boundary_source = load_manual_boundary(BOUNDARY_JSON)
    poly = interpolate_polyline(boundary_source, 70)
    geometry_boundary = BoundaryConfig(
        boundary_type="polyline",
        points=tuple(poly),
        note="interpolated from data/audit/surface/a5_manual_boundary.json (manual white-line calibration)",
        inside_side="left_of_direction" if boundary_source.legal_side == "left" else "right_of_direction",
    )
    records = process_records(_tracks_raw(), geometry_config, geometry_boundary)
    from collections import Counter

    return {
        "records": len(records),
        "uncertain_geometry": sum(1 for rec in records if rec["geometry_status"] == "UNCERTAIN"),
        "spatial_states": dict(Counter(rec["spatial_state"] for rec in records)),
        "geometry_modes": dict(Counter(rec["geometry_mode"] for rec in records)),
        "boundary": {
            "type": geometry_boundary.boundary_type,
            "points": len(geometry_boundary.points),
            "inside_side": geometry_boundary.inside_side,
            "note": geometry_boundary.note,
        },
        "sample": records[100] if len(records) > 100 else (records[0] if records else None),
    }


@router.get("/tracks")
def demo_tracks() -> list[dict]:
    return _tracks_raw()


@router.get("/spatial")
def demo_spatial() -> list[dict]:
    return _read_jsonl(A5_SPATIAL)


@router.get("/boundary")
def demo_boundary() -> dict:
    return _read_json(BOUNDARY_JSON)


@router.get("/run")
def demo_run() -> dict:
    """Explicitly run the real A5 incident pipeline and persist the report."""
    return _ensure_incident()


@router.get("/incident")
def demo_incident() -> dict:
    incident = repository.get_by_incident(INCIDENT_ID)
    if incident is None:
        _ensure_incident()
        incident = repository.get_by_incident(INCIDENT_ID)
    if incident is None:
        raise HTTPException(status_code=404, detail="A5 incident not found")
    return incident


@router.get("/perception/video")
def demo_perception_video() -> FileResponse:
    if not TRACKING_VIDEO.is_file():
        raise HTTPException(status_code=404, detail="Tracking video not found")
    return FileResponse(TRACKING_VIDEO, media_type="video/mp4")


@router.get("/surface/video")
def demo_surface_video() -> FileResponse:
    video = SURFACE_DIR / "a5_manual_visualization.mp4"
    if not video.is_file():
        raise HTTPException(status_code=404, detail="Surface visualization not found")
    return FileResponse(video, media_type="video/mp4")


@router.get("/frames/{name}")
def demo_frame(name: str) -> FileResponse:
    safe = Path(name).name
    path = KEYFRAMES_DIR / safe
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Keyframe not found")
    return FileResponse(path, media_type="image/png")