#!/usr/bin/env bash
set -euo pipefail

npm run build
node tests/smoke/pages-smoke.mjs
