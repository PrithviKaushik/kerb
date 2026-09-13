from ..schema import (
    Rule,
    RuleCategory,
    RulePriority,
)


FOUR_OUTSIDE_RULE = Rule(
    rule_id="TL-001",
    name="Four Outside Rule",
    category=RuleCategory.TRACK_LIMITS,
    priority=RulePriority.CRITICAL,

    description=(
        "A track-limit violation candidate requires all four "
        "contact regions of the vehicle to be outside the legal "
        "track boundary at the evaluated observation."
    ),

    applies_to=(
        "track_limits",
        "vehicle_contact",
    ),

    dependencies=(
        "CT-001",
        "BD-001",
    ),

    evidence_required=(
        "front_left",
        "front_right",
        "rear_left",
        "rear_right",
    ),

    parameters={
        "required_outside_regions": 4,
    },
)
FORCED_OFF_TRACK_RULE = Rule(
    rule_id="TL-002",
    name="Forced Off Track",
    category=RuleCategory.TRACK_LIMITS,
    priority=RulePriority.CRITICAL,
    description=(
        "A driver should not be treated as committing a "
        "track-limit violation when they are forced beyond "
        "the legal track boundary by another driver. "
        "The situation requires contextual steward review "
        "rather than automatic classification as a violation."
    ),
    applies_to=(
        "track_limits",
        "race_context",
        "steward_review",
    ),
    dependencies=("TL-001", "EV-001"),
    evidence_required=(
        "vehicle_contact_regions",
        "nearby_vehicle",
        "relative_vehicle_motion",
        "event_frames",
    ),
    parameters={
        "requires_contextual_review": True,
    },
)