"""Shared media-serving helpers for the API.

Kept out of the routes so the A5 demo and the arbitrary-upload session endpoints
serve clips identically (browser-playable H.264 + cache-busted URLs).
"""

from __future__ import annotations

import subprocess
from pathlib import Path


def browser_playable(src: Path) -> Path:
    """Return an MP4 the browser can actually decode.

    The pipeline renders MPEG-4 Part 2 (OpenCV mp4v), which Chrome/Firefox
    refuse to play in <video>. Re-mux to H.264/yuv420p once, next to the
    source, and reuse that copy on later requests.
    """
    browser_path = src.with_name(src.stem + ".browser.mp4")
    if browser_path.is_file():
        return browser_path
    if not src.is_file():
        return src
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-i",
                str(src),
                "-vsync",
                "cfr",
                "-r",
                "30",
                "-an",
                "-c:v",
                "libopenh264",
                "-pix_fmt",
                "yuv420p",
                "-b:v",
                "6M",
                "-maxrate",
                "8M",
                "-bufsize",
                "16M",
                "-movflags",
                "+faststart",
                str(browser_path),
            ],
            check=True,
            capture_output=True,
        )
    except (FileNotFoundError, subprocess.CalledProcessError):
        return src
    return browser_path


def cached_video_uri(route: str, src: Path) -> str | None:
    """API path for a clip served by ``route``, cache-busted by mtime.

    The browser may have cached an earlier (pre-transcode, unplayable) response
    for the same bare path; embedding the mtime forces a fresh fetch whenever
    the file changes.
    """
    if not src.is_file():
        return None
    playable = browser_playable(src)
    stamp = int(playable.stat().st_mtime)
    return f"{route}?m={stamp}"