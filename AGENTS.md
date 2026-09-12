# Kerb — Agent Engineering Contract

Kerb is a **steward-assist system** for identifying potential track-limit violations from race video. It is an evidence engine, **NOT an automatic referee** and never issues penalties. Every output is a candidate event (`VIOLATION_CANDIDATE`, `NO_VIOLATION`, or `UNCERTAIN`) for human steward review.

## Repo state and layout

- This repo is currently **docs-only**: no source code, no commits, no package manager, no test harness. Do not assume `pytest`, `uv`, `npm`, or any toolchain exists until it appears in the tree.
- Read `Documents/` before substantial work; it is the authoritative project knowledge:
  - `Kerb_Hackathon_Build_Plan_MVP.md` — the sprint-locked build plan; **source of truth for engineering decisions**.
  - `Kerb_Technical_Direction_MVP_Validation.md` — internal technical direction and validation framework.
  - `Mentorship-Guide-How-to-handle-the-mentors.txt` — consult only when asked about mentorship rounds / per-round deliverables.
  - `Guide for AGENTS.md` — archived full-length version of an earlier AGENTS.md; reference only, NOT authoritative.
- Conflict rule: prefer the official problem/orientation for sporting requirements; prefer the build plan for engineering decisions. Flag conflicts to the human rather than inventing a requirement.

## Environment (verified)

- **CPU-only.** No discrete/NVIDIA GPU (Intel Iris Xe). Never add CUDA paths; torch must use CPU wheels.
- Python 3.14.7 is the only interpreter and has no system `pip`. Use `uv` (already installed) for a `.venv`. PyPI is reachable and has working cp314 wheels for torch/opencv-python/ultralytics.
- `ffmpeg`/`ffprobe` 8.1.2 present for clip inspection and trimming.
- Fedora 44, x86_64, 8 cores, 31 GB RAM, ~449 GB free.

## MVP scope

One vertical slice: fixed camera, one track-limit zone, recorded footage, manual boundary, YOLO + ByteTrack, approximate contact regions, four-outside rule, 3-of-5 temporal filter, trust score, steward evidence (workstreams A/B/C producing structured event JSON).

**Out of scope — do not build:** multi-camera fusion, full 3D reconstruction, automatic calibration, cross-camera re-identification, calibrated probabilities, custom tire-keypoint training, guaranteed broadcast real-time.

## Pipeline (locked)

```
VIDEO → YOLO → ByteTrack → vehicle geometry/mask → approximate contact regions
     → legal boundary → four-outside rule → 3-of-5 temporal filter
     → trust score → evidence package → STEWARD REVIEW REQUIRED
```

Keep perception, geometry, sporting logic, reliability, and evidence modular. Ship the vertical slice before improving sophistication; kill any component that adds complexity without visible demo value.

## Sprint-locked decisions

### Contact-region hierarchy
Never describe any of these as detected tire centers; label them approximate contact markers.
1. **Vehicle mask** — visible lower contour + orientation → four contact regions with confidence.
2. **Box proxy** (deterministic): with box `(x1,y1)-(x2,y2)`, `w=x2-x1`, `h=y2-y1`:
   - `contact_y = y2 - 0.05 * h`
   - `left_x  = x1 + 0.20 * w`, `right_x = x1 + 0.80 * w`
   - front/rear from tracked displacement; fixed-camera fallback = image horizontal axis if motion is unstable.
3. **Unreliable geometry** (occluded, too small, blurred, extreme angle, poor tracking) → `UNCERTAIN`. Never assume an invisible tire is outside.

### Boundary
Manual polyline/polygon first. Lightweight refinement (color thresholding, edge detection, line/curve fitting, stabilization) only inside a manually-defined corridor, hard timebox ≤45–60 min; if unstable, return to the best manual boundary.

### Sporting rule vs reliability filter
- **Frame condition (candidate):** ALL FOUR contact regions OUTSIDE simultaneously. Contact with the boundary counts as **not outside**.
- **Reliability filter:** 3 of 5 frames. This is a noise filter, never described as the sporting regulation.

