from .registry import RuleRegistry

from .rules import (
    BOUNDARY_CONTACT_RULE,
    CONTACT_REGION_RULE,
    FOUR_OUTSIDE_RULE,
    FORCED_OFF_TRACK_RULE,
    STEWARD_REVIEW_RULE,
    TEMPORAL_SUPPORT_RULE,
    UNKNOWN_CONTACT_RULE,
)


def create_default_registry() -> RuleRegistry:
    return RuleRegistry(
        rules=[
            FOUR_OUTSIDE_RULE,
            FORCED_OFF_TRACK_RULE,
            BOUNDARY_CONTACT_RULE,
            CONTACT_REGION_RULE,
            TEMPORAL_SUPPORT_RULE,
            UNKNOWN_CONTACT_RULE,
            STEWARD_REVIEW_RULE,
        ]
    )

__all__ = [
    "RuleRegistry",
    "create_default_registry",
]