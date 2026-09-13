"""Spatial state timeline aggregation for steward-facing demo evidence."""

from __future__ import annotations

from collections import Counter, defaultdict
from typing import Any


def _time(row: dict[str, Any]) -> float:
    return float(row["timestamp_seconds"])


def _frame(row: dict[str, Any]) -> int:
    return int(row["frame_index"])


def _state(row: dict[str, Any]) -> str:
    return str(row["spatial_state"])


def aggregate_spatial_timeline(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Aggregate measured spatial states by tracked vehicle.

    Durations are based on timestamp deltas between adjacent records with the
    same state. This deliberately does not bridge missing frames or records in
    another state, which keeps an OUTSIDE interval tied to observed evidence.
    """
    by_track: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_track[int(row["track_id"])].append(row)

    timelines: list[dict[str, Any]] = []
    for track_id in sorted(by_track):
        track_rows = sorted(by_track[track_id], key=lambda row: (_frame(row), _time(row)))
        states = [
            {
                "frame": _frame(row),
                "time": _time(row),
                "state": _state(row),
            }
            for row in track_rows
        ]
        first_boundary = next((row for row in track_rows if _state(row) == "BOUNDARY"), None)
        outside_rows = [row for row in track_rows if _state(row) == "OUTSIDE"]
        peak = max(outside_rows, key=lambda row: float(row.get("off_track_fraction", 0.0)), default=None)

        state_durations: Counter[str] = Counter()
        outside_duration = 0.0
        for previous, current in zip(track_rows, track_rows[1:]):
            if _state(previous) != _state(current):
                continue
            duration = max(0.0, _time(current) - _time(previous))
            state_durations[_state(previous)] += duration
            if _state(previous) == "OUTSIDE":
                outside_duration += duration

        state_counts = Counter(_state(row) for row in track_rows)
        for state in ("INSIDE", "BOUNDARY", "OUTSIDE", "UNCERTAIN"):
            state_counts.setdefault(state, 0)
        state_duration_values = dict(state_durations)
        for state in ("INSIDE", "BOUNDARY", "OUTSIDE", "UNCERTAIN"):
            state_duration_values.setdefault(state, 0.0)
        timelines.append(
            {
                "track_id": track_id,
                "first_boundary_frame": _frame(first_boundary) if first_boundary else None,
                "first_boundary_time": _time(first_boundary) if first_boundary else None,
                "first_outside_frame": _frame(outside_rows[0]) if outside_rows else None,
                "first_outside_time": _time(outside_rows[0]) if outside_rows else None,
                "last_outside_frame": _frame(outside_rows[-1]) if outside_rows else None,
                "last_outside_time": _time(outside_rows[-1]) if outside_rows else None,
                "outside_duration_seconds": round(outside_duration, 6),
                "peak_frame": _frame(peak) if peak else None,
                "peak_time": _time(peak) if peak else None,
                "states": states,
                "state_counts": dict(state_counts),
                "state_durations_seconds": {
                    state: round(duration, 6) for state, duration in state_duration_values.items()
                },
            }
        )
    return timelines
