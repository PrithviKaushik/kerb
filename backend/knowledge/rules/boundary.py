from ..schema import (
    Rule,
    RuleCategory,
    RulePriority,
)


BOUNDARY_CONTACT_RULE = Rule(
    rule_id="BD-001",
    name="Boundary Contact",
    category=RuleCategory.BOUNDARY,
    priority=RulePriority.CRITICAL,

    description=(
        "Contact with the legal track boundary must not be "
        "classified as outside. A contact region on the boundary "
        "is treated as ON_BOUNDARY."
    ),

    applies_to=(
        "track_limits",
        "boundary_classification",
    ),

    evidence_required=(
        "legal_boundary",
        "contact_region",
    ),

    parameters={
        "boundary_tolerance_px": 2,
    },
)