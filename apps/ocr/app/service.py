"""هسته‌ی پردازش تصویر/OCR."""

from __future__ import annotations

import re
import shutil
from dataclasses import dataclass

from .schemas import OcrPage


@dataclass
class OcrService:
    settings: object

    # ── ابزارهای کمکی ───────────────────────────────────────────────────────
    def tesseract_available(self) -> bool:
        return shutil.which("tesseract") is not None

    def _to_images(self, content: bytes, filename: str, dpi: int = 300) -> list[bytes]:
        if filename.lower().endswith(".pdf"):
            try:
                import pymupdf as fitz  # نام مدرن PyMuPDF
            except ImportError:  # پشتیبانی از نصب‌های قدیمی‌تر
                import fitz  # type: ignore[no-redef]

            document = fitz.open(stream=content, filetype="pdf")
            limit = min(len(document), int(getattr(self.settings, "ocr_max_pages", 4)))
            pages: list[bytes] = []
            for index in range(limit):
                page = document.load_page(index)
                pixmap = page.get_pixmap(dpi=dpi)
                pages.append(pixmap.tobytes("png"))
            document.close()
            return pages
        return [content]

    # ── مسیر اصلی ────────────────────────────────────────────────────────────
    async def extract(
        self,
        filename: str,
        content: bytes,
        *,
        languages: str | None = None,
        dpi: int = 300,
    ) -> list[OcrPage]:
        if not self.tesseract_available():
            # فاز ۱: در محیطی که binstaller/tessdata نصب نباشد، پاسخ صریح برمی‌گردد
            return [OcrPage(page=1, text="", confidence=0.0)]

        import pytesseract
        from PIL import Image

        pytesseract.pytesseract.tesseract_cmd = shutil.which("tesseract") or "tesseract"
        tessdata = getattr(self.settings, "ocr_tesseract_data_path", "")
        psm = getattr(self.settings, "ocr_psm", 6)
        config = f"--tessdata-dir {tessdata} --psm {psm}"
        languages = languages or getattr(self.settings, "ocr_languages", "fas+eng")

        results: list[OcrPage] = []
        for index, image_bytes in enumerate(self._to_images(content, filename, dpi)):
            import io

            image = Image.open(io.BytesIO(image_bytes))
            text = pytesseract.image_to_string(image, lang=languages, config=config)
            data = pytesseract.image_to_data(
                image,
                lang=languages,
                config=config,
                output_type=pytesseract.Output.DICT,
            )
            confidences = [float(c) for c in data.get("conf", []) if str(c).replace(".", "", 1).isdigit()]
            average = sum(confidences) / len(confidences) if confidences else 0.0
            results.append(OcrPage(page=index + 1, text=text.strip(), confidence=round(average, 2)))
        return results

    def parse_metrics(self, text: str) -> dict[str, float]:
        """
        استخراج متریک‌های خام از متن OCR (مبلغ، دیماند، ضریب قدرت، kWh).
        تطبیق دقیق فیلدها در فاز ۲ با الگوهای واقعی قبض توانیر کامل می‌شود.
        """
        normalized = self._normalize_digits(text)

        def first(pattern: str) -> float:
            match = re.search(pattern, normalized, flags=re.IGNORECASE)
            return float(match.group(1).replace(",", "").replace("_", "")) if match else 0.0

        return {
            "energy_kwh": first(r"(?:مصرف|energy|kwh)[^\d]{0,14}([\d,_]+)"),
            "demand_kw": first(r"(?:demand|دیماند)[^\d]{0,14}([\d,_]+)"),
            "power_factor": first(r"(?:power factor|pf|ضریب قدرت)[^\d]{0,14}([\d.,]+)"),
            "amount_toman": first(r"(?:amount|مبلغ|ریال|تومان)[^\d]{0,14}([\d,_]+)"),
        }

    @staticmethod
    def _normalize_digits(text: str) -> str:
        """یکدست‌سازی ارقام فارسی/عربی و جداکننده‌های اعشار برای parse Metrics."""
        persian = "۰۱۲۳۴۵۶۷۸۹"
        arabic = "٠١٢٣٤٥٦٧٨٩"
        table = str.maketrans(
            {**{ch: str(i) for i, ch in enumerate(persian)}, **{ch: str(i) for i, ch in enumerate(arabic)}},
        )
        out = text.translate(table)
        return out.replace("٫", ".").replace("،", ",")
