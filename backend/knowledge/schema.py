from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class RuleCategory(str, Enum):
    TRACK_LIMITS = "TRACK_LIMITS"
    CONTACT = "CONTACT"
    BOUNDARY = "BOUNDARY"
    TEMPORAL = "TEMPORAL"
    UNCERTAINTY = "UNCERTAINTY"
    EVIDENCE = "EVIDENCE"


class RulePriority(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"


@dataclass(frozen=True)
class Rule:
    """
    A deterministic rule known by the KERB Knowledge Base.
    """

    rule_id: str
    name: str
    category: RuleCategory

    description: str

    priority: RulePriority

    applies_to: tuple[str, ...] = ()

    dependencies: tuple[str, ...] = ()

    evidence_required: tuple[str, ...] = ()

    parameters: dict[str, int | float | str] = field(
        default_factory=dict
    )

    version: str = "1.0"
    enabled: bool = True