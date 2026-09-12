# Kerb — Agent Engineering Contract

## 1. Project Mission

Kerb is a **steward-assist system** for identifying potential track-limit violations from race video.

It is NOT an autonomous referee and MUST NOT issue penalties.

The system's job is to:

1. Detect and track vehicles.
2. Establish the legal track boundary.
3. Estimate observable vehicle contact regions.
4. Evaluate the four-outside sporting condition.
5. Apply temporal reliability filtering.
6. Produce a system trust score.
7. Generate visual evidence for human steward review.

Every final incident output must remain a **potential violation / steward-review result**.

Never output an autonomous penalty decision.

---

## 2. Source of Truth

During the hackathon, the active project sources are:

1. Official Problem Statement
2. Organizer Orientation
3. Kerb Hackathon Build Plan & MVP Specification

The build plan contains the sprint-locked engineering decisions.

If an implementation idea conflicts with those sources:

- Prefer the official problem/orientation for sporting requirements.
- Prefer the build plan for engineering decisions.
- Do not silently invent a new requirement.
- Flag conflicts to the human rather than making a major architectural decision autonomously.

Archived research or speculative ideas are not automatically MVP requirements.

---

## 3. MVP Scope

The hackathon targets ONE reliable vertical slice:

- One target camera/view.
- One clearly defined track-limit zone.
- Recorded race footage.
- Fixed/manual boundary configuration.
- Vehicle detection.
- Persistent vehicle tracking.
- Approximate contact-region estimation.
- Four-outside rule.
- Lightweight temporal filtering.
- Trust score.
- Steward-facing evidence.

Do NOT expand scope unless explicitly requested.

Explicitly out of scope for the MVP:

- Multi-camera fusion.
- Full 3D reconstruction.
- Automatic camera calibration.
- Every circuit/camera type.
- Cross-camera re-identification.
- Statistically calibrated probabilities.
- Autonomous penalty decisions.
- Custom tire-keypoint training unless the simple approach demonstrably fails.
- Guaranteed broadcast-grade real-time performance.

---

## 4. Core Architecture

The intended pipeline is:

VIDEO
→ YOLO vehicle detection
→ ByteTrack
→ vehicle geometry / mask
→ approximate contact regions
→ legal boundary
→ four-outside rule
→ temporal reliability filter
→ trust score
→ evidence package
→ STEWARD REVIEW REQUIRED

Keep these concerns modular.

Perception, geometry, sporting logic, reliability, and evidence generation should not be unnecessarily coupled.

---

## 5. Engineering Philosophy

### Prefer:

- Simple deterministic methods.
- Existing pretrained models.
- Small composable functions.
- Explicit intermediate representations.
- Measured performance.
- Reproducible commands.
- Clear logs.
- Honest uncertainty.
- Minimal dependencies.
- Small changes that can be tested quickly.

### Avoid:

- Architecture astronautics.
- Premature abstraction.
- Training models without evidence that they are necessary.
- Large dependency additions.
- Generalizing beyond the selected camera/zone.
- Building infrastructure before proving the pipeline.
- Optimizing components that have not been measured.
- Hiding uncertainty.
- Fabricating evidence.

### Hackathon rule

**Ship the vertical slice before improving sophistication.**

If a simpler implementation works sufficiently for the selected demo footage, use it.

---

# 6. Sporting Rule vs Engineering Reliability

These are separate concepts.

## Sporting condition

A candidate violation occurs when:

> All four tires/contact regions are outside the legal track boundary at the same time.

A tire touching the legal boundary counts as **not outside**.

Do not change this condition merely because temporal filtering is being used.

## Temporal reliability

The MVP uses:

> 3 of 5 frames

as a reliability filter.

This is NOT a claim that the sporting regulations require three frames.

Never describe the 3-of-5 filter as the sporting rule.

---

# 7. Contact-Region Hierarchy

Contact regions are approximations in the MVP.

Never describe them as exact detected tire centers unless a future implementation genuinely provides that evidence.

