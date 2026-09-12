# Kerb — Hackathon Build Plan & MVP Specification

## 1. Objective

Kerb is a **steward-assist system** for identifying potential track-limit violations from continuous trackside race footage.

It does **not** issue penalties. It finds candidate events, shows the visual evidence, and gives a system trust score so a human steward can review the event quickly.

The organizer defines a track-limit violation as the case where **all four tires are outside the legal track boundary at the same time**. If any tire remains on the white boundary line, it is not a violation. The system therefore needs persistent vehicle identity, spatial boundary reasoning, and temporal evidence. [Source: organizer orientation]

---

## 2. Hackathon Scope: One Vertical Slice

We are deliberately **not** building a general-purpose F1 track-limit engine in 24 hours.

### MVP scope

- One target-domain camera/view.
- One clearly defined track-limit zone.
- Continuous recorded footage.
- Fixed/manual boundary configuration.
- Vehicle detection + tracking.
- Approximate tire/contact-region estimation.
- Four-outside rule logic.
- Lightweight temporal filtering.
- Steward-facing evidence output.

### Explicitly out of scope

- Multi-camera fusion.
- Full 3D reconstruction.
- Automatic camera calibration.
- Every circuit/corner/camera type.
- Cross-camera re-identification.
- Statistically calibrated probabilities.
- Automated penalty decisions.
- A custom tire-keypoint model unless the simple approach fails.
- Guaranteed live-broadcast real-time performance.

This is consistent with the project specification's single-shot MVP assumptions and its requirement that outputs remain potential violations for human review. 

---

## 3. Core Pipeline

```text
                TRACKSIDE VIDEO
                       │
                       ▼
                YOLO VEHICLE DETECTION
                       │
                       ▼
                  BYTETRACK
                       │
                       ▼
              VEHICLE MASK / GEOMETRY
                       │
                       ▼
             ESTIMATED CONTACT REGIONS
                       │
                       ├──────────────┐
                       ▼              ▼
              TRACK BOUNDARY      CAR STATE
                       │              │
                       └──────┬───────┘
                              ▼
                     BOUNDARY RELATION
                              │
                              ▼
                    ALL-4-OUTSIDE RULE
                              │
                              ▼
                    TEMPORAL FILTER
                              │
                              ▼
                 CONFIDENCE / UNCERTAINTY
                              │
                              ▼
                    STEWARD EVIDENCE
```

### Engineering principle

**Keep perception, geometry, rules, and reliability separate in code, but keep the implementation simple.**

---

## 4. P0 — Must Work

### P0.1 Vehicle detection

Run a pretrained YOLO model on the actual race footage.

Output:

- bounding box
- vehicle class
- detection confidence

Do not spend hackathon time training a car detector from scratch.

### P0.2 Vehicle tracking

Use ByteTrack to maintain a persistent vehicle ID.

Required demo behavior:

```text
Car #12 → frame 100 → frame 101 → frame 102 → ...
```

The steward should be able to see that the candidate event belongs to the same car.

### P0.3 Boundary

For the fixed MVP camera, start with the **simplest boundary method that works**:

1. Manual polygon/line configuration.
2. Classical CV if the marking can be extracted reliably.
3. Segmentation only if the first two approaches fail.

Do not make custom boundary segmentation a prerequisite for the demo.

### P0.4 Contact-region approximation

The organizer's rule concerns tires, but a trackside image does not always make every tire directly observable.

Use the simplest defensible approximation available:

- vehicle mask if available,
- lower vehicle geometry,
- visible tire cues,
- manually defined/derived contact-region geometry.

Do **not** present bounding-box corners as exact tire locations.

If a critical contact region cannot be established reliably, output:

```text
UNCERTAIN
```

rather than inventing evidence.

### P0.5 Rule engine

At frame `t`:

```python
violation_candidate =
    tire_1_outside and
    tire_2_outside and
    tire_3_outside and
    tire_4_outside
```

