from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    azure_openai_endpoint: str
    azure_openai_api_key: str
    azure_openai_api_version: str = "2024-12-01-preview"
    azure_openai_deployment_gpt: str = "gpt-4o"
    azure_openai_deployment_whisper: str = "whisper"

    backend_url: str = "http://localhost:4000"
    port: int = 8000

    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
