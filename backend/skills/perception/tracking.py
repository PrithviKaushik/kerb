from __future__ import annotations

import argparse
import json
import time
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import cv2
from ultralytics import YOLO


@dataclass(frozen=True)
class TrackRecord:
    """One detector/tracker observation; downstream geometry consumes this schema."""

    frame_index: int
    timestamp_seconds: float
    track_id: int
    x1: float
    y1: float
    x2: float
    y2: float
    detector_confidence: float


@dataclass(frozen=True)
class TrackingMetrics:
    source: str
    model: str
    source_fps: float
    source_resolution: tuple[int, int]
    frames_processed: int
    frames_with_tracks: int
    total_track_records: int
    unique_track_ids: int
    processing_duration_seconds: float
    end_to_end_fps: float
    detector_inference_seconds: float
    detector_inference_fps: float


def _annotate(frame: Any, boxes: Any, names: dict[int, str]) -> Any:
    annotated = frame.copy()
    for box, track_id, confidence, class_id in zip(
        boxes.xyxy.cpu().tolist(),
        boxes.id.int().cpu().tolist(),
        boxes.conf.cpu().tolist(),
        boxes.cls.int().cpu().tolist(),
    ):
        x1, y1, x2, y2 = (int(round(value)) for value in box)
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 220, 0), 2)
        label = f"Car #{track_id} {names[class_id]} {confidence:.2f}"
        (text_width, text_height), baseline = cv2.getTextSize(
            label, cv2.FONT_HERSHEY_SIMPLEX, 0.65, 2
        )
        label_y = max(y1, text_height + baseline + 4)
        cv2.rectangle(
            annotated,
            (x1, label_y - text_height - baseline - 4),
            (x1 + text_width + 6, label_y),
            (0, 220, 0),
            -1,
        )
        cv2.putText(
            annotated,
            label,
            (x1 + 3, label_y - baseline - 2),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.65,
            (0, 0, 0),
            2,
            cv2.LINE_AA,
        )
    return annotated


def track_video(
    source: str | Path,
    model_path: str | Path,
    output_video: str | Path,
    output_jsonl: str | Path,
    *,
    imgsz: int = 640,
    conf: float = 0.25,
) -> TrackingMetrics:
    """Track class-0 vehicles through a video with Ultralytics ByteTrack."""

    source_path = Path(source)
    model_file = Path(model_path)
    if not source_path.is_file():
        raise FileNotFoundError(f"Source video not found: {source_path}")
    if not model_file.is_file():
        raise FileNotFoundError(f"Model checkpoint not found: {model_file}")

    capture = cv2.VideoCapture(str(source_path))
    if not capture.isOpened():
        raise RuntimeError(f"Could not open source video: {source_path}")

    source_fps = capture.get(cv2.CAP_PROP_FPS)
    width = int(capture.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
    if source_fps <= 0 or width <= 0 or height <= 0:
        capture.release()
        raise RuntimeError("Source video metadata is invalid")

    output_video_path = Path(output_video)
    output_jsonl_path = Path(output_jsonl)
    output_video_path.parent.mkdir(parents=True, exist_ok=True)
    output_jsonl_path.parent.mkdir(parents=True, exist_ok=True)
    writer = cv2.VideoWriter(
        str(output_video_path),
        cv2.VideoWriter_fourcc(*"mp4v"),
        source_fps,
        (width, height),
    )
    if not writer.isOpened():
        capture.release()
        raise RuntimeError(f"Could not create output video: {output_video_path}")

    model = YOLO(str(model_file))
    class_names = {int(key): value for key, value in model.names.items()}
    if class_names.get(0) != "f1_car":
        capture.release()
        writer.release()
        raise RuntimeError(f"Expected class 0 to be f1_car, got {class_names.get(0)!r}")

    records: list[TrackRecord] = []
    track_ids: set[int] = set()
    frames_with_tracks = 0
    frame_index = 0
    detector_seconds = 0.0
    started = time.perf_counter()

    try:
        with output_jsonl_path.open("w", encoding="utf-8") as records_file:
            while True:
                ok, frame = capture.read()
                if not ok:
                    break

                inference_started = time.perf_counter()
                result = model.track(
                    frame,
                    persist=True,
                    tracker="bytetrack.yaml",
                    classes=[0],
                    conf=conf,
                    imgsz=imgsz,
                    device="cpu",
                    verbose=False,
                )[0]
                detector_seconds += time.perf_counter() - inference_started

                boxes = result.boxes
                if boxes is not None and boxes.id is not None and len(boxes) > 0:
                    frames_with_tracks += 1
                    for box, track_id, confidence in zip(
                        boxes.xyxy.cpu().tolist(),
                        boxes.id.int().cpu().tolist(),
                        boxes.conf.cpu().tolist(),
                    ):
                        record = TrackRecord(
                            frame_index=frame_index,
                            timestamp_seconds=frame_index / source_fps,
                            track_id=int(track_id),
                            x1=float(box[0]),
                            y1=float(box[1]),
                            x2=float(box[2]),
                            y2=float(box[3]),
                            detector_confidence=float(confidence),
                        )
                        records.append(record)
                        track_ids.add(record.track_id)
                        records_file.write(json.dumps(asdict(record)) + "\n")
                    annotated = _annotate(frame, boxes, class_names)
                else:
                    annotated = frame

                writer.write(annotated)
                frame_index += 1
    finally:
        capture.release()
        writer.release()

    elapsed = time.perf_counter() - started
    metrics = TrackingMetrics(
        source=str(source_path),
        model=str(model_file),
        source_fps=source_fps,
        source_resolution=(width, height),
        frames_processed=frame_index,
        frames_with_tracks=frames_with_tracks,
        total_track_records=len(records),
        unique_track_ids=len(track_ids),
        processing_duration_seconds=elapsed,
        end_to_end_fps=frame_index / elapsed if elapsed else 0.0,
        detector_inference_seconds=detector_seconds,
        detector_inference_fps=frame_index / detector_seconds if detector_seconds else 0.0,
    )
    metrics_path = output_jsonl_path.with_name(output_jsonl_path.stem + "_metrics.json")
    metrics_path.write_text(json.dumps(asdict(metrics), indent=2) + "\n", encoding="utf-8")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Kerb YOLO + ByteTrack perception.")
    parser.add_argument("--source", required=True, help="Input video path")
    parser.add_argument("--model", default="models/kerb_yolo11n_plus_d3.pt")
    parser.add_argument("--output", required=True, help="Annotated output video path")
    parser.add_argument("--records", required=True, help="Tracking JSONL output path")
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--conf", type=float, default=0.25)
    args = parser.parse_args()
    metrics = track_video(
        args.source,
        args.model,
        args.output,
        args.records,
        imgsz=args.imgsz,
        conf=args.conf,
    )
    print(json.dumps(asdict(metrics), indent=2))


if __name__ == "__main__":
    main()
