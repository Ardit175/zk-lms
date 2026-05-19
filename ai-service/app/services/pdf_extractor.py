import io
import logging
import re
from typing import Tuple

from pypdf import PdfReader

logger = logging.getLogger(__name__)

# Soft cap to keep prompts within model limits and cost predictable.
MAX_CHARS = 30000


def _clean(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_text_from_pdf(file_bytes: bytes, filename: str) -> Tuple[str, dict, bool]:
    """
    Return (cleaned_text, metadata, truncated).
    Raises ValueError on malformed/empty PDFs.
    """
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except Exception as exc:
        raise ValueError(f"PDF i palexueshem: {exc}") from exc

    if reader.is_encrypted:
        try:
            reader.decrypt("")
        except Exception as exc:
            raise ValueError("PDF eshte i mbrojtur me fjalekalim") from exc

    pages = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception as exc:
            logger.warning("Failed to extract a page from %s: %s", filename, exc)
            continue

    raw = "\n\n".join(p for p in pages if p.strip())
    cleaned = _clean(raw)

    if not cleaned or len(cleaned) < 50:
        raise ValueError(
            "PDF nuk permban tekst te lexueshem. Mund te jete i skanuar si imazh — perdor OCR perpara ngarkimit."
        )

    truncated = False
    if len(cleaned) > MAX_CHARS:
        cleaned = cleaned[:MAX_CHARS]
        truncated = True

    metadata = {
        "filename": filename,
        "page_count": len(reader.pages),
    }
    try:
        info = reader.metadata
        if info:
            if info.title:
                metadata["title"] = str(info.title)
            if info.author:
                metadata["author"] = str(info.author)
    except Exception:
        pass

    return cleaned, metadata, truncated
