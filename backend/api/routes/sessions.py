"""Uploaded-session endpoints: any clip through the real pipeline.

Four orthogonal actions drive a session:

  POST /api/sessions                  save + probe an upload, extract keyframes
  POST /api/sessions/{id}/track       background YOLO + ByteTrack job
  POST /api/sessions/{id}/boundary    manual in-browser polyline calibration
  POST /api/sessions/{id}/run         geometry + incident intelligence

The surface color stage is intentionally absent for uploads (approved scope):
geometry on the hand-calibrated boundary is the only spatial evidence, and the
pipeline vocabulary stays NO_VIOLATION / VIOLATION_CANDIDATE / UNCERTAIN with
STEWARD REVIEW REQUIRED.
"""

from __future__ import annotations

import json
import subprocess
import time
from collections import Counter
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from backend.api import jobs
from backend.api import sessions as session_store
from backend.api.media import browser_playable, cached_video_uri
from backend.api.providers.session import SessionAnalysisProvider
from backend.api.sessions import (
    UPLOAD_CAP_SECONDS,
    create_session,
    delete_session,
    delete_all_sessions,
    ensure_root,
    list_sessions,
    load_session,
    save_session,
)
from backend.reports.repository import repository
from backend.skills.geometry.geometry import BoundaryConfig, GeometryConfig, process_records
from backend.skills.perception.tracking import track_video
from backend.skills.surface.manual_boundary import (
    interpolate_polyline,
    load_manual_boundary,
)
from backend.skills.surface.run_manual_boundary import run as run_surface_boundary
from backend.skills.video.frame_extraction import extract_frames, probe_video

_REPO_ROOT = Path(__file__).resolve().parents[3]
GEOMETRY_CONFIG = _REPO_ROOT / "backend/skills/geometry/config/a5_demo_boundary.json"
SURFACE_CONFIG = _REPO_ROOT / "backend/skills/surface/config/a5_manual_demo.json"
VIDEO_SUFFIXES = {".mp4", ".mkv", ".mov", ".avi", ".webm"}
MAX_POINTS = 500

router = APIRouter(prefix="/api/sessions", tags=["Sessions"])


class BoundaryPayload(BaseModel):
    points: list[list[float]] | None = Field(default=None, min_length=2, max_length=MAX_POINTS)
    legal_side: Literal["left", "right"]
    frame_index: int | None = None
    keyframes: list[dict] | None = None


def _validate_upload(probe) -> None:
    """Reject uploads with unusable or over-long metadata before they hit disk."""
    if probe.duration_seconds <= 0 or probe.fps <= 0 or probe.width <= 0 or probe.height <= 0:
        raise HTTPException(status_code=422, detail="Video metadata is invalid")
    if probe.duration_seconds > UPLOAD_CAP_SECONDS:
        raise HTTPException(
            status_code=422,
            detail=f"Clip exceeds the {UPLOAD_CAP_SECONDS:.0f}s upload limit ({probe.duration_seconds:.1f}s)",
        )


def _get_meta(session_id: str):
    meta = load_session(session_id)
    if meta is None:
        raise HTTPException(status_code=404, detail="Session not found")
    return meta


def _read_jsonl(path: Path, limit: int = 5000) -> list[dict]:
    if not path.is_file():
        return []
    return [json.loads(line) for line in path.read_text().splitlines() if line.strip()][:limit]


def _issue(meta) -> str:
    return f"KERB-{meta.id.upper()}"


def _report_id(meta) -> str:
    return f"REP-{meta.id.upper()}"


def _extract_keyframes(meta) -> list[Path]:
    """One thumbnail set per second-ish, plus one full-res calibration frame."""
    keyframes_dir = meta.dir / "keyframes"
    if not keyframes_dir.is_dir():
        extract_frames(meta.dir / "source.mp4", keyframes_dir, max_frames=6, preset="balanced")
    calibration = meta.dir / "calibration.png"
    if not calibration.is_file() and meta.duration_s > 0:
        midpoint_s = max(0.1, meta.duration_s / 2.0)
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-loglevel",
                "error",
                "-ss",
                f"{midpoint_s:.3f}",
                "-i",
                str(meta.dir / "source.mp4"),
                "-frames:v",
                "1",
                str(calibration),
            ],
            check=True,
            capture_output=True,
        )
        meta.calibration_frame_index = round(midpoint_s * meta.video_fps)
    return sorted(keyframes_dir.glob("*.png")) if keyframes_dir.is_dir() else []


