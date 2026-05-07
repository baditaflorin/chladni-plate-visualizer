# 0003 - Frontend Framework And Build Tooling

## Status

Accepted

## Context

The app needs a rich control surface, typed logic, and GitHub Pages-compatible builds.

## Decision

Use React, strict TypeScript, Vite, Tailwind CSS, Three.js, zod, Vitest, ESLint, Prettier, and Playwright smoke tests.

## Consequences

Vite builds directly to `docs/` with a repository base path. Three.js is split into its own lazy chunk where possible.

## Alternatives Considered

Vanilla TypeScript was considered but would make stateful controls and accessibility more repetitive.