### Trust score (deterministic heuristic)
Start 50; +15 stable tracking, +10 clear boundary, +10 contact-region visibility, +10 geometric margin, +5 temporal support → max 100.
Bands: 90–100 HIGH, 75–89 MEDIUM-HIGH, 60–74 MEDIUM, <60 LOW/UNCERTAIN.
If a critical contact region is unobservable: cap at 59 and classify `UNCERTAIN`. Not a calibrated probability.

### Output vocabulary
Use `NO_VIOLATION`, `VIOLATION_CANDIDATE`, `UNCERTAIN`. Never `PENALTY`, `PENALTY_ISSUED`, `GUILTY`, `AUTOMATIC_VIOLATION`. UI language ends with `STEWARD REVIEW REQUIRED`.

### Event schema (semantic minimum)
`track_id`, `timestamp`, `peak_frame`, `state`, `trust_score`, `contact_regions`, `boundary`, `evidence_frames`, `reasons`, `review_required`. The UI consumes structured event output, never internal CV internals.

## Demo cases (all four must be supported)
- **A — Clear legal pass** → `NO_VIOLATION`
- **B — Clear violation candidate** → `VIOLATION_CANDIDATE` with evidence + high trust
- **C — Near-line / boundary touching** → `NO_VIOLATION` (proximity is not a violation)
- **D — Poor observability** → `UNCERTAIN` (never fabricate invisible tire evidence)

## Data and measurement
- Use real target-domain footage first; small deliberately-selected clips covering the demo cases. No large dataset collection before the first working pipeline.
- Target footage (Abu Dhabi clips, build plan §10) is **pending human supply**. Do not silently substitute.
- Until it arrives, sibling `~/Hackathons/trackshift/Dataset/` (31 × 1080p50 TCR clips) is acceptable for perception validation only — repo-external, never committed or hardcoded.
- Keep supplied clips in `data/` (gitignored); config points at repo-relative paths, never absolute home paths.
- Never split adjacent frames from the same event into independent train/test samples; report metrics split by clip/shot/event.
- Measure detection, tracking, and full-pipeline FPS plus hardware. Never claim real-time based on an individual model's speed.

## Testing
Write deterministic unit tests for at least:
- Boundary relation: inside / on boundary / outside.
- Four-contact rule: only 4/4 outside satisfies the condition; boundary-touching contact is not outside.
- Temporal filter: 0–2/5 positive → reject; 3–5/5 positive → accept.
- Uncertainty: any critical unobservable contact region blocks a high-trust violation.

## Code quality
Meaningful names, small functions, type hints where useful, comments explaining WHY not WHAT, no dead code, no machine-specific paths. Camera-specific values (video path, boundary, thresholds, contact constants, temporal window, trust parameters) must be configuration, not buried in source.

## Agent conduct
Autonomously: inspect files/history, run existing tests/scripts, create small modules, add tests, fix bugs, measure performance.
**Ask the human before:** changing core architecture, changing a sprint-locked decision, adding a major ML model, collecting a large dataset, replacing detection/tracking strategy, adding substantial infrastructure, removing a capability, changing sporting semantics.
On failure: diagnose → simplest local fix → report evidence → propose smallest viable alternative. Do not silently redesign.

## Git discipline
Baseline docs are committed. Do not push unless explicitly asked. Keep changes logically grouped, avoid formatting churn, and never track `data/`, footage, generated videos, or datasets. Report back after significant tasks: what changed, why, files, dependencies, commands, tests, measured results, known limitations, next bottleneck.

## Current mission
> Prove real race footage passes through YOLO + ByteTrack with persistent vehicle IDs and measured performance.

Do NOT implement tire logic, boundary logic, temporal/trust logic, or UI until the perception foundation is validated on actual footage, unless the human explicitly requests parallel work.