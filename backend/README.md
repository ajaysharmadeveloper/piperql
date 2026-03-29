# PiperQL Backend

FastAPI backend for PiperQL. Handles authentication, conversation management, and the LangGraph AI agent that queries PostgreSQL databases using natural language.

## What it does

- Users ask questions in plain English ("How many users signed up this week?")
- The AI agent reads your database schema, generates SQL behind the scenes, executes it, and returns a direct natural language answer
- SQL is never shown to the user unless they explicitly ask for it
- Write operations (INSERT, UPDATE, DELETE) require user confirmation before execution
- The agent remembers context across sessions using Mem0

## Tech Stack

| Component | Technology |
|-----------|-----------|
| API | FastAPI with async support |
| AI Agent | LangGraph + OpenAI (gpt-4o-mini) |
| ORM | SQLAlchemy 2.0 + Alembic migrations |
| Database | PostgreSQL (app DB + target DBs) |
| Auth | bcrypt + JWT (24h expiry) |
| Memory | Mem0 (persistent cross-session) |
| Search | Tavily (web search for SQL help) |
| Streaming | Server-Sent Events (SSE) |

## Prerequisites

- Python 3.12+
- PostgreSQL running on port 5432
- An OpenAI API key

## Setup

```bash
# From root directory
make install-backend    # Creates .venv, installs dependencies

# Or manually
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configure

```bash
cp .env.example .env
```

Required in `.env`:
```env
APP_DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_agent_db
JWT_SECRET=change-this-to-a-random-secret
```

Other settings (OpenAI key, DB credentials, Mem0, Tavily) can be configured in the app's Settings UI after first login, or set here.

## Database

```bash
createdb ai_agent_db        # Create the app database
make migrate                # Run Alembic migrations
make create-admin           # Create first admin user (interactive prompt)
```

## Run

```bash
make run-backend            # Starts on http://localhost:8000
```

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login with username/password, returns JWT |
| POST | `/api/auth/register` | Admin | Create new user |
| GET | `/api/auth/me` | Yes | Current user info |

### Users (Admin)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/users/` | List all users |
| PUT | `/api/users/{id}` | Update user |
| DELETE | `/api/users/{id}` | Delete user |

### Conversations
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/conversations/` | List user's conversations |
| POST | `/api/conversations/` | Create conversation |
| DELETE | `/api/conversations/{id}` | Delete conversation |
| GET | `/api/conversations/{id}/messages` | Get messages (paginated) |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/stream` | Stream agent response (SSE) |
| POST | `/api/chat/confirm` | Confirm/cancel write operation |

### Databases
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/databases/` | List PostgreSQL databases |
| GET | `/api/databases/tables?db=name` | List tables in a database |

### Settings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/settings/` | List all settings |
| PUT | `/api/settings/` | Update a setting (admin) |
| GET | `/api/settings/validate` | Check missing required keys |

## Agent Architecture

```
START → [retrieve_context] → [call_llm] → should_continue?
                                            ├─ no tools → [update_memory] → END
                                            └─ has tools → [call_tools] → [call_llm] (loop)
```

The agent has 6 tools:
- `query_database` — Execute SQL queries on the target database
- `get_schema` — Fetch full schema (tables, columns, types, constraints)
- `get_table_sample` — Sample rows from a table
- `list_databases` — List all databases on the server
- `generate_chart` — Create chart configs (bar, line, pie, area, scatter, radar, donut, stacked_bar, radial_bar, composed)
- `web_search` — Search the web via Tavily for SQL syntax help

## Access Modes

| Mode | SELECT | INSERT/UPDATE/DELETE | DDL (CREATE/DROP) |
|------|--------|---------------------|-------------------|
| Read Only | Instant | Blocked | Blocked |
| CRUD | Instant | Requires confirmation | Blocked |
| Full Access | Instant | Requires confirmation | Requires confirmation |

## SSE Stream Events

The chat endpoint streams these event types:

| Event | Description |
|-------|-------------|
| `status` | Agent progress ("Loading schema...", "Analyzing...") |
| `token` | Streamed text token (word by word) |
| `result` | Query result rows (JSON array) |
| `chart` | Chart configuration for frontend rendering |
| `confirm` | Write operation needs user confirmation |
| `error` | Error message |
| `done` | Stream complete with full response |

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, route mounting
│   ├── config.py            # Settings (env + DB-configurable)
│   ├── database.py          # SQLAlchemy async engine
│   ├── core/
│   │   ├── security.py      # JWT + bcrypt
│   │   └── deps.py          # Auth dependency (get_current_user)
│   ├── models/              # SQLAlchemy models (users, conversations, messages, env_variables)
│   ├── schemas/             # Pydantic request/response models
│   ├── routers/             # API route handlers
│   └── agent/               # LangGraph AI agent
│       ├── graph.py         # StateGraph definition
│       ├── tools.py         # Database, chart, search tools
│       ├── prompts.py       # Dynamic system prompt builder
│       ├── memory.py        # Mem0 integration
│       └── sql_validator.py # SQL safety validation
├── alembic/                 # Database migrations
├── tests/                   # Unit tests
├── create_admin.py          # Admin user creation script
└── requirements.txt
```

## Testing

```bash
make test-backend
```

## License

AGPL-3.0
