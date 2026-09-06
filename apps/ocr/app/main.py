"""
FastAPI OCR Microservice — نوت ۳ §۲-ج و نوت ۵ §۱.

فایل خام (PDF/تصویر) را می‌گیرد، با Tesseract متن را استخراج می‌کند و
متریک‌های قابل‌استخراج قبض را به‌صورت ساختاریافته برمی‌گرداند.
پردازش در فرآیند جدا انجام می‌شود تا بار CPU روی هسته‌ی NestJS نیفتد.
"""

import time

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import JSONResponse

from .config import get_settings
from .schemas import HealthResponse, OcrExtractResponse
from .service import OcrService

settings = get_settings()
ocr = OcrService(settings)

app = FastAPI(
    title="Xennic OCR Service",
    version="0.1.0",
    description="استخراج متن و داده از تصویر/PDF قبض برق",
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """بهداشت سرویس — در صورت نبود Tesseract وضعیت degraded برمی‌گردد (برای healthcheck داکر)."""
    available = ocr.tesseract_available()
    return HealthResponse(
        status="ok" if available else "degraded",
        tesseract_available=available,
        languages=settings.ocr_languages,
    )


@app.post("/ocr/extract", response_model=OcrExtractResponse)
async def extract(
    file: UploadFile = File(..., description="تصویر یا PDF قبض"),
    language: str | None = Form(default=None, description="پیش‌فرض از OCR_LANGUAGES مثلاً fas+eng"),
    dpi: int = Form(default=300, ge=96, le=600, description="رزولوشن رندر صفحات PDF"),
) -> OcrExtractResponse | JSONResponse:
    payload = await file.read()
    if not payload:
        return JSONResponse({"detail": "empty file"}, status_code=400)

    started = time.perf_counter()
    pages = await ocr.extract(
        filename=file.filename or "bill.bin",
        content=payload,
        languages=language,
        dpi=dpi,
    )
    return OcrExtractResponse(
        ok=True,
        languages=language or settings.ocr_languages,
        pages=pages,
        metrics=ocr.parse_metrics("\n".join(page.text for page in pages)),
        elapsed_ms=int((time.perf_counter() - started) * 1000),
    )
