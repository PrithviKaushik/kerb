from __future__ import annotations

from dataclasses import asdict

from .models import EvidencePackage


def serialize_evidence_package(
    package: EvidencePackage,
) -> dict:
    data = asdict(package)

    data["event"]["timestamp_s"] = round(
        data["event"]["timestamp_s"], 3
    )

    data["temporal"]["window_start_s"] = round(
        data["temporal"]["window_start_s"], 3
    )

    data["temporal"]["window_end_s"] = round(
        data["temporal"]["window_end_s"], 3
    )

    for frame in data["frames"]:
        frame["timestamp_s"] = round(
            frame["timestamp_s"], 3
        )

    return data