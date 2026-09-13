from __future__ import annotations

from typing import Iterable

from .models import TemporalEvidence, TemporalFrame


class TemporalEvidenceSearcher:
    """
    Finds evidence surrounding an incident timestamp.

    Current MVP:
    - single video source
    - timestamp-based search
    - surrounding frame window
    - track-specific filtering

    Future:
    - multiple evidence sources
    - telemetry synchronization
    - additional camera feeds
    """

    def __init__(
        self,
        before_s: float = 0.20,
        after_s: float = 0.20,
        required_support: int = 3,
        max_frames: int = 9,
    ) -> None:

        if before_s < 0:
            raise ValueError("before_s must be >= 0")

        if after_s < 0:
            raise ValueError("after_s must be >= 0")

        if required_support < 1:
            raise ValueError("required_support must be >= 1")

        if max_frames < 1:
            raise ValueError("max_frames must be >= 1")

        self.before_s = before_s
        self.after_s = after_s
        self.required_support = required_support
        self.max_frames = max_frames

    def search(
        self,
        track_id: int,
        event_timestamp_s: float,
        evaluations: Iterable[dict],
    ) -> TemporalEvidence:

        window_start = event_timestamp_s - self.before_s
        window_end = event_timestamp_s + self.after_s

        candidates = []

        for evaluation in evaluations:

            if int(evaluation["track_id"]) != track_id:
                continue

            timestamp = float(evaluation["timestamp_s"])

            if window_start <= timestamp <= window_end:
                candidates.append(evaluation)

        candidates.sort(
            key=lambda item: abs(
                float(item["timestamp_s"]) - event_timestamp_s
            )
        )

        candidates = candidates[: self.max_frames]

        event_frame_index = self._find_event_frame(
            candidates,
            event_timestamp_s,
        )

        frames = tuple(
            TemporalFrame(
                frame_index=int(item["frame_index"]),
                timestamp_s=float(item["timestamp_s"]),
                track_id=track_id,
                four_outside=item.get("four_outside"),
                is_event=(
                    int(item["frame_index"]) == event_frame_index
                ),
            )
            for item in candidates
        )

        eligible_frames = sum(
            frame.four_outside is not None
            for frame in frames
        )

        supporting_frames = sum(
            frame.four_outside is True
            for frame in frames
        )

        temporal_support = (
            supporting_frames >= self.required_support
        )

        return TemporalEvidence(
            track_id=track_id,
            event_timestamp_s=event_timestamp_s,
            window_start_s=window_start,
            window_end_s=window_end,
            frames=frames,
            eligible_frames=eligible_frames,
            supporting_frames=supporting_frames,
            temporal_support=temporal_support,
        )

    @staticmethod
    def _find_event_frame(
        evaluations: list[dict],
        event_timestamp_s: float,
    ) -> int:

        if not evaluations:
            return -1

        closest = min(
            evaluations,
            key=lambda item: abs(
                float(item["timestamp_s"]) - event_timestamp_s
            ),
        )

        return int(closest["frame_index"])