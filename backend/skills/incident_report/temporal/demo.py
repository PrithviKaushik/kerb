from .search import TemporalEvidenceSearcher
from .evidence import temporal_evidence_to_dict


evaluations = [
    {
        "frame_index": 4206,
        "timestamp_s": 84.12,
        "track_id": 16,
        "four_outside": False,
    },
    {
        "frame_index": 4211,
        "timestamp_s": 84.22,
        "track_id": 16,
        "four_outside": True,
    },
    {
        "frame_index": 4216,
        "timestamp_s": 84.32,
        "track_id": 16,
        "four_outside": True,
    },
    {
        "frame_index": 4221,
        "timestamp_s": 84.42,
        "track_id": 16,
        "four_outside": True,
    },
    {
        "frame_index": 4226,
        "timestamp_s": 84.52,
        "track_id": 16,
        "four_outside": False,
    },
]


searcher = TemporalEvidenceSearcher(
    before_s=0.20,
    after_s=0.20,
    required_support=3,
)

result = searcher.search(
    track_id=16,
    event_timestamp_s=84.32,
    evaluations=evaluations,
)

print(temporal_evidence_to_dict(result))