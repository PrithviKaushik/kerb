from __future__ import annotations

import json
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path

from .presets import get_preset


@dataclass(frozen=True)
class VideoMetadata:
    """Basic metadata required by KERB's video pipeline."""

    path: str
    width: int
    height: int
    fps: float
    frame_count: int
    duration_seconds: float


@dataclass(frozen=True)
class ExtractionResult:
    """Structured result returned by frame extraction."""

    video_path: str
    output_dir: str
    frames: tuple[str, ...]
    fps: float
    preset: str
    resolution: tuple[int, int]
    duration_seconds: float


def _require_ffmpeg() -> None:
    """Fail early with a useful message if FFmpeg is unavailable."""

    missing = [
        executable
        for executable in ("ffmpeg", "ffprobe")
        if shutil.which(executable) is None
    ]

    if missing:
        raise RuntimeError(
            "Missing required executable(s): "
            + ", ".join(missing)
            + ". Install FFmpeg and ensure ffmpeg/ffprobe are on PATH."
        )


def probe_video(video_path: str | Path) -> VideoMetadata:
    """Read video metadata using ffprobe."""

    _require_ffmpeg()

    path = Path(video_path)

    if not path.is_file():
        raise FileNotFoundError(f"Video not found: {path}")

    command = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,r_frame_rate,nb_frames,duration",
        "-of",
        "json",
        str(path),
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=True,
    )

    data = json.loads(result.stdout)
    stream = data["streams"][0]

    fps = _parse_frame_rate(stream.get("r_frame_rate", "0/1"))
    duration = float(stream.get("duration") or 0.0)

    frame_count = int(stream.get("nb_frames") or 0)

    if frame_count == 0 and fps > 0 and duration > 0:
        frame_count = round(fps * duration)

    return VideoMetadata(
        path=str(path),
        width=int(stream["width"]),
        height=int(stream["height"]),
        fps=fps,
        frame_count=frame_count,
        duration_seconds=duration,
    )


def extract_frames(
    video_path: str | Path,
    output_dir: str | Path,
    *,
    fps: float = 1.0,
    max_frames: int | None = None,
    preset: str = "balanced",
    max_dimension: int | None = None,
    quality: int | None = None,
    timestamps: bool = False,
) -> ExtractionResult:
    """
    Extract frames from a video using FFmpeg.

    If max_frames is provided, the extraction FPS is automatically
    calculated from the video's duration.
    """

    if fps <= 0:
        raise ValueError("fps must be greater than zero")

    if max_frames is not None and max_frames <= 0:
        raise ValueError("max_frames must be greater than zero")

    metadata = probe_video(video_path)
    selected_preset = get_preset(preset)

    extraction_fps = fps

    if max_frames is not None:
        if metadata.duration_seconds <= 0:
            raise ValueError(
                "Cannot calculate extraction FPS because video duration "
                "could not be determined."
            )

        extraction_fps = max_frames / metadata.duration_seconds
        extraction_fps = max(0.05, min(30.0, extraction_fps))

    dimension = max_dimension or selected_preset.max_dimension

    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)

    # KERB uses PNG for extracted frames so downstream CV/evidence
    # processing does not introduce JPEG compression artifacts.
    output_pattern = output / "frame_%06d.png"

    video_filter = f"fps={extraction_fps}"

    if dimension:
        video_filter += (
            f",scale={dimension}:{dimension}:"
            "force_original_aspect_ratio=decrease"
        )

    if timestamps:
        video_filter += (
            ",drawtext="
            "text='%{pts\\:hms}':"
            "x=w-tw-20:y=h-th-20:"
            "fontsize=24:"
            "fontcolor=white:"
            "box=1:"
            "boxcolor=black@0.65"
        )

    command = [
        "ffmpeg",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        str(video_path),
        "-vf",
        video_filter,
        "-y",
        str(output_pattern),
    ]

    subprocess.run(
        command,
        check=True,
        capture_output=True,
        text=True,
    )

    frames = tuple(
        str(path)
        for path in sorted(output.glob("frame_*.png"))
    )

    if not frames:
        raise RuntimeError("FFmpeg completed but produced no frames.")

    first_frame_metadata = _probe_image(frames[0])

    return ExtractionResult(
        video_path=str(video_path),
        output_dir=str(output),
        frames=frames,
        fps=extraction_fps,
        preset=preset,
        resolution=first_frame_metadata,
        duration_seconds=metadata.duration_seconds,
    )


def _parse_frame_rate(value: str) -> float:
    """Parse FFmpeg's rational frame-rate representation."""

    numerator, denominator = value.split("/")

    denominator = float(denominator)

    if denominator == 0:
        return 0.0

    return float(numerator) / denominator


def _probe_image(image_path: str) -> tuple[int, int]:
    """Get the dimensions of an extracted frame."""

    command = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height",
        "-of",
        "json",
        image_path,
    ]

    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=True,
    )

    stream = json.loads(result.stdout)["streams"][0]

    return int(stream["width"]), int(stream["height"])