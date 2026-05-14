from fastapi import APIRouter, HTTPException, status
from app.schemas.quiz import (
    QuizGenerationRequest,
    QuizGenerationResponse,
    ContentSummaryRequest,
    ContentSummaryResponse,
)
from app.services.quiz_generator import QuizGeneratorService
from app.services.content_summarizer import ContentSummarizerService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["AI"])

_quiz_service = QuizGeneratorService()
_summarizer_service = ContentSummarizerService()


@router.post(
    "/quiz-generator/generate",
    response_model=QuizGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a quiz from lesson content using AI",
)
async def generate_quiz(request: QuizGenerationRequest) -> QuizGenerationResponse:
    """
    Generate quiz questions from provided lesson content.

    - **content**: The raw lesson text (50-10000 characters).
    - **num_questions**: How many questions to generate (1–20).
    - **question_types**: One or more of MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER.
    - **difficulty**: BEGINNER, INTERMEDIATE, or ADVANCED.
    - **topic**: Optional lesson title for context.
    """
    try:
        return await _quiz_service.generate(request)
    except ValueError as exc:
        logger.error("Invalid AI response: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"AI returned malformed data: {exc}",
        )
    except Exception as exc:
        logger.exception("Quiz generation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Quiz generation failed. Please try again later.",
        )


@router.post(
    "/content-summarizer/summarize",
    response_model=ContentSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Summarize lesson content for SEO and previews",
)
async def summarize_content(request: ContentSummaryRequest) -> ContentSummaryResponse:
    """
    Generate a summary of lesson content.

    - **content**: The raw lesson text (50-10000 characters).
    - **title**: Optional content title for context.

    Returns key points, a brief summary, and keywords.
    """
    try:
        return await _summarizer_service.summarize(request)
    except ValueError as exc:
        logger.error("Invalid AI response: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"AI returned malformed data: {exc}",
        )
    except Exception as exc:
        logger.exception("Content summarization failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Content summarization failed. Please try again later.",
        )
