"""قرارداد ورودی/خروجی — آینه‌ی @xennic/shared (هر تغییر باید در هر دو طرف اعمال شود)."""

from typing import Any

from pydantic import BaseModel, Field


class OcrPage(BaseModel):
    page: int = Field(ge=1)
    text: str
    confidence: float = Field(ge=0, le=100)


class OcrExtractResponse(BaseModel):
    ok: bool
    engine: str = "tesseract"
    languages: str
    pages: list[OcrPage] = []
    metrics: dict[str, Any] = {}
    elapsed_ms: int = 0


class HealthResponse(BaseModel):
    status: str
    tesseract_available: bool
    languages: str
