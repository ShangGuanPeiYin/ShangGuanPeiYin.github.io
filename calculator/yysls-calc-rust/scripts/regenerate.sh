#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASELINE="$ROOT/../../static/tools/yysls-tiaolv/assets/wasm/yysls_calc.wasm"
TARGET="$ROOT/src/generated_legacy_semantics.rs"

EXPECTED="21652c0cb08c7b30a705faee61ae0a833a664d479212b2e74b4c1abb56919391"
ACTUAL="$(sha256sum "$BASELINE" | awk '{print $1}')"
if [[ "$ACTUAL" != "$EXPECTED" ]]; then
  echo "baseline hash mismatch: $ACTUAL" >&2
  exit 1
fi

command -v wasm2rs >/dev/null || {
  echo "install wasm2rs first: cargo install wasm2rs --locked" >&2
  exit 1
}

wasm2rs "$BASELINE" > "$TARGET"

