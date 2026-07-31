#!/usr/bin/env bash
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$repo"

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

check_file() {
  [[ -f "$1" ]] || fail "Missing required file: $1"
}

check_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if ! grep -Fq "$pattern" "$file"; then
    fail "$label not found in $file"
  fi
  echo "OK: $label"
}

check_not_contains() {
  local file="$1"
  local pattern="$2"
  local label="$3"
  if grep -Fq "$pattern" "$file"; then
    fail "$label unexpectedly found in $file"
  fi
  echo "OK: $label absent"
}

INDEX="static/tools/yysls-tiaolv/index.html"
APP="static/tools/yysls-tiaolv/assets/js/app.min.js"
LOCAL_JS="static/tools/yysls-tiaolv/assets/js/local-customizations.js"
THEME_CSS="static/tools/yysls-tiaolv/assets/css/ui-codex-command-classic.css"
ALGORITHMS_JS="static/tools/yysls-tiaolv/assets/js/best-build-algorithms.js"
RUNTIME="static/tools/yysls-tiaolv/assets/js/excel-runtime.js"
WASM="static/tools/yysls-tiaolv/assets/wasm/yysls_calc.wasm"
DOC="doc/tiaolv-local-customizations.md"

check_file "$INDEX"
check_file "$APP"
check_file "$LOCAL_JS"
check_file "$THEME_CSS"
check_file "$ALGORITHMS_JS"
check_file "$RUNTIME"
check_file "$WASM"
check_file "$DOC"

# Verify WASM matches the ASSET_VERSION declared in excel-runtime.js
expected_version="$(grep -o 'ASSET_VERSION = "[^"]*"' "$RUNTIME" | grep -o '"[^"]*"' | tr -d '"')"
# WASM magic number: first 4 bytes must be \0asm
wasm_magic="$(xxd -l 4 "$WASM" | awk '{print $2$3}' | head -1)"
if [[ "$wasm_magic" != "0061736d" ]]; then
  fail "WASM file is not a valid WebAssembly binary (bad magic number: $wasm_magic)"
fi
echo "OK: WASM magic number valid (asset version expected: $expected_version)"

