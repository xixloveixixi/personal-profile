"""Chat API Router - Streaming chat endpoint with persistence."""

import json
import asyncio
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage

from app.models.schemas import ChatRequest, ChatHistoryResponse
from app.agents.learning_coach import get_agent
from app.auth import verify_token, get_token_from_request
from app.db.session import SessionLocal
from app.db.models import AgentConversation, AgentMessage
from app.tools.learning import set_request_token

router = APIRouter()


def _normalize_message_content(content) -> str:
    if isinstance(content, str):
        return content
    return json.dumps(content, ensure_ascii=False)


def _save_message(db, conversation_id: int, role: str, content, tool_calls=None, tool_call_id=None, tokens_used=0):
    content_text = _normalize_message_content(content)
    tool_calls_data = None if tool_calls is None else tool_calls

    msg = AgentMessage(
        conversation_id=conversation_id,
        role=role,
        content=content_text,
        tool_calls=tool_calls_data,
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

    user = await verify_token(request)
    owner_id = user.get("id", 1)
    token = get_token_from_request(request)
    set_request_token(token)

    db = SessionLocal()
    try:
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

        _save_message(db, conversation_id, "user", body.message)

        agent = get_agent()
        messages = [HumanMessage(content=body.message)]
        write_intent_keywords = (
            "创建",
            "保存",
            "添加",
            "新增",
            "记录",
            "更新",
            "修改",
            "激活",
            "开始执行",
            "写入",
        )
        allow_write_tools = any(keyword in body.message for keyword in write_intent_keywords)
        initial_state = {"messages": messages, "owner_id": owner_id, "allow_write_tools": allow_write_tools}
        thread_id = str(conversation_id)
        config = {"configurable": {"thread_id": thread_id}}

        async def event_stream():
            total_tokens = 0
            try:
                existing_state = agent.get_state(config)
                existing_messages = existing_state.values.get("messages", []) if existing_state.values else []
                existing_message_count = len(existing_messages)

                result = agent.invoke(initial_state, config=config)
                new_messages = result["messages"][existing_message_count:]
                last_ai_msg = None

                for msg in new_messages:
                    if isinstance(msg, AIMessage):
                        last_ai_msg = msg

                    if isinstance(msg, AIMessage) and hasattr(msg, "tool_calls") and msg.tool_calls:
                        for tc in msg.tool_calls:
                            yield f"data: {json.dumps({'type': 'tool_call', 'name': tc['name'], 'args': tc.get('args', {}), 'id': tc.get('id', '')}, ensure_ascii=False)}\n\n"
                    elif isinstance(msg, ToolMessage):
                        try:
                            result_data = json.loads(msg.content) if isinstance(msg.content, str) else msg.content
                        except (json.JSONDecodeError, TypeError):
                            result_data = msg.content
                        yield f"data: {json.dumps({'type': 'tool_result', 'name': msg.name or '', 'result': result_data}, ensure_ascii=False)}\n\n"
                        _save_message(db, conversation_id, "tool", msg.content, tool_call_id=msg.tool_call_id)
                    elif isinstance(msg, AIMessage) and msg.content:
                        content = msg.content
                        chunk_size = 12
                        for index in range(0, len(content), chunk_size):
                            chunk = content[index:index + chunk_size]
                            yield f"data: {json.dumps({'type': 'token', 'content': chunk}, ensure_ascii=False)}\n\n"
                            await asyncio.sleep(0.03)

                if last_ai_msg is None:
                    raise RuntimeError("Agent did not return an assistant message")

                assistant_content = last_ai_msg.content if hasattr(last_ai_msg, "content") else str(last_ai_msg)
                tc_data = None
                if hasattr(last_ai_msg, "tool_calls") and last_ai_msg.tool_calls:
                    tc_data = [{"name": tc["name"], "args": tc.get("args", {}), "id": tc.get("id", "")} for tc in last_ai_msg.tool_calls]
                _save_message(db, conversation_id, "assistant", assistant_content, tool_calls=tc_data, tokens_used=total_tokens)

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


@router.get("/chat/history/{conversation_id}", response_model=ChatHistoryResponse)
async def get_chat_history(
    conversation_id: int,
    request: Request,
    limit: int = Query(default=100, ge=1, le=100),
    before_id: Optional[int] = Query(default=None, ge=1),
):
    """Get paginated chat history for a conversation."""
    await verify_token(request)

    db = SessionLocal()
    try:
        visible_roles = ("user", "assistant")
        query = db.query(AgentMessage).filter(
            AgentMessage.conversation_id == conversation_id,
            AgentMessage.role.in_(visible_roles),
        )

        if before_id is not None:
            query = query.filter(AgentMessage.id < before_id)

        messages = (
            query.order_by(AgentMessage.created_at.desc(), AgentMessage.id.desc())
            .limit(limit)
            .all()
        )

        messages = list(reversed(messages))
        next_before_id = messages[0].id if messages else None

        has_more = False
        if messages:
            oldest_message_id = messages[0].id
            has_more = (
                db.query(AgentMessage)
                .filter(
                    AgentMessage.conversation_id == conversation_id,
                    AgentMessage.role.in_(visible_roles),
                    AgentMessage.id < oldest_message_id,
                )
                .first()
                is not None
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
            ],
            "hasMore": has_more,
            "nextBeforeId": next_before_id,
        }
    finally:
        db.close()
