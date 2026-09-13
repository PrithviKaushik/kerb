from __future__ import annotations

from collections import deque

from ..models import TemporalResult


class TemporalConfig:
    def __init__(
        self,
        window_size: int = 5,
        required: int = 3,
    ) -> None:

        if window_size < 1:
            raise ValueError("window_size must be >= 1")

        if required < 1:
            raise ValueError("required must be >= 1")

        if required > window_size:
            raise ValueError(
                "required cannot exceed window_size"
            )

        self.window_size = window_size
        self.required = required


class TemporalFilter:
    """
    Tracks persistence of the four-outside condition
    independently for each vehicle track.
    """

    def __init__(
        self,
        config: TemporalConfig | None = None,
    ) -> None:

        self.config = config or TemporalConfig()

        self._history: dict[int, deque[bool]] = {}

    def update(
        self,
        track_id: int,
        four_outside: bool | None,
    ) -> TemporalResult:

        history = self._history.setdefault(
            track_id,
            deque(maxlen=self.config.window_size),
        )

        # Unknown observations are not inserted into the history.
        if four_outside is not None:
            history.append(four_outside)

        eligible_frames = len(history)

        outside_frames = sum(history)

        satisfied = (
            eligible_frames >= self.config.required
            and outside_frames >= self.config.required
        )

        return TemporalResult(
            eligible_frames=eligible_frames,
            outside_frames=outside_frames,
            window_size=self.config.window_size,
            required=self.config.required,
            satisfied=satisfied,
        )

    def reset_track(self, track_id: int) -> None:
        self._history.pop(track_id, None)

    def reset(self) -> None:
        self._history.clear()

    def get_history(self, track_id: int) -> tuple[bool, ...]:
        history = self._history.get(track_id)

        if history is None:
            return ()

        return tuple(history)