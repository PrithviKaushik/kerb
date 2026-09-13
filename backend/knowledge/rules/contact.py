from ..schema import (
    Rule,
    RuleCategory,
    RulePriority,
)


CONTACT_REGION_RULE = Rule(
    rule_id="CT-001",
    name="Vehicle Contact Regions",
    category=RuleCategory.CONTACT,
    priority=RulePriority.HIGH,

    description=(
        "Track-limit evaluation uses four vehicle contact regions "
        "representing the front-left, front-right, rear-left and "
        "rear-right tire contact areas."
    ),

    applies_to=(
        "vehicle_geometry",
        "track_limits",
    ),

    evidence_required=(
        "vehicle_detection",
        "vehicle_geometry",
    ),

    parameters={
        "contact_y_ratio": 0.05,
        "left_x_ratio": 0.20,
        "right_x_ratio": 0.80,
    },
)