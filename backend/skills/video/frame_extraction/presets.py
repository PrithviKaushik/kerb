from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class FramePreset:
    """Image-processing settings used during frame extraction."""

    max_dimension: int
    quality: int


PRESETS: dict[str, FramePreset] = {
    "efficient": FramePreset(
        max_dimension=768,
        quality=5,
    ),
    "balanced": FramePreset(
        max_dimension=1024,
        quality=3,
    ),
    "detailed": FramePreset(
        max_dimension=1568,
        quality=2,
    ),
}


def get_preset(name: str) -> FramePreset:
    """Return a named extraction preset."""
    try:
        return PRESETS[name]
    except KeyError as exc:
        available = ", ".join(sorted(PRESETS))
        raise ValueError(
            f"Unknown frame preset '{name}'. Available: {available}"
        ) from exc