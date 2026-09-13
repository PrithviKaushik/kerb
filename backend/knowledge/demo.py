from backend.knowledge import create_default_registry


knowledge = create_default_registry()


print("\n=== KERB KNOWLEDGE BASE ===")

for rule in knowledge.all():
    print(
        f"{rule.rule_id} | "
        f"{rule.name} | "
        f"{rule.category.value} | "
        f"{rule.priority.value}"
    )


print("\n=== TRACK LIMIT RULES ===")

for rule in knowledge.by_category(
    __import__(
        "backend.knowledge.schema",
        fromlist=["RuleCategory"],
    ).RuleCategory.TRACK_LIMITS
):
    print(rule.rule_id, rule.name)


print("\n=== TL-001 DEPENDENCIES ===")

for dependency in knowledge.dependencies("TL-001"):
    print(
        f"{dependency.rule_id}: "
        f"{dependency.name}"
    )


print("\n=== FRONTEND JSON ===")

print(knowledge.to_list())