# 0016 - Local Git Hooks

## Status

Accepted

## Context

No GitHub Actions are allowed, but checks should still run before commits and pushes.

## Decision

Use plain `.githooks/` wired by `make install-hooks`.

Hooks run formatting checks, lint, type checks, gitleaks, tests, build, and smoke tests.

## Consequences

Contributors must opt in locally with `make install-hooks`.

## Alternatives Considered

Lefthook was considered but rejected to avoid another runtime dependency.
