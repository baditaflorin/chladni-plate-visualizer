# 0009 - Configuration And Secrets Management

## Status

Accepted

## Context

The frontend has no secrets. It needs only public URLs and a base path.

## Decision

Use Vite environment variables for public build-time values and `.env.example` for documentation. Real `.env*` files stay gitignored.

## Consequences

No secret can be required by the app. Public URLs are visible by design.

## Alternatives Considered

Runtime configuration fetch was rejected because the values are public and static.
