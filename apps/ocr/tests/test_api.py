"""دود-آزمون لایه‌ی HTTP: /health و /ocr/extract بدون نیاز به Tesseract نصب‌شده."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_engine_availability() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] in {"ok", "degraded"}
    assert isinstance(body["tesseract_available"], bool)
    assert body["languages"]


def test_ocr_extract_accepts_png_upload() -> None:
    # PNG تک‌پیکسلی — مسیر بدون Tesseract باید پاسخ ساختاریافته بدهد نه ۵۰۰
    png = bytes.fromhex(
        "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4"
        "890000000d49444154789c63000100000500010d0a2db40000000049454e44ae426082"
    )
    response = client.post(
        "/ocr/extract",
        files={"file": ("bill.png", png, "image/png")},
        data={"language": "fas+eng", "dpi": "250"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["pages"] and body["pages"][0]["page"] == 1
    assert "metrics" in body
