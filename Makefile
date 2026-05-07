SHELL := /bin/bash

.PHONY: help install-hooks dev build test test-integration smoke lint fmt pages-preview release clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z0-9_-]+:.*##/ {printf "%-22s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install-hooks: ## Wire local git hooks.
	git config core.hooksPath .githooks
	chmod +x .githooks/*

dev: ## Run the frontend dev server.
	npm run dev

build: ## Build the GitHub Pages site into docs/.
	npm run build

test: ## Run unit tests.
	npm run test

test-integration: ## Placeholder for integration tests.
	@echo "No integration suite is required for Mode A v1."

smoke: ## Build and smoke-test the Pages output.
	npm run smoke

lint: ## Run linters and type checks.
	npm run lint

fmt: ## Autoformat source files.
	npm run fmt

pages-preview: ## Serve docs/ locally with the same base path as GitHub Pages.
	npm run preview

release: ## Tag the current version after checks pass.
	$(MAKE) test
	$(MAKE) build
	$(MAKE) smoke
	git tag v$$(node -p "require('./package.json').version")

clean: ## Remove transient build artifacts.
	rm -rf node_modules coverage .vite playwright-report test-results docs/assets docs/404.html docs/index.html docs/version.json

hooks-pre-commit: ## Run the pre-commit hook manually.
	.githooks/pre-commit

hooks-commit-msg: ## Run the commit-msg hook manually with MSG=<file>.
	.githooks/commit-msg "$${MSG:-.git/COMMIT_EDITMSG}"

hooks-pre-push: ## Run the pre-push hook manually.
	.githooks/pre-push