## Level 1 — Usable vehicle mask

If a reliable vehicle instance mask exists:

- derive the visible lower vehicle contour,
- estimate vehicle orientation,
- derive four approximate contact regions,
- assign confidence based on observability and mask quality.

## Level 2 — No usable mask

Use deterministic bounding-box geometry.

Given:

x1, y1 = top-left  
x2, y2 = bottom-right

w = x2 - x1  
h = y2 - y1

Approximate contact line:

contact_y = y2 - 0.05 * h

Left/right columns:

left_x = x1 + 0.20 * w  
right_x = x1 + 0.80 * w

Use tracked displacement to estimate the vehicle's longitudinal direction.

If motion direction is unstable, use the fixed-camera fallback defined in the build plan.

These four points are:

- rear-left
- rear-right
- front-left
- front-right

They are **contact-region proxies**.

Label them accordingly in user-facing output.

## Level 3 — Unreliable geometry

If the vehicle is:

- heavily occluded,
- too small,
- severely blurred,
- at an extreme angle,
- poorly tracked,
- or otherwise unsuitable for four-contact estimation,

return:

UNCERTAIN

Never assume an invisible tire is outside.

---

# 8. Boundary Strategy

Start with:

MANUAL BOUNDARY

For the selected fixed camera/zone, use a manually configured polyline or polygon.

Test it across the selected clips.

Only introduce lightweight boundary refinement if the manual boundary demonstrably fails.

Possible refinement:

- color thresholding,
- edge detection,
- line/curve fitting,
- frame stabilization,
- refinement inside a manually defined corridor.

Boundary refinement has a hard timebox of approximately 30–60 minutes.

If refinement does not become reliable:

**return to the best manual boundary.**

Do not build a general-purpose learned boundary segmentation system during the core MVP sprint.

---

# 9. Trust Score

The MVP uses a deterministic heuristic.

Start at:

50

Add:

- Stable vehicle tracking: +15
- Clear boundary: +10
- Good contact-region visibility: +10
- Strong geometric margin: +10
- Temporal support: +5

Maximum:

100

Interpretation:

90–100 = HIGH TRUST  
75–89 = MEDIUM-HIGH  
60–74 = MEDIUM  
<60 = LOW / UNCERTAIN

This is a **System Trust Score**.

It is NOT a statistically calibrated probability.

If a critical contact region is unobservable:

- cap score at 59,
- classify as UNCERTAIN.

Never manufacture a high-confidence violation from incomplete evidence.

---

# 10. Uncertainty Is a First-Class Output

The system must be allowed to say:

UNCERTAIN

Examples:

- Contact region occluded.
- Vehicle too small.
- Boundary unreliable.
- Tracking unstable.
- Geometry insufficient.
- Camera does not support the four-tire decision.

Never force uncertain perception into:

- violation,
- no violation,

when the evidence does not support either.

This is a core product principle.

---

# 11. Evidence Requirements

Every candidate event should expose, where available:

- vehicle ID,
- frame number,
- timestamp,
- boundary,
- approximate contact regions,
- state,
- trust score,
- supporting temporal frames,
- reason/evidence factors.

Preferred event structure:

```json
{
  "track_id": 16,
  "timestamp": 84.32,
  "peak_frame": 1847,
  "state": "VIOLATION_CANDIDATE",
  "trust_score": 93,
  "contact_regions": [],
  "boundary": {},
  "evidence_frames": [],
  "reasons": [],
  "review_required": true
}
```

The exact schema may evolve, but the semantic information must remain available.

---

# 12. Output Vocabulary

Prefer these states:

- `NO_VIOLATION`
- `VIOLATION_CANDIDATE`
- `UNCERTAIN`

Never use:

- `PENALTY`
- `PENALTY_ISSUED`
- `GUILTY`
- `AUTOMATIC_VIOLATION`

The system is assisting a steward.

Final UI language should communicate:

`STEWARD REVIEW REQUIRED`

---

# 13. Video / Data Policy

