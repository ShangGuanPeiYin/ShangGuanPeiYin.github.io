#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[3]
LIVE = ROOT / "static/tools/yysls-tiaolv"
EXCEL_DIR = LIVE / "excels"
CALC = Path(__file__).resolve().parent.parent
OUT = CALC / "tests/fixtures/excel-oracle-v1.json"

sys.path.insert(0, str(CALC / "scripts"))
from generate_excel_engine import FLOW_ORDER, FLOW_SLUGS


def generated_json(path: Path, prefix: str):
    text = path.read_text(encoding="utf-8")
    match = re.search(re.escape(prefix) + r"(.*?);\s*(?:\n|$)", text, re.S)
    if not match:
        raise ValueError(f"无法解析 {path}")
    return json.loads(match.group(1))


def main():
    metadata = generated_json(LIVE / "assets/js/generated-calc-metadata.js", "window.YYSLS_CALC_METADATA=")
    oracle = {"version": 1, "flows": {}}
    for flow in FLOW_ORDER:
        info = metadata["flowExcelModules"][flow]
        workbook = next((p for p in EXCEL_DIR.glob(f"{flow}*计算器*.xlsx") if f"{flow}110" in p.name), None)
        if workbook is None:
            raise ValueError(f"工作簿定位失败 flow={flow} version={info['version']}")
        wb = load_workbook(workbook, data_only=True, read_only=True)
        expected_sheet = wb["期望"]
        rd_sheet = wb["RD"]
        outputs = {}
        for key, address in {"totalDamage": "I10", "adps": "I12", "graduationRatio": "I16", "rdps": "I14"}.items():
            value = expected_sheet[address].value
            if value is None:
                raise ValueError(f"期望!{address} 缓存为空 flow={flow}")
            outputs[key] = float(value)
        rd_baseline = rd_sheet["I14"].value
        if rd_baseline is None:
            raise ValueError(f"RD!I14 缓存为空 flow={flow}")
        wb.close()
        oracle["flows"][flow] = {
            "workbook": workbook.name,
            "version": info["version"],
            "module": info["file"],
            **outputs,
            "rdpsBaseline": float(rd_baseline),
        }
    OUT.write_text(json.dumps(oracle, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "ok", "flows": len(oracle["flows"]), "file": str(OUT)}, ensure_ascii=False))


if __name__ == "__main__":
    main()