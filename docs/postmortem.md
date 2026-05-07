# Postmortem

## Built

V1 implements a static GitHub Pages Chladni plate visualizer with a browser-side PDE solver, Web Audio inputs, Three.js rendering, project documentation, local hooks, tests, and a Pages publish flow.

## Deployment Mode In Hindsight

Mode A remains the correct choice. The project has no runtime secrets, no cross-device persistence, no authentication, and no server mutations. WebGPU and Web Audio cover the interactive runtime directly in the browser.

## What Worked

- GitHub Pages keeps deployment small and reproducible.
- WebGPU compute maps well to the plate update step.
- Web Audio FFT bands provide a responsive audio-to-mode control path.

## What Did Not

- GitHub Pages cannot set COOP/COEP headers, so v1 avoids SharedArrayBuffer-dependent WASM approaches.
- Browser WebGPU support still varies; a CPU fallback is necessary.

## Surprises

- A useful cymatics experience can fit into a static app without a runtime API.

## Accepted Tech Debt

- The C++ solver is a reference implementation rather than a production WASM module because Emscripten is not required for the static v1 build.
- Sand motion is an artistic particle approximation driven by the simulated field, not a granular physics solver.

## Next Improvements

1. Add optional Emscripten build for the C++ reference solver as a WASM validation module.
2. Add more boundary conditions and material presets.
3. Add exportable snapshots and short WebM captures.

## Time

Estimated: 6-8 hours for v1 scaffold and implementation.

Actual: Completed as a focused first-pass implementation in one build session.