Use the actual target-domain footage before expanding the dataset.

The first goal is to prove:

- cars can be detected,
- IDs persist,
- target zone is usable,
- processing speed is measurable.

Do not collect a huge dataset before the first working pipeline exists.

When evaluating data, prefer clips containing:

1. Clear legal passes.
2. Clear candidate violations.
3. Near-line / tire-touching cases.
4. Approaches to the boundary.
5. Blur.
6. Shadows/glare.
7. Partial boundary visibility.
8. Occlusion.
9. Multiple nearby cars.

Do not split adjacent frames from the same event into independent train/test examples and call them independent samples.

If metrics are reported, split by clip/shot/event where possible.

---

# 14. Performance Measurement

Measure performance rather than claiming real-time capability.

Record:

- input resolution,
- input FPS,
- number of frames,
- detection FPS,
- tracking/full-pipeline FPS,
- hardware used.

Do not describe the system as real-time merely because YOLO or another individual component can run in real time.

The MVP supports recorded footage.

---

# 15. Dependency Rules

Before adding a dependency:

1. Check whether the functionality already exists in the project.
2. Check whether the standard library can solve it.
3. Check whether an already-installed dependency provides it.
4. Prefer established, lightweight packages.
5. Add only what is necessary.

Do not replace package managers, frameworks, or project structure without explicit human approval.

After adding dependencies:

- update the appropriate dependency manifest,
- ensure reproducibility,
- document installation/run commands.

---

# 16. Code Quality

Write code suitable for a hackathon but not throwaway code.

Requirements:

- meaningful names,
- small functions,
- type hints where useful,
- clear interfaces,
- no giant monolithic scripts if avoidable,
- comments explaining WHY rather than obvious WHAT,
- no dead code,
- no hardcoded machine-specific paths,
- configuration separated from logic where practical.

Avoid overengineering.

---

# 17. Configuration

Camera-specific values must be configurable.

Examples:

- video path,
- boundary coordinates,
- detection confidence threshold,
- tracking settings,
- contact geometry constants,
- temporal window,
- trust-score parameters.

Do not bury camera-specific values throughout source files.

The MVP is intentionally fixed-camera, but the implementation should make changing the selected clip/zone reasonably straightforward.

---

# 18. Testing Strategy

Prioritize tests for deterministic logic.

At minimum, test:

### Boundary relation

- Clearly inside.
- On boundary.
- Clearly outside.

### Four-contact rule

- 0/4 outside.
- 1/4 outside.
- 2/4 outside.
- 3/4 outside.
- 4/4 outside.
- Boundary-touching contact.

Only 4/4 outside should satisfy the sporting candidate condition.

### Temporal filter

For a five-frame window:

- 0/5 positive → reject.
- 1/5 positive → reject.
- 2/5 positive → reject.
- 3/5 positive → accept.
- 4/5 positive → accept.
- 5/5 positive → accept.

### Uncertainty

Any critical unobservable contact region should prevent a high-trust violation result.

---

# 19. Demo Cases

The finished MVP must aim to support:

### A — Clear legal pass

Expected:

`NO_VIOLATION`

### B — Clear violation candidate

Expected:

`VIOLATION_CANDIDATE`

with evidence and high trust.

### C — Near-line / touching

Expected:

`NO_VIOLATION`

This demonstrates that proximity to the boundary is not itself a violation.

### D — Poor observability

Expected:

`UNCERTAIN`

This demonstrates that the system does not fabricate invisible tire evidence.

---

# 20. Workstreams

Keep the implementation compatible with three parallel workstreams.

## Workstream A — Perception

- YOLO
- ByteTrack
- vehicle geometry
- contact approximation
- FPS measurement

## Workstream B — Geometry / Rules

- manual boundary
- optional boundary refinement
- four-contact state
- temporal filter
- trust score

## Workstream C — Evidence / UI

- event visualization
- evidence frames
- candidate list
- trust score
- steward review state

The UI should be able to consume structured event output rather than depending directly on internal CV implementation.

