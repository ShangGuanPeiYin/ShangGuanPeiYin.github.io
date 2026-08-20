#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
SOURCE="$ROOT/calculator/yysls-calc-rust/target/generated-excel-direct/excel_qslin_2_1.rs"
CANDIDATE="$ROOT/calculator/yysls-calc-rust/dist/excel/excel_qslin_2_1.wasm"
TEMP_DIR="$(mktemp -d)"
SECOND="$TEMP_DIR/excel_qslin_2_1.wasm"
trap 'rm -rf "$TEMP_DIR"' EXIT

[[ -f "$SOURCE" ]] || { echo "Missing generated source: $SOURCE" >&2; exit 1; }
[[ -f "$CANDIDATE" ]] || { echo "Missing candidate module: $CANDIDATE" >&2; exit 1; }

rustc -Awarnings --edition=2024 --target wasm32-unknown-unknown \
  -C opt-level=2 -C panic=abort -C codegen-units=1 -C strip=symbols \
  --crate-type cdylib "$SOURCE" -o "$SECOND"

if ! cmp -s "$CANDIDATE" "$SECOND"; then
  echo "FAIL: 牵丝霖 WASM is not reproducible" >&2
  sha256sum "$CANDIDATE" "$SECOND" >&2
  exit 1
fi

echo "Reproducible: $(sha256sum "$CANDIDATE" | cut -d' ' -f1)  excel_qslin_2_1.wasm"
