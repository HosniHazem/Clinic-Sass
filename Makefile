.PHONY: help build up down restart logs shell db-shell prisma-studio clean dev prod

# Variables
COMPOSE_FILE := docker-compose.yml
COMPOSE_FILE_DEV := docker-compose.dev.yml
APP_CONTAINER := medflow-app
DB_CONTAINER := medflow-db

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Development commands
dev: ## Start development environment
	docker-compose -f $(COMPOSE_FILE_DEV) up -d
	@echo "✅ Development environment started"
	@echo "📱 App: http://localhost:3000"
	@echo "🗄️  Database: localhost:5432"
	@echo "📊 Prisma Studio: make prisma-studio"

dev-build: ## Build and start development environment
	docker-compose -f $(COMPOSE_FILE_DEV) up -d --build
	@echo "✅ Development environment built and started"

dev-down: ## Stop development environment
	docker-compose -f $(COMPOSE_FILE_DEV) down
	@echo "✅ Development environment stopped"

dev-logs: ## Show development logs
	docker-compose -f $(COMPOSE_FILE_DEV) logs -f

# Production commands
prod: ## Start production environment
	docker-compose -f $(COMPOSE_FILE) up -d
	@echo "✅ Production environment started"

prod-build: ## Build and start production environment
	docker-compose -f $(COMPOSE_FILE) up -d --build
	@echo "✅ Production environment built and started"

prod-down: ## Stop production environment
	docker-compose -f $(COMPOSE_FILE) down
	@echo "✅ Production environment stopped"

prod-logs: ## Show production logs
	docker-compose -f $(COMPOSE_FILE) logs -f

# Common commands
build: ## Build Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs for all services
	docker-compose logs -f

logs-app: ## Show logs for app service
	docker-compose logs -f app

logs-db: ## Show logs for database service
	docker-compose logs -f postgres

# Shell access
shell: ## Open shell in app container
	docker-compose exec app sh

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U medflow -d medflow

# Database commands
db-migrate: ## Run database migrations
	docker-compose exec app npx prisma migrate deploy

db-migrate-dev: ## Run database migrations (dev)
	docker-compose -f $(COMPOSE_FILE_DEV) exec app npx prisma migrate dev

db-seed: ## Seed the database
	docker-compose exec app npx prisma db seed

db-reset: ## Reset the database
	docker-compose exec app npx prisma migrate reset --force

db-studio: ## Open Prisma Studio
	docker-compose exec app npx prisma studio

prisma-studio: ## Start Prisma Studio in separate container
	docker-compose -f $(COMPOSE_FILE_DEV) --profile tools up -d prisma-studio
	@echo "📊 Prisma Studio: http://localhost:5555"

# Maintenance commands
clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all
	@echo "✅ All containers, volumes, and images removed"

clean-volumes: ## Remove all volumes
	docker-compose down -v
	@echo "✅ All volumes removed"

prune: ## Prune Docker system
	docker system prune -af --volumes
	@echo "✅ Docker system pruned"

# Health check
health: ## Check application health
	@curl -s http://localhost:3000/api/health | jq '.' || echo "❌ Health check failed"

# Install and setup
install: ## Install dependencies in container
	docker-compose exec app npm install

setup: ## Initial setup (build, migrate, seed)
	@make build
	@make up
	@sleep 5
	@make db-migrate
	@make db-seed
	@echo "✅ Setup complete!"

# Update
update: ## Update dependencies
	docker-compose exec app npm update
	docker-compose exec app npx prisma generate
	@echo "✅ Dependencies updated"
