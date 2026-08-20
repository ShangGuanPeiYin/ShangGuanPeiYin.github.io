#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SOURCE_DIR="$ROOT/target/generated-excel-direct"
DIST_DIR="$ROOT/dist/excel"
mkdir -p "$DIST_DIR"
find "$DIST_DIR" -maxdepth 1 -type f -name 'excel_*.wasm' -delete

jobs="${YYSLS_EXCEL_BUILD_JOBS:-2}"
compile_one() {
  local source="$1"
  local output="$DIST_DIR/$(basename "${source%.rs}.wasm")"
  local opt_level=3
  local codegen_units=8
  if [[ "$(basename "$source")" == "excel_qslin_2_1.rs" ]]; then
    opt_level=2
    # This large module produced different section ordering across cold builds
    # with parallel codegen. A single unit keeps the published hash reproducible.
    codegen_units=1
  fi
  echo "Compiling $(basename "$output")"
  rustc -Awarnings --edition=2024 --target wasm32-unknown-unknown \
    -C opt-level="$opt_level" -C panic=abort -C codegen-units="$codegen_units" -C strip=symbols \
    --crate-type cdylib "$source" -o "$output"
}

pids=()
for source in "$SOURCE_DIR"/excel_*.rs; do
  compile_one "$source" &
  pids+=("$!")
  if (( ${#pids[@]} >= jobs )); then
    for pid in "${pids[@]}"; do wait "$pid"; done
    pids=()
  fi
done
for pid in "${pids[@]}"; do wait "$pid"; done

python3 "$ROOT/scripts/finalize_excel_modules.py"
