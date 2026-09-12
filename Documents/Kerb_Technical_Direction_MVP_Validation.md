# Kerb — Technical Direction & MVP Validation

## Problem Statement 2: AI Steward-Assist Agent for Track Limit Violation Detection

**Status:** Final internal direction document  
**Purpose:** Freeze the engineering direction before implementation and define the minimum defensible MVP.

---

## 1. Executive Summary

Kerb is an AI-assisted video analysis system intended to help motorsport stewards identify potential track-limit violations. It is a **decision-support tool, not an autonomous race-control system**.

The organizer's orientation frames the problem as a **spatio-temporal reasoning problem** rather than a simple computer-vision classification task. The system must follow the same vehicle across frames, determine the vehicle's relationship to the legal boundary, reason about the four tire/contact regions simultaneously, and provide the steward with evidence for review.

The central design principle is:

> **Perception identifies what is visible; geometry determines spatial relationships; rules define the condition; temporal reasoning improves reliability; the steward receives evidence rather than a final penalty verdict.**

The MVP will deliberately operate on a **single continuous trackside camera shot and a defined track-limit zone**, with manual one-time camera calibration. The first implementation milestone is an **observability audit on real footage** to establish whether the selected camera angle contains enough information to support four-tire reasoning.

---

# 2. Official Requirement Interpretation

The organizer's orientation establishes the following requirements:

| Organizer requirement | Engineering interpretation |
|---|---|
| AI helper for race stewards | Output must assist human review rather than issue penalties |
| Process race footage | Input is continuous trackside video |
| Same car must be followed through frames | Persistent vehicle identity is required |
| Track-limit violation involves all four tires | The geometric condition must be evaluated jointly for all four tire/contact regions |
| Even partial tire contact with the white line is not a violation | Boundary contact must be distinguished from fully-outside status |
| Trust/confidence should be provided | Each candidate event should carry a system confidence/trust score |
| Steward should be shown the relevant evidence | Output must include exact frames/timestamps and visual overlays |

The detailed project specification additionally establishes that the legal boundary should primarily be inferred from **boundary markings and curb edges**, rather than simply treating the asphalt/grass transition as the legal limit.

---

# 3. Problem Definition

## 3.1 Input

A continuous trackside motorsport video shot without a mid-clip camera cut.

## 3.2 Output

For each potential track-limit event:

- Vehicle ID
- Timestamp / frame range
- Detected legal boundary
- Estimated tire/contact regions
- Vehicle position relative to the boundary
- System confidence/trust score
- Visual evidence / replay window
- State: `VIOLATION CANDIDATE`, `NO VIOLATION`, or `UNCERTAIN`

The system must never present a potential violation as an official penalty decision.

---

# 4. Formal Rule and System Definition

The organizer's rule is interpreted as:

> **At a given instant, a vehicle satisfies the geometric track-limit violation condition when all four tires are completely outside the configured legal boundary. If any tire remains on or contacts the boundary line, the geometric violation condition is not satisfied at that instant.**

Two concepts must remain separate.

### 4.1 Sporting/geometric condition

At frame `t`:

```text
ALL FOUR tire/contact regions = OUTSIDE
```

This is the rule condition we are attempting to observe.

### 4.2 System reliability condition

The system separately asks:

```text
Can we reliably establish the four tire/contact regions?
Is the boundary sufficiently certain?
Is the vehicle identity stable?
Is the geometric margin larger than measurement uncertainty?
```

If not, the system should return:

```text
UNCERTAIN
```

Temporal persistence is primarily a **noise/confidence mechanism**, not a replacement for the sporting rule. It prevents a one-frame perception glitch from immediately becoming a steward alert.

---

# 5. The Critical Technical Risk: Observability

## 5.1 Why four-tire observability matters

A trackside camera may not visibly resolve all four tires because of:

- vehicle bodywork occlusion,
- near-side/far-side overlap,
- another vehicle,
- curb or track furniture,
- motion blur,
- insufficient image resolution,
- unfavorable camera geometry.

Therefore:

> **The system must never silently infer an invisible tire's position and then claim a violation.**

If all four required contact regions cannot be established with sufficient confidence:

```text
UNKNOWN CRITICAL TIRE
        ↓
    UNCERTAIN
```

This is a deliberate safety behavior for a steward-assistance system.

## 5.2 First implementation milestone: observability audit

Before training a segmentation model or building a large annotation set, inspect approximately 10–20 representative clips from the intended footage.

