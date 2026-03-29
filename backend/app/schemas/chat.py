from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str
    conversation_id: str
    database: str = "postgres"
    access_mode: str = "read_only"


class ConfirmRequest(BaseModel):
    sql: str
    database: str = "postgres"
    action: str = "confirm"  # "confirm" or "cancel"
