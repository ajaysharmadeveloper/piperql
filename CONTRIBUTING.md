# Contributing to PiperQL

Thank you for your interest in contributing to PiperQL! This guide will help you get started.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/ajaysharmadeveloper/piperql/issues) to avoid duplicates
2. Open a new issue using the bug report template
3. Include steps to reproduce, expected behavior, and actual behavior

### Suggesting Features

1. Check [existing issues](https://github.com/ajaysharmadeveloper/piperql/issues) for similar requests
2. Open a new issue using the feature request template
3. Describe the problem your feature would solve

### Submitting Code

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes
4. Run tests:
   ```bash
   make test
   ```
5. Commit with a clear message:
   ```bash
   git commit -m "feat: add your feature description"
   ```
6. Push and open a Pull Request

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `chore:` — maintenance tasks
- `refactor:` — code refactoring
- `test:` — adding or updating tests

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/piperql.git
cd piperql

# Install dependencies
make install

# Set up environment
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# Edit with your settings

# Run migrations
make migrate

# Start development
make run
```

## Project Structure

- `frontend/` — Next.js app (TypeScript, Tailwind CSS)
- `backend/` — FastAPI backend (Python)
  - `backend/app/agent/` — LangGraph AI agent
  - `backend/app/routers/` — API routes
  - `backend/app/models/` — SQLAlchemy models
  - `backend/app/schemas/` — Pydantic schemas

## Code Style

- **Python:** Follow PEP 8
- **TypeScript:** Follow the existing ESLint config
- **General:** Keep changes focused and minimal

## Questions?

Open an issue or reach out to [@ajaysharmadeveloper](https://github.com/ajaysharmadeveloper).
