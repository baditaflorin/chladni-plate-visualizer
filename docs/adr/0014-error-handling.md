# 0014 - Error Handling Conventions

## Status

Accepted

## Context

Browser APIs can fail due to unsupported WebGPU, denied microphone permissions, or unsupported audio formats.

## Decision

Surface recoverable failures through a global toast and non-blocking status text. Use CPU simulation fallback when WebGPU is unavailable.

## Consequences

The app remains usable on browsers without WebGPU.

## Alternatives Considered

Failing hard on missing WebGPU was rejected because the app should still demonstrate the core behavior.
