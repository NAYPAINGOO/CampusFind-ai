from typing import Literal

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: Literal["development", "test", "production"] = "development"
    ai_service_api_key: str = "development-only"
    allowed_origins: str = "http://localhost:3000"
    text_model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    clip_model_name: str = "ViT-B-32"
    clip_pretrained: str = "laion2b_s34b_b79k"
    enable_ml_models: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def secure_production_settings(self) -> "Settings":
        if self.environment == "production" and (
            self.ai_service_api_key == "development-only" or len(self.ai_service_api_key) < 32
        ):
            raise ValueError("AI_SERVICE_API_KEY must be a non-default value of at least 32 characters in production")
        return self


settings = Settings()
