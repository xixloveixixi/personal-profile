"""FastAPI Application Entry Point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.api.chat import router as chat_router
from app.api.generate import router as generate_router

settings = get_settings()

app = FastAPI(
    title="Learning Coach Agent Service",
    description="Personal AI learning coach powered by LangGraph and DeepSeek",
    version="0.1.0",
)

# CORS for frontend direct access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(generate_router, prefix="/api", tags=["generate"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "agent-service"}
