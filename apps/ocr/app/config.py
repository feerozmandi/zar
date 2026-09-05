"""تنظیمات مایکروسرویس OCR — با همان نام متغیرهایی که در @xennic/shared اعتبارسنجی می‌شوند."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../../.env"), extra="ignore")

    node_env: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"

    ocr_languages: str = "fas+eng"
    ocr_tesseract_data_path: str = "/usr/share/tessdata"
    ocr_psm: int = 6
    ocr_max_pages: int = 4
    redis_url: str = "redis://localhost:6379"


@lru_cache
def get_settings() -> Settings:
    return Settings()
