import os
from dotenv import load_dotenv

load_dotenv()

# === These MUST stay in .env (needed to boot the app) ===
APP_DATABASE_URL = os.environ["APP_DATABASE_URL"]
JWT_SECRET = os.environ.get("JWT_SECRET", "your-jwt-secret-change-this-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 24

# === Default values for DB-configurable settings ===
_ENV_DEFAULTS = {
    "OPENAI_API_KEY": os.environ.get("OPENAI_API_KEY", ""),
    "OPENAI_MODEL": os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
    "MEM0_API_KEY": os.environ.get("MEM0_API_KEY", ""),
    "TAVILY_API_KEY": os.environ.get("TAVILY_API_KEY", ""),
    "DB_HOST": os.getenv("DB_HOST", "localhost"),
    "DB_PORT": os.getenv("DB_PORT", "5432"),
    "DB_USER": os.getenv("DB_USER", "postgres"),
    "DB_PASSWORD": os.getenv("DB_PASSWORD", ""),
    "FRONTEND_URL": os.getenv("FRONTEND_URL", "http://localhost:3000"),
}

# Descriptions for the settings UI
ENV_DESCRIPTIONS = {
    "OPENAI_API_KEY": "OpenAI API key for the AI agent",
    "OPENAI_MODEL": "OpenAI model name (e.g. gpt-4o-mini, gpt-4o)",
    "MEM0_API_KEY": "Mem0 API key for persistent AI memory",
    "TAVILY_API_KEY": "Tavily API key for web search",
    "DB_HOST": "Default PostgreSQL host for target databases",
    "DB_PORT": "Default PostgreSQL port for target databases",
    "DB_USER": "Default PostgreSQL user for target databases",
    "DB_PASSWORD": "Default PostgreSQL password for target databases",
    "FRONTEND_URL": "Frontend URL for CORS",
}


def get_setting(key: str) -> str:
    """Get a setting value: DB first, then .env fallback."""
    from app.database import SessionLocal
    from app.models.env_variable import EnvVariable

    db = SessionLocal()
    try:
        row = db.query(EnvVariable).filter(EnvVariable.key == key).first()
        if row and row.value:
            return row.value
    finally:
        db.close()
    return _ENV_DEFAULTS.get(key, "")


def get_target_db_url(database: str = "postgres") -> str:
    """Build a connection URL for a target database."""
    host = get_setting("DB_HOST")
    port = get_setting("DB_PORT")
    user = get_setting("DB_USER")
    password = get_setting("DB_PASSWORD")
    return f"postgresql://{user}:{password}@{host}:{port}/{database}"
