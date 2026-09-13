# backend/skills/surface

Whole-bbox track-surface spatial analysis (Phase 1) — a classical-CV baseline.

## What this is

Per frame it estimates a pixel-level surface label over a configurable search
ROI (`LEGAL_TRACK` / `OFF_TRACK` / `UNKNOWN`) and computes a deterministic
`surface_confidence`. Then, for every ByteTrack record, it samples the ENTIRE
det box (never the bottom edge, never tyre points) into per-bbox fractions and
classifies the box as `INSIDE` / `OUTSIDE` / `BOUNDARY` / `UNCERTAIN`.

This component does NOT decide violations, detect shots, or do temporal logic.

## Pipeline

```
frame → ROI → HSV appearance rules → surface mask (TRACK/OFF/UNKNOWN)
     → mask-quality stats → surface_confidence + surface_state
     → + ByteTrack bbox → bbox fractions → spatial_state
```

## `surface_confidence` — exact deterministic definition

Per frame, over the ROI:

```
known_fraction        = (track_px + off_track_px) / roi_px
separation            = |mean(V)_track − mean(V)_off_track| / 255
                        (0.5 when exactly one class present, 0.0 when none)
continuity            = largest 8-connected LEGAL_TRACK component / track_px
                        (0.0 when no track pixels)
temporal_consistency  = fraction of ROI pixels whose label equals previous frame
                        (1.0 on the first frame)

surface_confidence =
      0.40 * known_fraction
    + 0.30 * separation
    + 0.20 * continuity
    + 0.10 * temporal_consistency
```

All components in `[0,1]`, weights sum to 1 → confidence in `[0,1]`. Weights are
config (camera/view `metrics` block). Rationale: known coverage is the most
important signal (cannot trust an estimate of pixels we cannot label);
separation measures whether track and off-track actually look different in
this frame; continuity rejects fragmented/noisy masks; temporal consistency
stabilises the estimate.

`surface_state` (frame level):

- `UNKNOWN` if `known_fraction < usable_known_fraction` (default 0.5)
- else `LEGAL_TRACK` if `track_px >= off_track_px`, otherwise `OFF_TRACK`

## Pixel labelling rules (priority order)

1. default = `LEGAL_TRACK` (mid-brightness, low-saturation gray/asphalt)
2. grass-green hue + saturation + brightness → `OFF_TRACK` (morph closed/opened)
3. very dark (shadow / obscured) → `UNKNOWN`
4. saturated non-green colour (cars, graphics, kerb, skid marks) → `UNKNOWN`
5. white (bright + low-sat) dilated by `transition_dilation_kernel` → `UNKNOWN`
   (the white line / kerb is only a transition *cue* that widens an UNKNOWN
   band; it is never asserted to be "the boundary")

`UNKNOWN` is a first-class state and is NEVER counted as off-track.

## Whole-bbox classification

For a box `(x1,y1)-(x2,y2)` with `bbox_area`:

```
legal_track_fraction + off_track_fraction + unknown_fraction = 1
```

ROI-outside portions of the box count as `UNKNOWN` (unestimated evidence).

Classifier order:

1. invalid / tiny box (< `minimum_box_width/height`) → `UNCERTAIN`
2. `surface_confidence < min_surface_confidence` → `UNCERTAIN`
3. `known_fraction < min_known_fraction` → `UNCERTAIN`
4. else, with `track_share = legal_track_fraction / known_fraction`:
   - `track_share >= inside_track_share` and `legal_track_fraction >= min_dominant_fraction` → `INSIDE`
   - `track_share <= outside_track_share` and `off_track_fraction >= min_dominant_fraction` → `OUTSIDE`
   - otherwise → `BOUNDARY`

Every threshold is config (`classifier` block); none is baked into source.

## Configuration scope

Configuration is scoped to camera/view + track-limit zone (`config/*_camera_view.json`),
never a video filename. The ROI is a SEARCH region (derived mechanically from
the tracked-vehicle workspace on the sample footage), NOT a hard-coded boundary
or white-line polyline. No algorithm branches on camera identity.

## Usage

```
.venv/bin/python -m backend.skills.surface.pipeline \
  --video data/raw/a5.mp4 \
  --records data/audit/perception_tracking/a5_adapt/a5_tracks.jsonl \
  --config backend/skills/surface/config/a5_camera_view.json \
  --output data/audit/surface/a5/a5_surface.jsonl \
  --metrics-out data/audit/surface/a5/a5_surface_metrics.json

.venv/bin/python -m backend.skills.surface.visualize \
  --video data/raw/a5.mp4 \
  --records data/audit/surface/a5/a5_surface.jsonl \
  --config backend/skills/surface/config/a5_camera_view.json \
  --output data/audit/surface/a5/a5_surface_visualization.mp4
```

## Output record

`frame_index, timestamp_seconds, track_id, bbox, bbox_area,`
`legal_track_pixel_count, off_track_pixel_count, unknown_pixel_count,`
`legal_track_fraction, off_track_fraction, unknown_fraction,`
`surface_confidence, surface_state, spatial_state, uncertainty_reasons, shot_id`

## A5 manual legal-boundary demo (calibrated white line)

The A5 remote demo uses a brightly CALIBRATED polyline for the legal track-limit
white line (never inferred). Keyframes `0, 35, 70, 105, 140` are clicked by a
human; per-frame polylines are arclength re-sampled and linearly interpolated
between neighbouring keyframes. The interpolated polyline is rasterised into a
label mask — asphalt side LEGAL_TRACK, beyond-the-line side OFF_TRACK, the line
vicinity (transition band) UNKNOWN — fused with the unchanged estimator's
UNKNOWN/OFF_TRACK cues, then scored by the unchanged whole-bbox classifier.

```
.venv/bin/python -m backend.skills.surface.calibrate \
  --video data/raw/a5.mp4 \
  --output data/audit/surface/a5_manual_boundary.json \
  --scale 0.7

.venv/bin/python -m backend.skills.surface.run_manual_boundary \
  --video data/raw/a5.mp4 \
  --records data/audit/perception_tracking/a5_adapt/a5_tracks.jsonl \
  --boundary data/audit/surface/a5_manual_boundary.json \
  --config backend/skills/surface/config/a5_manual_demo.json \
  --output-dir data/audit/surface/a5_manual
```

## Tests

```
.venv/bin/python -m unittest backend.skills.surface.tests.test_surface backend.skills.surface.tests.test_manual_boundary
```

Covers: appearance rules (gray/grass/white-line band/saturated/dark), the
confidence formula bounds, the UNKNOWN-never-OFF-track invariant, bbox fraction
sum, OUTSIDE/BOUNDARY/INSIDE mixtures, low-confidence/tiny/outside-ROI → UNCERTAIN,
and config validation.