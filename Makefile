.PHONY: up down logs restart build health-check ps rebuild logs-api logs-web test-tier1 test-tier2 test-all

COMPOSE = docker compose -f infra/docker-compose.yml

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

logs:
	$(COMPOSE) logs -f

restart:
	$(COMPOSE) restart

build:
	$(COMPOSE) build

health-check:
	@echo "Checking FastAPI health..."
	@curl -s http://localhost:80/v1/health | python -m json.tool || echo "Health check failed"

ps:
	$(COMPOSE) ps

rebuild:
	$(COMPOSE) down && $(COMPOSE) up -d --build

logs-api:
	$(COMPOSE) logs -f fastapi

logs-web:
	$(COMPOSE) logs -f nextjs

test-tier1:
	cd apps/backend && python -m pytest tests/tier1/ -v --tb=short -x -m tier1

test-tier2:
	cd apps/backend && python -m pytest tests/tier2/ -v --tb=short

test-all:
	$(MAKE) test-tier1 && $(MAKE) test-tier2
