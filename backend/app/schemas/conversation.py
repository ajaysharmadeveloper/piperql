from pydantic import BaseModel


class ConversationCreate(BaseModel):
    target_database: str = "postgres"
    access_mode: str = "read_only"


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    title: str | None
    summary: str | None
    target_database: str | None
    access_mode: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    sql_query: str | None
    query_result: dict | None
    chart_config: dict | None
    confirmation_status: str | None
    created_at: str

    class Config:
        from_attributes = True
