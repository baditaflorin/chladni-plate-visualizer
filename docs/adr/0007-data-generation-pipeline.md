# 0007 - Data Generation Pipeline

## Status

Accepted

## Context

This is a Mode A project.

## Decision

No Mode B data generation pipeline is included in v1. Optional librosa scripts under `tools/librosa/` are local analysis helpers, not deployed data generators.

## Consequences

There is no `make data` target in v1.

## Alternatives Considered

Precomputing modal atlases was rejected because live parameter sweeps are central to the experience.
