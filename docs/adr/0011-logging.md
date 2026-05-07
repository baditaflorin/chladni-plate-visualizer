# 0011 - Logging Strategy

## Status

Accepted

## Context

Mode A has no server logs.

## Decision

Keep production browser logging minimal. Expected feature detection paths are surfaced in UI status rather than emitted as console errors.

## Consequences

Smoke tests can fail on unexpected console errors while allowing normal browser warnings.

## Alternatives Considered

Client log collection was rejected because v1 has no analytics or backend.
