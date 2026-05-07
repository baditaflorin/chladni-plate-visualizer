# 0012 - Metrics And Observability

## Status

Accepted

## Context

Mode A has no server-side runtime.

## Decision

Use no analytics in v1. Local UI status shows renderer mode, FPS, commit, and version.

## Consequences

No PII is collected. There are no dashboards.

## Alternatives Considered

Plausible was considered but rejected because usage insight is not required for v1.