Record:

| Clip | Boundary visible | Car visible | Tire 1 | Tire 2 | Tire 3 | Tire 4 | Contact resolvable | Verdict possible |
|---|---|---|---|---|---|---|---|---|
| 01 | | | | | | | | |
| 02 | | | | | | | | |
| 03 | | | | | | | | |

The audit should determine:

1. Whether four tire/contact regions are observable often enough.
2. Which camera angles are suitable.
3. Which track-limit zones are most suitable.
4. Which failure modes dominate.
5. Whether the existing footage can support the MVP.

If the footage is fundamentally unobservable, improving the ML model will not solve the problem. The camera/scene selection must change.

---

# 6. System Architecture

```text
                         TRACKSIDE VIDEO
                                │
                 ┌──────────────┴──────────────┐
                 │                             │
                 ▼                             ▼
        VEHICLE PERCEPTION              TRACK PERCEPTION
                 │                             │
          YOLO Detection              Boundary / Curb
                 │                       Perception
          ByteTrack ID                      │
                 │                           │
                 ▼                           ▼
        Vehicle Geometry              Legal Boundary
        / Contact Estimate               Extraction
                 │                           │
                 └──────────────┬────────────┘
                                ▼
                    PERSPECTIVE / GROUND PLANE
                         GEOMETRIC REASONING
                                │
                                ▼
                     FOUR-TIRE RULE EVALUATION
                                │
                                ▼
                    TEMPORAL / CONFIDENCE FILTER
                                │
                                ▼
                       EVIDENCE GENERATION
                                │
                                ▼
                             STEWARD
```

The architecture intentionally separates probabilistic perception from deterministic geometric/rule reasoning.

---

# 7. Pipeline

## 7.1 Camera calibration

### MVP approach

Use **manual one-time calibration per continuous camera shot**.

An operator selects approximately 4–6 known ground-plane points. A homography is computed and reused for the shot.

```text
Image coordinates
       ↓
Manual correspondences
       ↓
Homography
       ↓
Ground-plane coordinate system
```

Automatic camera calibration is outside the MVP.

The selected camera/shot must first pass the observability audit.

---

## 7.2 Track and legal-boundary perception

The system must identify:

- `TRACK_SURFACE`
- `CURB`
- `BOUNDARY_LINE`
- `OFF_TRACK`

The legal boundary should primarily use the relevant boundary marking or curb edge according to the configured ruleset.

The visible asphalt edge is **not automatically assumed to be the legal boundary**.

### MVP strategy

Use:

1. Classical CV first where the boundary is sufficiently stable.
2. Custom segmentation where classical methods fail because of:
   - shadows,
   - glare,
   - wet track,
   - faded markings,
   - motion blur,
   - partial occlusion,
   - complex curb/background appearance.

The neural model should solve the visual perception problem; it should not directly declare a violation.

---

## 7.3 Boundary representation

The perception result is converted into a geometric boundary:

```text
Segmentation mask
      ↓
Mask cleanup
      ↓
Boundary extraction
      ↓
Polyline / curve
      ↓
Configured legal boundary
```

The geometric representation should retain uncertainty.

For example:

```text
Predicted boundary position = x
Boundary uncertainty = ±δ
```

If the tire-to-boundary margin is smaller than the relevant uncertainty, the result is `UNCERTAIN` rather than a forced inside/outside decision.

---

# 8. Vehicle Detection and Tracking

Use established pretrained components.

### Detection

YOLO-family detector.

### Tracking

Use **ByteTrack** as the default tracker.

Do not spend significant hackathon time comparing multiple tracking algorithms unless ByteTrack demonstrably fails.

The tracker provides:

```text
Vehicle
    ↓
Persistent ID
    ↓
Trajectory across frames
```

Identity breaks should be explicitly detected rather than silently continuing a potentially incorrect track.

---

# 9. Tire / Contact-Region Estimation

This is the hardest unresolved implementation component.

## 9.1 What we must not do

Do not use the vehicle bounding-box corners as the final tire locations.

A bounding box describes the vehicle extent, not its tire locations:

```text
┌───────────────────┐
│       CAR         │
│                   │
└───────────────────┘
```

Its corners may correspond to bodywork, wings, diffuser, shadow, or empty space.

Bounding-box corners may be used only as an **exploratory baseline** and must never support a final violation claim.

## 9.2 Preferred implementation path

Investigate the simplest viable approach first:

