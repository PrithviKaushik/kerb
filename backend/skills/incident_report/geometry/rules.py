from __future__ import annotations

from collections.abc import Iterable

from ..models import ContactRegion, ContactState, IncidentState


def evaluate_four_outside(
    contact_regions: Iterable[ContactRegion],
) -> tuple[bool | None, IncidentState]:
    """
    Evaluate the KERB four-outside sporting rule for one frame.

    Rules:

    - All four contact regions OUTSIDE
        -> VIOLATION_CANDIDATE

    - Any contact region INSIDE
        -> NO_VIOLATION

    - Any contact region ON_BOUNDARY
        -> NO_VIOLATION

    - Any critical contact region UNKNOWN
        -> UNCERTAIN

    The temporal 3-of-5 rule is intentionally NOT handled here.
    """

    contacts = tuple(contact_regions)

    if len(contacts) != 4:
        raise ValueError(
            f"Expected exactly 4 contact regions, got {len(contacts)}."
        )

    states = [contact.state for contact in contacts]

    # Unknown takes precedence over an aggressive violation claim.
    if ContactState.UNKNOWN in states:
        return None, IncidentState.UNCERTAIN

    # Touching the boundary is NOT outside.
    if ContactState.ON_BOUNDARY in states:
        return False, IncidentState.NO_VIOLATION

    # Any contact region still inside means all-four-outside is false.
    if ContactState.INSIDE in states:
        return False, IncidentState.NO_VIOLATION

    # At this point all four must be OUTSIDE.
    if all(state == ContactState.OUTSIDE for state in states):
        return True, IncidentState.VIOLATION_CANDIDATE

    # Defensive fallback. The states are an enum, so this should
    # normally never be reached.
    return None, IncidentState.UNCERTAIN