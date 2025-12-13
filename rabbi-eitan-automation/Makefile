# Rabbi Eitan - Makefile
# Easy commands for development and deployment

.PHONY: help setup build up down restart logs shell test clean

# Default target
help:
	@echo "Rabbi Eitan - Available Commands"
	@echo "================================"
	@echo "  make setup     - Initial setup (create .env, build, start)"
	@echo "  make build     - Build Docker images"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make logs      - View logs (all services)"
	@echo "  make logs-api  - View backend logs"
	@echo "  make logs-ui   - View frontend logs"
	@echo "  make shell     - Open shell in backend container"
	@echo "  make test      - Run tests"
	@echo "  make clean     - Remove containers and volumes"
	@echo "  make status    - Show service status"

# Initial setup
setup:
	@chmod +x infrastructure/scripts/setup.sh
	@./infrastructure/scripts/setup.sh

# Build images
build:
	docker-compose build

# Start services
up:
	docker-compose up -d
	@echo "Services started!"
	@echo "Dashboard: http://localhost:3000"
	@echo "API: http://localhost:8000"

# Stop services
down:
	docker-compose down

# Restart services
restart:
	docker-compose restart

# View all logs
logs:
	docker-compose logs -f

# View backend logs
logs-api:
	docker-compose logs -f backend worker

# View frontend logs
logs-ui:
	docker-compose logs -f frontend

# Open shell in backend
shell:
	docker-compose exec backend bash

# Run tests
test:
	docker-compose exec backend pytest -v

# Clean everything
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Show status
status:
	docker-compose ps

# Development mode (with hot reload)
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Database commands
db-migrate:
	docker-compose exec backend alembic upgrade head

db-shell:
	docker-compose exec postgres psql -U rabbi_user -d rabbi_eitan

# Celery commands
celery-status:
	docker-compose exec worker celery -A app.workers.celery_app inspect active

# Quick trigger pipeline
trigger:
	curl -X POST http://localhost:8000/api/v1/content/scrape

# Health check
health:
	@curl -s http://localhost:8000/health | python -m json.tool
