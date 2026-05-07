# 0017 - Dependency Policy

## Status

Accepted

## Context

The app needs dependable frontend and browser-platform libraries.

## Decision

Use production-ready dependencies: React, Vite, Three.js, zod, Tailwind CSS, Vitest, ESLint, Prettier, and Playwright.

Avoid custom engines where a browser-native or battle-tested library exists.

## Consequences

The codebase stays maintainable and benefits from established ecosystems.

## Alternatives Considered

Custom DOM rendering and a custom 3D renderer were rejected because they add risk without helping the core experience.
