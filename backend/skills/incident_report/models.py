from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class ContactState(str, Enum):
    INSIDE = "INSIDE"
    ON_BOUNDARY = "ON_BOUNDARY"
    OUTSIDE = "OUTSIDE"
    UNKNOWN = "UNKNOWN"


class IncidentState(str, Enum):
    NO_VIOLATION = "NO_VIOLATION"
    VIOLATION_CANDIDATE = "VIOLATION_CANDIDATE"
    UNCERTAIN = "UNCERTAIN"


class TrustBand(str, Enum):
    HIGH = "HIGH"
    MEDIUM_HIGH = "MEDIUM_HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    UNCERTAIN = "UNCERTAIN"


class ContactMethod(str, Enum):
    MASK = "MASK"
    BBOX_PROXY = "BBOX_PROXY"


@dataclass(frozen=True)
class Point:
    x: float
    y: float


@dataclass(frozen=True)
class ContactRegion:
    name: str
    point: Point
    state: ContactState
    observability: float
    method: ContactMethod
    reliability: float


@dataclass(frozen=True)
class Detection:
    frame_index: int
    timestamp_s: float
    track_id: int
    bbox: tuple[float, float, float, float]
    confidence: float


@dataclass(frozen=True)
class TemporalResult:
    eligible_frames: int
    outside_frames: int
    window_size: int
    required: int
    satisfied: bool

@dataclass(frozen=True)
class TrustResult:
    score: int
    band: TrustBand

    stable_tracking: bool
    clear_boundary: bool
    contact_visibility: bool
    geometric_margin: bool
    temporal_support: bool

    breakdown: dict[str, int]