```text
Vehicle detection
       ↓
Vehicle segmentation mask
       ↓
Vehicle orientation / geometry
       ↓
Estimated ground-contact regions
       ↓
Four tire/contact estimates
```

Only if this proves insufficient should the team consider a dedicated tire/keypoint model.

The project does not need to train a custom tire detector merely because four-tire reasoning is required.

## 9.3 Observability rule

For every critical frame:

```text
Can all four tire/contact regions be established?
              │
        ┌─────┴─────┐
       YES           NO
        │             │
        ▼             ▼
   Evaluate       UNCERTAIN
     rule
```

Unknown must not be treated as outside.

---

# 10. Spatial Geometry

A tire should conceptually be represented as a **contact region**, not merely a single mathematical point.

For each tire/contact region:

```text
Contact region
      ↓
Boundary intersection?
      │
   ┌──┴──┐
  YES    NO
   │      │
TOUCHING  Determine side
          │
      INSIDE / OUTSIDE
```

The geometric layer should use region-to-boundary intersection and signed-distance analysis where possible.

The goal is to distinguish:

- `INSIDE`
- `TOUCHING`
- `OUTSIDE`
- `UNKNOWN`

The critical rule is:

```text
ALL FOUR = OUTSIDE
```

with sufficient observability and geometric confidence.

If even one tire is `TOUCHING`, the geometric violation condition is not satisfied.

If a critical tire is `UNKNOWN`, the system should not produce a confident violation claim.

---

# 11. Perspective-Aware Ground-Plane Reasoning

Trackside footage is a perspective projection of a 3D environment.

Image-space distances cannot automatically be interpreted as physical distances on the track.

The MVP therefore uses a homography:

```text
2D image
   ↓
Homography
   ↓
Approximate ground plane
   ↓
Common spatial coordinate system
```

The MVP assumes the visible track surface is approximately planar within a single camera shot.

We are **not** claiming full 3D reconstruction of the car or circuit.

The purpose of the homography is to make the vehicle/boundary spatial relationship more meaningful under perspective.

---

# 12. Rule and Temporal Reasoning

## 12.1 Per-frame rule evaluation

For each tracked vehicle and each frame:

```text
Tire 1 → INSIDE / TOUCHING / OUTSIDE / UNKNOWN
Tire 2 → INSIDE / TOUCHING / OUTSIDE / UNKNOWN
Tire 3 → INSIDE / TOUCHING / OUTSIDE / UNKNOWN
Tire 4 → INSIDE / TOUCHING / OUTSIDE / UNKNOWN
```

Then:

```text
All four OUTSIDE
       ↓
Geometric condition satisfied
```

But:

```text
Any TOUCHING
       ↓
No geometric violation

Any UNKNOWN
       ↓
UNCERTAIN
```

## 12.2 Temporal confidence filtering

The system evaluates the geometric state across consecutive frames for the same vehicle ID.

This is used to suppress:

- single-frame segmentation glitches,
- tracker jitter,
- transient boundary extraction errors,
- momentary contact-region estimation noise.

Temporal persistence should **not** be presented as the sporting rule itself.

---

# 13. Confidence / Trust Score

The MVP uses a **system confidence/trust score**, not a statistically calibrated probability.

A conceptual score can combine:

```text
Vehicle detection confidence
        +
Tracking stability
        +
Tire/contact confidence
        +
Boundary confidence
        +
Geometric margin
        +
Temporal consistency
        ↓
System confidence
```

Example:

```text
POTENTIAL VIOLATION
System confidence: 92
```

This should not be described as:

> "There is a 92% probability that the steward's final ruling should be a penalty."

Instead:

> "The system has high confidence in the visual/geometric evidence supporting this candidate event."

Confidence must decrease when:

- tires are occluded,
- boundary position is ambiguous,
- the track ID is unstable,
- the geometric margin is too small,
- camera calibration is unreliable.

---

# 14. Three-State Output

The system should expose three states:

```text
┌────────────────────────────┐
│ VIOLATION CANDIDATE        │
│ All four conditions        │
│ sufficiently supported     │
├────────────────────────────┤
│ NO VIOLATION               │
│ Evidence reliably indicates│
│ at least one tire is       │
│ inside/touching            │
├────────────────────────────┤
│ UNCERTAIN                  │
│ Required evidence cannot   │
│ be established reliably    │
└────────────────────────────┘
```

`UNCERTAIN` is an intended system behavior.

Examples:

