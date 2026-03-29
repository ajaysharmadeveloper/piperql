<div align="center">

# PiperQL

**Anyone in your team can now query the database. No SQL. No waiting. No dependency.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Python 3.12+](https://img.shields.io/badge/Python-3.12+-3776AB.svg)](https://python.org)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)

PiperQL is an open-source AI agent that connects to your PostgreSQL databases and lets anyone on your team get answers using plain English. Ask a question, get tables, charts, and insights — no SQL knowledge required.

[Website](https://piperql.vercel.app) | [Report Bug](https://github.com/ajaysharmadeveloper/piperql/issues) | [Request Feature](https://github.com/ajaysharmadeveloper/piperql/issues)

</div>

---

<!-- TODO: Add screenshots/demo GIF here -->

## Why PiperQL?

- **Founders & Managers** — See your business numbers without waiting for your dev team
- **Data Analysts** — Skip writing SQL, go straight to insights
- **Business Analysts** — Get the exact data you need, right now
- **Developers** — Stop being your team's human data API
- **Small Teams** — Get a data team powered by one AI agent

## Features

- **Natural language queries** — Ask questions in plain English, get SQL results
- **10+ chart types** — Bar, line, pie, area, scatter, radar, and more — generated automatically
- **Safe by default** — Write operations require explicit confirmation
- **Real-time streaming** — Watch responses appear as the AI thinks
- **Self-hosted** — Your data never leaves your servers
- **AI memory** — Remembers context across conversations
- **Multi-database** — Connect and switch between multiple PostgreSQL databases
- **Web search** — AI can look up SQL syntax and database help online

## Quick Start

### Option 1: Docker (Recommended)

```bash
git clone https://github.com/ajaysharmadeveloper/piperql.git
cd piperql
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys and database credentials
docker compose up -d
```

Open http://localhost:3000 and start chatting with your database.

### Option 2: Manual Setup

**Prerequisites:** PostgreSQL, Python 3.12+, Node.js 20+

```bash
git clone https://github.com/ajaysharmadeveloper/piperql.git
cd piperql

# Install dependencies
make install

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Edit both files with your settings

# Run database migrations
make migrate

# Create your first admin user
make create-admin

# Start the app
make run
```

Backend runs on http://localhost:8000, frontend on http://localhost:3000.

## Access Modes

| Mode | What's Allowed | Confirmation Required |
|------|---------------|----------------------|
| **Read Only** | SELECT queries | No |
| **CRUD** | SELECT, INSERT, UPDATE, DELETE | Yes (for writes) |
| **Full Access** | All SQL including DDL | Yes (for writes/DDL) |

## Architecture

```
┌─────────────────┐     ┌─────────────────────────────────────┐
│   Next.js App   │────▶│         FastAPI Backend              │
│   (Port 3000)   │ SSE │                                     │
│                 │◀────│  ┌─────────┐  ┌──────────────────┐  │
│  Chat UI        │     │  │  Auth   │  │  LangGraph Agent │  │
│  Charts         │     │  │  (JWT)  │  │  ┌────────────┐  │  │
│  SQL Results    │     │  └─────────┘  │  │ Tools:     │  │  │
└─────────────────┘     │               │  │ - query_db │  │  │
                        │               │  │ - schema   │  │  │
                        │               │  │ - charts   │  │  │
                        │               │  │ - search   │  │  │
                        │               │  └────────────┘  │  │
                        │               └──────────────────┘  │
                        │                        │            │
                        │               ┌────────▼─────────┐  │
                        │               │   PostgreSQL DB   │  │
                        │               └──────────────────┘  │
                        └─────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, TypeScript, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic |
| AI Agent | LangGraph, LangChain, OpenAI |
| Memory | mem0 |
| Database | PostgreSQL |
| Auth | JWT, bcrypt |
| Streaming | Server-Sent Events (SSE) |
| Deployment | Docker, Docker Compose |

## Make Commands

| Command | Description |
|---------|-------------|
| `make run` | Start both backend + frontend |
| `make stop` | Stop all services |
| `make install` | Install all dependencies |
| `make migrate` | Run database migrations |
| `make create-admin` | Create admin user |
| `make test` | Run all tests |
| `make docker-up` | Start with Docker |
| `make docker-down` | Stop Docker |
| `make help` | Show all commands |

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).

Copyright (C) 2026 Ajay Kumar Sharma

---

<div align="center">

**Built by [Ajay Kumar Sharma](https://www.ajaykumarsharma.co.in/)**

If PiperQL helps you, give it a star!

</div>
