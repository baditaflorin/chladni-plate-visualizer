# Data

Mode A does not use a backend data pipeline.

The frontend ships only static assets and a generated `version.json` file containing:

- package version
- source commit
- build timestamp
- repository URL
- PayPal URL

The schema version for `version.json` is `1`.
