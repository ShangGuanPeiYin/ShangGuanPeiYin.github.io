#!/usr/bin/env python3
import json
import math
import subprocess
import tempfile
from pathlib import Path

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[3]
CALC = ROOT / "calculator/yysls-calc-rust"
LIVE = ROOT / "static/tools/yysls-tiaolv"
WORKBOOK = next((LIVE / "excels").glob("破竹鸢*2.6.xlsx"))
MODULE = LIVE / "assets/wasm/excel/excel_pzyuan_2_6.wasm"

def generated_json(path):
    return json.loads(path.read_text(encoding="utf-8").split("=", 1)[1].split(";", 1)[0])

metadata = generated_json(LIVE / "assets/js/generated-calc-metadata.js")
strings = generated_json(LIVE / "assets/js/generated-calc-strings.js")
string_ids = {value: index for index, value in enumerate(strings)}
flow = "破竹鸢"
kinds = metadata["flowClassKinds"][flow]
defaults = metadata["flowClassDefaultValues"][flow]
row = [float(string_ids.get(value, 0)) if kind == "str" else float(value or 0) for kind, value in zip(kinds, defaults)]
row.extend([0.0] * (40 - len(row)))

cached = load_workbook(WORKBOOK, data_only=True, read_only=True)
expected = [
    float(cached["期望"]["I10"].value),
    float(cached["期望"]["I12"].value),
    float(cached["期望"]["I16"].value),
    float(cached["期望"]["I14"].value),
    1.0,
]
cached.close()

with tempfile.TemporaryDirectory(prefix="pzy-workbook-parity-") as tmp:
    corpus = Path(tmp, "corpus.json")
    corpus.write_text(json.dumps([row], ensure_ascii=False), encoding="utf-8")
    actual = json.loads(subprocess.check_output([
        "node", str(CALC / "tests/pzy-direct-batch.mjs"), str(MODULE), str(corpus)
    ], text=True))[0]

for output, (left, right) in enumerate(zip(expected, actual)):
    if not math.isclose(left, right, rel_tol=2e-14, abs_tol=1e-8):
        raise SystemExit(json.dumps({"output": output, "excelCache": left, "wasm": right}, ensure_ascii=False))
print(json.dumps({"status": "ok", "flow": flow, "outputs": 5}, ensure_ascii=False))
