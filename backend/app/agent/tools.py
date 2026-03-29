import json
import re

import asyncpg
from langchain_core.tools import tool
from tavily import TavilyClient

from app.config import get_target_db_url, get_setting


async def _get_connection(database: str = "postgres") -> asyncpg.Connection:
    return await asyncpg.connect(get_target_db_url(database))


@tool
async def query_database(sql: str, database: str = "postgres") -> str:
    """Execute a read-only SELECT query on the target database and return results as JSON.
    Args:
        sql: The SELECT SQL query to execute
        database: The target database name (default: postgres)
    """
    conn = await _get_connection(database)
    try:
        rows = await conn.fetch(sql)
        results = [dict(row) for row in rows]
        for row in results:
            for key, value in row.items():
                if not isinstance(value, (str, int, float, bool, type(None), list, dict)):
                    row[key] = str(value)
        return json.dumps(results, default=str)
    finally:
        await conn.close()


@tool
async def get_schema(database: str = "postgres") -> str:
    """Fetch the complete schema for a database including tables, columns, types, and constraints.
    Args:
        database: The target database name (default: postgres)
    """
    conn = await _get_connection(database)
    try:
        rows = await conn.fetch("""
            SELECT
                t.table_name,
                c.column_name,
                c.data_type,
                c.is_nullable,
                c.column_default,
                tc.constraint_type
            FROM information_schema.tables t
            JOIN information_schema.columns c
                ON t.table_name = c.table_name AND t.table_schema = c.table_schema
            LEFT JOIN information_schema.key_column_usage kcu
                ON c.table_name = kcu.table_name AND c.column_name = kcu.column_name AND c.table_schema = kcu.table_schema
            LEFT JOIN information_schema.table_constraints tc
                ON kcu.constraint_name = tc.constraint_name AND kcu.table_schema = tc.table_schema
            WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name, c.ordinal_position
        """)

        schema: dict[str, list[dict]] = {}
        for row in rows:
            table = row["table_name"]
            if table not in schema:
                schema[table] = []
            schema[table].append({
                "column": row["column_name"],
                "type": row["data_type"],
                "nullable": row["is_nullable"],
                "default": str(row["column_default"]) if row["column_default"] else None,
                "constraint": row["constraint_type"],
            })

        return json.dumps(schema, indent=2)
    finally:
        await conn.close()


@tool
async def get_table_sample(table_name: str, database: str = "postgres", limit: int = 5) -> str:
    """Get sample rows from a table to understand the data format and content.
    Args:
        table_name: Name of the table to sample
        database: The target database name (default: postgres)
        limit: Number of sample rows (default: 5)
    """
    if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table_name):
        return json.dumps({"error": "Invalid table name"})

    conn = await _get_connection(database)
    try:
        rows = await conn.fetch(f'SELECT * FROM "{table_name}" LIMIT {int(limit)}')
        results = [dict(row) for row in rows]
        for row in results:
            for key, value in row.items():
                if not isinstance(value, (str, int, float, bool, type(None), list, dict)):
                    row[key] = str(value)
        return json.dumps(results, default=str)
    finally:
        await conn.close()


@tool
async def list_databases() -> str:
    """List all available databases on the PostgreSQL server."""
    conn = await _get_connection("postgres")
    try:
        rows = await conn.fetch(
            "SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname"
        )
        return json.dumps([row["datname"] for row in rows])
    finally:
        await conn.close()


@tool
def generate_chart(chart_type: str, data_json: str, x_key: str, y_keys_csv: str, title: str = "") -> str:
    """Generate a chart visualization from query results. Use this AFTER querying data with query_database. Pass the query results directly.
    Args:
        chart_type: Type of chart — one of: bar, line, pie, area, scatter, radar, radial_bar, donut, stacked_bar, composed
        data_json: The query results as a JSON string (copy the exact output from query_database)
        x_key: The column name to use for X axis / labels (e.g. "role")
        y_keys_csv: Comma-separated column names for Y axis values (e.g. "count" or "users,sessions")
        title: Chart title (e.g. "Message Distribution")
    """
    try:
        if isinstance(data_json, list):
            data = data_json
        elif isinstance(data_json, dict):
            data = [data_json]
        elif isinstance(data_json, str):
            parsed = json.loads(data_json)
            data = parsed if isinstance(parsed, list) else [parsed]
        else:
            data = [data_json]
        y_keys = [k.strip() for k in y_keys_csv.split(",")] if isinstance(y_keys_csv, str) else y_keys_csv
    except (json.JSONDecodeError, TypeError, ValueError):
        return json.dumps({"error": "Invalid data format."})

    return json.dumps({
        "chart": True,
        "type": chart_type,
        "data": data,
        "xKey": x_key,
        "yKeys": y_keys,
        "title": title,
        "status": "Chart rendered successfully. Do NOT call generate_chart again. Summarize the data briefly for the user.",
    })


@tool
def web_search(query: str, max_results: int = 5) -> str:
    """Search the web for latest information using Tavily. Use this when the user asks about something that requires up-to-date knowledge beyond the database, such as SQL syntax help, PostgreSQL best practices, or general knowledge questions.
    Args:
        query: The search query
        max_results: Maximum number of results to return (default: 5)
    """
    client = TavilyClient(api_key=get_setting("TAVILY_API_KEY"))
    response = client.search(query=query, max_results=max_results)
    results = []
    for r in response.get("results", []):
        results.append({"title": r.get("title", ""), "url": r.get("url", ""), "content": r.get("content", "")})
    return json.dumps(results, indent=2)
