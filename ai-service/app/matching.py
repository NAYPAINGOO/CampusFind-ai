from __future__ import annotations

from .models import MatchComponents, MatchWeights


def score_match(components: MatchComponents, weights: MatchWeights) -> float:
    values = {
        "image": components.image_similarity,
        "text": components.text_similarity,
        "category": components.category_match,
        "colour": components.colour_similarity,
        "brand": components.brand_similarity,
        "location": components.location_similarity,
        "date": components.date_similarity,
    }
    weighted = sum(values[key] * weight for key, weight in weights.model_dump().items())
    return round(weighted / 100, 2)


def confidence_label(score: float) -> str:
    if score >= 85:
        return "Very strong"
    if score >= 70:
        return "Strong"
    if score >= 50:
        return "Possible"
    return "Weak"


def explanation(components: MatchComponents, score: float) -> str:
    reasons: list[str] = []
    pairs = [
        (components.image_similarity, "visually similar images"),
        (components.text_similarity, "closely matching descriptions"),
        (components.category_match, "the same item category"),
        (components.colour_similarity, "similar colours"),
        (components.brand_similarity, "matching brand or model details"),
        (components.location_similarity, "nearby campus locations"),
        (components.date_similarity, "dates recorded close together"),
    ]
    reasons.extend(label for value, label in pairs if value >= 75)
    joined = ", ".join(reasons) if reasons else "several moderately similar attributes"
    return f"{round(score)}% recommendation based on {joined}. Human verification is required."
