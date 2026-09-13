"""Configuration for the surface estimator and whole-bbox classifier.

Configuration is scoped to a camera/view/track-limit zone, never to a video
filename or an algorithm variant. The search ROI below is a *search region*
where the vehicle operates (derived from tracked-vehicle workspace on the
sample footage); it is NOT a hand-marked white-line / boundary polyline.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, fields
from pathlib import Path


@dataclass(frozen=True)
class ROI:
    """Normalised (0..1) rectangle giving the surface search region."""

    x1: float
    y1: float
    x2: float
    y2: float

    def to_absolute(self, width: int, height: int) -> tuple[int, int, int, int]:
        rx1 = round(self.x1 * width)
        ry1 = round(self.y1 * height)
        rx2 = round(self.x2 * width)
        ry2 = round(self.y2 * height)
        return rx1, ry1, rx2, ry2


@dataclass(frozen=True)
class SurfaceAppearance:
    """Pixel-appearance thresholds for the classical surface baseline."""

    white_min_value: int = 200
    white_max_saturation: int = 40
    dark_max_value: int = 45
    grass_hue_min: int = 30
    grass_hue_max: int = 95
    grass_min_saturation: int = 60
    grass_min_value: int = 40
    color_sat_unknown_min: int = 100


@dataclass(frozen=True)
class SurfaceMorphology:
    """Morphology knobs controlling mask smoothing and the transition band."""

    transition_dilation_kernel: int = 21
    green_close_kernel: int = 5
    green_open_kernel: int = 5


@dataclass(frozen=True)
class SurfaceMetrics:
    """Weights of the deterministic surface-confidence formula (must sum to 1)."""

    weight_known: float = 0.40
    weight_separation: float = 0.30
    weight_continuity: float = 0.20
    weight_temporal: float = 0.10
    usable_known_fraction: float = 0.50


@dataclass(frozen=True)
class ClassifierConfig:
    """Thresholds for whole-bbox spatial classification.

    All fractions are measured over the full bbox area; pixels outside the ROI
    count as UNKNOWN (unestimated). Nothing is a magic number -- every value
    is configurable here and duplicated nowhere in source code.
    """

    minimum_box_width: float = 20.0
    minimum_box_height: float = 20.0
    min_surface_confidence: float = 0.40
    min_known_fraction: float = 0.50
    inside_track_share: float = 0.85
    outside_track_share: float = 0.15
    min_dominant_fraction: float = 0.50


@dataclass(frozen=True)
class CameraViewConfig:
    """Bundle of surface + classifier configuration for one camera/view/zone."""

    camera_name: str
    camera_view: str
    zone_id: str
    roi: ROI
    appearance: SurfaceAppearance = SurfaceAppearance()
    morphology: SurfaceMorphology = SurfaceMorphology()
    metrics: SurfaceMetrics = SurfaceMetrics()
    classifier: ClassifierConfig = ClassifierConfig()
    note: str = ""


def _from_dict(cls, data: dict, name: str):
    known = {f.name for f in fields(cls)}
    extra = set(data) - known
    if extra:
        raise ValueError(f"Unknown fields for {name}: {sorted(extra)}")
    return cls(**data)


def load_config(path: str | Path) -> CameraViewConfig:
    raw = json.loads(Path(path).read_text())
    roi = _from_dict(ROI, raw["roi"], "roi")
    cfg = CameraViewConfig(
        camera_name=raw["camera_name"],
        camera_view=raw["camera_view"],
        zone_id=raw["zone_id"],
        roi=roi,
        appearance=_from_dict(SurfaceAppearance, raw.get("appearance", {}), "appearance"),
        morphology=_from_dict(SurfaceMorphology, raw.get("morphology", {}), "morphology"),
        metrics=_from_dict(SurfaceMetrics, raw.get("metrics", {}), "metrics"),
        classifier=_from_dict(ClassifierConfig, raw.get("classifier", {}), "classifier"),
        note=raw.get("note", ""),
    )
    validate(cfg)
    return cfg


def validate(cfg: CameraViewConfig) -> None:
    r = cfg.roi
    if not (0.0 <= r.x1 < r.x2 <= 1.0 and 0.0 <= r.y1 < r.y2 <= 1.0):
        raise ValueError(f"ROI must be a valid normalised rectangle inside [0,1]: {r}")
    m = cfg.metrics
    total = m.weight_known + m.weight_separation + m.weight_continuity + m.weight_temporal
    if abs(total - 1.0) > 1e-6:
        raise ValueError(f"surface-confidence weights must sum to 1, got {total}")
    if not 0.0 < m.usable_known_fraction <= 1.0:
        raise ValueError("usable_known_fraction must be in (0,1]")
    cc = cfg.classifier
    if not (cc.inside_track_share > cc.outside_track_share):
        raise ValueError("inside_track_share must exceed outside_track_share")
    kernels = [cfg.morphology.green_close_kernel, cfg.morphology.green_open_kernel]
    if cfg.morphology.transition_dilation_kernel <= 0:
        raise ValueError("transition_dilation_kernel must be positive")
    kernels.append(cfg.morphology.transition_dilation_kernel)
    for k in kernels:
        if k <= 0 or k % 2 == 0:
            raise ValueError("morphology kernels must be positive odd ints")