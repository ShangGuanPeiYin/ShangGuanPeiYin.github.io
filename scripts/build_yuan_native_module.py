from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path("/home/xxs/myboke")
WORKBOOK_JSON = ROOT / "static" / "tools" / "yysls-graduation" / "workbook-yuan.json"
TARGET = ROOT / "static" / "tools" / "yysls-tiaolv" / "assets" / "js" / "yuan-native.js"
INCLUDED_SHEETS = {"期望", "武器奇术", "目标属性", "版本日志"}

FUNC_PATTERN = re.compile(r"\b(IF|VLOOKUP|MAX|MIN|AND|OR|SUM)\s*\(")


def protect_strings(expression: str) -> tuple[str, list[str]]:
    strings: list[str] = []

    def repl(match: re.Match[str]) -> str:
        token = f"__STR{len(strings)}__"
        strings.append(match.group(0))
        return token

    protected = re.sub(r'"([^"]*)"', repl, expression)
    return protected, strings


def restore_strings(expression: str, strings: list[str]) -> str:
    def repl(match: re.Match[str]) -> str:
        return strings[int(match.group(1))]

    return re.sub(r"__STR(\d+)__", repl, expression)


def transpile_formula(sheet_name: str, formula: str) -> str:
    expr = formula[1:]
    expr, strings = protect_strings(expr)

    expr = re.sub(r"(\d+(?:\.\d+)?)%", r"(\1/100)", expr)
    expr = re.sub(
        r"([A-Za-z0-9_\u4e00-\u9fa5]+)!\$?([A-Z]{1,3})\$?(\d+):\$?([A-Z]{1,3})\$?(\d+)",
        lambda m: f'rg("{m.group(1)}","{m.group(2)}{m.group(3)}","{m.group(4)}{m.group(5)}")',
        expr,
    )
    expr = re.sub(
        r"([A-Za-z0-9_\u4e00-\u9fa5]+)!\$?([A-Z]{1,3}):\$?([A-Z]{1,3})",
        lambda m: f'cg("{m.group(1)}","{m.group(2)}","{m.group(3)}")',
        expr,
    )
    expr = re.sub(
        r'(?<![A-Z0-9_"])\$?([A-Z]{1,3})\$?(\d+):\$?([A-Z]{1,3})\$?(\d+)',
        lambda m: f'rg("{sheet_name}","{m.group(1)}{m.group(2)}","{m.group(3)}{m.group(4)}")',
        expr,
    )
    expr = re.sub(
        r'(?<![A-Z0-9_"])\$?([A-Z]{1,3}):\$?([A-Z]{1,3})(?!\d)',
        lambda m: f'cg("{sheet_name}","{m.group(1)}","{m.group(2)}")',
        expr,
    )
    expr = re.sub(
        r"([A-Za-z0-9_\u4e00-\u9fa5]+)!\$?([A-Z]{1,3})\$?(\d+)",
        lambda m: f'g("{m.group(1)}","{m.group(2)}{m.group(3)}")',
        expr,
    )
    expr = re.sub(
        r'(?<![A-Z0-9_"])\$?([A-Z]{1,3})\$?(\d+)',
        lambda m: f'g("{sheet_name}","{m.group(1)}{m.group(2)}")',
        expr,
    )
    expr = expr.replace("<>", "!==")
    expr = re.sub(r"(?<![<>=!])=(?!=)", "===", expr)
    expr = re.sub(r"\bTRUE\b", "true", expr)
    expr = re.sub(r"\bFALSE\b", "false", expr)
    expr = FUNC_PATTERN.sub(lambda m: f"fn.{m.group(1)}(", expr)
    expr = restore_strings(expr, strings)
    return expr


