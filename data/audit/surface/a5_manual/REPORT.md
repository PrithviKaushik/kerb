# A5 manual-boundary demo

- boundary: `data/audit/surface/a5_manual_boundary.json` (keyframes [0, 35, 70, 105, 140], legal side = left)
- records classified: 141
- spatial states: {'OUTSIDE': 37, 'BOUNDARY': 41, 'UNCERTAIN': 57, 'INSIDE': 6}
- surface states: {'LEGAL_TRACK': 66, 'OFF_TRACK': 68, 'UNKNOWN': 11}
- transition band: 26px

Classification came from the unchanged whole-bbox classifier applied to a boundary-fused label mask (manual polyline + estimator appearance cues) - no state was manufactured.
- artifacts: `a5_manual`
