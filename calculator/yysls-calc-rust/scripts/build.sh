#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cargo build --release --target wasm32-unknown-unknown --no-default-features --features diy
cp target/wasm32-unknown-unknown/release/yysls_calc_next.wasm dist/yysls_panel.wasm

cargo build --release --target wasm32-unknown-unknown --no-default-features --features class
cp target/wasm32-unknown-unknown/release/yysls_calc_next.wasm dist/yysls_excel.wasm