def _geometry_config() -> GeometryConfig:
    raw = json.loads(GEOMETRY_CONFIG.read_text(encoding="utf-8"))
    return GeometryConfig(
        **raw["geometry"],
        fixed_camera_horizontal_fallback=bool(raw.get("fixed_camera_horizontal_fallback", True)),
    )


def _generate_surface_visualization(meta) -> None:
    """Render the skill-compatible surface evidence after calibration."""
    if not meta.has_tracking or not meta.has_boundary:
        return
    run_surface_boundary(
        meta.dir / "source.mp4",
        meta.dir / "tracks.jsonl",
        meta.dir / "manual_boundary.json",
        SURFACE_CONFIG,
        meta.dir / "surface",
    )
    meta.status["surface"] = "done"
    save_session(meta)


def _session_state_payload(meta) -> dict:
    keyframes = sorted((meta.dir / "keyframes").glob("*.png")) if (meta.dir / "keyframes").is_dir() else []
    tracks_path = meta.dir / "tracks.jsonl"
    tracks_video = meta.dir / "tracks.mp4"
    geometry_path = meta.dir / "geometry.jsonl"
    track_ids: list[int] = []
    record_count = 0
    if tracks_path.is_file():
        tracks = _read_jsonl(tracks_path)
        record_count = len(tracks)
        track_ids = sorted({int(rec["track_id"]) for rec in tracks})
    geometry = _read_jsonl(geometry_path) if geometry_path.is_file() else []
    geometry_counts = dict(Counter(rec.get("spatial_state") for rec in geometry))
    calibration_keyframes = sorted(
        {
            0,
            max(0, round((meta.frame_count - 1) * 0.25)),
            max(0, round((meta.frame_count - 1) * 0.50)),
            max(0, round((meta.frame_count - 1) * 0.75)),
            max(0, meta.frame_count - 1),
        }
    )

    perception_artifacts: list[dict] = []
    if record_count:
        metrics = meta.tracking_metrics or {}
        perception_artifacts = [
            {"kind": "records", "count": record_count, "url": f"/api/sessions/{meta.id}/tracks"},
            {"kind": "video", "url": cached_video_uri(f"/api/sessions/{meta.id}/perception/video", tracks_video)},
            {"kind": "metrics", "data": metrics},
        ]
    elif meta.status.get("perception") == "done":
        perception_artifacts = [
            {"kind": "notice", "text": "done, but the model found no f1_car detections in this clip"},
        ]
    else:
        perception_artifacts = [{"kind": "notice", "text": "perception not run yet"}]

    surface_artifacts = []
    if meta.has_boundary:
        surface_artifacts = [
            {"kind": "calibration", "count": (meta.boundary or {}).get("points", 0)},
            {"kind": "input", "url": f"/api/sessions/{meta.id}/calibrate/frame"},
        ]
        surface_video = meta.dir / "surface" / "a5_manual_visualization.mp4"
        if surface_video.is_file():
            surface_artifacts.append({
                "kind": "video",
                "url": cached_video_uri(f"/api/sessions/{meta.id}/surface/video", surface_video),
            })
    else:
        surface_artifacts = [
            {"kind": "notice", "text": "manual boundary calibration required before analysis"},
        ]

    incident_artifacts = [
        {
            "kind": "incident",
            "url": f"/api/sessions/{meta.id}/incident" if meta.incident else None,
        }
    ]

    job = meta.job or dict(state="idle")
    return {
        "id": meta.id,
        "name": meta.name,
        "kind": "session",
        "video": {"name": meta.source_filename, "exists": True, "frames": meta.frame_count, "fps": meta.video_fps},
        "stages": [
            {"id": "extraction", "name": "Frame Extraction", "skill": "backend.skills.video.frame_extraction", "artifacts": [{"kind": "keyframes", "count": len(keyframes), "urls": [f"/api/sessions/{meta.id}/frames/{p.name}" for p in keyframes]}]},
            {"id": "perception", "name": "YOLO + ByteTrack", "skill": "backend.skills.perception.tracking", "artifacts": perception_artifacts},
            {"id": "geometry", "name": "Vehicle Geometry", "skill": "backend.skills.geometry.geometry", "artifacts": [{"kind": "relation", "url": f"/api/sessions/{meta.id}/geometry"}] if geometry else [{"kind": "notice", "text": "geometry not run yet"}]},
            {"id": "surface", "name": "Manual Calibration", "skill": "backend.skills.surface.manual_boundary", "artifacts": surface_artifacts},
            {"id": "incident", "name": "Incident Intelligence", "skill": "backend.skills.incident_report", "artifacts": incident_artifacts},
        ],
        "track_ids": track_ids,
        "tracking_records": record_count,
        "spatial_state_counts": geometry_counts,
        "boundary": meta.boundary,
        "incident": meta.incident,
        "job": job,
        "model": meta.model,
        "status": dict(meta.status),
        "calibration_frame_index": meta.calibration_frame_index,
        "calibration_keyframes": calibration_keyframes,
    }


