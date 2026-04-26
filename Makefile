# Multi-Model Agent Platform — Common Tasks

.PHONY: help install dev build start test test:e2e test:a11y lint typecheck format \
        docker-build docker-up deploy:staging deploy:prod

# ------------------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------------------
.DEFAULT_GOAL := help

help: ## Show this help message
	@echo "Usage: make <target>"
	@echo ""
	@echo "Targets:"
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ------------------------------------------------------------------------------
# Environment
# ------------------------------------------------------------------------------

install: ## Install dependencies (npm)
	npm ci

dev: ## Start development server
	npm run dev

build: ## Build for production
	npm run build

start: ## Start production server
	npm run start

# ------------------------------------------------------------------------------
# Testing
# ------------------------------------------------------------------------------

test: ## Run unit tests
	npm run test

test:e2e: ## Run end-to-end tests
	npm run test:e2e

test:a11y: ## Run accessibility tests
	npm run test:a11y

# ------------------------------------------------------------------------------
# Code Quality
# ------------------------------------------------------------------------------

lint: ## Run linter
	npm run lint

typecheck: ## Run TypeScript type checker
	npx tsc --noEmit

format: ## Format code with Prettier
	npx prettier --write "src/**/*.{ts,tsx,js,jsx,json,css,md}"

# ------------------------------------------------------------------------------
# Docker
# ------------------------------------------------------------------------------

docker-build: ## Build Docker image
	docker compose build

docker-up: ## Start containers with docker compose
	docker compose up -d

# ------------------------------------------------------------------------------
# Deployment
# ------------------------------------------------------------------------------

deploy:staging: ## Deploy to staging environment
	@echo "Deploying to staging..."
	npm run build
	vercel --target=staging

deploy:prod: ## Deploy to production environment
	@echo "Deploying to production..."
	npm run build
	vercel --target=production
