# Kerb — Final Geometry & Track-Limits Detection Solution
### Consolidated spec after the boundary-bug, tyre-approximation, and footprint-triage discussion

This supersedes the geometry-only spec used for the d5 smoke test. It fixes two real bugs found during visual QA, keeps the sporting rule intact (all four contact regions outside, simultaneously — no silent redefinition to "whole car outside"), and adds a cheap triage stage so the expensive contact-region reasoning only has to run where it actually matters.

---

## 0. Priority-0 fixes — must land before any of the geometry below is trusted again

These were found during visual QA and are currently corrupting every downstream judgment call. Nothing else in this document is meaningful until these are fixed.

### 0.1 Per-clip boundary configuration + hard mismatch guard

**Bug:** a boundary config scoped to one camera/clip (e.g. `d5_manual_boundary.json`) was applied to different footage (d3, COTA broadcast footage), producing a boundary line that cuts through the paddock/background instead of the track edge.

**Fix:**
- One boundary config per clip/camera, named and stored per clip (`d3_manual_boundary.json`, `d5_manual_boundary.json`, etc.).
- Each config carries an explicit `clip_id` / `camera_id` field.
- The geometry/visualization tooling **refuses to run** (hard error, not a warning) if the config's declared `clip_id` doesn't match the video being processed. Silent mismatched rendering is the actual failure mode that caused the confusion in QA — this must become impossible, not just discouraged.

### 0.2 Exclude broadcast UI/graphic regions from detection before tracking

**Bug:** the detector/tracker was found producing valid-looking detections, IDs, and contact-region estimates for miniature cars inside a picture-in-picture ("LIVE") replay inset baked into the broadcast feed — coordinates that mean nothing relative to the real track boundary.

**Fix:**
- Define a per-camera exclusion region (or region list) covering known static UI graphics (PIP inset, "LIVE"/"REPLAY" badges, lap/leaderboard overlays).
- Drop any detection whose box falls substantially inside an exclusion region **before** it reaches ByteTrack — this must happen upstream of tracking, not filtered out cosmetically at visualization time, since a phantom track ID reaching the geometry/rule stages is a data-integrity problem, not a display problem.
- If overlay position varies by broadcast source, exclusion regions are configured per source, same as the boundary — not hardcoded globally.

**Nothing below this line should be evaluated, tuned, or judged as "accurate/inaccurate" on footage that hasn't had both of these fixes applied.**

---

## 1. Pipeline shape (unchanged in outline, one new stage inserted)

```text
VIDEO
  → UI/graphic exclusion filter        [NEW — Section 0.2]
  → YOLO vehicle detection
  → ByteTrack (persistent ID)
  → footprint-vs-boundary triage       [NEW — Section 2]
       │
       ├── clearly inside  → NO_VIOLATION (skip contact-region work)
       ├── clearly outside → still requires contact-region confirmation
       │                     (see Section 1a — do not shortcut the rule here)
       └── straddling      → contact-region estimation (Section 3)
                                  │
                                  ▼
                          boundary relation (per region)
                                  │
                                  ▼
                          four-outside rule (Section 4)
                                  │
                                  ▼
                          temporal 3-of-5 filter (Section 5)
                                  │
                                  ▼
                          trust score (Section 6)
                                  │
                                  ▼
                          evidence package → STEWARD REVIEW REQUIRED
```

### 1a. Why "clearly outside" still needs confirmation, not just a shortcut

It's tempting to treat "whole footprint clearly outside" as an automatic violation and skip contact-region work entirely. **Don't.** A footprint fully beyond the boundary line does not tell you whether all four contact regions are outside *simultaneously and completely* — a rotated car with its body past the line can still have a trailing tyre on the line. The triage step exists to **cut cost on the unambiguous majority of frames**, not to replace the sporting rule on any frame. Every candidate that isn't a clean "entirely inside" still needs the real four-region check before it becomes a `VIOLATION_CANDIDATE`.

---

## 2. Footprint-vs-boundary triage (new, cheap pre-filter)

**Purpose:** most frames are unambiguous. Don't run four-region estimation on frames that obviously don't need it.

- Compute a **vehicle footprint proxy** = lower ~25–30% of the YOLO box (not the full box — the full box includes wings/airbox/halo, which sit well above the tyres and would make this check too permissive).
- Compare that footprint region against the boundary:
  - **Entirely on the track side, with margin** → `NO_VIOLATION`, stop here for this frame.
  - **Entirely beyond the boundary, with margin** → proceed to full contact-region check (Section 1a) — do not auto-flag.
  - **Straddling, or within the margin of the boundary** → proceed to full contact-region check.
