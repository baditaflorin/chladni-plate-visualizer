# 0015 - Deployment Topology

## Status

Accepted

## Context

Mode A deploys only static assets.

## Decision

GitHub Pages serves `docs/` from `main`. There is no Docker Compose, nginx, GHCR image, Prometheus, or server.

## Consequences

Operational work is limited to git pushes and Pages configuration.

## Alternatives Considered

A Docker backend was rejected because v1 needs no runtime API.