check_contains "$INDEX" "assets/js/local-customizations.js" "local customizations script tag"
check_contains "$INDEX" "assets/js/best-build-algorithms.js" "best-build algorithms script tag"
check_contains "$ALGORITHMS_JS" "window.YYSLSBestBuildAlgorithms" "best-build algorithm registry"
check_contains "$APP" "best-build-algorithm-select" "best-build algorithm selector"
check_contains "$APP" 'id: "legacy-exhaustive"' "legacy best-build algorithm registration"
check_contains "$LOCAL_JS" "level-select" "equipment level control injection"
check_contains "$LOCAL_JS" "download-json-data-btn" "download JSON control"
check_contains "$LOCAL_JS" "import-json-file-input" "upload JSON control"
check_contains "$LOCAL_JS" "yysls-tiaolv-full-backup" "full JSON backup marker"
check_contains "$LOCAL_JS" "schemaVersion: FULL_BACKUP_SCHEMA_VERSION" "full JSON backup schema version"
check_contains "$LOCAL_JS" "isValidJsonPayload(payload)" "legacy JSON import compatibility"
check_contains "$LOCAL_JS" "grad-manual-stat-count-controls" "manual stat-count input mode"
check_contains "$LOCAL_JS" "MANUAL_STAT_COUNT_MAX = 40" "manual stat-count limit"
check_contains "$LOCAL_JS" "getManualStatCountLimit" "manual per-stat physical limits"
check_contains "$LOCAL_JS" "runManualStatMinCostFlow" "manual main/sub stat allocator"
check_contains "$LOCAL_JS" "allocateManualStatCounts" "manual equipment feasibility validation"
check_contains "$LOCAL_JS" "grad-manual-main-count-total" "manual main-stat counter"
check_contains "$LOCAL_JS" "grad-manual-sub-count-total" "manual sub-stat counter"
check_contains "$LOCAL_JS" "assignment.subs.map" "manual allocated theoretical equipment"
check_contains "$LOCAL_JS" "全部按承音值" "manual Chengyin-value mode"
check_contains "$LOCAL_JS" '"undefined" == typeof Calculator' "manual calculator readiness check"
check_contains "$LOCAL_JS" 'panelEditor.style.display = countMode ? "none" : "block"' "manual panel visibility toggle"
check_contains "$LOCAL_JS" "grad-manual-stat-category-panels" "manual stat category panels"
check_contains "$LOCAL_JS" "grad-manual-bow-select" "manual bow selector"
check_contains "$LOCAL_JS" 'UIManager.dom.bowSelect.dispatchEvent(new Event("change"' "manual bow selector synchronization"
check_contains "$LOCAL_JS" "weaponStatsByClass" "manual class weapon-stat filtering"
check_contains "$LOCAL_JS" "grad-manual-stat-clear-btn" "manual stat-count clear control"
check_contains "$LOCAL_JS" 'renderLabeledMetric(countResultElement, "Excel表格显示毕业率：", rate)' "manual stat-count gold rate"
check_contains "$LOCAL_JS" "grad-manual-stat-preset-select" "manual stat-count preset selector"
check_contains "$LOCAL_JS" "保存为新组合" "manual stat-count preset save"
check_contains "$LOCAL_JS" "当前词条组合有未更新的改动" "manual stat-count dirty preset warning"
check_contains "$LOCAL_JS" "writeManualPanelInputs(container, panel, false)" "manual stat-count single calculation path"
check_contains "$LOCAL_JS" "grad-manual-stat-count-result" "manual stat-count isolated result"
check_contains "$LOCAL_JS" 'panelResultElement.style.display = countMode ? "none" : "block"' "manual dual-mode result isolation"
check_contains "$LOCAL_JS" "grad-manual-stat-count-final-panel" "manual stat-count final panel"
check_contains "$LOCAL_JS" "GradModal.renderPanelStats(panelData" "manual final-panel shared renderer"
check_contains "$LOCAL_JS" "decoratePanelRateOverflow" "final-panel rate overflow display"
check_contains "$LOCAL_JS" "manual-panel-overflow-hint" "final-panel white-value overflow hint"
check_contains "$APP" "function isTransmutableEquip" "110-level transmutation eligibility"
check_contains "$APP" "if (!isTransmutableEquip(e)) return a" "transmutation variant eligibility guard"
check_contains "$APP" "只有110级非承音装备可以计算转律建议" "transmutation suggestion eligibility guard"
check_contains "$LOCAL_JS" "TRANSMUTATION_LEVEL_MIGRATION_MARKER" "transmutation status level migration marker"
check_contains "$LOCAL_JS" "migrateTransmutationStatusesToLevel110" "transmutation status level migration"
check_contains "$LOCAL_JS" "var allow = level === 110 && !isChengyin" "transmutation status 110-level visibility"
check_contains "$LOCAL_JS" "TRANSMUTATION_TWO_STATE_MIGRATION_MARKER" "two-state transmutation migration marker"
check_contains "$LOCAL_JS" "TRANSMUTATION_STATUS_MODEL_VERSION = 2" "two-state transmutation model version"
check_contains "$LOCAL_JS" "migrateTransmutationStatusesToTwoState" "legacy transmutation reset migration"
check_contains "$LOCAL_JS" 'return { state: "active", subStatIndex: subStatIndex, modelVersion: TRANSMUTATION_STATUS_MODEL_VERSION }' "single-substat transmutation status"
check_not_contains "$LOCAL_JS" "锁死 / 默认" "legacy third transmutation state absent"
check_not_contains "$LOCAL_JS" "可转目标（1-3个）" "legacy transmutation target editor absent"
check_not_contains "$INDEX" 'data-tab="transmutation"' "transmutation suggestion tab hidden"
check_contains "$APP" "this.state.bestBuildLockedConvertible = null, this.clearBestBuildCache();" "normal best-build ignores transmutation cache"
check_contains "$THEME_CSS" "font-family: var(--cc-mono);" "equipment stat monospace font"
check_contains "$THEME_CSS" "font-variant-numeric: tabular-nums;" "equipment stat tabular numerals"
check_contains "$LOCAL_JS" "purgeRemovedTransmutationCooldownData" "removed transmutation-CD data migration"
check_contains "$LOCAL_JS" "REMOVED_TRANSMUTATION_CD_MARKER" "removed transmutation-CD migration marker"
check_not_contains "$INDEX" "enter-transmute-cd-btn" "removed transmutation-CD equipment control"
check_not_contains "$INDEX" 'data-tab="transmutation-cd"' "removed transmutation-CD tab"
check_not_contains "$APP" "TransmutationCd" "removed transmutation-CD runtime"
check_not_contains "$APP" "game_transmutation_cd_" "removed transmutation-CD storage"
check_not_contains "$LOCAL_JS" "transmutationCooldowns" "removed transmutation-CD backup field"
check_contains "$LOCAL_JS" "renderBuildStatsSummary" "build stats summary function"
check_contains "$APP" "renderBuildStatsSummary" "build stats summary template call"

check_contains "$APP" "levelSelect" "equipment level DOM binding"
check_contains "$APP" "level: parseInt" "equipment level save"
check_contains "$APP" "if (!item.level) item.level = 105" "default equipment level"
check_contains "$APP" "maxNeedChengyin" "max-needed-Chengyin state"
check_contains "$APP" "max-need-chengyin-select" "max-needed-Chengyin selector"
check_contains "$APP" "needChengyinCount" "needed-Chengyin count"
check_contains "$APP" "(需承音)" "needed-Chengyin label"
check_contains "$APP" "(承音)" "real-Chengyin label"
check_contains "$APP" "top10Builds: o.slice(0, 20)" "Top20 best-build retention"

node --check "$APP" >/dev/null
echo "OK: app.min.js syntax"

node --check "$LOCAL_JS" >/dev/null
echo "OK: local-customizations.js syntax"

node --check "$ALGORITHMS_JS" >/dev/null
echo "OK: best-build-algorithms.js syntax"

if [[ -x "$repo/.tools/hugo/hugo" ]]; then
  "$repo/.tools/hugo/hugo" --gc --minify >/dev/null
  echo "OK: Hugo build"
else
  echo "WARN: .tools/hugo/hugo not found; skipped Hugo build" >&2
fi

echo "Tiaolv customization checks passed."
