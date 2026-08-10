#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../.." && pwd)"
cd "$REPO"
EXPECTED="$(head -n 1 "$ROOT/baseline.sha256" | cut -d ' ' -f 1)"
ACTUAL="$(./gitw show 86a4e23:static/tools/yysls-tiaolv/assets/wasm/yysls_calc.wasm | sha256sum | cut -d ' ' -f 1)"
test "$EXPECTED" = "$ACTUAL"
tail -n +2 "$ROOT/baseline.sha256" | sha256sum --check
