# 0013 - Testing Strategy

## Status

Accepted

## Context

The riskiest logic is deterministic math, settings validation, and page boot.

## Decision

Use Vitest for unit tests and a Playwright smoke test that builds `docs/`, serves it with the GitHub Pages base path, loads the app, starts the visualizer, and checks one interaction.

## Consequences

Checks stay local and fast enough for pre-push.

## Alternatives Considered

Full visual regression was rejected for v1 because WebGPU and GPU drivers vary across environments.
