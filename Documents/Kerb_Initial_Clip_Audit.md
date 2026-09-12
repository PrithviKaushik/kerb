# Kerb Initial Clip Observability Audit

## Purpose and Scope

This document is the human observability-audit worksheet for the complete supplied clip set currently present in `data/raw/`. The set contains 17 clips. It is an event-level audit, not exhaustive frame-by-frame labeling.

Objective metadata is collected automatically and marked `[auto]`. Human-provided first-pass observations are recorded only where explicitly supplied below. All other semantic and observability fields remain `TBD`. No label is inferred from a filename, selection context, warning, penalty, or clip name.

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

The fields below record the supplied first-pass human observations. Fields not explicitly supplied by the human reviewer remain `TBD`; no formal verdict is derived from the notes.

| Clip | Target car | Relevant boundary | Event type | Event window | Peak timestamp | Camera/view | Boundary visibility | FL visibility | FL position | FR visibility | FR position | RL visibility | RL position | RR visibility | RR position | Human verdict | Observability | Notes | Recommended validation/demo role |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| d1 | McLaren #4 | white line on outside of corner entry | TBD | 1–3 s | TBD | fixed camera, then pans to left along with car | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | car barely misses exceeding track limits; only 2 tyres exceed track limits | TBD |
| d2 | McLaren #4 | white line on right corner of video | TBD | 1–2 s | TBD | fixed but zooms out | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | no track limits exceeded; only two tyres exceed track limits | TBD |
| d3 | Aston Martin #14 | left grid line with ETIHAD written on it | TBD | 3–4 s | TBD | top view of the grid | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | car exceeds track limits | TBD |
| d4 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| d5 | Ferrari #16 | right track line at the top right of the frame | TBD | 2–4 s | TBD | top right of the frame; camera view is in front of the car with the car approaching | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | car comes out of a turn and has all 4 wheels outside the track-limit line while exiting | TBD |
| d6 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| d7 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| d8 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| d9 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| d10 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| d11 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| d12 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| d13 | Ferrari #16 | left track line at the left of the frame | TBD | 3–4 s | TBD | car approaching the camera from its front | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | car crosses track limits while exiting | TBD |
| d14 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| d15 | Williams #55 | left track line at the left of the frame | TBD | 1–3 s | TBD | car approaching the camera from its front | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | all 4 wheels beyond track limits | TBD |
| d16 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| d17 | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

### Human Field Definitions

| Field | Meaning |
|---|---|
| Target car | Human-identified vehicle to follow; do not infer from filename. |
| Relevant boundary | Human description of the boundary relevant to the event. |
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

The audit workspace contains full-clip coarse triage material from the earlier batch and event-specific material for the six clips with supplied first-pass observations:

- `data/audit/frames/d1/`, `d2/`, `d3/`, `d5/`, `d13/`, and `d15/` contain 10 FPS event-window frames.
- `data/audit/contact_sheets/d1.png`, `d2.png`, `d3.png`, `d5.png`, `d13.png`, and `d15.png` are the corresponding event-window contact sheets.
- The other 11 clips were not processed for this event-window extraction.

## Audit Status

- Supplied clips in current audit set: 17
- Objective metadata collection: complete
- Human first-pass audit entries recorded: 6 clips (`d1`, `d2`, `d3`, `d5`, `d13`, `d15`)
- Detailed contact-region audit: pending
- Event-specific frame extraction for supplied windows: complete for the 6 recorded clips
- ML inference: not performed
