from __future__ import annotations

from io import BytesIO
from secrets import compare_digest

from fastapi import Depends, FastAPI, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

from .config import settings
from .embeddings import image_similarity, semantic_text_similarity
from .fallback import compare_descriptors
from .matching import confidence_label, explanation, score_match
from .models import CompareRequest, MatchComponents, ScoreRequest, ScoreResponse

Image.MAX_IMAGE_PIXELS = 30_000_000
MAX_IMAGE_BYTES = 5_242_880

app = FastAPI(title="CampusFind AI Matching Service", version="1.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origin_list,
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["content-type", "x-api-key"],
)


def verify_api_key(x_api_key: str | None = Header(default=None)) -> None:
    if settings.ai_service_api_key == "development-only" and settings.environment != "production":
        return
    if not x_api_key or not compare_digest(x_api_key, settings.ai_service_api_key):
        raise HTTPException(status_code=401, detail="Invalid API key")


def validate_image(content: bytes) -> None:
    if not content:
        raise HTTPException(status_code=400, detail="Image file is empty")
    try:
        with Image.open(BytesIO(content)) as image:
            image.verify()
        with Image.open(BytesIO(content)) as image:
            width, height = image.size
            if width < 32 or height < 32:
                raise HTTPException(status_code=400, detail="Image dimensions are too small")
            if width * height > Image.MAX_IMAGE_PIXELS:
                raise HTTPException(status_code=413, detail="Image dimensions are too large")
    except (UnidentifiedImageError, OSError, SyntaxError, Image.DecompressionBombError) as error:
        raise HTTPException(status_code=400, detail="Invalid or unsafe image file") from error


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {"status": "ok", "ml_models_enabled": settings.enable_ml_models}


@app.post("/v1/score", response_model=ScoreResponse, dependencies=[Depends(verify_api_key)])
def score(request: ScoreRequest) -> ScoreResponse:
    overall = score_match(request.components, request.weights)
    return ScoreResponse(
        overall_score=overall,
        confidence=confidence_label(overall),
        explanation=explanation(request.components, overall),
        notification_eligible=overall >= 70,
        engine="weighted-components",
    )


@app.post("/v1/compare", response_model=ScoreResponse, dependencies=[Depends(verify_api_key)])
def compare(request: CompareRequest) -> ScoreResponse:
    values = compare_descriptors(request.lost, request.found, request.image_similarity)
    semantic = semantic_text_similarity(
        f"{request.lost.title} {request.lost.description}",
        f"{request.found.title} {request.found.description}",
    )
    if semantic is not None:
        values["text_similarity"] = semantic
    components = MatchComponents(**values)
    overall = score_match(components, request.weights)
    return ScoreResponse(
        overall_score=overall,
        confidence=confidence_label(overall),
        explanation=explanation(components, overall),
        notification_eligible=overall >= 70,
        engine="ml+rules" if semantic is not None else "rule-fallback",
    )


@app.post("/v1/image-similarity", dependencies=[Depends(verify_api_key)])
async def compare_images(left: UploadFile, right: UploadFile) -> dict[str, float | str]:
    allowed = {"image/jpeg", "image/png", "image/webp"}
    if left.content_type not in allowed or right.content_type not in allowed:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG and WebP are accepted")
    left_bytes, right_bytes = await left.read(MAX_IMAGE_BYTES + 1), await right.read(MAX_IMAGE_BYTES + 1)
    if len(left_bytes) > MAX_IMAGE_BYTES or len(right_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Each image must be 5 MB or smaller")
    validate_image(left_bytes)
    validate_image(right_bytes)
    similarity = image_similarity(left_bytes, right_bytes)
    if similarity is None:
        raise HTTPException(status_code=503, detail="CLIP model is disabled; use a supplied image score or enable ML models")
    return {"image_similarity": similarity, "engine": "CLIP"}
