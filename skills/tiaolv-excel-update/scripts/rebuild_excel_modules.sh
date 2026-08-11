#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$ROOT"

panel_before="$(sha256sum static/tools/yysls-tiaolv/assets/wasm/yysls_panel.wasm | cut -d' ' -f1)"
python3 skills/tiaolv-excel-update/scripts/inventory_workbooks.py
python3 calculator/yysls-calc-rust/scripts/generate_excel_engine.py
calculator/yysls-calc-rust/scripts/build_excel_modules.sh
node calculator/yysls-calc-rust/tests/excel-direct-parity.mjs
python3 calculator/yysls-calc-rust/tests/pzy-workbook-parity.py
panel_after="$(sha256sum static/tools/yysls-tiaolv/assets/wasm/yysls_panel.wasm | cut -d' ' -f1)"
test "$panel_before" = "$panel_after"
./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh
hugo --minify
echo "Excel modules rebuilt; Panel hash unchanged: $panel_after"