Boundary contact means the tire is **not outside**.

The four-tire sporting condition must remain separate from temporal filtering.

### P0.6 Temporal filtering

Use time only to reduce visual noise:

- stable tracking,
- consecutive supporting frames,
- suppression of isolated detection glitches.

Do **not** redefine the sporting rule as "outside for N frames" unless the organizers explicitly confirm that duration is part of the rule.

### P0.7 Evidence

Every candidate event should produce:

- car ID,
- timestamp/frame,
- boundary overlay,
- estimated contact regions,
- state,
- trust/confidence score,
- short before/during/after evidence sequence.

The output is a **review package**, not a penalty.

---

## 5. P1 — Add Only If P0 Works

These features improve the technical story but must not block the vertical slice:

- Manual homography for the fixed camera.
- Ground-plane distance to the boundary.
- Better vehicle masks.
- Simple segmentation for track / curb / boundary / off-track.
- Event start / peak / end detection.
- Side-by-side evidence frames.
- A clean dashboard showing candidate events.

### Homography rule

Start in image space.

Only add a manual homography if perspective visibly causes incorrect boundary decisions.

There is no prize for adding calibration complexity that does not improve the demo.

---

## 6. P2 — Future Work / Research

Do not spend the core hackathon sprint on:

- custom tire keypoint networks,
- full 3D reconstruction,
- multi-camera fusion,
- automatic camera calibration,
- large-scale active-learning pipelines,
- extensive segmentation benchmarking,
- statistically calibrated confidence,
- generalization to every track.

These are valid future directions, not MVP requirements.

---

## 7. Dataset Strategy

The goal during the hackathon is **not** to build a research-grade dataset.

Use the existing target-domain clips first.

Prioritize a small, deliberately selected set containing:

1. Clear violations.
2. Clear legal passes.
3. Tire-on-line / near-line cases.
4. Cars approaching the boundary.
5. Motion blur.
6. Shadows/glare.
7. Partial boundary visibility.
8. Occlusion or poor observability.
9. Multiple cars near the zone.

### Data rule

Do not randomly split adjacent frames from the same event and call them independent test examples.

For any reported metric, split by **clip/shot/event**, not by individual frames.

### What counts as enough data?

Enough data to demonstrate:

- the pipeline works,
- at least a few clear candidate violations are detected,
- near-line cases expose the difference between naive and temporal/geometric reasoning,
- one or two failure/uncertain cases are shown honestly.

Do not collect hundreds of clips before the first working pipeline exists.

---

## 8. Confidence / Trust Score

For the hackathon, call this a:

> **System Trust Score**

It should reflect available evidence such as:

- detector confidence,
- track stability,
- boundary confidence,
- contact-region confidence,
- geometric margin,
- temporal consistency.

Do not claim that the number is a statistically calibrated probability.

Example display:

```text
CAR #16
TRACK LIMIT CANDIDATE

Trust: 93%

4/4 contact regions estimated outside
Boundary: high confidence
Tracking: stable
Evidence: frames 1842–1850

[VIEW EVIDENCE]
```

If evidence is insufficient:

```text
CAR #16
UNCERTAIN

Reason:
Rear-left contact region occluded
```

---

## 9. Steward UI

The demo should make the value obvious within seconds.

### Main view

Show:

- race frame,
- vehicle ID,
- legal boundary,
- contact/tire approximation,
- current state,
- trust score.

### Event panel

```text
Potential Track Limit Event

Car: #16
Time: 01:24.32
State: VIOLATION CANDIDATE
Trust: 93%

Evidence
[ PRE ] [ PEAK ] [ POST ]

Reasoning
✓ Same vehicle tracked
✓ Boundary detected
✓ 4 contact regions estimated
✓ All 4 outside at peak
✓ Temporal support present

Final decision: STEWARD REVIEW
```

The last line is important: **never "Penalty issued."**

---

