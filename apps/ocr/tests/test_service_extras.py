"""آزمون‌های تکمیلی هسته‌ی OCR: نرمال‌سازی ارقام و در دسترس بودن Tesseract."""

from __future__ import annotations

from app.config import Settings
from app.service import OcrService


def test_normalize_digits_handles_persian_arabic_and_separators() -> None:
    raw = "مبلغ ۴۵٫۰۰۰،۰۰۰ ریال — دیماند ٣٤٠ کیلووات"
    normalized = OcrService._normalize_digits(raw)  # noqa: SLF001 - تست رفتار داخلی
    assert "45.000,000" in normalized
    assert "340" in normalized


def test_parse_metrics_without_keyword_returns_zero() -> None:
    service = OcrService(Settings())
    metrics = service.parse_metrics("هیچ عددی با کلیدواژه‌های شناخته‌شده در این متن نیست")
    assert metrics == {"energy_kwh": 0.0, "demand_kw": 0.0, "power_factor": 0.0, "amount_toman": 0.0}


def test_extract_without_tesseract_returns_empty_page() -> None:
    service = OcrService(Settings())
    service.tesseract_available = lambda: False  # type: ignore[method-assign]
    pages = service._to_images(b"", "x.png")  # noqa: SLF001
    assert pages == [b""]
