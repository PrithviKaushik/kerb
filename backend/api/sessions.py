"""On-disk store for uploaded analysis sessions.

Each session lives under ``data/sessions/<session_id>/`` with a JSON metadata
file the API maps into the frontend state payload. The directory is intentionally
gitignored (AGENTS contract: never track footage, generated media, or data).
"""

from __future__ import annotations

import json
import shutil
import time
import uuid
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

_REPO_ROOT = Path(__file__).resolve().parents[3]
SESSIONS_ROOT = _REPO_ROOT / "data" / "sessions"
MODEL_PATH = _REPO_ROOT / "models" / "kerb_yolo11n_plus_d3_and_a5.pt"
UPLOAD_CAP_SECONDS = 30.0


def _default_job() -> dict[str, Any]:
    return {
        "state": "idle",
        "progress": None,
        "message": None,
        "error": None,
        "started_at": None,
        "finished_at": None,
    }


@dataclass
class SessionMeta:
    id: str
    name: str
    created_at: float
    source_filename: str
    video_fps: float
    frame_count: int
    duration_s: float
    width: int
    height: int
    calibration_frame_index: int
    model: str
    status: dict[str, str] = field(default_factory=dict)
    job: dict[str, Any] = field(default_factory=_default_job)
    incident: dict[str, Any] | None = None
    tracking_metrics: dict[str, Any] | None = None
    boundary: dict[str, Any] | None = None

    @property
    def dir(self) -> Path:
        return SESSIONS_ROOT / self.id

    @property
    def has_tracking(self) -> bool:
        return (self.dir / "tracks.jsonl").is_file()

    @property
    def has_geometry(self) -> bool:
        return (self.dir / "geometry.jsonl").is_file()

    @property
    def has_boundary(self) -> bool:
        return (self.dir / "manual_boundary.json").is_file()


def session_path(session_id: str) -> Path:
    if not session_id or session_id.strip("/") != session_id or ".." in session_id:
        raise ValueError(f"Invalid session id: {session_id!r}")
    path = (SESSIONS_ROOT / session_id).resolve()
    if path.parent != SESSIONS_ROOT.resolve():
        raise ValueError(f"Invalid session id: {session_id!r}")
    return path


def create_session(
    source_path: Path,
    source_filename: str,
    *,
    width: int,
    height: int,
    fps: float,
    frame_count: int,
    duration_s: float,
    calibration_frame_index: int,
    name: str | None = None,
) -> SessionMeta:
    session_id = uuid.uuid4().hex[:12]
    base = session_path(session_id)
    base.mkdir(parents=True, exist_ok=False)
    shutil.copy2(source_path, base / "source.mp4")
    meta = SessionMeta(
        id=session_id,
        name=name or source_filename,
        created_at=time.time(),
        source_filename=source_filename,
        video_fps=fps,
        frame_count=frame_count,
        duration_s=duration_s,
        width=width,
        height=height,
        calibration_frame_index=calibration_frame_index,
        model=str(MODEL_PATH.name),
        status={"extraction": "done", "calibration": "pending", "perception": "pending", "incident": "pending"},
    )
    save_session(meta)
    return meta


def save_session(meta: SessionMeta) -> None:
    payload = asdict(meta)
    (meta.dir / "session.json").write_text(
        json.dumps(payload, indent=2, default=str), encoding="utf-8"
    )


def load_session(session_id: str) -> SessionMeta | None:
    meta_file = session_path(session_id) / "session.json"
    if not meta_file.is_file():
        return None
    data = json.loads(meta_file.read_text(encoding="utf-8"))
    return SessionMeta(**data)


def list_sessions() -> list[SessionMeta]:
    metas = []
    if not SESSIONS_ROOT.is_dir():
        return metas
    for directory in sorted(SESSIONS_ROOT.iterdir()):
        if not directory.is_dir():
            continue
        meta = load_session(directory.name)
        if meta is not None:
            metas.append(meta)
    return sorted(metas, key=lambda item: item.created_at)


def delete_session(session_id: str) -> bool:
    base = session_path(session_id)
    if not base.is_dir():
        return False
    shutil.rmtree(base)
    return True


def delete_all_sessions() -> int:
    """Remove every uploaded session directory and return the number removed."""
    if not SESSIONS_ROOT.is_dir():
        return 0
    removed = 0
    for directory in list(SESSIONS_ROOT.iterdir()):
        if directory.is_dir() and (directory / "session.json").is_file():
            shutil.rmtree(directory)
            removed += 1
        elif directory.is_file() and directory.name.startswith(".upload-"):
            directory.unlink()
    return removed


def ensure_root() -> None:
    SESSIONS_ROOT.mkdir(parents=True, exist_ok=True)