- The "margin" here is a config constant (start conservative — a car has to be unambiguously clear of the line before being triaged out), not a judgment call made per event.

This is purely a performance/engineering optimization. **It must never appear in the output state or the evidence package as a decision — it only decides whether the expensive path runs.**

---

## 3. Contact-region geometry — two tracks, explicitly labeled

Both tracks below produce **approximate contact regions**, never claimed as detected tyres. This labeling requirement is non-negotiable in any UI, log, or report this system produces — see Section 8.

### 3.1 Track A — Demo-ready heuristic (ship this now)

Replaces the pure axis-mismatch bug (image-axis left/right + motion-axis front/rear, which only agreed when the car moved horizontally in frame) with an aspect-ratio-based layout switch:

```text
aspect = box_width / box_height

if aspect < threshold_vertical:
    # car pointed toward/away from camera — use all four box corners
    regions = [(x1,y1), (x2,y1), (x1,y2), (x2,y2)]

elif aspect > threshold_horizontal:
    # car broadside to camera — current Level-2 mid-edge approximation
    left_x    = x1 + 0.20*w
    right_x   = x1 + 0.80*w
    contact_y = y2 - 0.05*h
    regions = current front/rear-assigned pair, per existing motion-direction logic

else:
    # ambiguous orientation (car rotated ~30-60° in frame — the actual
    # mid-corner case) — do not guess a layout
    geometry_status = UNCERTAIN
```

- `threshold_vertical` / `threshold_horizontal` are set from real observed aspect ratios on actual target footage (straight-on, broadside, and several corner frames) — not eyeballed, consistent with how 0.05/0.20/0.80 were originally pinned.
- The ambiguous middle band **defaults to `UNCERTAIN`**. This is deliberate: it's exactly the band covering genuine mid-corner rotation, which is where a wrong guess is most costly. A confidently-wrong four-corner layout in the middle of a real track-limit event is worse than an honest "can't tell."
- **This is a demo-clarity improvement, not a geometry breakthrough.** It makes the two extremes (head-on, broadside) look right; it does not make the ambiguous middle any more accurate than before — it just refuses to guess there instead of guessing badly. State this plainly if asked, per Section 8.

### 3.2 Track B — Mask-derived oriented footprint (build if time allows; the actual fix for corner rotation)

If hackathon time permits, this is the real solution to the rotation problem, not a heuristic patch:

1. Run a **pretrained**, box-prompted segmentation model (SAM / FastSAM / MobileSAM) using the existing YOLO box as the prompt — zero training required, and sidesteps "no F1-car class in COCO" since the model only has to segment what's inside a box already classified as a car.
2. Take the **lower ~25–30% slice** of the resulting mask (same rationale as the footprint triage — exclude wings/airbox).
3. Fit an **oriented rectangle** to that slice: `cv2.minAreaRect()` → `cv2.boxPoints()`. This rectangle's angle comes from the mask's actual shape, so it rotates with the car through a corner instead of staying locked to the image axis.
4. Use the existing 5-position motion-smoothing window **only to pick which end is front** (the rectangle is symmetric under 180° rotation) — not to compute the geometry itself. This shrinks the blast radius of motion instability to a front/rear label, not the point positions.
5. Reliability checks before trusting the mask output: mask-area-to-box-area ratio too low, mask fragmented into disjoint blobs, or `minAreaRect` aspect wildly off from expected car proportions → fall through to Track A, then to `UNCERTAIN` per the existing hierarchy.

**Track B, if built, becomes Level 1; Track A becomes Level 2; `UNCERTAIN` remains Level 3 — this extends the existing fallback hierarchy, it doesn't replace it.**

---

## 4. The sporting rule — unchanged, and explicitly not redefined

```text
At time t, for a given tracked vehicle:
  violation_candidate =
      region_front_left  is OUTSIDE  and
      region_front_right is OUTSIDE  and
      region_rear_left   is OUTSIDE  and
      region_rear_right  is OUTSIDE

A region touching the boundary line counts as NOT outside
(the organizer's 1%-still-on-the-line example).
```

