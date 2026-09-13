from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Mapping

from .models import ContactRegion, Detection


@dataclass(frozen=True)
class StandardizedObservation:
    """Stable boundary between perception and KERB incident intelligence."""

    detection: Detection
    contact_regions: tuple[ContactRegion, ...]
    geometry_method: str
    context_flags: tuple[str, ...] = ()
    reliability: dict[str, float] | None = None


def adapt_perception_record(
    record: Any,
    contact_regions: tuple[ContactRegion, ...],
    *,
    context_flags: tuple[str, ...] = (),
    reliability: dict[str, float] | None = None,
    geometry_method: str = "BBOX_PROXY",
) -> StandardizedObservation:
    """Adapt TrackRecord-like objects or mappings without coupling downstream code to YOLO."""

    def value(name: str, *aliases: str) -> Any:
        if isinstance(record, Mapping):
            for key in (name, *aliases):
                if key in record:
                    return record[key]
        else:
            for key in (name, *aliases):
                if hasattr(record, key):
                    return getattr(record, key)
        raise ValueError(f"Perception record is missing {name!r}")

    detection = Detection(
        frame_index=int(value("frame_index")),
        timestamp_s=float(value("timestamp_s", "timestamp_seconds")),
        track_id=int(value("track_id")),
        bbox=_bbox_from_record(record),
        confidence=float(value("confidence", "detector_confidence")),
    )
    if len(detection.bbox) != 4:
        raise ValueError("Perception bbox must contain four coordinates")
    if len(contact_regions) != 4:
        raise ValueError("Exactly four standardized contact regions are required")
    return StandardizedObservation(detection, contact_regions, geometry_method, context_flags, reliability)


def _bbox_from_record(record: Any) -> tuple[float, float, float, float]:
    if isinstance(record, Mapping):
        if "bbox" in record:
            return tuple(float(item) for item in record["bbox"])
        if "xyxy" in record:
            return tuple(float(item) for item in record["xyxy"])
        raise ValueError("Perception record is missing 'bbox'")
    return tuple(float(getattr(record, key)) for key in ("x1", "y1", "x2", "y2"))
