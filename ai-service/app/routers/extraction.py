import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status

from app.schemas.extraction import ExtractionResponse, YoutubeExtractionRequest
from app.services.audio_transcriber import AudioTranscriberService
from app.services.pdf_extractor import extract_text_from_pdf
from app.services.youtube_extractor import fetch_youtube_transcript

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/content-extractor", tags=["AI Extraction"])

_audio_service = AudioTranscriberService()

MAX_PDF_BYTES = 25 * 1024 * 1024  # 25MB
MAX_AUDIO_BYTES = 25 * 1024 * 1024


@router.post(
    "/pdf",
    response_model=ExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract text from a PDF file",
)
async def extract_pdf(file: UploadFile = File(...)) -> ExtractionResponse:
    if file.content_type not in {"application/pdf", "application/x-pdf"} and not (
        file.filename or ""
    ).lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Skedari duhet te jete PDF",
        )

    data = await file.read()
    if len(data) > MAX_PDF_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"PDF kalon limitin prej {MAX_PDF_BYTES // (1024 * 1024)}MB",
        )

    try:
        text, metadata, truncated = extract_text_from_pdf(data, file.filename or "document.pdf")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception:
        logger.exception("PDF extraction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ekstrakti i PDF-se deshtoi",
        )

    return ExtractionResponse(
        source_type="pdf",
        source_label=metadata.get("title") or file.filename or "PDF",
        content=text,
        char_count=len(text),
        truncated=truncated,
        metadata=metadata,
    )


@router.post(
    "/youtube",
    response_model=ExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch transcript from a YouTube video",
)
async def extract_youtube(request: YoutubeExtractionRequest) -> ExtractionResponse:
    try:
        text, metadata, truncated = fetch_youtube_transcript(
            request.url, preferred_language=request.language
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception:
        logger.exception("YouTube extraction failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Marrja e transcript-it deshtoi",
        )

    return ExtractionResponse(
        source_type="youtube",
        source_label=f"YouTube · {metadata.get('video_id', '')}",
        content=text,
        char_count=len(text),
        truncated=truncated,
        metadata=metadata,
    )


@router.post(
    "/audio",
    response_model=ExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Transcribe an audio/video file with Whisper",
)
async def extract_audio(
    file: UploadFile = File(...),
    label: str = Form(default=""),
) -> ExtractionResponse:
    content_type = file.content_type or ""
    name_lower = (file.filename or "").lower()

    is_supported = (
        content_type.startswith("audio/")
        or content_type.startswith("video/")
        or name_lower.endswith(
            (".mp3", ".mp4", ".m4a", ".mpga", ".mpeg", ".wav", ".webm", ".ogg", ".flac")
        )
    )
    if not is_supported:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipi i skedarit nuk mbeshtetet. Lejohen audio/video.",
        )

    data = await file.read()
    if len(data) > MAX_AUDIO_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Skedari kalon limitin prej {MAX_AUDIO_BYTES // (1024 * 1024)}MB (limit i Whisper-it)",
        )

    try:
        text, metadata, truncated = await _audio_service.transcribe(
            data, file.filename or "audio", content_type
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception:
        logger.exception("Whisper transcription failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Transkriptimi me Whisper deshtoi",
        )

    return ExtractionResponse(
        source_type="audio",
        source_label=label or file.filename or "Audio/Video",
        content=text,
        char_count=len(text),
        truncated=truncated,
        metadata=metadata,
    )
