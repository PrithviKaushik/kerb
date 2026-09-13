from backend.skills.incident_report.models import (
    ContactRegion,
    ContactState,
    ContactMethod,
    Point,
    TemporalResult,
)

from backend.skills.incident_report.trust.score import (
    TrustScorer,
    build_trust_input,
)
def make_contact_regions(
    state: ContactState,
) -> tuple[ContactRegion, ...]:

    names = (
        "front_left",
        "front_right",
        "rear_left",
        "rear_right",
    )

    return tuple(
        ContactRegion(
            name=name,
            point=Point(0, 0),
            state=state,
            observability=1.0,
            method=ContactMethod.BBOX_PROXY,
            reliability=0.94,
        )
        for name in names
    )


temporal = TemporalResult(
    eligible_frames=5,
    outside_frames=3,
    window_size=5,
    required=3,
    satisfied=True,
)


scorer = TrustScorer()


# -----------------------------------------
# Scenario 1: Strong evidence
# -----------------------------------------

regions = make_contact_regions(
    ContactState.OUTSIDE
)

trust_input = build_trust_input(
    contact_regions=regions,
    temporal=temporal,
    stable_tracking=True,
    geometric_margin=True,
)

result = scorer.calculate(trust_input)

print("\nSTRONG EVIDENCE")
print(result)


# -----------------------------------------
# Scenario 2: Weak evidence
# -----------------------------------------

regions = make_contact_regions(
    ContactState.OUTSIDE
)

trust_input = build_trust_input(
    contact_regions=regions,
    temporal=TemporalResult(
        eligible_frames=2,
        outside_frames=1,
        window_size=5,
        required=3,
        satisfied=False,
    ),
    stable_tracking=False,
    geometric_margin=False,
)

result = scorer.calculate(trust_input)

print("\nWEAK EVIDENCE")
print(result)


# -----------------------------------------
# Scenario 3: Unknown contact region
# -----------------------------------------

regions = (
    ContactRegion(
        name="front_left",
        point=Point(0, 0),
        state=ContactState.UNKNOWN,
        observability=0.2,
        method=ContactMethod.BBOX_PROXY,
        reliability=0.40,
    ),
    *make_contact_regions(ContactState.OUTSIDE)[1:],
)

trust_input = build_trust_input(
    contact_regions=regions,
    temporal=temporal,
    stable_tracking=True,
    geometric_margin=True,
)

result = scorer.calculate(trust_input)

print("\nUNKNOWN CONTACT")
print(result)