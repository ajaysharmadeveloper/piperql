from fastapi import APIRouter, Depends, Query
import asyncpg

from app.config import get_target_db_url
from app.models.user import User
from app.core.deps import get_current_user

router = APIRouter(prefix="/databases", tags=["databases"])


@router.get("/")
async def list_databases(current_user: User = Depends(get_current_user)):
    conn = await asyncpg.connect(get_target_db_url("postgres"))
    try:
        rows = await conn.fetch(
            "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
        )
        return {"databases": [row["datname"] for row in rows]}
    finally:
        await conn.close()


@router.get("/tables")
async def list_tables(
    db: str = Query(..., description="Database name"),
    current_user: User = Depends(get_current_user),
):
    conn = await asyncpg.connect(get_target_db_url(db))
    try:
        rows = await conn.fetch(
            "SELECT table_name, table_type FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        )
        return {"tables": [{"table_name": r["table_name"], "table_type": r["table_type"]} for r in rows]}
    finally:
        await conn.close()
