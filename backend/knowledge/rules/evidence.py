from ..schema import (
    Rule,
    RuleCategory,
    RulePriority,
)


STEWARD_REVIEW_RULE = Rule(
    rule_id="EV-001",
    name="Steward Review Required",
    category=RuleCategory.EVIDENCE,
    priority=RulePriority.CRITICAL,

    description=(
        "KERB produces evidence-backed incident candidates for "
        "human steward review. The system does not make the final "
        "sporting decision."
    ),

    applies_to=(
        "incident_reporting",
        "steward_review",
    ),

    evidence_required=(
        "incident_state",
        "evidence_frames",
        "trust_score",
    ),
)