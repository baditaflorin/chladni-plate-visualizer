# 0002 - Architecture Overview And Module Boundaries

## Status

Accepted

## Context

The app needs simulation, rendering, audio, controls, and local persistence while staying static.

## Decision

Use a feature-oriented frontend:

- `features/plate/audio` owns Web Audio.
- `features/plate/simulation` owns PDE stepping.
- `features/plate/visualizer` owns Three.js rendering.
- `features/plate/math` owns deterministic math utilities.
- `lib` owns build metadata and storage helpers.

## Consequences

The simulation can be tested separately from the UI, and the rendering layer can switch between GPU and CPU solvers without changing controls.

## Alternatives Considered

A single large canvas module was rejected because it would make solver tests and future WASM work harder.
