# 0005 - Client-Side Storage Strategy

## Status

Accepted

## Context

The app only needs to remember non-sensitive local preferences.

## Decision

Use `localStorage` with zod validation for settings such as material, frequency, damping, gain, particle count, and audio mode.

## Consequences

Settings are simple, local, offline-friendly, and easy to reset. No IndexedDB or OPFS is needed for v1.

## Alternatives Considered

IndexedDB was rejected because the state is small and structured.
