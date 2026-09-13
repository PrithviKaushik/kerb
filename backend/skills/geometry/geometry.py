from __future__ import annotations

import argparse
import json
import math
from collections import defaultdict, deque
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable


@dataclass(frozen=True)
class GeometryConfig:
    history_window: int = 5
    minimum_displacement_pixels: float = 2.0
    minimum_box_width: float = 20.0
    minimum_box_height: float = 20.0
    minimum_detector_confidence: float = 0.25
    lower_box_fraction: float = 0.50
    boundary_touch_tolerance_pixels: float = 2.0
    fixed_camera_horizontal_fallback: bool = True


@dataclass(frozen=True)
class BoundaryConfig:
    boundary_type: str
    points: tuple[tuple[float, float], ...]
    note: str
    inside_side: str = "right_of_direction"


@dataclass(frozen=True)
class Position:
    frame_index: int
    x: float
    y: float


def load_config(path: str | Path) -> tuple[GeometryConfig, BoundaryConfig]:
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    geometry = data["geometry"]
    config = GeometryConfig(
        **geometry,
        fixed_camera_horizontal_fallback=bool(
            data.get("fixed_camera_horizontal_fallback", True)
        ),
    )
    if not 0.0 < config.lower_box_fraction < 1.0:
        raise ValueError("lower_box_fraction must be strictly between 0 and 1")
    if config.boundary_touch_tolerance_pixels < 0.0:
        raise ValueError("boundary_touch_tolerance_pixels must be non-negative")
    boundary_data = data["boundary"]
    boundary = BoundaryConfig(
        boundary_type=str(boundary_data["type"]),
        points=tuple((float(x), float(y)) for x, y in boundary_data["points"]),
        note=str(boundary_data.get("note", "")),
        inside_side=str(boundary_data.get("inside_side", "right_of_direction")),
    )
    if boundary.boundary_type not in {"polyline", "polygon"}:
        raise ValueError("boundary.type must be polyline or polygon")
    if len(boundary.points) < 2:
        raise ValueError("manual boundary requires at least two points")
    if boundary.inside_side not in {"left_of_direction", "right_of_direction"}:
        raise ValueError("boundary.inside_side must be left_of_direction or right_of_direction")
    if config.history_window < 2:
        raise ValueError("history_window must be at least 2")
    return config, boundary


def _bbox(record: dict) -> tuple[float, float, float, float]:
    return (float(record["x1"]), float(record["y1"]), float(record["x2"]), float(record["y2"]))


def _position(record: dict) -> Position:
    x1, y1, x2, y2 = _bbox(record)
    return Position(int(record["frame_index"]), (x1 + x2) / 2, (y1 + y2) / 2)


def _direction(
    history: deque[Position], config: GeometryConfig
) -> tuple[tuple[float, float] | None, str]:
    if len(history) < 2:
        return None, "unstable_insufficient_history"
    oldest, newest = history[0], history[-1]
    dx = newest.x - oldest.x
    dy = newest.y - oldest.y
    magnitude = math.hypot(dx, dy)
    if len(history) >= config.history_window and magnitude >= config.minimum_displacement_pixels:
        return (dx / magnitude, dy / magnitude), "stable"
    if config.fixed_camera_horizontal_fallback and abs(dx) >= config.minimum_displacement_pixels:
        return ((1.0 if dx > 0 else -1.0), 0.0), "fallback_horizontal_insufficient_history"
    if len(history) < config.history_window:
        return None, "unstable_insufficient_history"
    return None, "unstable_near_zero_displacement"


def _footprint(
    bbox: tuple[float, float, float, float], config: GeometryConfig
) -> tuple[dict[str, float], str]:
    x1, y1, x2, y2 = bbox
    height = y2 - y1
    width = x2 - x1
    if height > width:
        return {"x1": x1, "y1": y1, "x2": x2, "y2": y2}, "FULL_BOX"
    footprint_y1 = y1 + config.lower_box_fraction * height
    return {"x1": x1, "y1": footprint_y1, "x2": x2, "y2": y2}, "LOWER_BOX"


def _boundary_segments(
    boundary: BoundaryConfig,
) -> list[tuple[tuple[float, float], tuple[float, float]]]:
    points = boundary.points
    segments = list(zip(points, points[1:]))
    if boundary.boundary_type == "polygon" and len(points) > 2:
        segments.append((points[-1], points[0]))
    return segments


def _signed_distance_to_segment_line(
    point: tuple[float, float], segment: tuple[tuple[float, float], tuple[float, float]]
) -> float | None:
    (ax, ay), (bx, by) = segment
    abx, aby = bx - ax, by - ay
    length = math.hypot(abx, aby)
    if length == 0:
        return None
    cross = abx * (point[1] - ay) - aby * (point[0] - ax)
    return cross / length


def _signed_distance_to_boundary(point: tuple[float, float], boundary: BoundaryConfig) -> float | None:
    best: float | None = None
    for segment in _boundary_segments(boundary):
        distance = _signed_distance_to_segment_line(point, segment)
        if distance is None:
            continue
        if best is None or abs(distance) < abs(best):
            best = distance
    return best


