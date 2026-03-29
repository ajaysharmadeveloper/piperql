import json

import asyncpg
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.config import get_target_db_url, get_setting
from app.models.user import User
from app.models.message import Message
from app.models.conversation import Conversation
from app.schemas.chat import ChatRequest, ConfirmRequest
from app.core.deps import get_current_user
from app.agent.graph import graph
from langchain_core.messages import HumanMessage, AIMessage

router = APIRouter(prefix="/chat", tags=["chat"])


async def stream_agent_response(request: ChatRequest, user_id: str, db: Session):
    """Stream the agent response as SSE events."""
    # Fetch recent messages for context (last 5)
    recent_messages = (
        db.query(Message)
        .filter(Message.conversation_id == request.conversation_id)
        .order_by(Message.created_at.desc())
        .limit(5)
        .all()
    )
    recent_messages.reverse()

    # Build message history
    messages = []
    for msg in recent_messages:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            messages.append(AIMessage(content=msg.content))

    # Add current user message
    messages.append(HumanMessage(content=request.message))

    # Save user message to DB
    user_msg = Message(
        conversation_id=request.conversation_id,
        role="user",
        content=request.message,
    )
    db.add(user_msg)
    db.commit()

    # Update conversation timestamp
    db.query(Conversation).filter(Conversation.id == request.conversation_id).update({"updated_at": "now()"})
    db.commit()

    input_state = {
        "messages": messages,
        "user_id": user_id,
        "database": request.database,
        "access_mode": request.access_mode,
        "conversation_id": request.conversation_id,
        "tool_call_count": 0,
    }

    full_response = ""
    current_node = ""
    has_first_token = False

    # Status helper
    def status_event(msg: str) -> str:
        return f"event: status\ndata: {json.dumps({'type': 'status', 'content': msg})}\n\n"

    # Validate required settings before starting
    openai_key = get_setting("OPENAI_API_KEY")
    if not openai_key:
        yield f"event: error\ndata: {json.dumps({'type': 'error', 'content': 'OpenAI API key is not configured. Please ask your admin to set it in Settings.'})}\n\n"
        return

    yield status_event("Loading database schema...")

    # Tool name to user-friendly description
    TOOL_LABELS = {
        "query_database": "Executing SQL query",
        "get_schema": "Fetching database schema",
        "get_table_sample": "Sampling table data",
        "list_databases": "Listing available databases",
        "web_search": "Searching the web",
    }

    try:
        async for message_chunk, metadata in graph.astream(
            input_state,
            stream_mode="messages",
            config={"recursion_limit": 100},
        ):
            node = metadata.get("langgraph_node", "")

            # Emit status on node transitions
            if node != current_node:
                current_node = node
                if node == "retrieve_context":
                    yield status_event("Loading schema & retrieving memories...")
                elif node == "call_llm" and not has_first_token:
                    yield status_event("Analyzing your question...")

            # Stream AI text tokens
            if message_chunk.content and node == "call_llm":
                if not has_first_token:
                    yield status_event("Generating response...")
                    has_first_token = True
                full_response += message_chunk.content
                event = {"type": "token", "content": message_chunk.content}
                yield f"event: token\ndata: {json.dumps(event)}\n\n"

            # Emit status for tool calls (from AIMessage with tool_calls)
            if node == "call_llm" and hasattr(message_chunk, "tool_calls") and message_chunk.tool_calls:
                for tc in message_chunk.tool_calls:
                    tool_name = tc.get("name", "") if isinstance(tc, dict) else getattr(tc, "name", "")
                    label = TOOL_LABELS.get(tool_name, f"Running {tool_name}")
                    yield status_event(label + "...")

            # Check for tool results
            if message_chunk.content and node == "call_tools":
                try:
                    tool_result = json.loads(message_chunk.content)
                    if isinstance(tool_result, dict):
                        if tool_result.get("needs_confirmation"):
                            yield status_event("Waiting for your confirmation...")
                            event = {
                                "type": "confirm",
                                "content": tool_result["sql"],
                                "statement_type": tool_result["statement_type"],
                                "is_destructive": tool_result.get("is_destructive", False),
                                "confirmation_id": request.conversation_id,
                            }
                            yield f"event: confirm\ndata: {json.dumps(event)}\n\n"
                        elif tool_result.get("error"):
                            event = {"type": "error", "content": tool_result["error"]}
                            yield f"event: error\ndata: {json.dumps(event)}\n\n"
                        elif tool_result.get("chart"):
                            yield status_event("Rendering chart...")
                            chart_config = {
                                "type": tool_result["type"],
                                "data": tool_result["data"],
                                "xKey": tool_result["xKey"],
                                "yKeys": tool_result["yKeys"],
                                "title": tool_result.get("title", ""),
                            }
                            event = {"type": "chart", "data": chart_config}
                            yield f"event: chart\ndata: {json.dumps(event)}\n\n"
                        else:
                            yield status_event("Processing results...")
                            event = {"type": "result", "data": tool_result}
                            yield f"event: result\ndata: {json.dumps(event)}\n\n"
                    elif isinstance(tool_result, list):
                        yield status_event("Processing results...")
                        event = {"type": "result", "data": tool_result}
                        yield f"event: result\ndata: {json.dumps(event)}\n\n"
                except (json.JSONDecodeError, TypeError):
                    pass

        yield status_event("Saving conversation...")

        # Save assistant message to DB
        if full_response:
            assistant_msg = Message(
                conversation_id=request.conversation_id,
                role="assistant",
                content=full_response,
            )
            db.add(assistant_msg)
            db.commit()

            # Auto-generate title from first message if needed
            conv = db.query(Conversation).filter(Conversation.id == request.conversation_id).first()
            if conv and not conv.title:
                title = request.message[:57] + "..." if len(request.message) > 60 else request.message
                conv.title = title
                db.commit()

        yield f"event: done\ndata: {json.dumps({'full_response': full_response})}\n\n"

    except Exception as e:
        event = {"type": "error", "content": str(e)}
        yield f"event: error\ndata: {json.dumps(event)}\n\n"


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return StreamingResponse(
        stream_agent_response(request, str(current_user.id), db),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/confirm")
async def confirm_write(
    request: ConfirmRequest,
    current_user: User = Depends(get_current_user),
):
    if request.action == "cancel":
        return {"status": "cancelled", "message": "Operation cancelled by user."}

    conn = await asyncpg.connect(get_target_db_url(request.database))
    try:
        result = await conn.execute(request.sql)
        return {"status": "executed", "result": str(result)}
    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        await conn.close()
