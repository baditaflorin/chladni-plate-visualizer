# 0010 - GitHub Pages Publishing Strategy

## Status

Accepted

## Context

The live URL must work from day one and no GitHub Actions are allowed.

## Decision

Publish from the `main` branch `/docs` directory. Vite builds into `docs/` with `base: /chladni-plate-visualizer/`, hashed assets, `404.html`, and `version.json`.

`docs/` is not gitignored because it is the Pages publish directory and also contains project documentation.

## Consequences

Every publish is a normal git commit. Reverting a publish means reverting the `docs/` changes.

## Alternatives Considered

A `gh-pages` branch was rejected because it splits source and docs across branches and makes local review less direct.
