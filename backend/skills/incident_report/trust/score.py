from __future__ import annotations

from dataclasses import dataclass

from ..models import (
    ContactRegion,
    ContactState,
    TemporalResult,
    TrustBand,
    TrustResult,
)


@dataclass(frozen=True)
class TrustInput:
    """
    Evidence-quality signals used to calculate the trust score.

    These are evidence-quality indicators, NOT probabilities.
    """

    stable_tracking: bool
    clear_boundary: bool
    contact_visibility: bool
    geometric_margin: bool
    temporal_support: bool

    critical_contact_unknown: bool = False


class TrustScorer:
    """
    Calculates a deterministic evidence-quality score.

    Scoring:
        Base                    50
        Stable tracking        +15
        Clear boundary         +10
        Contact visibility     +10
        Geometric margin       +10
        Temporal support        +5

    Maximum = 100

    This score represents confidence in the quality of the
    evidence package, NOT probability that a sporting violation
    occurred.
    """

    BASE_SCORE = 50

    STABLE_TRACKING_POINTS = 15
    CLEAR_BOUNDARY_POINTS = 10
    CONTACT_VISIBILITY_POINTS = 10
    GEOMETRIC_MARGIN_POINTS = 10
    TEMPORAL_SUPPORT_POINTS = 5

    CRITICAL_UNKNOWN_MAX = 59

    def calculate(
        self,
        evidence: TrustInput,
    ) -> TrustResult:

        breakdown = {
            "base": self.BASE_SCORE,

            "stable_tracking": (
                self.STABLE_TRACKING_POINTS
                if evidence.stable_tracking
                else 0
            ),

            "clear_boundary": (
                self.CLEAR_BOUNDARY_POINTS
                if evidence.clear_boundary
                else 0
            ),

            "contact_visibility": (
                self.CONTACT_VISIBILITY_POINTS
                if evidence.contact_visibility
                else 0
            ),

            "geometric_margin": (
                self.GEOMETRIC_MARGIN_POINTS
                if evidence.geometric_margin
                else 0
            ),

            "temporal_support": (
                self.TEMPORAL_SUPPORT_POINTS
                if evidence.temporal_support
                else 0
            ),
        }

        score = sum(breakdown.values())

        score = min(100, max(0, score))

        # If a critical contact region cannot be observed,
        # evidence quality is capped regardless of other signals.
        if evidence.critical_contact_unknown:
            score = min(
                score,
                self.CRITICAL_UNKNOWN_MAX,
            )

        band = self._band(score, evidence)

        return TrustResult(
            score=score,
            band=band,
            stable_tracking=evidence.stable_tracking,
            clear_boundary=evidence.clear_boundary,
            contact_visibility=evidence.contact_visibility,
            geometric_margin=evidence.geometric_margin,
            temporal_support=evidence.temporal_support,
            breakdown=breakdown,
        )

    @staticmethod
    def _band(
        score: int,
        evidence: TrustInput,
    ) -> TrustBand:

        if evidence.critical_contact_unknown:
            return TrustBand.UNCERTAIN

        if score >= 90:
            return TrustBand.HIGH

        if score >= 75:
            return TrustBand.MEDIUM_HIGH

        if score >= 60:
            return TrustBand.MEDIUM

        return TrustBand.LOW


def build_trust_input(
    contact_regions: tuple[ContactRegion, ...],
    temporal: TemporalResult,
    stable_tracking: bool,
    geometric_margin: bool,
) -> TrustInput:

    critical_contact_unknown = any(
        region.state == ContactState.UNKNOWN
        for region in contact_regions
    )

    contact_visibility = not critical_contact_unknown

    clear_boundary = all(
        region.state != ContactState.UNKNOWN
        for region in contact_regions
    )

    return TrustInput(
        stable_tracking=stable_tracking,
        clear_boundary=clear_boundary,
        contact_visibility=contact_visibility,
        geometric_margin=geometric_margin,
        temporal_support=temporal.satisfied,
        critical_contact_unknown=critical_contact_unknown,
    )