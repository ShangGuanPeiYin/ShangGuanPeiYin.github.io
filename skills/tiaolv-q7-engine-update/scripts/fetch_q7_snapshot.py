#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import shutil
import subprocess
import tempfile
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
BASE = "https://yysls.leoq7.com"
LIVE = ROOT / "static/tools/yysls-tiaolv"
Q7_JS = LIVE / "assets/engines/q7"
Q7_WASM = LIVE / "assets/wasm/q7"
Q7_EXCEL = LIVE / "excels/q7"
JS_FILES = ["generated-calc-strings.js", "generated-calc-metadata.js", "excel-runtime.js", "app.min.js"]


def fetch(url: str, path: Path) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "tiaolv-q7-snapshot/1"})
    with urllib.request.urlopen(request, timeout=60) as response:
        if response.status != 200:
            raise RuntimeError(f"HTTP {response.status}: {url}")
        path.write_bytes(response.read())


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load_metadata(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"window\.YYSLS_CALC_METADATA=(.*);\s*$", text, re.S)
    if not match:
        raise RuntimeError("Q7 metadata assignment not found")
    return json.loads(match.group(1))


def extract_app_config(app_path: Path, output: Path) -> None:
    script = r'''
const fs = require("fs"), vm = require("vm");
const source = fs.readFileSync(process.argv[1], "utf8");
const start = source.indexOf("const CommonData =");
const end = source.indexOf("OCRHandler =", start);
if (start < 0 || end < 0) throw new Error("Q7 app config block not found");
const block = source.slice(start, end)
  .replace(/^const CommonData\s*=\s*/, "globalThis.CommonData = ")
  .replace(/,\s*ClassConfig\s*=\s*/, ";\nglobalThis.ClassConfig = ")
  .replace(/,\s*$/, ";");
const context = {}; vm.createContext(context); vm.runInContext(block, context);
process.stdout.write("window.YYSLS_Q7_APP_CONFIG=" + JSON.stringify({CommonData: context.CommonData, ClassConfig: context.ClassConfig}) + ";\n");
'''
    result = subprocess.run(["node", "-e", script, str(app_path)], check=True, capture_output=True, text=True)
    config = json.loads(re.search(r"window\.YYSLS_Q7_APP_CONFIG=(.*);\s*$", result.stdout, re.S).group(1))
    # 本站明确采用 2.45；这是相对 Q7 上游快照唯一允许的数值覆盖。
    config["CommonData"]["SEASON_STATS"]["赛季抗性"] = 2.45
    output.write_text("window.YYSLS_Q7_APP_CONFIG=" + json.dumps(config, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")


def main() -> None:
    with tempfile.TemporaryDirectory(prefix="tiaolv-q7-") as tmp_name:
        tmp = Path(tmp_name)
        for filename in JS_FILES:
            fetch(f"{BASE}/assets/js/{filename}", tmp / filename)
        fetch(f"{BASE}/assets/wasm/yysls_calc.wasm", tmp / "yysls_calc.wasm")
        wasm = tmp / "yysls_calc.wasm"
        if wasm.stat().st_size < 100_000 or wasm.read_bytes()[:4] != b"\0asm":
            raise RuntimeError("invalid Q7 WASM")

        metadata = load_metadata(tmp / "generated-calc-metadata.js")
        rotations = metadata.get("classRotationStats", {})
        if len(rotations) != 11:
            raise RuntimeError(f"expected 11 Q7 flows, got {len(rotations)}")
        workbook_dir = tmp / "excels"
        workbook_dir.mkdir()
        workbook_names = []
        for flow, rotation in rotations.items():
            name = f"{rotation['version']}.xlsx"
            workbook_names.append(name)
            fetch(f"{BASE}/excels/{urllib.parse.quote(name)}", workbook_dir / name)
            if (workbook_dir / name).stat().st_size < 10_000:
                raise RuntimeError(f"invalid workbook: {flow} / {name}")

        runtime_text = (tmp / "excel-runtime.js").read_text(encoding="utf-8")
        old_url = "assets/wasm/yysls_calc.wasm"
        if runtime_text.count(old_url) != 1:
            raise RuntimeError("unexpected Q7 WASM URL contract")
        runtime_text = runtime_text.replace(old_url, "assets/wasm/q7/yysls_calc.wasm")
        fallback = 'return num(seasonStats["赛季抗性"]) || 2.15;'
        if runtime_text.count(fallback) != 1:
            raise RuntimeError("unexpected Q7 season-resistance fallback contract")
        runtime_text = runtime_text.replace(fallback, 'return num(seasonStats["赛季抗性"]) || 2.45;')
        (tmp / "excel-runtime.namespaced.js").write_text(runtime_text, encoding="utf-8")
        extract_app_config(tmp / "app.min.js", tmp / "q7-app-config.js")

        manifest = {
            "source": BASE,
            "localOverrides": {"seasonResistance": 2.45},
            "siteUpdateTime": metadata.get("siteUpdateTime", ""),
            "flows": list(rotations),
            "assets": {filename: {"sha256": digest(tmp / filename), "size": (tmp / filename).stat().st_size} for filename in JS_FILES},
            "wasm": {"sha256": digest(wasm), "size": wasm.stat().st_size},
            "workbooks": {name: {"sha256": digest(workbook_dir / name), "size": (workbook_dir / name).stat().st_size} for name in workbook_names},
        }
        (tmp / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

        Q7_JS.mkdir(parents=True, exist_ok=True)
        Q7_WASM.mkdir(parents=True, exist_ok=True)
        Q7_EXCEL.mkdir(parents=True, exist_ok=True)
        for old in Q7_JS.iterdir():
            if old.is_file(): old.unlink()
        for old in Q7_EXCEL.glob("*.xlsx"):
            old.unlink()
        shutil.copy2(tmp / "generated-calc-strings.js", Q7_JS / "generated-calc-strings.js")
        shutil.copy2(tmp / "generated-calc-metadata.js", Q7_JS / "generated-calc-metadata.js")
        shutil.copy2(tmp / "excel-runtime.namespaced.js", Q7_JS / "excel-runtime.js")
        shutil.copy2(tmp / "q7-app-config.js", Q7_JS / "q7-app-config.js")
        shutil.copy2(tmp / "manifest.json", Q7_JS / "manifest.json")
        shutil.copy2(wasm, Q7_WASM / "yysls_calc.wasm")
        for name in workbook_names:
            shutil.copy2(workbook_dir / name, Q7_EXCEL / name)
        print(json.dumps({"status": "ok", "wasm": manifest["wasm"], "workbooks": len(workbook_names), "siteUpdateTime": manifest["siteUpdateTime"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