@router.post("", status_code=201)
async def create_upload(
    file: UploadFile = File(...),
    name: str | None = Form(None),
) -> dict:
    """Save an uploaded clip and prepare its extraction artifacts."""
    ensure_root()
    suffix = Path(file.filename or "video.mp4").suffix.lower()
    if suffix not in VIDEO_SUFFIXES:
        raise HTTPException(status_code=415, detail=f"Unsupported video container: {suffix}")
    safe_filename = Path(file.filename or "clip").name
    tmp = session_store.SESSIONS_ROOT / f".upload-{time.time_ns()}-{safe_filename}"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    try:
        with tmp.open("wb") as out:
            while chunk := await file.read(1024 * 1024):
                out.write(chunk)
        probe = probe_video(tmp)
        _validate_upload(probe)
        meta = create_session(
            tmp,
            file.filename or "clip",
            width=probe.width,
            height=probe.height,
            fps=probe.fps,
            frame_count=probe.frame_count,
            duration_s=probe.duration_seconds,
            calibration_frame_index=round(probe.duration_seconds * probe.fps / 2),
            name=name,
        )
        _extract_keyframes(meta)
        save_session(meta)
        return _session_state_payload(meta)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=422, detail=f"Could not process upload: {exc}") from exc
    finally:
        tmp.unlink(missing_ok=True)


@router.get("")
def list_uploads() -> list[dict]:
    return [
        {
            "id": meta.id,
            "name": meta.name,
            "created_at": meta.created_at,
            "duration_s": meta.duration_s,
            "status": meta.status,
            "has_incident": meta.incident is not None,
        }
        for meta in list_sessions()
    ]


@router.delete("", status_code=200)
def remove_all_sessions() -> dict[str, int]:
    """Delete all uploaded session artifacts; the built-in demo is untouched."""
    return {"deleted": delete_all_sessions()}


@router.get("/{session_id}")
def session_state(session_id: str) -> dict:
    return _session_state_payload(_get_meta(session_id))


@router.delete("/{session_id}", status_code=204)
def remove_session(session_id: str) -> None:
    delete_session(session_id)


@router.post("/{session_id}/track", status_code=202)
def start_tracking(session_id: str) -> dict:
    meta = _get_meta(session_id)
    model = _REPO_ROOT / "models" / meta.model
    if not model.is_file():
        raise HTTPException(status_code=422, detail=f"Model checkpoint not found: {meta.model}")
    track_video_file = meta.dir / "tracks.mp4"
    tracks_file = meta.dir / "tracks.jsonl"

    def run_tracking() -> dict:
        metrics = track_video(
            meta.dir / "source.mp4",
            model,
            track_video_file,
            tracks_file,
            progress=lambda done, total: jobs.report_progress(
                meta.id, "perception", done / max(int(total), 1), f"frame {done}/{total}"
            ),
        )
        meta.tracking_metrics = {
            "frames_processed": metrics.frames_processed,
            "frames_with_tracks": metrics.frames_with_tracks,
            "total_track_records": metrics.total_track_records,
            "unique_track_ids": metrics.unique_track_ids,
            "processing_duration_seconds": round(metrics.processing_duration_seconds, 2),
            "end_to_end_fps": round(metrics.end_to_end_fps, 2),
            "detector_inference_fps": round(metrics.detector_inference_fps, 2),
            "model": metrics.model,
        }
        meta.status["perception"] = "done"
        save_session(meta)
        return meta.tracking_metrics

    meta.status["perception"] = "running"
    save_session(meta)
    try:
        job = jobs.start_job(session_id, "perception", run_tracking)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"job": job, "session_id": session_id}


