from ..schema import (
    Rule,
    RuleCategory,
    RulePriority,
)


TEMPORAL_SUPPORT_RULE = Rule(
    rule_id="TM-001",
    name="Temporal Support",
    category=RuleCategory.TEMPORAL,
    priority=RulePriority.HIGH,

    description=(
        "Temporal support is established when at least three "
        "eligible observations within a five-observation window "
        "satisfy the four-outside condition."
    ),

    applies_to=(
        "track_limits",
        "temporal_evidence",
    ),

    evidence_required=(
        "timestamp",
        "frame_history",
    ),

    parameters={
        "window_size": 5,
        "required_support": 3,
    },
)