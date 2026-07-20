from app.matching import confidence_label, score_match
from app.models import MatchComponents, MatchWeights


def test_weighted_score() -> None:
    components = MatchComponents(
        image_similarity=90,
        text_similarity=80,
        category_match=100,
        colour_similarity=90,
        brand_similarity=100,
        location_similarity=70,
        date_similarity=80,
    )
    assert score_match(components, MatchWeights()) == 87.2
    assert confidence_label(87.2) == "Very strong"


def test_low_score_label() -> None:
    assert confidence_label(30) == "Weak"