@router.get("/{session_id}/job")
def session_job(session_id: str) -> dict:
    job = jobs.job_status(session_id)
    if job is None:
        job = (_get_meta(session_id)).job or {"state": "idle"}
    return job


@router.post("/{session_id}/boundary")
def set_boundary(session_id: str, payload: BoundaryPayload) -> dict:
    meta = _get_meta(session_id)
    if payload.keyframes is not None:
        keyframes = []
        for keyframe in payload.keyframes:
            points = keyframe.get("points")
            if not isinstance(points, list) or len(points) < 2:
                raise HTTPException(status_code=422, detail="Each keyframe needs at least two points")
            keyframes.append({
                "frame_index": int(keyframe["frame_index"]),
                "points": [[float(x), float(y)] for x, y in points],
            })
        frame_index = keyframes[0]["frame_index"]
    else:
        if payload.points is None:
            raise HTTPException(status_code=422, detail="Boundary points are required")
        frame_index = payload.frame_index if payload.frame_index is not None else meta.calibration_frame_index
        keyframes = [{
            "frame_index": int(frame_index),
            "points": [[float(x), float(y)] for x, y in payload.points],
        }]
    boundary_json = {
        "video": meta.source_filename,
        "coordinate_space": "pixel",
        "camera_view": f"session_{meta.id}",
        "zone_id": f"session_{meta.id}_zone",
        "legal_side": payload.legal_side,
        "boundary_semantics": "legal_track_limit_white_line",
        "line_contact_is_legal": True,
        "note": "manual in-browser calibration on the calibration frame",
        "keyframes": keyframes,
    }
    boundary_path = meta.dir / "manual_boundary.json"
    boundary_path.write_text(json.dumps(boundary_json, indent=2), encoding="utf-8")
    try:
        load_manual_boundary(boundary_path)
    except (ValueError, KeyError, TypeError) as exc:
        boundary_path.unlink(missing_ok=True)
        raise HTTPException(status_code=422, detail=f"Invalid boundary: {exc}") from exc
    meta.boundary = {
        "keyframes": [int(keyframe["frame_index"]) for keyframe in keyframes],
        "legal_side": payload.legal_side,
        "points": sum(len(keyframe["points"]) for keyframe in keyframes),
    }
    meta.status["calibration"] = "done"
    save_session(meta)
    _generate_surface_visualization(meta)
    return meta.boundary


@router.get("/{session_id}/calibrate/frame")
def calibration_frame(session_id: str, frame_index: int | None = None) -> FileResponse:
    meta = _get_meta(session_id)
    selected_frame = meta.calibration_frame_index if frame_index is None else frame_index
    selected_frame = max(0, min(selected_frame, max(meta.frame_count - 1, 0)))
    if selected_frame == meta.calibration_frame_index:
        frame = meta.dir / "calibration.png"
    else:
        frame = meta.dir / "calibration" / f"frame_{selected_frame:06d}.png"
        if not frame.is_file():
            frame.parent.mkdir(parents=True, exist_ok=True)
            timestamp = selected_frame / meta.video_fps
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-loglevel",
                    "error",
                    "-ss",
                    f"{timestamp:.6f}",
                    "-i",
                    str(meta.dir / "source.mp4"),
                    "-frames:v",
                    "1",
                    str(frame),
                ],
                check=True,
                capture_output=True,
            )
    if not frame.is_file():
        raise HTTPException(status_code=404, detail="Calibration frame not available")
    return FileResponse(frame, media_type="image/png")


@router.get("/{session_id}/perception/video")
def perception_video(session_id: str) -> FileResponse:
    meta = _get_meta(session_id)
    video = meta.dir / "tracks.mp4"
    if not video.is_file():
        raise HTTPException(status_code=404, detail="Tracking video not available")
    return FileResponse(
        browser_playable(video),
        media_type="video/mp4",
        headers={"Cache-Control": "no-cache"},
    )


@router.get("/{session_id}/surface/video")
def surface_video(session_id: str) -> FileResponse:
    meta = _get_meta(session_id)
    video = meta.dir / "surface" / "a5_manual_visualization.mp4"
    if not video.is_file():
        raise HTTPException(status_code=404, detail="Surface visualization not generated yet")
    return FileResponse(
        browser_playable(video),
        media_type="video/mp4",
        headers={"Cache-Control": "no-cache"},
    )