---

# 21. Kill Criteria

Stop or simplify a component when it adds complexity without improving the demonstrated vertical slice.

Kill/defer:

- custom segmentation if manual boundary is sufficient,
- homography if image-space geometry is sufficient,
- tire-keypoint modeling if contact proxies work sufficiently,
- broad dataset collection if existing clips cover the required cases,
- multi-camera work unless explicitly requested,
- generalized infrastructure unrelated to the demo.

When uncertain between two approaches:

**choose the simpler measurable approach.**

---

# 22. Autonomous-Agent Rules

The coding agent may autonomously:

- inspect files,
- inspect git history/status,
- run existing tests,
- run existing scripts,
- create small implementation modules,
- add necessary tests,
- fix clear bugs,
- measure performance,
- improve code within the locked architecture.

The coding agent must ask the human before:

- changing the core architecture,
- changing a sprint-locked decision,
- adding a major ML model,
- collecting or downloading a large new dataset,
- replacing the chosen tracking/detection strategy,
- adding substantial infrastructure,
- removing an important capability,
- changing sporting semantics.

If an implementation approach fails:

1. Diagnose the failure.
2. Try the simplest local fix.
3. If the locked approach still demonstrably fails, report the evidence.
4. Propose the smallest viable alternative.
5. Do not silently redesign the system.

---

# 23. Timeboxing

This is a 24-hour hackathon.

Time is an engineering constraint.

When a task has a specified timebox, respect it.

Current first-sprint priorities:

### Hour 1

YOLO + ByteTrack on actual target footage.

### Hour 2

Manual boundary + contact approximation.

### Hour 3

Four-contact state + 3-of-5 filter + trust score + event output.

Then:

- evidence UI,
- demo cases,
- hardening,
- fallback package,
- presentation.

If a component is blocking the critical path, reduce scope before increasing complexity.

---

# 24. Git Discipline

Before substantial changes:

- inspect git status,
- keep changes logically grouped,
- avoid unrelated formatting churn,
- do not overwrite user work,
- do not commit generated videos/datasets unless explicitly intended.

Prefer small, meaningful commits where the repository workflow uses commits.

---

# 25. Reporting Back

After each significant task, report:

1. What changed.
2. Why it changed.
3. Files created/modified.
4. Dependencies added.
5. Commands to run.
6. Tests performed.
7. Measured results.
8. Known failures/limitations.
9. Recommended next bottleneck.

Do not report success merely because code executes.

For CV work, success must be demonstrated on actual target footage.

---

# 26. Definition of Done

The MVP is complete when:

- YOLO detects cars in target footage.
- ByteTrack maintains usable IDs.
- A fixed legal boundary exists.
- Contact regions can be estimated for selected demo cars.
- Four-outside logic works.
- Boundary-touching cases are not automatically flagged.
- Temporal filtering removes obvious frame-level noise.
- Candidate events contain evidence.
- Every candidate has a trust score.
- Poor observability can produce `UNCERTAIN`.
- UI clearly indicates steward review.
- Clear violation, clean pass, near-line, and uncertainty cases exist.
- Processing FPS has been measured.

---

# 27. Product Principle

The central technical/product principle is:

> Kerb is not an automatic referee. It is an evidence engine that tracks the same car, reasons about observable contact regions, explicitly handles uncertainty, and gives the steward the evidence required to make the final decision.

The implementation should preserve this principle.

---

# 28. Default Decision Rule

When deciding whether to build something:

```text
SHIP
if it improves the vertical slice.

DEFER
if it is useful but non-essential.

KILL
if it adds complexity without visible demo value.
```

When in doubt:

**Ask the human rather than inventing requirements.**

---

# 29. Current Mission

The immediate mission is:

> Prove that real race footage can pass through YOLO + ByteTrack with persistent vehicle IDs and measured performance.

Do not implement tire logic, boundary logic, temporal violation logic, trust scoring, or UI until the perception foundation has been validated unless the human explicitly asks for parallel work.