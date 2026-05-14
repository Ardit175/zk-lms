.PHONY: dev test migrate seed lint build clean help

# Development
dev:
	docker-compose up

dev-build:
	docker-compose up --build

stop:
	docker-compose down

# Testing
test:
	cd backend && npm test
	cd frontend && npm run lint

test-backend:
	cd backend && npm test

test-coverage:
	cd backend && npm run test:coverage

# Database
migrate:
	cd backend && npx prisma migrate dev

migrate-deploy:
	cd backend && npx prisma migrate deploy

seed:
	cd backend && npx prisma db seed

studio:
	cd backend && npx prisma studio

reset-db:
	cd backend && npx prisma migrate reset --force

# Linting
lint:
	cd backend && npm run lint 2>/dev/null || true
	cd frontend && npm run lint

lint-fix:
	cd backend && npm run lint -- --fix 2>/dev/null || true
	cd frontend && npm run lint -- --fix

# Building
build:
	cd backend && npm run build
	cd frontend && npm run build

build-backend:
	cd backend && npm run build

build-frontend:
	cd frontend && npm run build

# Docker
docker-build:
	docker-compose build

docker-clean:
	docker-compose down -v --rmi local

# Utilities
install:
	cd backend && npm install
	cd frontend && npm install
	cd ai-service && pip install -r requirements.txt

clean:
	rm -rf backend/dist
	rm -rf backend/coverage
	rm -rf frontend/.next
	rm -rf frontend/out

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# Help
help:
	@echo "Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start all services with docker-compose"
	@echo "  make dev-build    - Build and start all services"
	@echo "  make stop         - Stop all services"
	@echo ""
	@echo "Testing:"
	@echo "  make test         - Run all tests"
	@echo "  make test-backend - Run backend tests only"
	@echo "  make test-coverage- Run backend tests with coverage"
	@echo ""
	@echo "Database:"
	@echo "  make migrate      - Run Prisma migrations (dev)"
	@echo "  make seed         - Seed the database"
	@echo "  make studio       - Open Prisma Studio"
	@echo "  make reset-db     - Reset database (WARNING: deletes all data)"
	@echo ""
	@echo "Linting:"
	@echo "  make lint         - Run linters"
	@echo "  make lint-fix     - Run linters with auto-fix"
	@echo ""
	@echo "Building:"
	@echo "  make build        - Build all projects"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-build - Build Docker images"
	@echo "  make docker-clean - Remove Docker containers and images"
	@echo ""
	@echo "Utilities:"
	@echo "  make install      - Install all dependencies"
	@echo "  make clean        - Clean build artifacts"
	@echo "  make logs         - View Docker logs"
