from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


class QuestionType(str, Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    TRUE_FALSE = "TRUE_FALSE"
    SHORT_ANSWER = "SHORT_ANSWER"


class Difficulty(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"


class QuizGenerationRequest(BaseModel):
    content: str = Field(..., min_length=50, max_length=10000, description="Lesson content to generate quiz from")
    num_questions: int = Field(default=5, ge=1, le=20, description="Number of questions to generate")
    question_types: List[QuestionType] = Field(
        default=[QuestionType.MULTIPLE_CHOICE],
        description="Types of questions to generate",
    )
    difficulty: Difficulty = Field(
        default=Difficulty.INTERMEDIATE,
        description="Difficulty level of questions",
    )
    topic: Optional[str] = Field(
        default=None,
        description="Topic/title of the lesson for context",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "content": "Python is a high-level, interpreted programming language...",
                "num_questions": 5,
                "question_types": ["MULTIPLE_CHOICE", "TRUE_FALSE"],
                "difficulty": "INTERMEDIATE",
                "topic": "Introduction to Python",
            }
        }
    }


class QuizOption(BaseModel):
    option_text: str = Field(..., alias="optionText")
    is_correct: bool = Field(..., alias="isCorrect")

    model_config = {
        "populate_by_name": True,
    }


class QuizQuestion(BaseModel):
    question_text: str = Field(..., alias="questionText")
    type: QuestionType
    options: List[QuizOption] = Field(default_factory=list)
    explanation: Optional[str] = None
    points: int = Field(default=1, ge=1)
    sample_answer: Optional[str] = Field(default=None, alias="sampleAnswer")

    model_config = {
        "populate_by_name": True,
    }


class QuizGenerationResponse(BaseModel):
    success: bool = True
    title: str
    questions: List[QuizQuestion]
    is_ai_generated: bool = Field(default=True, alias="isAiGenerated")

    model_config = {
        "populate_by_name": True,
    }


# Content Summarizer Schemas
class ContentSummaryRequest(BaseModel):
    content: str = Field(..., min_length=50, max_length=10000, description="Content to summarize")
    title: Optional[str] = Field(default=None, description="Title of the content")

    model_config = {
        "json_schema_extra": {
            "example": {
                "content": "Python is a high-level programming language...",
                "title": "Introduction to Python",
            }
        }
    }


class ContentSummaryResponse(BaseModel):
    success: bool = True
    key_points: List[str] = Field(..., alias="keyPoints")
    summary: str
    keywords: List[str]

    model_config = {
        "populate_by_name": True,
    }
