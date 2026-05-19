from pydantic import BaseModel, Field, HttpUrl
from typing import Optional


class ExtractionResponse(BaseModel):
    """Normalized response for every content-extraction endpoint."""
    success: bool = True
    source_type: str = Field(..., alias="sourceType")
    source_label: str = Field(..., alias="sourceLabel")
    content: str
    char_count: int = Field(..., alias="charCount")
    truncated: bool = False
    metadata: dict = Field(default_factory=dict)

    model_config = {
        "populate_by_name": True,
    }


class YoutubeExtractionRequest(BaseModel):
    url: str = Field(..., min_length=10, description="YouTube video URL or ID")
    language: Optional[str] = Field(
        default=None,
        description="Preferred caption language code (e.g. 'en', 'sq'). Falls back to any available.",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                "language": "en",
            }
        }
    }
