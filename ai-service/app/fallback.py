from __future__ import annotations

from datetime import date
from difflib import SequenceMatcher
from math import exp
import re

from .models import ReportDescriptor


def _normalise(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(re.findall(r"[a-z0-9]+", value.lower()))


def text_similarity(left: str, right: str) -> float:
    a, b = _normalise(left), _normalise(right)
    if not a or not b:
        return 0.0
    sequence = SequenceMatcher(None, a, b).ratio()
    words_a, words_b = set(a.split()), set(b.split())
    union = words_a | words_b
    jaccard = len(words_a & words_b) / len(union) if union else 0.0
    return round((sequence * 0.55 + jaccard * 0.45) * 100, 2)


def exact_or_fuzzy(left: str | None, right: str | None) -> float:
    a, b = _normalise(left), _normalise(right)
    if not a and not b:
        return 50.0
    if not a or not b:
        return 20.0
    if a == b:
        return 100.0
    return round(SequenceMatcher(None, a, b).ratio() * 100, 2)


def date_proximity(left: str | date, right: str | date) -> float:
    try:
        left_date = left if isinstance(left, date) else date.fromisoformat(left)
        right_date = right if isinstance(right, date) else date.fromisoformat(right)
        days = abs((left_date - right_date).days)
    except ValueError:
        return 0.0
    return round(100 * exp(-days / 7), 2)


def location_similarity(left: str, right: str) -> float:
    return exact_or_fuzzy(left, right)


def compare_descriptors(lost: ReportDescriptor, found: ReportDescriptor, image_similarity: float | None) -> dict[str, float]:
    combined_lost = f"{lost.title} {lost.description} {lost.brand or ''} {lost.model or ''}"
    combined_found = f"{found.title} {found.description} {found.brand or ''} {found.model or ''}"
    return {
        "image_similarity": float(image_similarity if image_similarity is not None else 50.0),
        "text_similarity": text_similarity(combined_lost, combined_found),
        "category_match": exact_or_fuzzy(lost.category, found.category),
        "colour_similarity": exact_or_fuzzy(lost.primary_colour, found.primary_colour),
        "brand_similarity": exact_or_fuzzy(f"{lost.brand or ''} {lost.model or ''}", f"{found.brand or ''} {found.model or ''}"),
        "location_similarity": location_similarity(lost.location, found.location),
        "date_similarity": date_proximity(lost.incident_date, found.incident_date),
    }