This is evaluated only on frames that reached this stage via Section 2/3 (i.e., not triaged out as clearly-inside). **This condition is never replaced by "whole footprint/bounding box outside."** That was considered explicitly and rejected: it answers a different, stricter question than the one the organizer specified, and it fails exactly the near-line case (Demo C) that the system exists to get right. The footprint check is a triage filter (Section 2), not a rule.

If any of the four regions has `geometry_status = UNCERTAIN` at the decisive frame, the **event** is `UNCERTAIN`, not a guessed violation/non-violation — never let three confident regions outvote one unobservable one.

---

## 5. Temporal reliability filter (unchanged from prior lock)

- 5-frame window, majority-of-3 acceptance, as previously locked.
- This is a **noise filter for imperfect perception**, not part of the sporting condition. If asked why 3-of-5: "the rule is all-four-outside at an instant; this window is our reliability filter for detector/tracking jitter, not a claim that the regulation requires multiple frames."
- Peak frame = the frame within the accepted window with the strongest geometric margin (all four regions furthest from the boundary, simultaneously).

---

## 6. Trust score (unchanged from prior lock)

Deterministic heuristic, starting at 50, additive factors up to 100 (tracking stability, boundary confidence, contact-region confidence, geometric margin, temporal support), capped at 59 and forced to `UNCERTAIN` if any critical contact region is unobservable at the peak frame. Called a **system trust score**, never a calibrated probability.

---

## 7. Output states (unchanged)

`NO_VIOLATION` / `VIOLATION_CANDIDATE` / `UNCERTAIN` only. Never `PENALTY`, `GUILTY`, or any autonomous verdict language. Every card ends with `STEWARD REVIEW REQUIRED`.

---

## 8. Mandatory honesty/labeling requirements (new, given this discussion)

These are not optional polish — they are what keeps this system defensible under judge/mentor questioning after this design conversation:

1. **All contact-region output, in every UI/log/report, is labeled "approximate contact region," never "tyre" or "tyre detection."** This applies equally to Track A and Track B — Track B is a better approximation, not a real tyre detector.
2. **The two-bucket aspect-ratio switch (Track A) must be describable in one honest sentence if asked:** *"We use box orientation to pick between two fixed approximate layouts; we don't estimate continuous rotation, and in the ambiguous middle we say UNCERTAIN rather than guess."* Do not let this be discovered as a surprise in Q&A.
3. **The footprint triage (Section 2) must never be described as part of the violation rule.** If asked "so a violation is just the car being past the line?" — the answer is no, the triage only decides which frames get the real four-region check; the rule itself is still the four-region condition.
4. **If Track B (mask-based) is built, be ready to say what it is precisely:** a pretrained, zero-shot, box-prompted segmentation model's mask fit to an oriented rectangle — not a custom-trained model, not literal wheel detection.

---

## 9. What changed from the original geometry spec, at a glance

| Area | Before | Now |
|---|---|---|
| Boundary config | Single file, no clip check | Per-clip config + hard mismatch guard |
| Broadcast UI | Detected/tracked as real cars | Excluded before tracking |
| Contact geometry | Fixed mid-edge layout regardless of orientation | Aspect-ratio-switched layout (Track A); optional mask-derived oriented rectangle (Track B) |
| Ambiguous rotation | Silently used mismatched image/motion axes | Explicit `UNCERTAIN` in the ambiguous middle band |
| Violation trigger | Four-region check on every frame | Footprint triage first; four-region check only where it matters |
| Sporting rule | All four regions outside, simultaneously | **Unchanged** — never replaced by whole-footprint-outside |
| Labeling discipline | "Approximate contact region" | Same, extended explicitly to cover both geometry tracks |

---

## 10. Immediate next steps, in order

1. Implement Section 0.1 and 0.2 (boundary guard, UI exclusion) — nothing else can be trusted until these land.
2. Re-run the d3/d5 visual QA clean, on corrected footage only, and specifically look at corner sequences now that the boundary line will actually be correct.
3. Implement Track A (aspect-ratio switch) and re-check against the same corner sequences.
4. If time allows, prototype Track B on a small sample (reuse the segmentation-feasibility experiment already scoped) and compare its corner-region output against Track A on the same frames.
5. Only then wire in the footprint triage and the four-region rule end-to-end, and only then consider the temporal filter and trust score against real candidate events.

Do not proceed to frontend/demo polish until step 2 has actually been looked at by a human.