## 10. 24-Hour Execution Order

### Hour 0–1 — Prove the footage works

Run YOLO + ByteTrack on the actual Abu Dhabi clips.

Answer immediately:

- Are cars detected?
- Do IDs persist?
- Is the target zone visible?
- Can the relevant car be isolated?

If this fails, fix footage/scope before doing anything else.

### Hour 1–2 — Boundary

Get a fixed boundary working.

Prefer manual configuration first.

### Hour 2–4 — Contact approximation

Implement the simplest geometry that gives useful tire/contact estimates.

Test it on:

- clear inside,
- near-line,
- clear outside.

### Hour 4–5 — Rule engine

Implement:

```text
4 contact regions
       ↓
inside / touching / outside
       ↓
all four outside?
       ↓
candidate / no violation / uncertain
```

### Hour 5–6 — Temporal logic

Track the event across consecutive frames.

Suppress isolated glitches.

Generate an event window.

### Hour 6–8 — Evidence UI

Build the steward-facing output.

This is the point at which the project becomes demonstrable.

### Hour 8+ — Harden the bottleneck

Stop adding architecture.

Use the remaining time to:

- fix false positives,
- improve boundary/contact approximation,
- improve tracking,
- curate the strongest demo clips,
- add one honest failure case,
- measure FPS,
- polish the presentation.

---

## 11. Kill Criteria

Immediately simplify the design if a component consumes time without improving the demo.

### Kill custom segmentation if:

Manual/classical boundary configuration is already reliable enough for the selected camera.

### Kill homography if:

Image-space geometry produces correct results on the chosen zone.

### Kill tire-keypoint modeling if:

A simpler contact approximation is sufficient for the demo.

### Kill broad dataset collection if:

The current clips already provide clear positive/negative/edge cases.

### Kill multi-camera ambitions if:

The single-camera vertical slice is not yet reliable.

---

## 12. Minimum Demo Test Set

Before presentation, prepare approximately:

### Demo A — Clear legal pass

Expected:

```text
NO VIOLATION
```

### Demo B — Clear violation

Expected:

```text
VIOLATION CANDIDATE
```

with evidence and high trust.

### Demo C — Near-line / tire touching

Expected:

```text
NO VIOLATION
```

This demonstrates that the system is not simply detecting "car close to edge."

### Demo D — Poor observability

Expected:

```text
UNCERTAIN
```

This demonstrates that Kerb does not fabricate invisible tire evidence.

---

## 13. What Makes Kerb Technically Interesting

Do not pitch this as:

> "YOLO detects F1 cars and checks if they are off the track."

The technical story is:

```text
Vehicle perception
        +
Persistent identity
        +
Legal boundary reasoning
        +
Contact-region estimation
        +
Four-tire geometric rule
        +
Temporal evidence
        +
Steward review
```

The important differentiator is the **combination**.

The organizer explicitly describes the challenge as temporal rather than merely detecting whether a car is on or off the track. The system therefore has to reason about the same vehicle across frames and supply evidence to the steward. 

---

## 14. Technical Honesty

Kerb should explicitly state:

- Contact regions are approximations in the MVP.
- A single camera can make some tires unobservable.
- Confidence is a system trust score, not a calibrated probability.
- The MVP targets one camera/zone.
- Recorded footage is acceptable for the MVP; FPS is measured rather than promising broadcast-grade real time.
- Final sporting decisions remain with human stewards.

This is stronger than pretending a 24-hour prototype has solved full race-control perception.

---

## 15. Definition of Done

The MVP is done when:

- [ ] YOLO detects cars in target footage.
- [ ] ByteTrack maintains usable IDs.
- [ ] A fixed legal boundary is available.
- [ ] Contact regions can be estimated for selected demo cars.
- [ ] Four-outside logic works.
- [ ] Boundary-touching cases are not automatically flagged.
- [ ] Temporal filtering removes obvious frame-level noise.
- [ ] Candidate events have evidence frames.
- [ ] Every candidate has a trust score.
- [ ] Poorly observable cases can become `UNCERTAIN`.
- [ ] UI clearly says the result is for **STEWARD REVIEW**.
- [ ] At least one clear violation, one clean pass, one near-line case, and one uncertainty/failure case are ready.
- [ ] Processing FPS is measured.

