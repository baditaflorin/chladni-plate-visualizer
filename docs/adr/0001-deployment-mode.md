# 0001 - Deployment Mode

## Status

Accepted

## Context

The app needs real-time interactive simulation, browser audio input, and 3D rendering. It does not need accounts, shared state, secrets, server mutations, or a runtime database.

## Decision

Use Mode A: Pure GitHub Pages.

The app runs entirely in the browser using WebGPU compute where available, a CPU fallback where needed, Web Audio, Three.js, and static assets.

## Consequences

- No backend, Docker, nginx, runtime database, or server secrets.
- GitHub Pages is the only deployment target.
- Browser feature support must be detected at runtime.

## Alternatives Considered

- Mode B: unnecessary because v1 has no data artifacts that need scheduled generation.
- Mode C: rejected because a runtime API would add operational cost without solving a v1 requirement.
