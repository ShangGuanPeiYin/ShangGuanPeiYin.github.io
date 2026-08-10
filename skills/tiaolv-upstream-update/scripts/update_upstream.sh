#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
STUDY="$REPO/study"
SITE="yysls-assistant.cn"
BASE_URL="https://$SITE"
NEW_DIR="$STUDY/new/$SITE"
OLD_DIR="$STUDY/old/$SITE"
SEED_DIR="$STUDY/$SITE"
WORK_DIR="$(mktemp -d "$STUDY/.assistant-update.XXXXXX")"
DOWNLOAD_DIR="$WORK_DIR/$SITE"

cleanup() {
    rm -rf "$WORK_DIR"
}
trap cleanup EXIT

mkdir -p "$DOWNLOAD_DIR/assets"

fetch() {
    local relative="$1"
    local target="$DOWNLOAD_DIR/$relative"
    mkdir -p "$(dirname "$target")"
    curl --fail --silent --show-error --location \
        --retry 3 --retry-delay 1 \
        -H "Referer: $BASE_URL/" \
        "$BASE_URL/$relative" -o "$target"
}

echo "下载并验证 $BASE_URL 数值参考快照……"
fetch "index.html"

declare -A seen=()
declare -a queue=()

enqueue_assets() {
    local file="$1"
    local asset
    while IFS= read -r asset; do
        asset="${asset%%\?*}"
        asset="${asset#/}"
        case "$asset" in
            assets/*.js|assets/*.css)
                if [ -z "${seen[$asset]+x}" ]; then
                    seen["$asset"]=1
                    queue+=("$asset")
                fi
                ;;
        esac
    done < <(grep -Eo '(/)?assets/[A-Za-z0-9_./-]+\.(js|css)(\?[^"'"'"'[:space:]<>)]*)?' "$file" | sort -u || true)
}

enqueue_assets "$DOWNLOAD_DIR/index.html"
cursor=0
while [ "$cursor" -lt "${#queue[@]}" ]; do
    asset="${queue[$cursor]}"
    cursor=$((cursor + 1))
    fetch "$asset"
    enqueue_assets "$DOWNLOAD_DIR/$asset"
done

if [ "${#queue[@]}" -eq 0 ]; then
    echo "ERROR: 页面中未发现 JavaScript/CSS 资源，拒绝轮换快照。" >&2
    exit 1
fi

if ! grep -RqsE '110_[A-Z0-9_]+' "$DOWNLOAD_DIR/assets"; then
    echo "ERROR: 未发现可识别的110级版本标记，拒绝轮换快照。" >&2
    exit 1
fi

if ! grep -RqsE 'summaryAttributePanel|DamageCalculatorV2|martial|equipment' "$DOWNLOAD_DIR/assets"; then
    echo "ERROR: 未发现可识别的面板数值结构，拒绝轮换快照。" >&2
    exit 1
fi

FETCHED_AT="$(date '+%Y-%m-%d %H:%M:%S %z')"
{
    echo "source=$BASE_URL"
    echo "fetched_at=$FETCHED_AT"
    echo "purpose=numeric-panel-reference-only"
    echo "asset_count=${#queue[@]}"
    find "$DOWNLOAD_DIR" -type f -print0 | sort -z | xargs -0 sha256sum
} > "$DOWNLOAD_DIR/SNAPSHOT-MANIFEST.txt"

mkdir -p "$STUDY/new" "$STUDY/old"
if [ -d "$OLD_DIR" ]; then
    rm -rf "$OLD_DIR"
fi
if [ -d "$NEW_DIR" ]; then
    mv "$NEW_DIR" "$OLD_DIR"
elif [ -d "$SEED_DIR" ]; then
    cp -a "$SEED_DIR" "$OLD_DIR"
fi
mv "$DOWNLOAD_DIR" "$NEW_DIR"

echo "完成："
echo "  最新数值快照：$NEW_DIR"
echo "  上次数值快照：$OLD_DIR"
echo "  抓取资源数量：${#queue[@]}"
echo "注意：尚未修改任何本站代码或WASM，后续必须走 tiaolv-sync 数值验收流程。"
