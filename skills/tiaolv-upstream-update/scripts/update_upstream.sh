#!/usr/bin/env bash
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
STUDY="$REPO/study"
OLD_DIR="$STUDY/old"
NEW_DIR="$STUDY/new"
SITE="yysls.leoq7.com"
BASE_URL="https://$SITE"
REFERER="-H Referer: $BASE_URL/"

echo "=== Step 1: 清空 old/ ==="
rm -rf "$OLD_DIR"
mkdir -p "$OLD_DIR"

echo "=== Step 2: 把 new/ 内容移入 old/ ==="
if [ -d "$NEW_DIR/$SITE" ]; then
    mv "$NEW_DIR/$SITE" "$OLD_DIR/$SITE"
    echo "已移动 study/new/$SITE → study/old/$SITE"
else
    echo "study/new/$SITE 不存在，跳过移动"
fi

echo "=== Step 3: 下载最新代码到 new/ ==="
DEST="$NEW_DIR/$SITE"
mkdir -p "$DEST/assets/css" "$DEST/assets/js" "$DEST/assets/images" "$DEST/assets/wasm"

# 下载 index.html
echo "下载 index.html..."
curl -sL "$BASE_URL/" -H "Referer: $BASE_URL/" -o "$DEST/index.html"

# 从 index.html 提取所有 assets/ 路径（含版本号）
ASSETS=$(grep -o 'assets/[^"]*' "$DEST/index.html" | sort -u)

# 下载每个 asset
for ASSET in $ASSETS; do
    FILE="$DEST/$ASSET"
    DIR="$(dirname "$FILE")"
    mkdir -p "$DIR"
    echo "下载 $ASSET..."
    curl -sL "$BASE_URL/$ASSET" -H "Referer: $BASE_URL/" -o "$FILE"
done

# 从 excel-runtime.js 读取 WASM 版本号并下载
RUNTIME_FILE=$(find "$DEST/assets/js" -name "excel-runtime.js*" | head -1)
if [ -n "$RUNTIME_FILE" ]; then
    ASSET_VERSION=$(grep -o 'ASSET_VERSION = "[^"]*"' "$RUNTIME_FILE" | grep -o '"[^"]*"' | tr -d '"')
    echo "下载 yysls_calc.wasm (v=$ASSET_VERSION)..."
    curl -sL "$BASE_URL/assets/wasm/yysls_calc.wasm?v=$ASSET_VERSION" \
        -H "Referer: $BASE_URL/" \
        -o "$DEST/assets/wasm/yysls_calc.wasm" \
        -w "  HTTP %{http_code}, %{size_download} bytes\n"

    # 验证 WASM 魔数
    MAGIC=$(xxd -l 4 "$DEST/assets/wasm/yysls_calc.wasm" | awk '{print $2$3}' | head -1)
    if [ "$MAGIC" != "0061736d" ]; then
        echo "ERROR: WASM 文件魔数不正确（$MAGIC），下载可能失败" >&2
        exit 1
    fi
    echo "  WASM 验证通过 (asset version: $ASSET_VERSION)"
else
    echo "WARNING: 未找到 excel-runtime.js，跳过 WASM 下载" >&2
fi

echo ""
echo "=== 完成 ==="
echo "study/old/ → 上次快照"
echo "study/new/ → 最新快照"
echo ""
echo "下载文件列表："
find "$DEST" -type f | sort
