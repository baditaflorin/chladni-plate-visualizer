# Architecture

```mermaid
C4Container
    title Chladni Plate Visualizer - Mode A
    Person(user, "Visitor")
    System_Boundary(browser, "Browser") {
      Container(app, "App Shell", "React + TypeScript", "Controls, status, persistence, installable PWA")
      Container(audio, "Audio Analysis", "Web Audio", "Oscillator, uploaded files, microphone FFT")
      Container(sim, "Plate Simulation", "WebGPU compute + CPU fallback", "Damped biharmonic PDE solver")
      Container(render, "Scene", "Three.js", "3D plate mesh and sand particles")
      ContainerDb(storage, "Local Settings", "localStorage", "Non-sensitive user preferences")
    }
    System_Ext(pages, "GitHub Pages", "Static host")
    Rel(user, app, "Interacts with")
    Rel(app, audio, "Starts/stops sources")
    Rel(audio, sim, "Provides frequency bands")
    Rel(app, sim, "Sets material and drive")
    Rel(sim, render, "Streams displacement field")
    Rel(app, storage, "Reads/writes")
    Rel(pages, app, "Serves static files")
```

## Module Boundaries

- `src/features/plate/audio/`: browser audio input and FFT bands.
- `src/features/plate/simulation/`: PDE solvers and shared simulation contracts.
- `src/features/plate/visualizer/`: Three.js scene and sand particle update.
- `src/features/plate/math/`: deterministic functions covered by unit tests.
- `src/lib/`: app-wide storage, build metadata, and small utilities.
