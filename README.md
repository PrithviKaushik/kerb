# KERB — Preserve the Curve

**AI finds the incident. The steward makes the decision.**

KERB is a **steward-assist** system for finding and reviewing potential track-limit
incidents in race footage. It is an evidence engine — **not an automatic referee** —
and it never issues penalties. Every output is a reviewable candidate
(`NO_VIOLATION`, `VIOLATION_CANDIDATE`, or `UNCERTAIN`) surfaced for human
stewards, who make the final sporting decision.

> **Authors:** Waqar Akhtar · Prithvi Kaushik
>
> **Built for:** TrackShift 2026 · Plaksha University

## What KERB does

Race footage is a needle-locator problem: many cars, many frames, brief and
partially-occluded moments. KERB turns that footage into structured,
human-reviewable evidence:

<p align="center">
<code>
VIDEO → YOLO + ByteTrack → vehicle geometry → approximate contact regions
→ legal boundary → four-outside rule → 3-of-5 temporal filter
→ trust score → evidence package → STEWARD REVIEW REQUIRED
</code>
</p>

Every stage emits real measurements and real artifacts. Approximate contact
markers are **never** described as detected tire centers; invisible or
unobservable geometry is always reported `UNCERTAIN`, and a boundary-touching
contact is **not** treated as "outside".

## Repository contents

```text
.
├── backend/                 # FastAPI service + skills
│   ├── api/                 #   routes, providers, session store, media helpers
│   ├── knowledge/           #   rule registry (TL-001, BD-001, CT-001, …)
│   ├── reports/             #   in-memory report repository + steward review
│   └── skills/
│       ├── perception/      #   YOLO + ByteTrack → TrackRecord JSONL + metrics
│       ├── geometry/        #   contact regions + boundary relation
│       ├── surface/         #   manual boundary calibration → legal-track mask
│       ├── video/           #   ffmpeg probe + frame extraction
│       └── incident_report/ #   four-outside, temporal, trust, evidence, report
├── frontend/                # Next.js (App Router) product shell
└── data/audit/              # committed A5 demo evidence bundle (see below)
```

## Demo that works out of the box

The recorded demo needs **no model, no supplied footage, and no local data**.
The compact A5 evidence bundle is committed under `data/audit/` and served via
`/api/demo/*` — a tracked clip tracked with a fine-tuned YOLO11n (`d3 + a5`),
a manually calibrated white-line boundary, spatial frame classifications, an
incident intelligence pass, and browser-playable video.

Measured on the committed bundle (CPU, Intel Iris Xe, 2304×1440 @ 29 fps source):

| Metric | Value |
| --- | --- |
| Frames processed | 145 |
| Frames with tracks | 141 |
| Persistent track IDs | 1 |
| Detector inference | 17.7 fps |
| End-to-end tracking | 12.1 fps |

## Getting started

### 1. Backend

