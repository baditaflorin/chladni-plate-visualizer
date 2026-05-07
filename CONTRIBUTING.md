# Contributing

Thanks for helping improve Chladni Plate Visualizer.

## Local Setup

```sh
npm install
make install-hooks
make test
make build
make smoke
```

## Commit Style

Use Conventional Commits:

- `feat:` user-facing feature
- `fix:` bug fix
- `docs:` documentation only
- `chore:` maintenance
- `refactor:` behavior-preserving code change
- `test:` test-only change
- `ops:` deployment or operations
- `data:` regenerated static data

## Security

Never commit secrets, keys, tokens, `.env` files with real values, private hostnames, or credentials.
