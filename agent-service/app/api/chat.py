"""Chat API Router - Streaming chat endpoint."""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from langchain_core.messages import HumanMessage, AIMessage

from app.models.schemas import ChatRequest
from app.agents.learning_coach import get_agent

router = APIRouter()


@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Streaming chat with Learning Coach Agent.

    Returns SSE stream with tokens and tool calls.
    """
    if not request.message:
        raise HTTPException(status_code=400, detail="message is required")

    agent = get_agent()

    # Build initial state
    messages = [HumanMessage(content=request.message)]
    initial_state = {
        "messages": messages,
        "owner_id": 1,  # TODO: get from JWT
    }

    # Run agent (non-streaming for MVP)
    result = agent.invoke(initial_state)

    # Extract response
    last_message = result["messages"][-1]
    response_content = last_message.content if hasattr(last_message, "content") else str(last_message)

    # For MVP, return simple JSON response
    # TODO: implement proper streaming with SSE
    return {
        "conversation_id": request.conversation_id or 1,
        "message": response_content,
        "tokens_used": 0,  # TODO: track actual token usage
    }


@router.get("/chat/history/{conversation_id}")
async def get_chat_history(conversation_id: int):
    """Get chat history for a conversation."""
    # TODO: implement with database storage
    return {"messages": []}