```text
Tire occluded             → UNCERTAIN
Boundary ambiguous        → UNCERTAIN
Track identity lost       → UNCERTAIN
Calibration unreliable    → UNCERTAIN
Geometric margin too small→ UNCERTAIN
```

The system should surface uncertain cases rather than hide them.

---

# 15. Event Definition

An event is a short evidence window surrounding a potential track-limit incident.

For example:

```text
Frame 100: all inside
Frame 101: 3 outside
Frame 102: 4 outside  ← peak evidence
Frame 103: 4 outside
Frame 104: 3 outside
Frame 105: all inside
```

Define:

- **Event start:** first frame where the candidate condition becomes relevant for evidence collection.
- **Event peak:** highest-confidence frame satisfying the four-outside geometric condition.
- **Event end:** last relevant frame before the vehicle returns to a clearly non-violation state.

The event window should include context before and after the peak so the steward can verify the incident.

The exact trigger used to begin collecting a candidate window is a system implementation choice, not a claim about the sporting rule.

---

# 16. Dataset Definition

Two label systems must remain separate.

## 16.1 Segmentation training labels

If custom segmentation is required:

```text
Frame
 ├── TRACK_SURFACE
 ├── CURB
 ├── BOUNDARY_LINE
 └── OFF_TRACK
```

Vehicle masks are not required for this segmentation task if vehicle detection/segmentation is handled separately.

## 16.2 End-to-end evaluation labels

The event evaluation set should contain:

```text
LEGAL
TIRE TOUCHING BOUNDARY
ALL FOUR OUTSIDE
UNCERTAIN / OCCLUDED
```

The segmentation model should not be trained directly on the final `VIOLATION` label.

---

# 17. Dataset Construction Strategy

The target-domain trackside footage is the most important dataset because the problem depends heavily on camera viewpoint.

Frames should be sampled for visual diversity rather than extracting every consecutive frame.

Prioritize:

- different vehicle distances,
- cars approaching the boundary,
- cars touching the boundary,
- potential violations,
- clean legal passes,
- motion blur,
- shadows/glare,
- partial boundary visibility,
- vehicle occlusion,
- multiple cars near the boundary,
- different curb appearances,
- different lighting conditions.

## 17.1 Active-learning loop

Use:

```text
Train
  ↓
Run inference
  ↓
Analyze failures
  ↓
Collect hard examples
  ↓
Annotate
  ↓
Retrain
```

This concentrates limited annotation time on cases that actually hurt system performance.

## 17.2 Leakage protection

Never randomly split adjacent frames from the same continuous shot across train and test.

Use:

```text
VIDEO / SHOT / SOURCE SEQUENCE
              ↓
       Train / Validation / Test
```

This prevents near-identical frames from appearing on both sides of the evaluation split.

---

# 18. MVP Scope

## Phase 1 — Camera and calibration

- One continuous trackside camera.
- One clearly defined track-limit zone.
- Manual one-time homography calibration.
- Observability audit before model development.

## Phase 2 — Vehicle and boundary perception

- YOLO vehicle detection.
- ByteTrack tracking.
- Classical boundary extraction where reliable.
- Custom segmentation only where needed.

## Phase 3 — Contact-region estimation

- Investigate vehicle mask/geometry approach first.
- Establish four contact regions where observable.
- Return `UNCERTAIN` when critical contact regions cannot be established.
- Bounding-box corners may exist only as an experimental baseline.

## Phase 4 — Geometric and rule reasoning

- Perspective-aware ground-plane transformation.
- Tire/contact-region to boundary relationship.
- Four-outside simultaneous condition.
- Separate temporal confidence filtering.

## Phase 5 — Steward evidence

Generate:

- annotated frame,
- vehicle ID,
- boundary overlay,
- estimated contact regions,
- state,
- system confidence,
- event start/peak/end,
- short replay/evidence clip.

---

# 19. Explicitly Out of Scope

For the MVP:

- Multi-camera fusion.
- Cross-camera vehicle re-identification.
- Every circuit and every corner configuration.
- Automatic camera calibration.
- Full 3D reconstruction.
- Statistically calibrated probabilities.
- Automated penalty decisions.
- Rule-severity classification.
- A custom tire-keypoint model unless simpler approaches fail.
- Guaranteed live-broadcast real-time operation.

The architecture should nevertheless remain compatible with near-real-time processing, and processing FPS should be measured.

---

# 20. Validation Framework

Validation should be performed on held-out video sequences, not randomly sampled frames.

