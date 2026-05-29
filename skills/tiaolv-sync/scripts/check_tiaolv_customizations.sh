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

INDEX="static/tools/yysls-tiaolv/index.html"
APP="static/tools/yysls-tiaolv/assets/js/app.min.js"
LOCAL_JS="static/tools/yysls-tiaolv/assets/js/local-customizations.js"
DOC="doc/tiaolv-local-customizations.md"

check_file "$INDEX"
check_file "$APP"
check_file "$LOCAL_JS"
check_file "$DOC"

check_contains "$INDEX" "assets/js/local-customizations.js" "local customizations script tag"
check_contains "$LOCAL_JS" "level-select" "equipment level control injection"
check_contains "$LOCAL_JS" "download-json-data-btn" "download JSON control"
check_contains "$LOCAL_JS" "import-json-file-input" "upload JSON control"
check_contains "$LOCAL_JS" "format: \"plain-json\"" "plain JSON export marker"

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

if [[ -x "$repo/.tools/hugo/hugo" ]]; then
  "$repo/.tools/hugo/hugo" --gc --minify >/dev/null
  echo "OK: Hugo build"
else
  echo "WARN: .tools/hugo/hugo not found; skipped Hugo build" >&2
fi

echo "Tiaolv customization checks passed."