@router.get("/{session_id}/frames/{name}")
def session_frame(session_id: str, name: str) -> FileResponse:
    meta = _get_meta(session_id)
    safe = Path(name).name
    frame = meta.dir / "keyframes" / safe
    if not frame.is_file():
        raise HTTPException(status_code=404, detail="Keyframe not found")
    return FileResponse(frame, media_type="image/png")


@router.get("/{session_id}/tracks")
def session_tracks(session_id: str) -> list[dict]:
    meta = _get_meta(session_id)
    tracks = _read_jsonl(meta.dir / "tracks.jsonl")
    if meta.status.get("perception") in (None, "pending") and not tracks:
        raise HTTPException(status_code=404, detail="No tracking records yet")
    return tracks


@router.get("/{session_id}/geometry")
def session_geometry(session_id: str) -> list[dict]:
    meta = _get_meta(session_id)
    geometry = _read_jsonl(meta.dir / "geometry.jsonl")
    if not geometry:
        raise HTTPException(status_code=404, detail="No geometry records yet")
    return geometry


@router.get("/{session_id}/spatial")
def session_spatial(session_id: str) -> list[dict]:
    """Geometry records projected onto the spatial vocabulary for the timeline."""
    meta = _get_meta(session_id)
    geometry = _read_jsonl(meta.dir / "geometry.jsonl")
    if not geometry:
        raise HTTPException(status_code=404, detail="No spatial records yet")
    return [
        {
            "frame_index": rec["frame_index"],
            "timestamp_seconds": rec.get("timestamp_seconds", 0.0),
            "track_id": rec["track_id"],
            "spatial_state": rec["spatial_state"],
            "off_track_fraction": 1.0 if rec["spatial_state"] == "OUTSIDE" else 0.0,
        }
        for rec in geometry
    ]


@router.get("/{session_id}/incident")
def session_incident(session_id: str) -> dict:
    meta = _get_meta(session_id)
    if meta.incident is None:
        raise HTTPException(status_code=404, detail="No incident produced for this session yet")
    return meta.incident


@router.post("/{session_id}/run")
def run_analysis(session_id: str) -> dict:
    meta = _get_meta(session_id)
    if not meta.has_tracking:
        raise HTTPException(status_code=422, detail="Run perception first")
    if not meta.has_boundary:
        raise HTTPException(status_code=422, detail="Calibrate a manual boundary first")
    if meta.status.get("perception") == "done" and meta.tracking_metrics and meta.tracking_metrics.get("frames_with_tracks", 0) == 0:
        raise HTTPException(status_code=422, detail="No f1_car detections in this clip; nothing to analyze")

    tracks_path = meta.dir / "tracks.jsonl"
    geometry_path = meta.dir / "geometry.jsonl"
    boundary_source = load_manual_boundary(meta.dir / "manual_boundary.json")
    def geometry_boundary(frame_index: int) -> BoundaryConfig:
        poly = interpolate_polyline(boundary_source, frame_index)
        return BoundaryConfig(
            boundary_type="polyline",
            points=tuple(poly),
            note="manual in-browser calibration with interpolated keyframes",
            inside_side="left_of_direction" if boundary_source.legal_side == "left" else "right_of_direction",
        )
    records = _read_jsonl(tracks_path)
    geometry_records = process_records(records, _geometry_config(), geometry_boundary)
    geometry_path.write_text(
        "\n".join(json.dumps(rec) for rec in geometry_records) + "\n", encoding="utf-8"
    )
    meta.status["analysis"] = "done"
    save_session(meta)

    if not (meta.dir / "surface" / "a5_manual_visualization.mp4").is_file():
        _generate_surface_visualization(meta)

    provider = SessionAnalysisProvider(tracks_path, geometry_path)
    envelope = provider.analyze(
        _issue(meta), _report_id(meta), meta.source_filename, meta.duration_s, meta.video_fps, meta.name
    )
    incident = envelope["incidents"][0]
    report = incident.pop("report")
    repository.create(
        {
            "report_id": _report_id(meta),
            "incident_id": _issue(meta),
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
    saved = repository.get_by_incident(_issue(meta))
    meta.incident = saved
    meta.status["incident"] = "done"
    save_session(meta)
    return saved