def _classify_footprint(
    footprint: dict[str, float],
    boundary: BoundaryConfig,
    config: GeometryConfig,
) -> tuple[str, dict | None]:
    if boundary is None or len(boundary.points) < 2:
        return "UNCERTAIN", None
    corners = {
        "top_left": (footprint["x1"], footprint["y1"]),
        "top_right": (footprint["x2"], footprint["y1"]),
        "bottom_left": (footprint["x1"], footprint["y2"]),
        "bottom_right": (footprint["x2"], footprint["y2"]),
    }
    signed_distances: dict[str, float] = {}
    for name, corner in corners.items():
        raw = _signed_distance_to_boundary(corner, boundary)
        if raw is None:
            return "UNCERTAIN", None
        signed_distances[name] = raw * (1.0 if boundary.inside_side == "left_of_direction" else -1.0)
    min_distance = min(signed_distances.values())
    max_distance = max(signed_distances.values())
    tolerance = config.boundary_touch_tolerance_pixels
    if min_distance >= tolerance:
        state = "INSIDE"
    elif max_distance <= -tolerance:
        state = "OUTSIDE"
    else:
        state = "BOUNDARY"
    relation = {
        "boundary_type": boundary.boundary_type,
        "boundary_note": boundary.note,
        "inside_side": boundary.inside_side,
        "tolerance_pixels": tolerance,
        "signed_distances": signed_distances,
        "signed_distances_min": min_distance,
        "signed_distances_max": max_distance,
    }
    return state, relation


def geometry_record(
    record: dict,
    history: deque[Position],
    config: GeometryConfig,
    boundary: BoundaryConfig,
) -> dict:
    bbox = _bbox(record)
    x1, y1, x2, y2 = bbox
    width = x2 - x1
    height = y2 - y1
    history.append(_position(record))
    reasons: list[str] = []
    if width <= 0 or height <= 0:
        reasons.append("invalid_bbox_dimensions")
    if width < config.minimum_box_width or height < config.minimum_box_height:
        reasons.append("bbox_below_minimum_size")
    if float(record["detector_confidence"]) < config.minimum_detector_confidence:
        reasons.append("low_detector_confidence")

    direction, motion_status = _direction(history, config)
    if direction is None:
        reasons.append(motion_status)

    footprint, geometry_mode = _footprint(bbox, config)
    if reasons:
        geometry_status = "UNCERTAIN"
        spatial_state = "UNCERTAIN"
        boundary_relation = None
    else:
        geometry_status = "OK"
        spatial_state, boundary_relation = _classify_footprint(footprint, boundary, config)
    return {
        "frame_index": int(record["frame_index"]),
        "timestamp_seconds": float(record["timestamp_seconds"]),
        "track_id": int(record["track_id"]),
        "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
        "detector_confidence": float(record["detector_confidence"]),
        "motion_direction": {"dx": direction[0], "dy": direction[1]} if direction else None,
        "motion_status": motion_status,
        "footprint": footprint,
        "geometry_mode": geometry_mode,
        "geometry_status": geometry_status,
        "spatial_state": spatial_state,
        "boundary_relation": boundary_relation,
        "uncertainty_reasons": reasons,
    }


def process_records(
    records: Iterable[dict],
    config: GeometryConfig,
    boundary: BoundaryConfig,
) -> list[dict]:
    histories: dict[int, deque[Position]] = defaultdict(
        lambda: deque(maxlen=config.history_window)
    )
    output = []
    for record in records:
        output.append(geometry_record(record, histories[int(record["track_id"])], config, boundary))
    return output


def load_records(path: str | Path) -> list[dict]:
    return [json.loads(line) for line in Path(path).read_text().splitlines() if line.strip()]


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Kerb conservative vehicle-footprint geometry.")
    parser.add_argument("--records", required=True)
    parser.add_argument("--config", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    config, boundary = load_config(args.config)
    output = process_records(load_records(args.records), config, boundary)
    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    with Path(args.output).open("w", encoding="utf-8") as handle:
        for record in output:
            handle.write(json.dumps(record) + "\n")
    print(json.dumps({
        "records": len(output),
        "uncertain_geometry": sum(record["geometry_status"] == "UNCERTAIN" for record in output),
        "spatial_states": {
            state: sum(record["spatial_state"] == state for record in output)
            for state in ("INSIDE", "BOUNDARY", "OUTSIDE", "UNCERTAIN")
        },
        "geometry_modes": {
            mode: sum(record["geometry_mode"] == mode for record in output)
            for mode in ("FULL_BOX", "LOWER_BOX")
        },
        "config": asdict(config),
        "boundary": {
            "boundary_type": boundary.boundary_type,
            "note": boundary.note,
            "inside_side": boundary.inside_side,
        },
    }, indent=2))


if __name__ == "__main__":
    main()