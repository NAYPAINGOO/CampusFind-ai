from datetime import date
from typing import Annotated

from pydantic import BaseModel, Field, model_validator

Score = Annotated[float, Field(ge=0, le=100)]


class MatchWeights(BaseModel):
    image: float = 30
    text: float = 25
    category: float = 10
    colour: float = 10
    brand: float = 10
    location: float = 8
    date: float = 7

    @model_validator(mode="after")
    def total_is_one_hundred(self) -> "MatchWeights":
        total = sum(self.model_dump().values())
        if any(value < 0 for value in self.model_dump().values()):
            raise ValueError("Weights must be non-negative")
        if abs(total - 100) > 0.001:
            raise ValueError(f"Weights must total 100; received {total}")
        return self


class MatchComponents(BaseModel):
    image_similarity: Score
    text_similarity: Score
    category_match: Score
    colour_similarity: Score
    brand_similarity: Score
    location_similarity: Score
    date_similarity: Score


class ScoreRequest(BaseModel):
    components: MatchComponents
    weights: MatchWeights = MatchWeights()


class ScoreResponse(BaseModel):
    overall_score: float
    confidence: str
    explanation: str
    notification_eligible: bool
    engine: str


class ReportDescriptor(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=3, max_length=3000)
    category: str = Field(min_length=1, max_length=120)
    primary_colour: str = Field(min_length=1, max_length=50)
    brand: str | None = Field(default=None, max_length=120)
    model: str | None = Field(default=None, max_length=120)
    location: str = Field(min_length=1, max_length=150)
    incident_date: date


class CompareRequest(BaseModel):
    lost: ReportDescriptor
    found: ReportDescriptor
    image_similarity: Score | None = None
    weights: MatchWeights = MatchWeights()
