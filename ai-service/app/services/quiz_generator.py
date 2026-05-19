import json
import logging
import os
from typing import List

from langchain_openai import AzureChatOpenAI

from app.schemas.quiz import (
    QuestionType,
    Difficulty,
    QuizGenerationRequest,
    QuizGenerationResponse,
    QuizOption,
    QuizQuestion,
)

logger = logging.getLogger(__name__)

DIFFICULTY_DESCRIPTIONS = {
    Difficulty.BEGINNER: "basic recall and simple understanding, suitable for beginners",
    Difficulty.INTERMEDIATE: "moderate complexity requiring application of concepts",
    Difficulty.ADVANCED: "complex analysis and synthesis, challenging even for advanced learners",
}


def _build_prompt(request: QuizGenerationRequest) -> str:
    type_labels = ", ".join(t.value for t in request.question_types)
    difficulty_desc = DIFFICULTY_DESCRIPTIONS.get(request.difficulty, "moderate complexity")
    topic_context = f"\nTopic/Title: {request.topic}" if request.topic else ""

    return f"""You are an expert educator creating quiz questions for an online Learning Management System.

Generate exactly {request.num_questions} quiz question(s) based on the lesson content below.
Allowed question types: {type_labels}.
Difficulty level: {request.difficulty.value} - {difficulty_desc}.{topic_context}

IMPORTANT RULES:
1. Questions must TEST UNDERSTANDING, not just memorization of facts.
2. Distractors (wrong answers) must be PLAUSIBLE and educational.
3. Explanations should be EDUCATIONAL and help the student learn.
4. Questions must be DIRECTLY grounded in the provided content.
5. Vary cognitive levels: recall, understanding, application, analysis.

TYPE-SPECIFIC RULES:
- MULTIPLE_CHOICE: Exactly 4 options, exactly 1 correct answer.
- TRUE_FALSE: Exactly 2 options ["True", "False"], mark the correct one.
- SHORT_ANSWER: NO options array (empty []), include "sample_answer" field with ideal response.

Lesson content:
\"\"\"
{request.content}
\"\"\"

Respond ONLY with a valid JSON object (no markdown, no extra text):
{{
  "title": "<short descriptive quiz title based on content>",
  "questions": [
    {{
      "question_text": "<clear, specific question>",
      "type": "MULTIPLE_CHOICE",
      "options": [
        {{"option_text": "<text>", "is_correct": false}},
        {{"option_text": "<text>", "is_correct": true}},
        {{"option_text": "<text>", "is_correct": false}},
        {{"option_text": "<text>", "is_correct": false}}
      ],
      "explanation": "<why the correct answer is correct, educational>",
      "points": 1
    }},
    {{
      "question_text": "<true/false statement>",
      "type": "TRUE_FALSE",
      "options": [
        {{"option_text": "True", "is_correct": true}},
        {{"option_text": "False", "is_correct": false}}
      ],
      "explanation": "<explanation>",
      "points": 1
    }},
    {{
      "question_text": "<open-ended question>",
      "type": "SHORT_ANSWER",
      "options": [],
      "sample_answer": "<ideal response>",
      "explanation": "<grading guidance>",
      "points": 2
    }}
  ]
}}"""


def _validate_question(q: dict, q_type: QuestionType) -> bool:
    """Validate a single question structure."""
    if not q.get("question_text"):
        return False

    options = q.get("options", [])

    if q_type == QuestionType.MULTIPLE_CHOICE:
        if len(options) != 4:
            return False
        correct_count = sum(1 for o in options if o.get("is_correct"))
        if correct_count != 1:
            return False

    elif q_type == QuestionType.TRUE_FALSE:
        if len(options) != 2:
            return False
        option_texts = [o.get("option_text", "").lower() for o in options]
        if "true" not in option_texts or "false" not in option_texts:
            return False
        correct_count = sum(1 for o in options if o.get("is_correct"))
        if correct_count != 1:
            return False

    elif q_type == QuestionType.SHORT_ANSWER:
        if len(options) > 0:
            return False

    return True


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


class QuizGeneratorService:
    def __init__(self) -> None:
        self._llm = AzureChatOpenAI(
            azure_deployment=os.getenv("AZURE_OPENAI_DEPLOYMENT_GPT"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            openai_api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
            temperature=0.4,
        )

    async def generate(self, request: QuizGenerationRequest, retry: bool = True) -> QuizGenerationResponse:
        prompt_text = _build_prompt(request)
        messages = [{"role": "user", "content": prompt_text}]

        logger.info(
            "Generating quiz: %d question(s), types=%s, difficulty=%s",
            request.num_questions,
            [t.value for t in request.question_types],
            request.difficulty.value,
        )

        response = await self._llm.ainvoke(messages)
        raw = response.content

        try:
            data = _parse_response(raw)
        except json.JSONDecodeError as e:
            logger.warning("JSON parse error: %s, attempting retry", e)
            if retry:
                return await self.generate(request, retry=False)
            raise ValueError(f"Invalid JSON response: {e}")

        questions: List[QuizQuestion] = []
        validation_errors = []

        for i, q in enumerate(data.get("questions", [])):
            q_type = QuestionType(q.get("type", "MULTIPLE_CHOICE"))

            if not _validate_question(q, q_type):
                validation_errors.append(f"Question {i+1} failed validation")
                continue

            options = [
                QuizOption(
                    option_text=opt["option_text"],
                    is_correct=opt.get("is_correct", False),
                )
                for opt in q.get("options", [])
            ]

            question = QuizQuestion(
                question_text=q["question_text"],
                type=q_type,
                options=options,
                explanation=q.get("explanation"),
                points=q.get("points", 1),
                sample_answer=q.get("sample_answer") if q_type == QuestionType.SHORT_ANSWER else None,
            )
            questions.append(question)

        if not questions:
            if retry:
                logger.warning("No valid questions generated, retrying...")
                return await self.generate(request, retry=False)
            raise ValueError("No valid questions could be generated")

        if validation_errors:
            logger.warning("Validation issues: %s", validation_errors)

        logger.info("Quiz generated successfully: %d valid question(s)", len(questions))

        return QuizGenerationResponse(
            success=True,
            title=data.get("title", f"Quiz: {request.topic}" if request.topic else "AI Generated Quiz"),
            questions=questions,
            is_ai_generated=True,
        )