def build_module(payload: dict) -> str:
    default_inputs: dict[str, object] = {}
    formulas: dict[str, str] = {}

    for sheet_name, sheet_data in payload["sheets"].items():
        if sheet_name not in INCLUDED_SHEETS:
            continue
        for coord, cell in sheet_data["cells"].items():
            key = f"{sheet_name}!{coord}"
            if "f" in cell:
                formulas[key] = transpile_formula(sheet_name, cell["f"])
            else:
                default_inputs[key] = cell["v"]

    defaults_json = json.dumps(default_inputs, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    formula_entries = []
    for key in sorted(formulas):
        formula_entries.append(f'    {json.dumps(key, ensure_ascii=False)}: function(g, rg, cg, fn) {{ return {formulas[key]}; }}')
    formulas_block = ",\n".join(formula_entries)

    return f"""(function () {{
  "use strict";

  const DEFAULT_INPUTS = {defaults_json};
  const FORMULA_FNS = {{
{formulas_block}
  }};

  function toNumber(value) {{
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return value;
    if (typeof value === "boolean") return value ? 1 : 0;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }}

  function colToNumber(col) {{
    let value = 0;
    for (const char of col) value = value * 26 + (char.charCodeAt(0) - 64);
    return value;
  }}

  function numberToCol(value) {{
    let n = value;
    let result = "";
    while (n > 0) {{
      const mod = (n - 1) % 26;
      result = String.fromCharCode(65 + mod) + result;
      n = Math.floor((n - 1) / 26);
    }}
    return result;
  }}

  function splitRef(ref) {{
    const match = /^([A-Z]+)(\\d+)$/.exec(ref);
    return {{ col: match[1], row: Number(match[2]) }};
  }}

  function createContext(inputOverrides) {{
    const cache = new Map();
    const rangeCache = new Map();
    const columnRangeCache = new Map();
    const vlookupIndexCache = new WeakMap();
    const overrides = inputOverrides || {{}};

    function currentValue(key) {{
      if (Object.prototype.hasOwnProperty.call(overrides, key)) return overrides[key];
      return Object.prototype.hasOwnProperty.call(DEFAULT_INPUTS, key) ? DEFAULT_INPUTS[key] : 0;
    }}

    function getCell(sheetName, coord) {{
      const key = `${{sheetName}}!${{coord}}`;
      if (cache.has(key)) return cache.get(key);
      const formula = FORMULA_FNS[key];
      const value = formula ? formula(getCell, buildRange, buildColumnRange, fn) : currentValue(key);
      cache.set(key, value);
      return value;
    }}

    function buildRange(sheetName, startRef, endRef) {{
      const cacheKey = `${{sheetName}}|${{startRef}}|${{endRef}}`;
      if (rangeCache.has(cacheKey)) return rangeCache.get(cacheKey);
      const start = splitRef(startRef);
      const end = splitRef(endRef);
      const rows = [];
      for (let row = start.row; row <= end.row; row += 1) {{
        const cols = [];
        for (let col = colToNumber(start.col); col <= colToNumber(end.col); col += 1) {{
          cols.push(getCell(sheetName, `${{numberToCol(col)}}${{row}}`));
        }}
        rows.push(cols);
      }}
      rangeCache.set(cacheKey, rows);
      return rows;
    }}

    function buildColumnRange(sheetName, startCol, endCol) {{
      const cacheKey = `${{sheetName}}|${{startCol}}|${{endCol}}`;
      if (columnRangeCache.has(cacheKey)) return columnRangeCache.get(cacheKey);
      const bounds = SHEET_BOUNDS[sheetName];
      const rows = [];
      for (let row = bounds.minRow; row <= bounds.maxRow; row += 1) {{
        const cols = [];
        for (let col = colToNumber(startCol); col <= colToNumber(endCol); col += 1) {{
          cols.push(getCell(sheetName, `${{numberToCol(col)}}${{row}}`));
        }}
        rows.push(cols);
      }}
      columnRangeCache.set(cacheKey, rows);
      return rows;
    }}

    const fn = {{
      IF(condition, yesValue, noValue) {{
        return condition ? yesValue : noValue;
      }},
      VLOOKUP(lookupValue, table, columnIndex) {{
        let index = vlookupIndexCache.get(table);
        if (!index) {{
          index = new Map();
          for (const row of table) {{
            if (!index.has(row[0])) index.set(row[0], row);
          }}
          vlookupIndexCache.set(table, index);
        }}
        const row = index.get(lookupValue);
        return row ? row[columnIndex - 1] : 0;
      }},
      MAX(...values) {{
        return Math.max(...values.flat(Infinity).map((value) => toNumber(value)));
      }},
      MIN(...values) {{
        return Math.min(...values.flat(Infinity).map((value) => toNumber(value)));
      }},
      AND(...values) {{
        return values.every(Boolean);
      }},
      OR(...values) {{
        return values.some(Boolean);
      }},
      SUM(...values) {{
        return values.flat(Infinity).reduce((sum, value) => sum + toNumber(value), 0);
      }}
    }};

    return {{
      getCell
    }};
  }}

  const SHEET_BOUNDS = {json.dumps({sheet: data["bounds"] for sheet, data in payload["sheets"].items() if sheet in INCLUDED_SHEETS}, ensure_ascii=False, separators=(",", ":"), sort_keys=True)};

  function calculate(inputOverrides) {{
    const ctx = createContext(inputOverrides);
    const totalDamage = toNumber(ctx.getCell("期望", "C30"));
    const dps = toNumber(ctx.getCell("期望", "C35"));
    const graduationRateRaw = toNumber(ctx.getCell("期望", "C40"));
    return {{
      totalDamage,
      dps,
      graduationRateRaw,
      graduationRate: graduationRateRaw * 100
    }};
  }}

  window.YYSLSYuanNativeWorkbook = {{
    calculate,
    createContext,
    formulaCount: Object.keys(FORMULA_FNS).length
  }};
}})();
"""


def main() -> None:
    payload = json.loads(WORKBOOK_JSON.read_text())
    TARGET.write_text(build_module(payload))
    print(f"Wrote {TARGET}")


if __name__ == "__main__":
    main()
