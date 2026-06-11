"""Chat API Router - Streaming chat endpoint with persistence."""

import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from app.models.schemas import ChatRequest
from app.agents.learning_coach import get_agent
from app.auth import verify_token, get_token_from_request
from app.db.session import SessionLocal
from app.db.models import AgentConversation, AgentMessage
from app.tools.learning import set_request_token

router = APIRouter()


def _save_message(db, conversation_id: int, role: str, content: str, tool_calls=None, tool_call_id=None, tokens_used=0):
    msg = AgentMessage(
        conversation_id=conversation_id,
        role=role,
        content=content,
        tool_calls=tool_calls,
        tool_call_id=tool_call_id,
        tokens_used=tokens_used,
        created_at=datetime.utcnow(),
    )
    db.add(msg)
    db.commit()
    return msg


@router.post("/chat")
async def chat(request: Request, body: ChatRequest):
    """Streaming chat with Learning Coach Agent. Returns SSE stream."""
    if not body.message:
        raise HTTPException(status_code=400, detail="message is required")

    # Auth
    user = await verify_token(request)
    owner_id = user.get("id", 1)
    token = get_token_from_request(request)
    set_request_token(token)

    db = SessionLocal()
    try:
        # Get or create conversation
        conversation_id = body.conversation_id
        if conversation_id:
            conv = db.query(AgentConversation).filter(AgentConversation.id == conversation_id).first()
            if not conv:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            conv = AgentConversation(
                owner_id=owner_id,
                title=body.message[:50],
                status="active",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)
            conversation_id = conv.id

        # Save user message
        _save_message(db, conversation_id, "user", body.message)

        # Run agent
        agent = get_agent()
        messages = [HumanMessage(content=body.message)]
        initial_state = {"messages": messages, "owner_id": owner_id}
        thread_id = str(conversation_id)
        config = {"configurable": {"thread_id": thread_id}}

        async def event_stream():
            total_tokens = 0
            try:
                result = agent.invoke(initial_state, config=config)
                # Process result messages (after user message)
                for msg in result["messages"][1:]:
                    if hasattr(msg, "tool_calls") and msg.tool_calls:
                        # AI message with tool calls
                        for tc in msg.tool_calls:
                            yield f"data: {json.dumps({'type': 'tool_call', 'name': tc['name'], 'args': tc.get('args', {}), 'id': tc.get('id', '')}, ensure_ascii=False)}\n\n"
                        if msg.content:
                            yield f"data: {json.dumps({'type': 'token', 'content': msg.content}, ensure_ascii=False)}\n\n"
                    elif isinstance(msg, ToolMessage):
                        # Tool result
                        try:
                            result_data = json.loads(msg.content) if isinstance(msg.content, str) else msg.content
                        except (json.JSONDecodeError, TypeError):
                            result_data = msg.content
                        yield f"data: {json.dumps({'type': 'tool_result', 'name': msg.name or '', 'result': result_data}, ensure_ascii=False)}\n\n"
                        _save_message(db, conversation_id, "tool", msg.content, tool_call_id=msg.tool_call_id)
                    elif hasattr(msg, "content") and msg.content:
                        # Final AI response
                        yield f"data: {json.dumps({'type': 'token', 'content': msg.content}, ensure_ascii=False)}\n\n"

                # Save final assistant message
                last_msg = result["messages"][-1]
                assistant_content = last_msg.content if hasattr(last_msg, "content") else str(last_msg)
                tc_data = None
                if hasattr(last_msg, "tool_calls") and last_msg.tool_calls:
                    tc_data = [{"name": tc["name"], "args": tc.get("args", {}), "id": tc.get("id", "")} for tc in last_msg.tool_calls]
                _save_message(db, conversation_id, "assistant", assistant_content, tool_calls=tc_data, tokens_used=total_tokens)

                # Update conversation timestamp
                conv.updated_at = datetime.utcnow()
                db.commit()

                yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id, 'tokens_used': total_tokens})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/chat/history/{conversation_id}")
async def get_chat_history(conversation_id: int, request: Request):
    """Get chat history for a conversation."""
    await verify_token(request)

    db = SessionLocal()
    try:
        messages = (
            db.query(AgentMessage)
            .filter(AgentMessage.conversation_id == conversation_id)
            .order_by(AgentMessage.created_at)
            .all()
        )
        return {
            "messages": [
                {
                    "id": m.id,
                    "role": m.role,
                    "content": m.content,
                    "toolCalls": m.tool_calls,
                    "createdAt": m.created_at.isoformat() if m.created_at else "",
                }
                for m in messages
            ]
        }
    finally:
        db.close()
