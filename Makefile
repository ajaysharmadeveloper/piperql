.PHONY: run run-backend run-frontend install install-backend install-frontend migrate migrate-new test test-backend build create-admin stop clean docker-up docker-down docker-build docker-logs

VENV = backend/.venv/bin

# ============================================
# Run
# ============================================

run: ## Start both backend and frontend
	@echo "Starting backend on :8000 and frontend on :3000..."
	@cd backend && .venv/bin/uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
	@sleep 2
	@cd frontend && npm run dev

run-backend: ## Start FastAPI backend (port 8000)
	cd backend && .venv/bin/uvicorn app.main:app --reload --port 8000

run-frontend: ## Start Next.js frontend (port 3000)
	cd frontend && npm run dev

stop: ## Stop all running services
	@pkill -f "uvicorn app.main:app" 2>/dev/null || true
	@pkill -f "next dev" 2>/dev/null || true
	@echo "Services stopped"

# ============================================
# Install
# ============================================

install: install-backend install-frontend ## Install all dependencies

install-backend: ## Install Python backend dependencies
	cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

install-frontend: ## Install Node.js frontend dependencies
	cd frontend && npm install

# ============================================
# Database
# ============================================

migrate: ## Run database migrations
	cd backend && $(VENV)/alembic upgrade head

migrate-new: ## Create a new migration (usage: make migrate-new msg="add new table")
	cd backend && $(VENV)/alembic revision --autogenerate -m "$(msg)"

create-admin: ## Create admin user interactively
	cd backend && $(VENV)/python create_admin.py

# ============================================
# Test
# ============================================

test: test-backend ## Run all tests

test-backend: ## Run backend tests
	cd backend && $(VENV)/python -m pytest tests/ -v

# ============================================
# Build
# ============================================

build: ## Build frontend for production
	cd frontend && npm run build

# ============================================
# Clean
# ============================================

clean: ## Clean build artifacts and caches
	rm -rf frontend/.next frontend/node_modules/.cache
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find backend -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true

# ============================================
# Help
# ============================================

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================
# Docker
# ============================================

docker-up: ## Start app with Docker
	docker compose up -d

docker-down: ## Stop Docker app
	docker compose down

docker-build: ## Build Docker image
	docker compose build

docker-logs: ## View Docker logs
	docker compose logs -f

docker-restart: ## Rebuild and restart Docker app
	docker compose down && docker compose up -d --build

.DEFAULT_GOAL := help