---

## 16. One-Sentence Team Alignment

> **Detect the car, track the car, establish the legal boundary, estimate the observable contact regions, test the four-tire condition, use temporal consistency to improve reliability, and give the steward the evidence — never an automatic penalty verdict.**


---

# 17. Sprint-Locked Decisions

These decisions are locked before implementation begins. The team should not debate alternative approaches during the critical build window unless the chosen method demonstrably fails.

## 17.1 Contact-Region Fallback Hierarchy

Use the following order:

### Level 1 — Vehicle mask available

If a usable vehicle instance mask is available:

- derive the visible lower vehicle contour,
- estimate vehicle orientation from the mask/box geometry,
- derive four approximate contact regions relative to the vehicle footprint,
- mark confidence according to mask quality and visibility.

The output remains an **approximation**, not wheel reconstruction.

### Level 2 — No usable mask

Use the tracked bounding box with a fixed, geometry-based approximation:

- estimate the vehicle longitudinal axis from box geometry / motion direction,
- estimate front/rear positions from the longitudinal extent,
- estimate left/right positions from vehicle width,
- place four approximate contact points near the lower footprint.

These points are explicitly labelled:

```text
APPROXIMATE CONTACT
```

They are not described as detected tire centers.

### Level 3 — Geometry unreliable

If the vehicle is:

- heavily occluded,
- too small,
- severely blurred,
- at an extreme angle,
- or otherwise unsuitable for four-contact estimation,

return:

```text
UNCERTAIN
```

**Never convert an unobservable tire into an assumed outside tire.**

---

## 17.2 Boundary Fallback Hierarchy

Start with:

```text
MANUAL BOUNDARY
```

For the selected camera, define the legal boundary as a polyline/polygon once.

If static geometry visibly fails because of:

- curvature,
- perspective,
- curb appearance,
- shadows,
- glare,

use a lightweight refinement **inside a manually defined boundary corridor**.

Possible refinement methods:

- color thresholding,
- edge detection,
- line/curve fitting,
- frame-to-frame stabilization.

Do not build a general boundary segmentation system unless the simpler methods fail.

### Timebox

Allow approximately **30–60 minutes** for boundary refinement.

If refinement is still unstable, return to the best manually calibrated boundary for the fixed demo zone.

---

## 17.3 Temporal Rule

Separate the sporting rule from the temporal reliability rule.

### Sporting condition

At a frame:

```text
ALL FOUR CONTACT REGIONS OUTSIDE
```

is the violation candidate condition.

A tire touching the legal boundary remains **inside / not outside**.

### MVP temporal filter

Use a short majority window:

```text
5-frame window
```

A candidate event is accepted when:

```text
at least 3 of the 5 frames
```

satisfy the four-outside condition.

Then select the frame with the strongest geometric evidence as the **peak frame**.

This is a reliability filter, not a claim that the sporting regulation requires three frames.

### Why this choice?

A majority window is more tolerant of:

- detector jitter,
- mask jitter,
- one-frame boundary noise,
- motion blur,

than a strict consecutive-frame rule.

If processing speed or event duration makes a 5-frame window impractical, use the equivalent shortest stable window and document the change.

---

## 17.4 Trust Score

Use one deterministic rule-based score throughout the demo.

Start at:

```text
50
```

Add:

| Evidence | Score |
|---|---:|
| Stable vehicle tracking | +15 |
| Clear boundary | +10 |
| Good contact-region visibility | +10 |
| Strong geometric margin outside boundary | +10 |
| Temporal support | +5 |

Maximum:

```text
100
```

