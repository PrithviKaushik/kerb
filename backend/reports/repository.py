from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from threading import RLock
from typing import Any

class ReportRepository:
    """Storage boundary for development reports; replaceable by SQLite later."""

    def __init__(self) -> None:
        self._lock = RLock()
        self._reports: dict[str, dict[str, Any]] = {}

    def seed(self, reports: list[dict[str, Any]]) -> None:
        with self._lock:
            for report in reports:
                self._reports[report["report_id"]] = deepcopy(report)

    def create(self, report: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            self._reports[report["report_id"]] = deepcopy(report)
            return deepcopy(report)

    def get(self, report_id: str) -> dict[str, Any] | None:
        with self._lock:
            report = self._reports.get(report_id)
            return deepcopy(report) if report else None

    def get_by_incident(self, incident_id: str) -> dict[str, Any] | None:
        with self._lock:
            for report in self._reports.values():
                if report["incident_id"] == incident_id:
                    return deepcopy(report)
        return None

    def list(self) -> list[dict[str, Any]]:
        with self._lock:
            reports = sorted(self._reports.values(), key=lambda report: report.get("trust", {}).get("score", 0), reverse=True)
            return deepcopy(reports)

    def update_review(self, report_id: str, review: dict[str, Any]) -> dict[str, Any]:
        with self._lock:
            if report_id not in self._reports:
                raise KeyError(report_id)
            # Review is appended; the original AI/evidence fields remain untouched.
            self._reports[report_id]["review"] = {
                **review,
                "status": "REVIEWED",
                "reviewed_at": datetime.now(timezone.utc).isoformat(),
            }
            return deepcopy(self._reports[report_id])


repository = ReportRepository()
