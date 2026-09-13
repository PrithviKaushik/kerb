"""Single-worker background job runner for session pipeline stages.

Perception inference on a 30 s clip takes tens of seconds; the tracker job must
not block the HTTP request. Only one CPU-bound stage runs at a time (the box has
8 cores and tracking already saturates several of them).
"""

from __future__ import annotations

import threading
import time
from concurrent.futures import Future, ThreadPoolExecutor
from typing import Any, Callable

from backend.api.sessions import save_session, session_path

_JOB_LOCK = threading.Lock()
_jobs: dict[str, dict[str, Any]] = {}
_last_disk_write: dict[str, float] = {}


def start_job(session_id: str, stage: str, fn: Callable[[], dict[str, Any]]) -> dict[str, Any]:
    """Queue ``fn`` for ``session_id``; returns the initial job status."""
    with _JOB_LOCK:
        current = _jobs.get(session_id)
        if current is not None and current["state"] in ("queued", "running"):
            raise RuntimeError(f"Job already running for session {session_id}")
        job = {
            "session_id": session_id,
            "stage": stage,
            "state": "queued",
            "progress": None,
            "message": "queued",
            "error": None,
            "started_at": None,
            "finished_at": None,
        }
        _jobs[session_id] = job
        notify_session_job(session_id, job)

    def _run() -> dict[str, Any]:
        try:
            with _JOB_LOCK:
                job["state"] = "running"
                job["started_at"] = time.time()
                job["message"] = "running"
            notify_session_job(session_id, job)
            result = fn()
            with _JOB_LOCK:
                job["state"] = "done"
                job["finished_at"] = time.time()
                job["message"] = "completed"
            notify_session_job(session_id, job)
            return result
        except Exception as exc:  # noqa: BLE001 - surface any failure to the client
            with _JOB_LOCK:
                job["state"] = "error"
                job["finished_at"] = time.time()
                job["error"] = str(exc)
                job["message"] = f"error: {exc}"
            notify_session_job(session_id, job)
            raise

    worker.submit(_run)
    return dict(job)


def job_status(session_id: str) -> dict[str, Any] | None:
    job = _jobs.get(session_id)
    return dict(job) if job is not None else None


def report_progress(session_id: str, stage: str, progress: float, message: str) -> None:
    with _JOB_LOCK:
        job = _jobs.get(session_id)
        if job is None:
            return
        job["progress"] = round(max(0.0, min(1.0, progress)), 4)
        job["message"] = message
        job["stage"] = stage
    # Persisting on every frame is pure IO spam (50 fps clips); throttle to
    # ~1 Hz plus the final tick so clients still see live progress.
    now = time.monotonic()
    if progress >= 1.0 or now - _last_disk_write.get(session_id, 0.0) >= 1.0:
        _last_disk_write[session_id] = now
        notify_session_job(session_id, job)


def report_result(session_id: str, result: dict[str, Any]) -> None:
    with _JOB_LOCK:
        job = _jobs.get(session_id)
        if job is None:
            return
        job["result"] = result


def notify_session_job(session_id: str, job: dict[str, Any]) -> None:
    """Persist the job snapshot inside the session's metadata file."""
    meta_path = session_path(session_id) / "session.json"
    if not meta_path.is_file():
        return
    import json as _json

    try:
        data = _json.loads(meta_path.read_text(encoding="utf-8"))
        data["job"] = dict(job)
        data["job"].pop("result", None)
        meta_path.write_text(_json.dumps(data, indent=2), encoding="utf-8")
    except (OSError, ValueError):
        pass


worker = ThreadPoolExecutor(max_workers=1, thread_name_prefix="kerb-job")