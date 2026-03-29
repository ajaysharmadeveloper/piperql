import json

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, ToolMessage
from langgraph.graph import StateGraph, START, END

from app.config import get_setting
from app.agent.state import AgentState
from app.agent.tools import query_database, get_schema, get_table_sample, list_databases, web_search, generate_chart
from app.agent.prompts import build_system_prompt
from app.agent.memory import search_memories, add_memory
from app.agent.sql_validator import validate_sql

# All tools available to the agent
tools = [query_database, get_schema, get_table_sample, list_databases, web_search, generate_chart]
tools_by_name = {t.name: t for t in tools}


def _get_llm():
    """Create LLM instance with current settings from DB."""
    llm = ChatOpenAI(
        model=get_setting("OPENAI_MODEL"),
        api_key=get_setting("OPENAI_API_KEY"),
        temperature=0,
        streaming=True,
    )
    return llm.bind_tools(tools)


async def retrieve_context(state: AgentState) -> dict:
    """Fetch schema, memories, and build the system prompt."""
    schema_json = await get_schema.ainvoke({"database": state["database"]})

    user_msg = state["messages"][-1].content if state["messages"] else ""
    memories = search_memories(str(user_msg), user_id=state["user_id"])

    system_prompt = build_system_prompt(
        database=state["database"],
        access_mode=state["access_mode"],
        schema=schema_json,
        memories=memories,
    )

    return {"messages": [SystemMessage(content=system_prompt)]}


async def call_llm(state: AgentState) -> dict:
    """Invoke the LLM with the current messages and tools."""
    llm_with_tools = _get_llm()
    response = await llm_with_tools.ainvoke(state["messages"])
    return {"messages": [response]}


async def call_tools(state: AgentState) -> dict:
    """Execute tool calls from the LLM response."""
    last_message = state["messages"][-1]
    results = []
    count = state.get("tool_call_count", 0) + len(last_message.tool_calls)

    for tool_call in last_message.tool_calls:
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]

        # Inject current database if not specified
        if tool_name in ("query_database", "get_schema", "get_table_sample") and "database" not in tool_args:
            tool_args["database"] = state["database"]

        # Validate SQL before executing query_database
        if tool_name == "query_database":
            sql = tool_args.get("sql", "")
            validation = validate_sql(sql, state["access_mode"])

            if not validation.allowed:
                results.append(ToolMessage(
                    content=json.dumps({"error": validation.reason}),
                    tool_call_id=tool_call["id"],
                ))
                continue

            if validation.needs_confirmation:
                confirm_data = {
                    "needs_confirmation": True,
                    "sql": sql,
                    "statement_type": validation.statement_type,
                    "is_destructive": validation.is_destructive,
                    "message": f"This {validation.statement_type} operation requires your confirmation before execution.",
                }
                results.append(ToolMessage(
                    content=json.dumps(confirm_data),
                    tool_call_id=tool_call["id"],
                ))
                continue

        tool_fn = tools_by_name[tool_name]
        try:
            result = await tool_fn.ainvoke(tool_args)
        except Exception as e:
            result = json.dumps({"error": str(e)})

        results.append(ToolMessage(
            content=str(result),
            tool_call_id=tool_call["id"],
        ))

    return {"messages": results, "tool_call_count": count}


async def update_memory(state: AgentState) -> dict:
    """Store learnings from this interaction in mem0."""
    messages_for_memory = []
    for msg in state["messages"][-4:]:
        if hasattr(msg, 'content') and msg.content and not isinstance(msg, (SystemMessage, ToolMessage)):
            role = "user" if msg.type == "human" else "assistant"
            messages_for_memory.append({"role": role, "content": str(msg.content)})

    if messages_for_memory:
        try:
            add_memory(messages_for_memory, user_id=state["user_id"])
        except Exception:
            pass  # Memory update is best-effort

    return {}


def should_continue(state: AgentState) -> str:
    """Route based on whether the LLM wants to call tools."""
    last_message = state["messages"][-1]
    if not (hasattr(last_message, "tool_calls") and last_message.tool_calls):
        return "update_memory"

    # Detect stuck loops — same tool + same args called 3+ times = stuck, force stop
    recent_signatures = []
    for msg in reversed(state["messages"][-16:]):
        if hasattr(msg, "tool_calls") and msg.tool_calls:
            for tc in msg.tool_calls:
                name = tc.get("name", "") if isinstance(tc, dict) else getattr(tc, "name", "")
                args = str(tc.get("args", {})) if isinstance(tc, dict) else str(getattr(tc, "args", {}))
                recent_signatures.append(f"{name}:{args}")

    for sig in set(recent_signatures):
        if recent_signatures.count(sig) >= 3:
            return "update_memory"

    return "call_tools"


# Build the graph
builder = StateGraph(AgentState)
builder.add_node("retrieve_context", retrieve_context)
builder.add_node("call_llm", call_llm)
builder.add_node("call_tools", call_tools)
builder.add_node("update_memory", update_memory)

builder.add_edge(START, "retrieve_context")
builder.add_edge("retrieve_context", "call_llm")
builder.add_conditional_edges("call_llm", should_continue, ["call_tools", "update_memory"])
builder.add_edge("call_tools", "call_llm")
builder.add_edge("update_memory", END)

graph = builder.compile()