Requires Python 3.14 and [`uv`](https://docs.astral.sh/uv/). CPU-only PyTorch
wheels are pinned in `pyproject.toml` — no CUDA needed.

```bash
uv sync
uv run python -m uvicorn backend.api.main:app --reload --port 8000
```

- Health check: `http://127.0.0.1:8000/api/health`
- OpenAPI: `http://127.0.0.1:8000/docs`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev        # open http://localhost:3000
```

The API client defaults to `http://127.0.0.1:8000`. Override with
`NEXT_PUBLIC_API_BASE_URL`.

### 3. Run the demo

Open **http://localhost:3000/demo** — the live pipeline page walks every skill
in order using the committed A5 artifacts:

1. **Frame extraction** — keyframes from the recorded clip.
2. **YOLO + ByteTrack** — tracking video + `TrackRecord` JSONL + metrics.
3. **Surface + Boundary** — whole-frame spatial state on the manually
   calibrated white-line boundary.
4. **Incident intelligence** — four-outside reasoning, temporal support,
   deterministic trust score, evidence package.
5. **Steward review** — the candidate with `STEWARD REVIEW REQUIRED`.

### 4. Upload your own clip

The `/analysis`-style session workflow (`/api/sessions`, or the `Uploaded clip`
panel on the demo page) runs the same skills on a clip you supply:

- Upload (capped at 30 s) → probe → keyframe extraction.
- Manual boundary calibration on a keyframe (pixel polyline, legal side).
- `YOLO + ByteTrack` background job, then geometry + incident intelligence.

This path **requires a fine-tuned model** at `models/kerb_yolo11n_plus_d3_and_a5.pt`
(class `0` = `f1_car`, CPU). The weights are intentionally **not** committed;
place them there and the upload flow works unchanged.

## Core reasoning

### Four-outside frame rule

All four approximate contact regions must be `OUTSIDE` **simultaneously**:

- Any `INSIDE` or `ON_BOUNDARY` region → `NO_VIOLATION`
- Any `UNKNOWN` critical region → `UNCERTAIN` (never assume an invisible tire is out)
- All four `OUTSIDE` → `VIOLATION_CANDIDATE`

### 3-of-5 temporal filter

A supporting frame count inside a track-specific five-frame window. This is a
**reliability filter**, not the sporting regulation.

### Deterministic trust score

| Factor | Points |
| --- | ---: |
| Base | 50 |
| Stable tracking | +15 |
| Clear boundary | +10 |
| Contact visibility | +10 |
| Geometric margin | +10 |
| Temporal support | +5 |
| **Max** | **100** |

Bands: 90–100 `HIGH`, 75–89 `MEDIUM_HIGH`, 60–74 `MEDIUM`, <60 `LOW`.
An unobservable critical contact region caps the score at 59 and forces
`UNCERTAIN`. The score is a heuristic, not a calibrated probability.

### Vocabulary

- AI states: `NO_VIOLATION` · `VIOLATION_CANDIDATE` · `UNCERTAIN`
- UI always ends with **STEWARD REVIEW REQUIRED**
- Steward decisions are separate: `TRACK_LIMIT_EXCEEDED` · `TRACK_LIMIT_NOT_EXCEEDED`

The central safety property: **AI assessment ≠ steward decision.**

## API map

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Backend + FFmpeg availability |
| `POST` | `/api/video/probe` | Probe video metadata / frame count |
| `POST` | `/api/video/extract-frames` | Extract PNG frames |
| `GET` | `/api/demo/state` | Live pipeline stage overview (committed A5 bundle) |
| `GET` | `/api/demo/tracks` · `/spatial` · `/geometry` | Perception / surface / geometry artifacts |
| `GET` | `/api/demo/perception/video` · `/surface/video` | Browser-playable tracking / surface video |
| `GET` | `/api/demo/frames/{name}` | Extracted keyframes |
| `GET` | `/api/demo/incident` | Incident evidence for the recorded clip |
| `POST` | `/api/sessions` | Save upload + probe + keyframe extraction |
| `POST` | `/api/sessions/{id}/track` | Background YOLO + ByteTrack job |
| `POST` | `/api/sessions/{id}/boundary` | Save manual boundary calibration |
| `POST` | `/api/sessions/{id}/run` | Geometry + incident intelligence → report |
| `GET` | `/api/incidents` · `/api/reports` | Incident queue / report archive |
| `POST` | `/api/reports/{id}/review` | Append steward decision |

## Demo cases baked into the pipeline

| Case | Outcome |
| --- | --- |
| Clear legal pass | `NO_VIOLATION` |
| Clear violation candidate with evidence | `VIOLATION_CANDIDATE` (high trust) |
| Near-line / boundary touching | `NO_VIOLATION` (proximity is not a violation) |
| Poor observability | `UNCERTAIN` (invisible evidence is never fabricated) |

## Tech stack

**Backend:** Python 3.14 · FastAPI · Uvicorn · Ultralytics YOLO11n + ByteTrack ·
OpenCV · FFmpeg/ffprobe · CPU PyTorch (via `uv`).

**Frontend:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Framer Motion · Lucide.

## Scripts & tests

```bash
# Perception skill (standalone)
uv run python -m backend.skills.perception.tracking \
  --source clip.mp4 --model models/kerb_yolo11n_plus_d3_and_a5.pt \
  --output out.mp4 --records out.jsonl

# Unit tests (deterministic; no model required)
uv run python -m unittest discover -s backend -p "test_*.py"
```

## Limitations

- One fixed camera, one track-limit zone, manual boundary — by design.
- Contact regions are approximate markers, not tire-center detectors.
- Uploaded-session perception needs the external (uncommitted) model checkpoint.
- The report repository is in-memory and resets on restart.
- Multi-camera fusion, 3D reconstruction, automatic calibration, and calibrated
  probabilities are explicitly out of scope.
- No autonomous sporting adjudication or penalty issuance — ever.

## License

No license file — do not assume one for this repository.