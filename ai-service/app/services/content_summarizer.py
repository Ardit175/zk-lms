import json
import logging
import os
from typing import List

from langchain_openai import AzureChatOpenAI

from app.schemas.quiz import ContentSummaryRequest, ContentSummaryResponse

logger = logging.getLogger(__name__)


def _build_prompt(request: ContentSummaryRequest) -> str:
    title_context = f"\nTitle: {request.title}" if request.title else ""

    return f"""You are an expert content analyst for an educational platform.

Analyze the following lesson content and provide a structured summary.{title_context}

Your task:
1. Extract 3-5 KEY POINTS that capture the main concepts
2. Write a concise SUMMARY (2-3 sentences) suitable for a lesson preview
3. Identify 5-10 KEYWORDS for SEO and search purposes

Content:
\"\"\"
{request.content}
\"\"\"

Respond ONLY with a valid JSON object (no markdown, no extra text):
{{
  "key_points": [
    "First key concept or takeaway",
    "Second key concept",
    "Third key concept"
  ],
  "summary": "A concise 2-3 sentence summary of the content that would help a student decide if this lesson is relevant to them.",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}}"""


def _parse_response(raw: str) -> dict:
    """Parse and clean the LLM response."""
    raw = raw.strip()

    if raw.startswith("```"):
        parts = raw.split("```")
        if len(parts) >= 2:
            raw = parts[1]
            if raw.startswith("json"):
                raw = raw[4:]
            raw = raw.strip()

    return json.loads(raw)


class ContentSummarizerService:
    def __init__(self) -> None:
        self._llm = AzureChatOpenAI(
            azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
            temperature=0.3,
        )

    async def summarize(self, request: ContentSummaryRequest, retry: bool = True) -> ContentSummaryResponse:
        prompt_text = _build_prompt(request)
        messages = [{"role": "user", "content": prompt_text}]

        logger.info(
            "Summarizing content: %d chars, title=%s",
            len(request.content),
            request.title or "(none)",
        )

        response = await self._llm.ainvoke(messages)
        raw = response.content

        try:
            data = _parse_response(raw)
        except json.JSONDecodeError as e:
            logger.warning("JSON parse error: %s, attempting retry", e)
            if retry:
                return await self.summarize(request, retry=False)
            raise ValueError(f"Invalid JSON response: {e}")

        key_points = data.get("key_points", [])
        summary = data.get("summary", "")
        keywords = data.get("keywords", [])

        if not key_points or not summary:
            if retry:
                logger.warning("Incomplete summary, retrying...")
                return await self.summarize(request, retry=False)
            raise ValueError("Incomplete summary response")

        logger.info(
            "Content summarized: %d key points, %d keywords",
            len(key_points),
            len(keywords),
        )

        return ContentSummaryResponse(
            success=True,
            key_points=key_points,
            summary=summary,
            keywords=keywords,
        )
