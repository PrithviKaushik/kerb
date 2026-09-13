from __future__ import annotations

from .schema import Rule, RuleCategory


class RuleRegistry:
    """
    In-memory Knowledge Base / Rule Registry.

    The registry is intentionally storage-independent.
    It can later be backed by a database or graph database
    without changing the agent interface.
    """

    def __init__(self, rules: list[Rule] | None = None) -> None:
        self._rules: dict[str, Rule] = {}

        if rules:
            for rule in rules:
                self.register(rule)

    def register(self, rule: Rule) -> None:
        if rule.rule_id in self._rules:
            raise ValueError(
                f"Rule already registered: {rule.rule_id}"
            )

        self._rules[rule.rule_id] = rule

    def get(self, rule_id: str) -> Rule | None:
        return self._rules.get(rule_id)

    def require(self, rule_id: str) -> Rule:
        rule = self.get(rule_id)

        if rule is None:
            raise KeyError(
                f"Unknown rule: {rule_id}"
            )

        return rule

    def all(self) -> tuple[Rule, ...]:
        return tuple(self._rules.values())

    def enabled(self) -> tuple[Rule, ...]:
        return tuple(
            rule
            for rule in self._rules.values()
            if rule.enabled
        )

    def by_category(
        self,
        category: RuleCategory,
    ) -> tuple[Rule, ...]:

        return tuple(
            rule
            for rule in self._rules.values()
            if rule.category == category
            and rule.enabled
        )

    def dependencies(
        self,
        rule_id: str,
    ) -> tuple[Rule, ...]:

        rule = self.require(rule_id)

        return tuple(
            self.require(dependency_id)
            for dependency_id in rule.dependencies
        )

    def search(
        self,
        query: str,
    ) -> tuple[Rule, ...]:

        query = query.lower().strip()

        if not query:
            return self.enabled()

        return tuple(
            rule
            for rule in self.enabled()
            if (
                query in rule.rule_id.lower()
                or query in rule.name.lower()
                or query in rule.description.lower()
                or query in rule.category.value.lower()
            )
        )
    def to_dict(self, rule_id: str) -> dict:
        rule = self.require(rule_id)

        return {
            "rule_id": rule.rule_id,
            "name": rule.name,
            "category": rule.category.value,
            "description": rule.description,
            "priority": rule.priority.value,
            "applies_to": list(rule.applies_to),
            "dependencies": list(rule.dependencies),
            "evidence_required": list(rule.evidence_required),
            "parameters": dict(rule.parameters),
            "version": rule.version,
            "enabled": rule.enabled,
        }

    def to_list(self) -> list[dict]:
        return [
            self.to_dict(rule.rule_id)
            for rule in self.enabled()
        ]