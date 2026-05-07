# 0008 - Go Backend Project Layout

## Status

Accepted

## Context

Mode A has no backend.

## Decision

Skip Go backend layout entirely for v1.

## Consequences

No `cmd/`, `internal/`, runtime API, Docker image, migrations, or server config are created.

## Alternatives Considered

A Go backend was rejected because there are no runtime writes, secrets, or server-only computations.
