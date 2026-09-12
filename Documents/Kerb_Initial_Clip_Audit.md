# Kerb Initial Clip Observability Audit

## Purpose and Scope

This document is the human observability-audit worksheet for the complete supplied clip set currently present in `data/raw/`. The set contains 17 clips. It is an event-level audit, not exhaustive frame-by-frame labeling.

Objective metadata is collected automatically and marked `[auto]`. All semantic and observability fields are intentionally blank until a human reviewer watches the clips. No label is inferred from a filename, selection context, warning, penalty, or clip name.

## Reviewer Instructions

1. First watch each clip once at normal speed without pausing.
2. Do not infer the outcome from the filename or selection context.
3. Identify the target car, boundary, event window, and camera characteristics first.
4. Then inspect selected frames around the event.
5. Evaluate each of the four contact regions independently.
6. Evaluate boundary visibility independently from contact-region visibility and position.
7. If a critical contact region cannot be established reliably, the eventual human verdict must be `UNCERTAIN`.
8. Clearly touching the boundary is not the same as being outside.
9. Do not apply the eventual 3-of-5 temporal filter during the initial human audit.
10. Record one event-level audit row per clip unless the human reviewer identifies a reason to document more than one event.

For contact regions, record visibility and position as separate fields. Do not collapse them into one label.

Allowed visibility values:

- `VISIBLE`
- `OBSCURED`
- `UNCLEAR`

Allowed position values when observable:

- `INSIDE`
- `ON_LINE`
- `OUTSIDE`
- `UNCERTAIN`

## Objective Clip Metadata

The following fields are `[auto]` values from `ffprobe` and are not human judgments.

| Clip | Filename [auto] | Resolution [auto] | FPS [auto] | Duration [auto] | Codec [auto] | Probe/read note [auto] |
|---|---|---:|---:|---:|---|---|
| d1 | `d1.mp4` | 1920x1080 | 50 | 6.58 s | H.264 | |
| d2 | `d2.mp4` | 1920x1080 | 50 | 11.36 s | H.264 | |
| d3 | `d3.mp4` | 1920x1080 | 50 | 19.06 s | H.264 | |
| d4 | `d4.mp4` | 1920x1080 | 50 | 14.66 s | H.264 | |
| d5 | `d5.mp4` | 1920x1080 | 50 | 14.00 s | H.264 | |
| d6 | `d6.mp4` | 1920x1080 | 50 | 7.12 s | H.264 | |
| d7 | `d7.mp4` | 1920x1080 | 50 | 7.88 s | H.264 | |
| d8 | `d8.mp4` | 1920x1080 | 50 | 5.58 s | H.264 | |
| d9 | `d9.mp4` | 1920x1080 | 50 | 19.06 s | H.264 | |
| d10 | `d10.mp4` | 1920x1080 | 50 | 10.48 s | H.264 | Decoder warning emitted; metadata probe completed successfully. |
| d11 | `d11.mp4` | 1920x1080 | 50 | 5.70 s | H.264 | |
| d12 | `d12.mp4` | 1920x1080 | 50 | 3.92 s | H.264 | |
| d13 | `d13.mp4` | 1920x1080 | 50 | 5.94 s | H.264 | |
| d14 | `d14.mp4` | 1920x1080 | 50 | 13.62 s | H.264 | |
| d15 | `d15.mp4` | 1920x1080 | 50 | 4.84 s | H.264 | |
| d16 | `d16.mp4` | 1920x1080 | 50 | 7.48 s | H.264 | |
| d17 | `d17.mp4` | 1920x1080 | 50 | 8.64 s | H.264 | |

## Human Audit Worksheet

The fields below are intentionally blank for human completion.

| Clip | Target car | Event type | Event window | Peak timestamp | Camera/view | Boundary visibility | FL visibility | FL position | FR visibility | FR position | RL visibility | RL position | RR visibility | RR position | Human verdict | Observability | Notes | Recommended validation/demo role |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| d1 | | | | | | | | | | | | | | | | | | |
| d2 | | | | | | | | | | | | | | | | | | |
| d3 | | | | | | | | | | | | | | | | | | |
| d4 | | | | | | | | | | | | | | | | | | |
| d5 | | | | | | | | | | | | | | | | | | |
| d6 | | | | | | | | | | | | | | | | | | |
| d7 | | | | | | | | | | | | | | | | | | |
| d8 | | | | | | | | | | | | | | | | | | |
| d9 | | | | | | | | | | | | | | | | | | |
| d10 | | | | | | | | | | | | | | | | | | |
| d11 | | | | | | | | | | | | | | | | | | |
| d12 | | | | | | | | | | | | | | | | | | |
| d13 | | | | | | | | | | | | | | | | | | |
| d14 | | | | | | | | | | | | | | | | | | |
| d15 | | | | | | | | | | | | | | | | | | |
| d16 | | | | | | | | | | | | | | | | | | |
| d17 | | | | | | | | | | | | | | | | | | |

### Human Field Definitions

| Field | Meaning |
|---|---|
| Target car | Human-identified vehicle to follow; do not infer from filename. |
| Event type | Human description of the observed event, if any. |
| Event window | Human-selected start/end time or frame range. |
| Peak timestamp | Human-selected strongest evidence time, if applicable. |
| Camera/view | Human description of camera angle, shot continuity, and view. |
| Boundary visibility | Human assessment of whether the relevant legal boundary is visible and usable. |
| Contact visibility | Independently record `VISIBLE`, `OBSCURED`, or `UNCLEAR`. |
| Contact position | When observable, independently record `INSIDE`, `ON_LINE`, `OUTSIDE`, or `UNCERTAIN`. |
| Human verdict | Human audit outcome using `NO_VIOLATION`, `VIOLATION_CANDIDATE`, or `UNCERTAIN`; do not auto-populate. |
| Observability | Human assessment of whether the evidence supports the four-contact decision. |
| Recommended validation/demo role | Human recommendation only; leave blank until review. |

Use these contact abbreviations consistently: `FL` front-left, `FR` front-right, `RL` rear-left, and `RR` rear-right. They identify worksheet columns only and do not imply that the corresponding contact region is visible.

## Coverage Matrix

This is a coverage inventory for the 17-clip set. Leave the clip references and notes blank until human review. Do not assign a category based on filenames or metadata.

| Coverage condition | Clip(s) after human review | Notes after human review |
|---|---|---|
| A — clear legal pass | | |
| B — clear violation candidate | | |
| C — near-line / boundary-contact case | | |
| D — poor observability / genuine uncertainty | | |
| Motion blur | | |
| Partial/poor boundary visibility | | |
| Occlusion | | |
| Multiple cars near the boundary | | |
| Camera movement/panning | | |
| Camera cuts | | |
| Other difficult visual conditions | | |

## Audit Workspace

The audit workspace is prepared without extracting frames:

- `data/audit/frames/d1/` through `data/audit/frames/d17/` are reserved for event-specific frame extraction after human review.
- `data/audit/contact_sheets/` is reserved for contact sheets created only around human-identified event windows.
- No dense frame extraction is performed across the 17 clips at this stage.

## Audit Status

- Supplied clips in current audit set: 17
- Objective metadata collection: complete
- Human semantic review: pending
- Event-specific frame extraction: pending human event windows
- ML inference: not performed
