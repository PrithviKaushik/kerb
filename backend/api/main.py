from pathlib import Path
import shutil
import tempfile

from fastapi import FastAPI, File, Form, UploadFile

from backend.skills.video.frame_extraction import (
    extract_frames,
    probe_video,
)

app = FastAPI(
    title="KERB Backend API",
    description="Race video processing backend for KERB.",
    version="0.1.0",
)


@app.get("/api/health")
def health():
    """Check that the KERB backend and FFmpeg are available."""

    ffmpeg_available = shutil.which("ffmpeg") is not None
    ffprobe_available = shutil.which("ffprobe") is not None

    return {
        "service": "KERB Backend",
        "status": "online",
        "ffmpeg": "available" if ffmpeg_available else "missing",
        "ffprobe": "available" if ffprobe_available else "missing",
    }


@app.post("/api/video/probe")
async def probe_video_api(file: UploadFile = File(...)):
    """Read basic metadata from an uploaded race video."""

    suffix = Path(file.filename or "video.mp4").suffix

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp_path = Path(temp.name)
        shutil.copyfileobj(file.file, temp)

    try:
        metadata = probe_video(temp_path)

        return {
            "video": file.filename,
            "width": metadata.width,
            "height": metadata.height,
            "fps": metadata.fps,
            "frame_count": metadata.frame_count,
            "duration_seconds": metadata.duration_seconds,
        }
    finally:
        temp_path.unlink(missing_ok=True)


@app.post("/api/video/extract-frames")
async def extract_frames_api(
    file: UploadFile = File(...),
    fps: float = Form(1.0),
    preset: str = Form("balanced"),
    max_frames: int | None = Form(None),
):
    """Extract PNG frames from an uploaded race video."""

    suffix = Path(file.filename or "video.mp4").suffix

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
        temp_path = Path(temp.name)
        shutil.copyfileobj(file.file, temp)

    output_name = Path(file.filename or "video").stem
    output_dir = (
        Path("data")
        / "api"
        / "frames"
        / output_name
    )
    output_dir.mkdir(parents=True, exist_ok=True)

    try:
        source = probe_video(temp_path)

        result = extract_frames(
    temp_path,
    output_dir,
    fps=fps,
    max_frames=max_frames if max_frames and max_frames > 0 else None,
    preset=preset,
)
        return {
            "video": file.filename,
            "source_fps": source.fps,
            "source_frames": source.frame_count,
            "duration_seconds": source.duration_seconds,
            "extraction_fps": result.fps,
            "frames_extracted": len(result.frames),
            "resolution": result.resolution,
            "output_directory": str(output_dir),
            "status": "success",
        }
    finally:
        temp_path.unlink(missing_ok=True)