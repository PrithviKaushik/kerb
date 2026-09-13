from __future__ import annotations

from .models import TemporalEvidence

def temporal_evidence_to_dict(
    evidence: TemporalEvidence,
) -> dict:

    return {
        "track_id": evidence.track_id,

        "event_timestamp_s": round(
            evidence.event_timestamp_s, 3
        ),

        "window_start_s": round(
            evidence.window_start_s, 3
        ),

        "window_end_s": round(
            evidence.window_end_s, 3
        ),

        "eligible_frames": evidence.eligible_frames,
        "supporting_frames": evidence.supporting_frames,

        "temporal_support": evidence.temporal_support,

        "mode": evidence.mode,

        "frames": [
            {
                "frame_index": frame.frame_index,
                "timestamp_s": round(
                    frame.timestamp_s, 3
                ),
                "track_id": frame.track_id,
                "four_outside": frame.four_outside,
                "is_event": frame.is_event,
            }
            for frame in evidence.frames
        ],
    }