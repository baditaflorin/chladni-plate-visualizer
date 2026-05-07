# 0004 - Static Data Contract

## Status

Accepted

## Context

Mode A has no external dataset, but the page must surface version and commit metadata.

## Decision

Generate `docs/version.json` at build time with schema version `1`, package version, short commit, build timestamp, repository URL, PayPal URL, and Pages URL.

## Consequences

The UI can show build metadata without a backend.

## Alternatives Considered

Hardcoding metadata in source was rejected because commit and build time need to reflect the current checkout.
