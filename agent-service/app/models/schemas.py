"""Pydantic models for API requests and responses."""

from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import date


class ChatRequest(BaseModel):
    """Chat request body."""
    conversation_id: Optional[int] = None
    message: str


class GeneratePlanRequest(BaseModel):
    """Generate plan request body."""
    goal_id: int
    preferences: Optional[str] = None


class GeneratedTask(BaseModel):
    """Generated task in plan response."""
    title: str
    description: str
    taskType: str
    estimatedMinutes: int
    sortOrder: int


class GeneratedPlan(BaseModel):
    """Generated plan response."""
    title: str
    description: str
    startDate: str
    endDate: str


class GeneratePlanResponse(BaseModel):
    """Generate plan response."""
    plan: GeneratedPlan
    tasks: List[GeneratedTask]


class Message(BaseModel):
    """Chat message."""
    id: int
    role: str  # user / assistant / system / tool
    content: str
    toolCalls: Optional[List[Any]] = None
    createdAt: str


class ChatHistoryResponse(BaseModel):
    """Chat history response."""
    messages: List[Message]
