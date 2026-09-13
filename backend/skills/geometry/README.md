# Kerb Geometry Stage

This module consumes YOLO + ByteTrack records and emits a **conservative vehicle-footprint estimate** plus its per-frame **spatial relation to the configured legal boundary**. It does not detect tyres/tires, estimate contact points, make a sporting decision, or implement the 3-of-5 temporal filter. It is a steward-assist evidence stage only.

## Approach

No tyre detection, no keypoints, no segmentation. The footprint is derived deterministically from the tracked YOLO bounding box:

- `h > w` (tall/narrow): `FULL_BOX` — footprint equals the whole bounding box `[x1, y1, x2, y2]`.
- `w >= h` (wide/low): `LOWER_BOX` — footprint is the bottom portion `[x1, y1 + lower_box_fraction * h, x2, y2]`.

`lower_box_fraction` is a config parameter (default `0.5`), never a visual assumption baked into source. The footprint is an approximate marker of where the vehicle meets the track surface; it is NOT the tyre positions.

Motion history is retained only as an observability signal. It does not assign front/rear and does not alter the footprint.

## Spatial classification (per frame)

The 4 footprint corners are compared against the configured boundary polyline/polygon via signed perpendicular distance. The inside side is a per-camera config decision (`inside_side: "left_of_direction" | "right_of_direction"`), never inferred from the image.

- All corners inside by more than `boundary_touch_tolerance_pixels` → `INSIDE`
- All corners outside by more than the tolerance → `OUTSIDE`
- Any corner within tolerance (touching) or corner signs mixed (intersecting) → `BOUNDARY` — **touching/intersecting is never `OUTSIDE`**
- Unreliable geometry or unusable boundary → `UNCERTAIN`

`OUTSIDE` is evidence for a potential violation, but the 3-of-5 temporal confirmation belongs to the later event/rule layer, not this module.

Boundary configuration is camera-specific (e.g. `config/d5_manual_boundary.json`). The d5 file is an example only and must not be used as a legal boundary for any other camera.

The single calibrated MVP camera/view/zone is `config/a5_demo_boundary.json` (camera `a5_demo`, view `a5_fixed_camera_view_1`, zone `a5_kerb_zone_1`). Its `boundary.points` are manually provided once by a human from an extracted A5 frame and reused for all footage from that camera/view/zone; they are never inferred automatically and never made per-video.

## Output record

`frame_index`, `timestamp_seconds`, `track_id`, `bbox`, `detector_confidence`, `motion_direction`, `motion_status`, `footprint`, `geometry_mode`, `geometry_status`, `spatial_state`, `boundary_relation` (with signed distances for explainability), `uncertainty_reasons`.

For `fixed_camera_horizontal_fallback: true`, a horizontal-only direction may be used when sufficient horizontal displacement exists but a full smoothed direction is unavailable. The fallback never fabricates a footprint; records without sufficient history or displacement remain `UNCERTAIN`.