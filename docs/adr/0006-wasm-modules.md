# 0006 - WASM Modules

## Status

Accepted

## Context

The concept mentions C++ PDE solvers. GitHub Pages cannot set COOP/COEP headers, and Emscripten is not a required local dependency for this v1.

## Decision

Do not ship runtime WASM in v1. Use WebGPU WGSL for real-time plate compute and include `cpp/pde/plate_solver.cpp` as a reference solver for future WASM validation.

## Consequences

The site stays simple and static. The C++ path remains available without blocking the public Pages build.

## Alternatives Considered

Shipping an Emscripten WASM module was rejected for v1 because WebGPU handles the hot path and Pages header constraints complicate advanced WASM threading.
