#!/usr/bin/env python3
from __future__ import annotations

import gzip
import hashlib
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
CALC = ROOT / "calculator/yysls-calc-rust"
DIST = CALC / "dist/excel"
LIVE = ROOT / "static/tools/yysls-tiaolv/assets/wasm/excel"
META_PATH = ROOT / "static/tools/yysls-tiaolv/assets/js/generated-calc-metadata.js"

match = re.search(r"window\.YYSLS_CALC_METADATA=(.*);\s*$", META_PATH.read_text(encoding="utf-8"), re.S)
if not match:
    raise SystemExit("无法解析 generated-calc-metadata.js")
metadata = json.loads(match.group(1))
modules = metadata.get("flowExcelModules") or {}
if len(modules) != 12:
    raise SystemExit(f"必须有12个Excel模块，实际为{len(modules)}")

LIVE.mkdir(parents=True, exist_ok=True)
expected = set()
for flow_name, entry in modules.items():
    filename = entry["file"]
    source = DIST / filename
    if not source.is_file():
        raise SystemExit(f"缺少模块：{source}")
    data = source.read_bytes()
    compressed_size = len(gzip.compress(data, compresslevel=9))
    if compressed_size > 1_000_000:
        raise SystemExit(f"{filename} gzip体积{compressed_size}超过1MB门槛")
    digest = hashlib.sha256(data).hexdigest()
    entry.update({"hash": digest, "size": len(data), "gzipSize": compressed_size})
    shutil.copy2(source, LIVE / filename)
    expected.add(filename)

for old in LIVE.glob("excel_*.wasm"):
    if old.name not in expected:
        old.unlink()

META_PATH.write_text(
    "// Generated from calculator workbooks. Do not edit by hand.\n"
    + "window.YYSLS_CALC_METADATA="
    + json.dumps(metadata, ensure_ascii=False, separators=(",", ":"))
    + ";\n",
    encoding="utf-8",
)
print(json.dumps({"status": "ok", "modules": len(modules)}, ensure_ascii=False))