Suggested interpretation:

```text
90–100  HIGH TRUST
75–89   MEDIUM-HIGH
60–74   MEDIUM
<60     UNCERTAIN / LOW TRUST
```

For a candidate event, display the score alongside the reasons.

Example:

```text
TRUST: 93%

+ Stable tracking
+ Clear boundary
+ Contact regions visible
+ Strong geometric margin
+ Temporal support
```

The exact starting value/weights are an **MVP heuristic**, not a calibrated probability.

If any critical contact region is unobservable, cap the trust score at:

```text
59
```

and classify the event as:

```text
UNCERTAIN
```

rather than presenting a high-confidence violation.

---

# 18. Parallel Workstreams

Do not wait for the entire CV pipeline before building the visible product.

## Workstream A — Perception

Owner:

- YOLO
- ByteTrack
- vehicle geometry
- contact approximation
- FPS measurement

## Workstream B — Geometry / Rules

Owner:

- manual boundary
- boundary refinement if necessary
- four-contact state
- temporal filter
- trust score

## Workstream C — Evidence / UI

Start as soon as tracking output exists.

Minimum skeleton:

```text
┌─────────────────────────────────────┐
│              RACE VIEW              │
│                                     │
│   Car #16                           │
│      ┌─────────────┐                │
│      │             │                │
│      └─────────────┘                │
│    •             •                  │
│    •             •                  │
│──────── LEGAL BOUNDARY ─────────────│
│                                     │
├─────────────────────────────────────┤
│ STATUS: VIOLATION CANDIDATE         │
│ TRUST: 93%                          │
│ FRAME: 1847                         │
│                                     │
│ [ PRE ] [ PEAK ] [ POST ]           │
│                                     │
│ STEWARD REVIEW REQUIRED             │
└─────────────────────────────────────┘
```

The UI can initially consume mocked event JSON while perception is still being developed.

This removes the risk of leaving the highest-visibility component until hours 6–8.

---

# 19. Demo Package

Prepare **4–6 clips before the final presentation**.

The preferred sequence is:

### Clip 1 — Baseline

A clean pass well inside the boundary.

Say:

> “Kerb first establishes the car's persistent identity and legal boundary. This is a normal pass, so there is no incident.”

### Clip 2 — Clear candidate

A clear all-four-outside case.

Say:

> “Here the system follows the same vehicle across frames, evaluates its contact regions against the legal boundary, and flags a potential violation.”

Show:

- car ID,
- boundary,
- contact approximation,
- peak frame,
- trust score,
- evidence sequence.

### Clip 3 — Near-line / touching

A case where a tire remains on the boundary.

Say:

> “This is the important negative case. Being close to the edge is not enough. Because the contact region remains on the legal line, Kerb does not flag it as a violation.”

### Clip 4 — Uncertain

A case with an occluded or poorly observable contact region.

Say:

> “When the camera cannot support the four-tire decision, the system does not invent the missing evidence. It returns uncertainty for steward review.”

### Optional Clip 5 — Multiple cars

Demonstrate persistent IDs and event isolation.

### Optional Clip 6 — Failure / recovery

Show a case where a frame-level detector jitters but temporal filtering prevents a false incident.

---

# 20. Presentation Fallback

The final presentation does **not** depend on successful live inference.

Maintain two modes:

### Mode A — Live / recorded inference

If the pipeline runs reliably at presentation time, run the selected clip through the system.

### Mode B — Pre-rendered evidence package

If live processing is:

- too slow,
- unstable,
- dependent on unavailable hardware,
- or likely to fail under demo conditions,

show pre-rendered evidence packages generated by the exact same pipeline.

This is preferable to risking a broken live demo.

The architecture can still be described as near-real-time capable, while reporting the measured FPS honestly.

---

# 21. FPS Measurement

Measure FPS as soon as the basic pipeline works.

Record separately where possible:

```text
Detection FPS
Tracking FPS
Full-pipeline FPS
```

Also record hardware used.

Example presentation statement:

> “On our hackathon hardware, the current prototype processes approximately X FPS on the target footage.”

Do not claim real-time capability without measurement.

If full-pipeline FPS is low, explain that the MVP uses recorded footage and that the perception stack can be optimized/deployed separately.

---

# 22. First Three Hours — Lock-In Checklist

By the end of Hour 1:

- [ ] Actual target footage runs through YOLO.
- [ ] ByteTrack IDs are visible.
- [ ] Target camera/zone is confirmed.
- [ ] Initial FPS is measured.

By the end of Hour 2:

- [ ] Manual boundary is configured.
- [ ] Contact approximation hierarchy is implemented.
- [ ] Evidence viewer skeleton can display a tracked car.
- [ ] At least one clip has a usable visual overlay.

By the end of Hour 3:

- [ ] Four-contact state exists.
- [ ] Temporal 5-frame majority filter exists.
- [ ] Deterministic trust score exists.
- [ ] Candidate event JSON/output exists.
- [ ] Team has selected the strongest 4–6 demo clips.

If any item is failing, **reduce scope immediately rather than adding another model.**

---

# 23. Judge Q&A Preparation

### “How do you know where all four tires are?”

Answer:

> “The MVP estimates four contact regions from the observable vehicle geometry. Where the camera does not provide sufficient evidence, we explicitly return uncertainty. We do not claim exact tire reconstruction from a single trackside view.”

### “Why not just use the bounding box?”

Answer:

> “A bounding box is useful for detection and tracking, but its corners are not tire locations. We use it only as the fallback geometry for approximate contact regions.”

### “Why not use a huge segmentation model?”

Answer:

> “For a 24-hour MVP, the fixed-camera vertical slice gives us a better reliability-to-complexity tradeoff. A learned segmentation model is a clear next step for generalization.”

### “Is 3-of-5 frames the actual F1 rule?”

Answer:

> “No. The sporting condition is the four-tire condition. The 3-of-5 rule is our temporal reliability filter for noisy video.”

### “Does Kerb make the penalty decision?”

Answer:

> “No. It produces a potential incident, evidence, and a trust score. The steward makes the final decision.”

### “What happens when a tire is hidden?”

Answer:

> “We do not assume hidden means outside. If the evidence is insufficient, the system returns UNCERTAIN.”

### “Can this work on every circuit?”

Answer:

> “That is not the MVP claim. We are demonstrating a reliable vertical slice on a fixed camera and zone. Generalization is the next engineering stage.”

---

# 24. Final Product Definition

Kerb succeeds at the hackathon if a judge can watch a short clip and immediately understand:

```text
1. THIS is the car being tracked.
2. THIS is the legal boundary.
3. THESE are the estimated contact regions.
4. THIS is why the event was flagged.
5. THIS is the supporting temporal evidence.
6. THIS is the system's trust level.
7. A HUMAN STEWARD still makes the decision.
```

That is the product.

Everything else is secondary.


---

# 25. Final Pre-Sprint Locks

## 25.1 Exact Level-2 Contact Heuristic

When no usable vehicle mask is available, use the tracked bounding box and motion direction.

Let:

```text
(x1, y1) = box top-left
(x2, y2) = box bottom-right
w = x2 - x1
h = y2 - y1
```

First define the approximate ground-contact line:

```text
contact_y = y2 - 0.05 * h
```

Then define the left/right contact columns:

```text
left_x  = x1 + 0.20 * w
right_x = x1 + 0.80 * w
```

Define front/rear positions along the vehicle's motion axis.

For the initial MVP, use the vehicle's tracked displacement between frames to determine the longitudinal direction. If motion-direction estimation is unstable, fall back to the image horizontal axis for the fixed camera.

The four approximate contact points are therefore:

```text
rear-left   = rear_position + left_x
rear-right  = rear_position + right_x
front-left  = front_position + left_x
front-right = front_position + right_x
```

