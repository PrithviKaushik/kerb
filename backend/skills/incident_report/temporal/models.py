from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class TemporalFrame:
    """
    A frame observed around an incident timestamp.
    """

    frame_index: int
    timestamp_s: float
    track_id: int

    four_outside: Optional[bool]

    is_event: bool = False


@dataclass(frozen=True)
class TemporalEvidence:
    """
    Evidence collected around a specific incident timestamp.
    """

    track_id: int

    event_timestamp_s: float

    window_start_s: float
    window_end_s: float

    frames: tuple[TemporalFrame, ...]

    eligible_frames: int
    supporting_frames: int

    temporal_support: bool

    mode: str = "SINGLE_VIEW"