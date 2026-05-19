import io
import logging
import os
from typing import Tuple

from app.core.azure_client import get_async_azure_openai_client, get_whisper_deployment

logger = logging.getLogger(__name__)

MAX_CHARS = 30000
WHISPER_MAX_BYTES = 25 * 1024 * 1024  # Azure / OpenAI Whisper hard limit


class AudioTranscriberService:
    def __init__(self) -> None:
        self._client = get_async_azure_openai_client()
        self._deployment = get_whisper_deployment()

    async def transcribe(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> Tuple[str, dict, bool]:
        """
        Send audio/video to Azure OpenAI Whisper. Returns (text, metadata, truncated).
        """
        if len(file_bytes) > WHISPER_MAX_BYTES:
            raise ValueError(
                f"Skedari kalon limitin e Whisper-it (25MB). Madhesia: {len(file_bytes) / 1024 / 1024:.1f}MB"
            )

        buffer = io.BytesIO(file_bytes)
        buffer.name = filename  # SDK uses .name to infer format

        logger.info(
            "Transcribing %s (%.1f KB, %s) via Azure deployment '%s'",
            filename,
            len(file_bytes) / 1024,
            content_type,
            self._deployment,
        )

        try:
            response = await self._client.audio.transcriptions.create(
                model=self._deployment,
                file=buffer,
                response_format="text",
                language="sq",
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
            "model": self._deployment,
            "language": "sq",
        }
        return text, metadata, truncated
