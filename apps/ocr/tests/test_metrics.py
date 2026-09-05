from app.config import Settings
from app.service import OcrService


def test_parse_metrics_reads_persian_digits() -> None:
    service = OcrService(Settings())
    metrics = service.parse_metrics("مصرف ۱۲۵۰۰ کیلووات ساعت — دیماند ۳۴۰ — ضریب قدرت ۰.۸۷ — مبلغ ۴۵,۰۰۰,۰۰۰")
    assert metrics["energy_kwh"] == 12500
    assert metrics["demand_kw"] == 340
    assert metrics["amount_toman"] == 45000000


def test_extract_without_tesseract_returns_empty_page() -> None:
    service = OcrService(Settings())
    service.tesseract_available = lambda: False  # type: ignore[method-assign]
    pages = __import__("asyncio").run(service.extract("bill.png", b"\x00\x01"))
    assert len(pages) == 1
    assert pages[0].confidence == 0.0
