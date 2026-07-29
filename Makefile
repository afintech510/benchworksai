.PHONY: up down logs restart build health-check ps

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

restart:
	docker compose restart

build:
	docker compose build

health-check:
	@echo "Checking FastAPI health..."
	@curl -s http://localhost:80/v1/health | python -m json.tool || echo "Health check failed"

ps:
	docker compose ps

rebuild:
	docker compose down && docker compose up -d --build

logs-api:
	docker compose logs -f fastapi

logs-web:
	docker compose logs -f nextjs

test-tier1:
	cd backend && python -m pytest ../tests/tier1/ -v --tb=short -x -m tier1

test-tier2:
	cd backend && python -m pytest ../tests/tier2/ -v --tb=short

test-all:
	$(MAKE) test-tier1 && $(MAKE) test-tier2
