import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import extraction, quiz

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("EduAI AI Service starting up...")
    yield
    logger.info("EduAI AI Service shutting down...")


app = FastAPI(
    title="EduAI AI Service",
    description="AI-powered content generation for the EduAI Learning Management System",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Internal auth ─────────────────────────────────────────────────────────────
# The AI service is only meant to be called by the backend. When AI_SERVICE_TOKEN
# is configured, every /api/* request must carry a matching `X-Internal-Token`
# header; otherwise it is rejected with 401. If the token is unset (local dev),
# the check is skipped so nothing breaks until both services are configured.
@app.middleware("http")
async def require_internal_token(request: Request, call_next):
    token = get_settings().ai_service_token
    if token and request.url.path.startswith("/api/"):
        if request.headers.get("x-internal-token") != token:
            return JSONResponse(status_code=401, content={"detail": "Unauthorized"})
    return await call_next(request)


# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev
        "http://localhost:4000",   # Express backend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(quiz.router)
app.include_router(extraction.router)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check() -> dict:
    return {"status": "ok", "service": "edu-ai-ai-service"}
