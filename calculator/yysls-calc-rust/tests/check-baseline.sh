#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/../.." && pwd)"
cd "$REPO"
sha256sum --check "$ROOT/baseline.sha256"
if [[ -f "$ROOT/q7-baseline.sha256" ]]; then
  sha256sum --check "$ROOT/q7-baseline.sha256"
fi
