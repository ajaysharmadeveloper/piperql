from typing import TypedDict, Annotated
from langchain_core.messages import AnyMessage
import operator


class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    user_id: str
    database: str
    access_mode: str
    conversation_id: str
    tool_call_count: int
