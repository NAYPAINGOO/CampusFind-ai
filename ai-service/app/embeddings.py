from __future__ import annotations

from functools import lru_cache
from io import BytesIO
import numpy as np
from PIL import Image

from .config import settings


@lru_cache(maxsize=1)
def _text_model():
    if not settings.enable_ml_models:
        return None
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(settings.text_model_name)


def semantic_text_similarity(left: str, right: str) -> float | None:
    model = _text_model()
    if model is None:
        return None
    embeddings = model.encode([left, right], normalize_embeddings=True)
    similarity = float(np.dot(embeddings[0], embeddings[1]))
    return round(max(0.0, min(1.0, similarity)) * 100, 2)


@lru_cache(maxsize=1)
def _clip_bundle():
    if not settings.enable_ml_models:
        return None
    import open_clip
    import torch
    model, _, preprocess = open_clip.create_model_and_transforms(settings.clip_model_name, pretrained=settings.clip_pretrained)
    model.eval()
    return model, preprocess, torch


def image_similarity(left_bytes: bytes, right_bytes: bytes) -> float | None:
    bundle = _clip_bundle()
    if bundle is None:
        return None
    model, preprocess, torch = bundle
    left = preprocess(Image.open(BytesIO(left_bytes)).convert("RGB")).unsqueeze(0)
    right = preprocess(Image.open(BytesIO(right_bytes)).convert("RGB")).unsqueeze(0)
    with torch.no_grad():
        left_features = model.encode_image(left)
        right_features = model.encode_image(right)
        left_features /= left_features.norm(dim=-1, keepdim=True)
        right_features /= right_features.norm(dim=-1, keepdim=True)
        similarity = float((left_features @ right_features.T).item())
    return round(max(0.0, min(1.0, similarity)) * 100, 2)
