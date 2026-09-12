"""
KERB video frame extraction.

Provides deterministic FFmpeg-based frame extraction for:
- perception preprocessing
- incident analysis
- evidence generation
"""

from .extractor import (
    ExtractionResult,
    VideoMetadata,
    extract_frames,
    probe_video,
)
from .presets import PRESETS, FramePreset

__all__ = [
    "ExtractionResult",
    "VideoMetadata",
    "FramePreset",
    "PRESETS",
    "probe_video",
    "extract_frames",
]