"""آزمون‌های تکمیلی هسته‌ی OCR: نرمال‌سازی ارقام و در دسترس بودن Tesseract."""

from __future__ import annotations

import pytest

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


def test_extract_survives_engine_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    """خطای موتور OCR (مثلاً نبودِ traineddata یا تصویر خراب) باید به صفحه‌ی خالی تبدیل شود."""
    import asyncio

    import pytesseract

    monkeypatch.setattr(OcrService, "tesseract_available", lambda self: True)

    def broken(*args: object, **kwargs: object) -> None:
        raise RuntimeError("Error opening data file fas.traineddata")

    monkeypatch.setattr(pytesseract, "image_to_string", broken)

    service = OcrService(Settings())
    pages = asyncio.run(service.extract("bill.png", b"\x00\x01"))
    assert len(pages) == 1
    assert pages[0].text == ""
    assert pages[0].confidence == 0.0


def test_tessdata_discovery_ignores_missing_paths(monkeypatch: pytest.MonkeyPatch) -> None:
    """مسیر ناموجود در تنظیمات نباید باعث ارسال --tessdata-dir بی‌معنی شود."""
    service = OcrService(Settings(ocr_tesseract_data_path="/definitely/not/here"))
    monkeypatch.setattr("os.path.isdir", lambda _path: False)
    assert service._tessdata_dir() is None  # noqa: SLF001