Implementation should be a small deterministic geometry function, not a learned model.

### Important limitation

These are **contact-region proxies**, not detected tire centers.

Display them as approximate contact markers.

If the box is too small, heavily occluded, highly unstable, or the geometry cannot establish a credible four-point footprint:

```text
UNCERTAIN
```

Do not tune these constants per individual event. They may be tuned once on the selected camera/zone during the first testing block.

---

## 25.2 Boundary Refinement Kill Switch

The boundary workflow is:

```text
Manual polyline
      ↓
Test across selected clips
      ↓
Good enough?
  YES → FREEZE
  NO  → lightweight corridor refinement
              ↓
         ≤45 minutes
              ↓
         Good enough?
          YES → FREEZE
          NO  → return to best manual boundary
```

Do not allow boundary refinement to consume the time needed for contact reasoning, event logic, or evidence UI.

---

## 25.3 Presentation Owner

**Workstream C / Evidence & UI owner owns the demo narrative.**

Responsibilities:

- maintain the final 3–4 minute flow,
- select the final 4–6 clips,
- maintain the spoken script,
- prepare fallback pre-rendered evidence,
- rehearse judge Q&A,
- ensure every screen ends with `STEWARD REVIEW REQUIRED`.

This person should not become the bottleneck for core CV development; the UI should be modular enough that the rest of the team can feed it event JSON.

---

## 25.4 Demo-Mode Performance Statement

If full-pipeline FPS is below the desired near-real-time target, do not hide it.

Use:

> “The current MVP is validated on recorded trackside footage. Our measured pipeline runs at X FPS on the available hardware. For the demonstration, evidence packages are pre-rendered from the same inference pipeline; production deployment would optimize the perception stack for the target hardware.”

Do not call the system “real-time” solely because individual models support real-time inference.

---

# 26. Final USP

## Evidence-Grade Steward Assistance with Explicit Uncertainty

Kerb's primary differentiator is **not** YOLO, tracking, or a confidence number.

It is the combination of:

```text
Persistent vehicle identity
          +
Four-contact reasoning
          +
Explicit observability handling
          +
Temporal evidence
          +
Structured review package
          +
Human-in-the-loop decision
```

The central product claim is:

> **“Kerb is not an automatic referee. It is a high-trust evidence engine that tracks the same car, reasons about all four contact regions when they are observable, and explicitly tells the steward when the camera does not provide enough information — so the final decision always stays human.”**

### Demo language

Use:

> **“Most systems try to answer: Was this a violation?  
> Kerb answers a more useful question: Here is the evidence, here is how much we trust it, and here is where the camera cannot support a reliable four-tire decision.”**

Do not claim:

- exact tire reconstruction,
- calibrated probability,
- universal circuit generalization,
- autonomous penalty decisions,
- guaranteed broadcast-grade real-time performance.

---

# 27. Final Source-Pruning Rule

For the duration of the hackathon, use only three active project sources:

```text
01 — Official Problem Statement
02 — Organizer Orientation
03 — Kerb Hackathon Build Plan & MVP
```

All other documents are **background/archive material**.

If a proposed feature appears only in an archived research document and is not required by the official problem, organizer orientation, or this build plan, it is **not automatically part of the MVP**.

The default decision is:

```text
SHIP → if it improves the vertical slice
DEFER → if useful but non-essential
KILL → if it adds complexity without visible demo value
```

---

# 28. Go/No-Go Gate

The team starts the main sprint only after these five decisions are acknowledged:

```text
[✓] Contact Level 2 = deterministic box-based four-point proxy
[✓] Temporal filter = 3 of 5 frames
[✓] Trust score = fixed rule-based heuristic
[✓] UI owner = Workstream C owner
[✓] Demo fallback = pre-rendered evidence packages
```

Then:

> **STOP DESIGNING. START BUILDING.**
