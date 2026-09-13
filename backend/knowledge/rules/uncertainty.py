from ..schema import (
    Rule,
    RuleCategory,
    RulePriority,
)


UNKNOWN_CONTACT_RULE = Rule(
    rule_id="UN-001",
    name="Unknown Contact Handling",
    category=RuleCategory.UNCERTAINTY,
    priority=RulePriority.CRITICAL,

    description=(
        "An unobservable critical contact region must not be "
        "assumed to be outside the legal boundary. The observation "
        "is treated as uncertain."
    ),

    applies_to=(
        "track_limits",
        "vehicle_geometry",
        "evidence_quality",
    ),

    evidence_required=(
        "contact_region_observability",
    ),

    parameters={
        "maximum_trust_score": 59,
    },
)