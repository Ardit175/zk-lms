"""Azure OpenAI client factories.

Centralizes Azure OpenAI client construction so services do not need to read
env variables directly. Both sync and async clients are exposed; the async one
is used in request handlers.
"""

import os
from functools import lru_cache

from openai import AsyncAzureOpenAI, AzureOpenAI


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(
            f"Missing required environment variable: {name}. "
            "Set it in ai-service/.env (see .env.example)."
        )
    return value


@lru_cache(maxsize=1)
def get_azure_openai_client() -> AzureOpenAI:
    """Sync Azure OpenAI client (used for things like file uploads)."""
    return AzureOpenAI(
        api_key=_require_env("AZURE_OPENAI_API_KEY"),
        api_version=_require_env("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=_require_env("AZURE_OPENAI_ENDPOINT"),
    )


@lru_cache(maxsize=1)
def get_async_azure_openai_client() -> AsyncAzureOpenAI:
    """Async Azure OpenAI client used by FastAPI request handlers."""
    return AsyncAzureOpenAI(
        api_key=_require_env("AZURE_OPENAI_API_KEY"),
        api_version=_require_env("AZURE_OPENAI_API_VERSION"),
        azure_endpoint=_require_env("AZURE_OPENAI_ENDPOINT"),
    )


def get_gpt_deployment() -> str:
    return _require_env("AZURE_OPENAI_DEPLOYMENT_GPT")


def get_whisper_deployment() -> str:
    return _require_env("AZURE_OPENAI_DEPLOYMENT_WHISPER")
