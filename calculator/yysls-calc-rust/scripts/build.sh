#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cargo build --release --target wasm32-unknown-unknown --no-default-features --features diy
cp target/wasm32-unknown-unknown/release/yysls_calc_next.wasm dist/yysls_panel.wasm

CARGO_PROFILE_RELEASE_LTO=false \
CARGO_PROFILE_RELEASE_CODEGEN_UNITS=8 \
CARGO_PROFILE_RELEASE_OPT_LEVEL=s \
cargo build --release --target wasm32-unknown-unknown --no-default-features --features class
cp target/wasm32-unknown-unknown/release/yysls_calc_next.wasm dist/yysls_excel.wasm