## 20.1 Observability

**Question:** Can the selected camera support four-tire reasoning?

Measure:

- percentage of clips with all four contact regions observable,
- percentage with boundary sufficiently visible,
- major causes of `UNCERTAIN`.

## 20.2 Perception

Measure:

- per-class IoU where segmentation is used,
- boundary deviation,
- contact-region localization quality.

The boundary class should receive special attention because it is thin and highly consequential.

## 20.3 Geometry

Measure:

- boundary deviation in ground-plane coordinates,
- vehicle/contact-to-boundary distance error where ground truth is available.

## 20.4 End-to-end system

Measure:

- violation precision,
- violation recall,
- F1,
- false violations per 100 clean passes,
- ID-switch rate,
- processing FPS / latency.

## 20.5 Baseline comparison

Compare Kerb against a naive baseline such as:

```text
Single-frame car/boundary overlap
```

The goal is to demonstrate that tracking + geometry + temporal reasoning reduces false positives, especially for near-line cases.

---

# 21. Success Criteria

The MVP is successful if it can demonstrate all of the following on a small held-out video set:

1. The same vehicle can be tracked through the relevant event window.
2. The system can distinguish clear inside, boundary-touching, and clear outside contact states where the footage is observable.
3. It correctly applies the simultaneous four-tire condition.
4. It produces `UNCERTAIN` rather than inventing evidence when required information is unavailable.
5. It produces steward-reviewable evidence with a confidence/trust score.
6. It reduces near-line false positives relative to the naive single-frame baseline.
7. Its limitations are clearly visible rather than hidden behind an apparently confident binary prediction.

No arbitrary accuracy percentage should be claimed before the actual dataset and observability audit establish what performance is achievable.

---

# 22. Key Engineering Decisions

| Decision | MVP choice |
|---|---|
| Camera | One continuous trackside shot |
| Calibration | Manual one-time homography |
| Vehicle detector | YOLO-family pretrained model |
| Tracker | ByteTrack |
| Boundary | Classical CV first; ML where necessary |
| Segmentation classes | Track, curb, boundary line, off-track |
| Contact estimation | Vehicle mask/geometry first |
| Tire keypoint model | Only if simpler approach fails |
| Geometry | Ground-plane + boundary distance/intersection |
| Rule | All four tires outside simultaneously |
| Temporal logic | Confidence/noise filtering, not rule definition |
| Uncertainty | First-class output |
| Confidence | Composite system trust score |
| Output | Evidence frame/replay + metadata |
| Final decision | Human steward |

---

# 23. What Kerb Is Actually Building

The project should not be described as:

> "An AI that detects whether an F1 car goes off track."

That undersells the technical problem.

The more accurate description is:

> **Kerb converts trackside race footage into perspective-aware, temporally consistent evidence about whether a vehicle's four tire/contact regions crossed the configured legal boundary, while explicitly identifying cases where the visual evidence is insufficient for a reliable determination.**

The system combines:

```text
Visual perception
       +
Vehicle tracking
       +
Boundary extraction
       +
Perspective-aware geometry
       +
Four-tire rule logic
       +
Temporal confidence reasoning
       +
Steward-facing evidence
```

The final consumer of the system is **the steward**, not an automated penalty engine.

---

# 24. Final Team Alignment Statement

> **Detect the car, track the car, establish the legal boundary, determine the four tire/contact regions where they are actually observable, transform the relevant geometry to the ground plane, test whether all four are outside simultaneously, use temporal consistency only to improve reliability, and give the steward the evidence and an honest confidence signal — never an automatic penalty verdict.**

---

# 25. Immediate Next Action

**Do not collect a large amount of additional data or begin model training yet.**

First perform the observability audit on approximately 10–20 of the existing target-domain clips.

The result determines the next branch:

```text
                 REAL FOOTAGE
                      │
                      ▼
             OBSERVABILITY AUDIT
                      │
             ┌────────┴────────┐
             │                 │
       Sufficient          Insufficient
       observability       observability
             │                 │
             ▼                 ▼
       Build MVP          Change footage /
       perception         camera zone / scope
```

If observability is sufficient, proceed to the smallest working prototype:

```text
YOLO → ByteTrack → boundary → contact estimation
→ geometry → four-tire rule → temporal confidence
→ evidence replay
```

Only after this pipeline works on real footage should additional segmentation complexity, larger datasets, or more sophisticated tire localization be introduced.
