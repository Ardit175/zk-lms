import io
import logging
from typing import Tuple

from openai import AsyncOpenAI

from app.config import get_settings

logger = logging.getLogger(__name__)

MAX_CHARS = 30000
WHISPER_MAX_BYTES = 25 * 1024 * 1024  # OpenAI Whisper API hard limit


class AudioTranscriberService:
    def __init__(self) -> None:
        settings = get_settings()
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)

    async def transcribe(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> Tuple[str, dict, bool]:
        """
        Send audio/video to OpenAI Whisper. Returns (text, metadata, truncated).
        """
        if len(file_bytes) > WHISPER_MAX_BYTES:
            raise ValueError(
                f"Skedari kalon limitin e Whisper-it (25MB). Madhesia: {len(file_bytes) / 1024 / 1024:.1f}MB"
            )

        buffer = io.BytesIO(file_bytes)
        buffer.name = filename  # OpenAI SDK uses .name to infer format

        logger.info(
            "Transcribing %s (%.1f KB, %s)",
            filename,
            len(file_bytes) / 1024,
            content_type,
        )

        try:
            response = await self._client.audio.transcriptions.create(
                model="whisper-1",
                file=buffer,
                response_format="text",
            )
        except Exception as exc:
            logger.exception("Whisper transcription failed")
            raise ValueError(f"Transkriptimi deshtoi: {exc}") from exc

        text = response if isinstance(response, str) else getattr(response, "text", "")
        text = (text or "").strip()

        if not text or len(text) < 20:
            raise ValueError("Transkriptimi solli tekst bosh ose shume te shkurter")

        truncated = False
        if len(text) > MAX_CHARS:
            text = text[:MAX_CHARS]
            truncated = True

        metadata = {
            "filename": filename,
            "content_type": content_type,
            "size_bytes": len(file_bytes),
            "model": "whisper-1",
        }
        return text, metadata, truncated
