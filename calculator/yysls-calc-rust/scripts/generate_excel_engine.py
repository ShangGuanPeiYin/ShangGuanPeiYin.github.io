#!/usr/bin/env python3
from __future__ import annotations

import json
import copy
import gc
import math
import re
import struct
from dataclasses import dataclass
from datetime import timezone
from pathlib import Path

from openpyxl import load_workbook
from openpyxl.formula import Tokenizer
from openpyxl.worksheet.formula import ArrayFormula
from openpyxl.utils.cell import column_index_from_string, coordinate_from_string


ROOT = Path(__file__).resolve().parents[3]
EXCEL_DIR = ROOT / "static/tools/yysls-tiaolv/excels"
METADATA_PATH = ROOT / "static/tools/yysls-tiaolv/assets/js/generated-calc-metadata.js"
STRINGS_PATH = ROOT / "static/tools/yysls-tiaolv/assets/js/generated-calc-strings.js"
DATA_PATH = ROOT / "calculator/yysls-calc-rust/src/generated_excel_data.bin"
MANIFEST_PATH = ROOT / "calculator/yysls-calc-rust/excel-sources.json"

SUPPORTED_FUNCTIONS = {"IF", "IFERROR", "VLOOKUP", "XLOOKUP", "OR", "MIN", "MAX", "SUM"}
FLOW_ORDER = ["牵丝玉", "牵丝翊", "破竹尘", "破竹风", "破竹鸢", "裂石威", "裂石钧", "鸣金虹", "鸣金影", "牵丝霖"]
INPUT_LEN = 40


def load_js_assignment(path: Path, prefix: str):
    text = path.read_text(encoding="utf-8")
    match = re.search(re.escape(prefix) + r"(.*?);\s*(?:\n|$)", text, re.S)
    if not match:
        raise ValueError(f"无法解析 {path}")
    return json.loads(match.group(1))


metadata = load_js_assignment(METADATA_PATH, "window.YYSLS_CALC_METADATA=")
source_metadata = copy.deepcopy(metadata)
strings = load_js_assignment(STRINGS_PATH, "window.YYSLS_CALC_STRINGS=")
string_ids = {value: index for index, value in enumerate(strings)}


def string_id(value: str) -> int:
    if value not in string_ids:
        string_ids[value] = len(strings)
        strings.append(value)
    return string_ids[value]


def f64_literal(value: float) -> str:
    if math.isnan(value):
        return "f64::NAN"
    if math.isinf(value):
        return "f64::INFINITY" if value > 0 else "f64::NEG_INFINITY"
    bits = struct.unpack("<Q", struct.pack("<d", float(value)))[0]
    return f"f64::from_bits(0x{bits:016x})"


@dataclass
class Node:
    kind: str
    value: object = None
    args: list["Node"] | None = None


class FormulaParser:
    def __init__(self, formula: str):
        self.tokens = Tokenizer(formula).items
        self.pos = 0

    def peek(self):
        return self.tokens[self.pos] if self.pos < len(self.tokens) else None

    def take(self):
        token = self.peek()
        if token is None:
            raise ValueError("公式意外结束")
        self.pos += 1
        return token

    def parse(self) -> Node:
        result = self.parse_comparison()
        if self.pos != len(self.tokens):
            raise ValueError(f"公式尾部存在未解析内容：{self.tokens[self.pos:]}")
        return result

    def parse_comparison(self):
        node = self.parse_additive()
        while self.peek() and self.peek().type == "OPERATOR-INFIX" and self.peek().value in ("=", "<", ">=", ">", "<=", "<>"):
            op = self.take().value
            node = Node("binary", op, [node, self.parse_additive()])
        return node

    def parse_additive(self):
        node = self.parse_multiplicative()
        while self.peek() and self.peek().type == "OPERATOR-INFIX" and self.peek().value in ("+", "-"):
            op = self.take().value
            node = Node("binary", op, [node, self.parse_multiplicative()])
        return node

    def parse_multiplicative(self):
        node = self.parse_atom()
        while self.peek() and self.peek().type == "OPERATOR-INFIX" and self.peek().value in ("*", "/"):
            op = self.take().value
            node = Node("binary", op, [node, self.parse_atom()])
        return node

    def parse_atom(self):
        token = self.take()
        if token.type == "PAREN" and token.subtype == "OPEN":
            node = self.parse_comparison()
            close = self.take()
            if close.type != "PAREN" or close.subtype != "CLOSE":
                raise ValueError("括号不匹配")
        elif token.type == "FUNC" and token.subtype == "OPEN":
            name = token.value[:-1].upper().removeprefix("_XLFN.")
            if name not in SUPPORTED_FUNCTIONS:
                raise ValueError(f"不支持的函数：{name}")
            args = []
            if not (self.peek() and self.peek().type == "FUNC" and self.peek().subtype == "CLOSE"):
                while True:
                    args.append(self.parse_comparison())
                    if self.peek() and self.peek().type == "SEP" and self.peek().subtype == "ARG":
                        self.take()
                        continue
                    break
            close = self.take()
            if close.type != "FUNC" or close.subtype != "CLOSE":
                raise ValueError(f"函数 {name} 缺少右括号")
            node = Node("func", name, args)
        elif token.type == "OPERAND":
            if token.subtype == "NUMBER":
                node = Node("number", float(token.value))
            elif token.subtype == "TEXT":
                node = Node("text", token.value[1:-1].replace('""', '"'))
            elif token.subtype == "LOGICAL":
                node = Node("number", 1.0 if token.value.upper() == "TRUE" else 0.0)
            elif token.subtype == "RANGE":
                node = Node("range", token.value)
            else:
                raise ValueError(f"不支持的操作数：{token.value}/{token.subtype}")
        else:
            raise ValueError(f"不支持的公式标记：{token.value}/{token.type}/{token.subtype}")
        while self.peek() and self.peek().type == "OPERATOR-POSTFIX" and self.peek().value == "%":
            self.take()
            node = Node("binary", "/", [node, Node("number", 100.0)])
        return node


class WorkbookCompiler:
    def __init__(self, path: Path, flow_name: str, class_name: str, input_cells: list[str], input_kinds: list[str]):
        self.path = path
        self.flow_name = flow_name
        self.class_name = class_name
        self.workbook = load_workbook(path, data_only=False, read_only=False)
        self.values = load_workbook(path, data_only=True, read_only=True)
        self.sheets = {ws.title: ws for ws in self.workbook.worksheets}
        self.sheet_values = {ws.title: ws for ws in self.values.worksheets}
        self.cells: dict[tuple[str, str], int] = {}
        self.cell_names: list[str] = []
        self.cell_values: list[object] = []
        for ws in self.workbook.worksheets:
            for row in ws.iter_rows():
                for cell in row:
                    if cell.value is not None:
                        self.cells[(ws.title, cell.coordinate)] = len(self.cell_values)
                        self.cell_names.append(f"{ws.title}!{cell.coordinate}")
                        self.cell_values.append(cell.value.text if isinstance(cell.value, ArrayFormula) else cell.value)
        self.input_ids = [self.resolve_single(cell, "期望") for cell in input_cells]
        self.input_kinds = input_kinds
        wanted = set(input_cells) | {"期望!I8", "期望!I10", "期望!I12", "期望!I14", "RD!I14"}
        self.cached_values = {}
        for reference in wanted:
            sheet, address = self.split_ref(reference, "期望")
            self.cached_values[f"{sheet}!{address}"] = self.sheet_values[sheet][address].value
        self.values.close()
        self.sheet_values = {}
        self.lookup_rows = []
        lookup = self.sheets["武学奇术"]
        for row in range(1, lookup.max_row + 1):
            key = lookup.cell(row, 1).value
            if isinstance(key, str) and key:
                self.lookup_rows.append((string_id(key), row))
        self.gain_rows = []
        gain = self.sheets["增益"]
        for row in range(1, gain.max_row + 1):
            key = gain.cell(row, 1).value
            if isinstance(key, str) and key:
                self.gain_rows.append((string_id(key), row))

    def split_ref(self, reference: str, current_sheet: str):
        cleaned = reference.replace("$", "")
        if "!" in cleaned:
            sheet, address = cleaned.rsplit("!", 1)
            sheet = sheet.strip("'").replace("''", "'")
        else:
            sheet, address = current_sheet, cleaned
        return sheet, address

    def resolve_single(self, reference: str, current_sheet: str) -> int | None:
        sheet, address = self.split_ref(reference, current_sheet)
        return self.cells.get((sheet, address))

    def range_ids(self, reference: str, current_sheet: str):
        sheet, address = self.split_ref(reference, current_sheet)
        ws = self.sheets[sheet]
        left, right = address.split(":", 1)
        if re.fullmatch(r"[A-Z]+", left) and re.fullmatch(r"[A-Z]+", right):
            min_col, max_col = column_index_from_string(left), column_index_from_string(right)
            min_row, max_row = 1, ws.max_row
        else:
            lcol, lrow = coordinate_from_string(left)
            rcol, rrow = coordinate_from_string(right)
            min_col, max_col = column_index_from_string(lcol), column_index_from_string(rcol)
            min_row, max_row = lrow, rrow
        result = []
        for row in range(min_row, max_row + 1):
            for col in range(min_col, max_col + 1):
                cell_id = self.cells.get((sheet, ws.cell(row, col).coordinate))
                if cell_id is not None:
                    result.append(cell_id)
        return result

    def expr(self, node: Node, current_sheet: str) -> str:
        if node.kind == "number":
            return f64_literal(node.value)
        if node.kind == "text":
            return f64_literal(float(string_id(node.value)))
        if node.kind == "range":
            if ":" in str(node.value):
                raise ValueError(f"范围只能作为函数参数：{node.value}")
            cell_id = self.resolve_single(str(node.value), current_sheet)
            return "0.0" if cell_id is None else f"self.cell({cell_id})"
        if node.kind == "binary":
            left = self.expr(node.args[0], current_sheet)
            right = self.expr(node.args[1], current_sheet)
            if node.value in ("+", "-", "*", "/"):
                return f"({left} {node.value} {right})"
            cmp = {"=": "==", "<>": "!=", "<": "<", ">": ">", "<=": "<=", ">=": ">="}[node.value]
            return f"if {left} {cmp} {right} {{ 1.0 }} else {{ 0.0 }}"
        if node.kind == "func":
            name = node.value
            if name == "IF":
                if len(node.args) != 3:
                    raise ValueError("IF参数数量必须为3")
                return f"if {self.expr(node.args[0], current_sheet)} != 0.0 {{ {self.expr(node.args[1], current_sheet)} }} else {{ {self.expr(node.args[2], current_sheet)} }}"
            if name == "OR":
                return "if " + " || ".join(f"{self.expr(arg, current_sheet)} != 0.0" for arg in node.args) + " { 1.0 } else { 0.0 }"
            if name in ("MIN", "MAX"):
                method = "min" if name == "MIN" else "max"
                parts = [self.expr(arg, current_sheet) for arg in node.args]
                result = parts[0]
                for part in parts[1:]:
                    result = f"({result}).{method}({part})"
                return result
            if name == "SUM":
                parts = []
                for arg in node.args:
                    if arg.kind == "range" and ":" in str(arg.value):
                        parts.extend(f"self.cell({cell_id})" for cell_id in self.range_ids(str(arg.value), current_sheet))
                    else:
                        parts.append(self.expr(arg, current_sheet))
                return "(" + " + ".join(parts or ["0.0"]) + ")"
            if name == "VLOOKUP":
                if len(node.args) != 4 or node.args[1].kind != "range" or node.args[2].kind != "number" or node.args[3].kind != "number" or node.args[3].value != 0:
                    raise ValueError("仅支持精确匹配VLOOKUP")
                key = self.expr(node.args[0], current_sheet)
                col = int(node.args[2].value)
                return f"self.vlookup({key}, {col})"
        raise ValueError(f"无法生成表达式：{node}")

    def cell_arm(self, cell_id: int):
        value = self.cell_values[cell_id]
        if isinstance(value, str) and value.startswith("="):
            parser = FormulaParser(value)
            node = parser.parse()
            sheet = next(sheet for (sheet, address), found in self.cells.items() if found == cell_id)
            return self.expr(node, sheet)
        if isinstance(value, bool):
            return "1.0" if value else "0.0"
        if isinstance(value, (int, float)):
            return f64_literal(float(value))
        if isinstance(value, str):
            return f64_literal(float(string_id(value)))
        return "0.0"

    def defaults(self):
        result = []
        for cell_id, kind in zip(self.input_ids, self.input_kinds):
            value = 0 if cell_id is None else self.cell_values[cell_id]
            if kind == "str":
                result.append(str(value or ""))
            elif isinstance(value, (int, float)):
                result.append(float(value))
            else:
                cached = 0 if cell_id is None else self.cached_values.get(self.cell_names[cell_id])
                result.append(float(cached or 0))
        return result

    def cached(self, sheet: str, address: str) -> float:
        value = self.cached_values.get(f"{sheet}!{address}")
        if not isinstance(value, (int, float)) or not math.isfinite(float(value)):
            raise ValueError(f"{self.path.name} {sheet}!{address} 没有有效缓存值：{value!r}")
        return float(value)

    def rust(self, index: int) -> str:
        arms = [f"            {cell_id} => {self.cell_arm(cell_id)}," for cell_id in range(len(self.cell_values))]
        input_initializers = []
        for input_index, cell_id in enumerate(self.input_ids):
            if cell_id is not None:
                input_initializers.append(f"        engine.set_input({cell_id}, input.get({input_index}).copied().unwrap_or(0.0));")
        lookup_arms = []
        for key_id, row in self.lookup_rows:
            column_arms = []
            for col in (30, 31):
                cell_id = self.cells.get(("武学奇术", self.sheets["武学奇术"].cell(row, col).coordinate))
                column_arms.append(f"                    {col} => {'0.0' if cell_id is None else f'self.cell({cell_id})'},")
            lookup_arms.append(f"            x if x == {f64_literal(float(key_id))} => match col {{\n" + "\n".join(column_arms) + "\n                    _ => 0.0,\n                },")
        output_ids = [self.resolve_single(ref, "期望") for ref in ("I10", "I12", "I16", "I14")]
        if any(cell_id is None for cell_id in output_ids):
            raise ValueError(f"{self.path.name} 缺少标准输出单元格")
        rd_baseline = self.cached("RD", "I14")
        return f"""
struct Engine{index} {{ cache: Vec<f64>, state: Vec<u8> }}
impl Engine{index} {{
    fn new() -> Self {{ Self {{ cache: vec![0.0; {len(self.cell_values)}], state: vec![0; {len(self.cell_values)}] }} }}
    fn set_input(&mut self, id: usize, value: f64) {{ self.cache[id] = value; self.state[id] = 2; }}
    fn cell(&mut self, id: usize) -> f64 {{
        if self.state[id] == 2 {{ return self.cache[id]; }}
        if self.state[id] == 1 {{ panic!("Excel公式循环引用"); }}
        self.state[id] = 1;
        let value = match id {{
{chr(10).join(arms)}
            _ => 0.0,
        }};
        self.cache[id] = value;
        self.state[id] = 2;
        value
    }}
    fn vlookup(&mut self, key: f64, col: usize) -> f64 {{
        match key {{
{chr(10).join(lookup_arms)}
            _ => 0.0,
        }}
    }}
}}

fn calculate_{index}(input: &[f64], output: &mut [f64]) {{
    let mut engine = Engine{index}::new();
{chr(10).join(input_initializers)}
    let total = engine.cell({output_ids[0]});
    let adps = engine.cell({output_ids[1]});
    let graduation = engine.cell({output_ids[2]});
    let rdps = engine.cell({output_ids[3]});
    output[0] = total;
    output[1] = adps;
    output[2] = graduation;
    output[3] = rdps;
    output[4] = rdps / {f64_literal(rd_baseline)};
}}
"""

    def bytecode(self, node: Node, current_sheet: str) -> bytes:
        def ref(cell_id: int | None):
            return b"\x00" + struct.pack("<d", 0.0) if cell_id is None else b"\x01" + struct.pack("<I", cell_id)

        if node.kind == "number":
            return b"\x00" + struct.pack("<d", float(node.value))
        if node.kind == "text":
            return b"\x00" + struct.pack("<d", float(string_id(str(node.value))))
        if node.kind == "range":
            if ":" in str(node.value):
                raise ValueError(f"范围只能作为函数参数：{node.value}")
            return ref(self.resolve_single(str(node.value), current_sheet))
        if node.kind == "binary":
            op = {"+": 2, "-": 3, "*": 4, "/": 5, "=": 6, "<>": 7, "<": 8, ">": 9, "<=": 10, ">=": 11}[str(node.value)]
            return self.bytecode(node.args[0], current_sheet) + self.bytecode(node.args[1], current_sheet) + bytes([op])
        if node.kind == "func":
            name = str(node.value)
            if name == "IF":
                return b"".join(self.bytecode(arg, current_sheet) for arg in node.args) + b"\x0c"
            if name == "IFERROR":
                if len(node.args) != 2:
                    raise ValueError("IFERROR参数数量必须为2")
                return self.bytecode(node.args[0], current_sheet)
            if name == "OR":
                code = self.bytecode(node.args[0], current_sheet)
                for arg in node.args[1:]:
                    code += self.bytecode(arg, current_sheet) + b"\x0d"
                return code
            if name in ("MIN", "MAX"):
                opcode = b"\x0e" if name == "MIN" else b"\x0f"
                code = self.bytecode(node.args[0], current_sheet)
                for arg in node.args[1:]:
                    code += self.bytecode(arg, current_sheet) + opcode
                return code
            if name == "SUM":
                items = []
                for arg in node.args:
                    if arg.kind == "func" and arg.value == "XLOOKUP":
                        lookup_value, lookup_array, return_array, default = arg.args
                        if lookup_value.kind != "range" or lookup_array.kind != "range" or return_array.kind != "range":
                            raise ValueError("仅支持范围形式XLOOKUP")
                        lookup_sheet, lookup_address = self.split_ref(str(lookup_array.value), current_sheet)
                        return_sheet, return_address = self.split_ref(str(return_array.value), current_sheet)
                        if lookup_sheet != "增益" or return_sheet != "增益" or lookup_address.replace("$", "") != "A:A":
                            raise ValueError("XLOOKUP仅支持增益表A列检索")
                        return_col = column_index_from_string(return_address.replace("$", "").split(":", 1)[0])
                        for cell_id in self.range_ids(str(lookup_value.value), current_sheet):
                            items.append(ref(cell_id) + self.bytecode(default, current_sheet) + b"\x12" + bytes([return_col]))
                        continue
                    if arg.kind == "range" and ":" in str(arg.value):
                        for cell_id in self.range_ids(str(arg.value), current_sheet):
                            value = self.cell_values[cell_id]
                            if isinstance(value, (int, float)) and not isinstance(value, bool) or isinstance(value, str) and value.startswith("="):
                                items.append(ref(cell_id))
                    else:
                        items.append(self.bytecode(arg, current_sheet))
                if not items:
                    return b"\x00" + struct.pack("<d", 0.0)
                code = items[0]
                for item in items[1:]:
                    code += item + b"\x02"
                return code
            if name == "VLOOKUP":
                if len(node.args) != 4 or node.args[1].kind != "range" or node.args[2].kind != "number" or node.args[3].kind != "number" or node.args[3].value != 0:
                    raise ValueError("仅支持精确匹配VLOOKUP")
                col = int(node.args[2].value)
                table_sheet, table_address = self.split_ref(str(node.args[1].value), current_sheet)
                if table_sheet == "武学奇术" and table_address.replace("$", "") == "A:ZZ":
                    return self.bytecode(node.args[0], current_sheet) + b"\x10" + bytes([col])
                left, right = table_address.replace("$", "").split(":", 1)
                lcol, lrow = coordinate_from_string(left)
                rcol, rrow = coordinate_from_string(right)
                first_col = column_index_from_string(lcol)
                width = column_index_from_string(rcol) - first_col + 1
                rows = rrow - lrow + 1
                if col > width:
                    raise ValueError("VLOOKUP返回列超出范围")
                pairs = []
                for row in range(rows):
                    excel_row = lrow + row
                    key_address = self.sheets[table_sheet].cell(excel_row, first_col).coordinate
                    value_address = self.sheets[table_sheet].cell(excel_row, first_col + col - 1).coordinate
                    key_id = self.cells.get((table_sheet, key_address))
                    value_id = self.cells.get((table_sheet, value_address))
                    pairs.append((key_id, value_id))
                payload = bytearray(self.bytecode(node.args[0], current_sheet))
                payload.extend(b"\x11" + struct.pack("<H", len(pairs)))
                for key_id, value_id in pairs:
                    payload.extend(struct.pack("<II", key_id if key_id is not None else 0xFFFFFFFF, value_id if value_id is not None else 0xFFFFFFFF))
                return bytes(payload)
            if name == "XLOOKUP":
                raise ValueError("XLOOKUP必须位于SUM内")
        raise ValueError(f"无法生成字节码：{node}")

    def cell_code(self, cell_id: int) -> bytes:
        value = self.cell_values[cell_id]
        if isinstance(value, str) and value.startswith("="):
            node = FormulaParser(value).parse()
            sheet = next(sheet for (sheet, _), found in self.cells.items() if found == cell_id)
            return self.bytecode(node, sheet)
        if isinstance(value, bool):
            numeric = 1.0 if value else 0.0
        elif isinstance(value, (int, float)):
            numeric = float(value)
        elif isinstance(value, str):
            numeric = float(string_id(value))
        else:
            numeric = 0.0
        return b"\x00" + struct.pack("<d", numeric)

    def binary_section(self) -> bytes:
        code = bytearray()
        records = []
        for cell_id in range(len(self.cell_values)):
            fragment = self.cell_code(cell_id)
            records.append((len(code), len(fragment)))
            code.extend(fragment)
        output_ids = [self.resolve_single(ref, "期望") for ref in ("I10", "I12", "I16", "I14")]
        if any(cell_id is None for cell_id in output_ids):
            raise ValueError(f"{self.path.name} 缺少标准输出单元格")
        out = bytearray()
        out.extend(struct.pack("<IIIII", len(self.cell_values), len(code), INPUT_LEN, len(self.lookup_rows), len(self.gain_rows)))
        out.extend(struct.pack("<IIII", *output_ids))
        out.extend(struct.pack("<d", self.cached("RD", "I14")))
        padded_inputs = [(cell_id if cell_id is not None else 0xFFFFFFFF) for cell_id in self.input_ids]
        padded_inputs.extend([0xFFFFFFFF] * (INPUT_LEN - len(padded_inputs)))
        out.extend(struct.pack("<" + "I" * INPUT_LEN, *padded_inputs))
        for offset, length in records:
            out.extend(struct.pack("<II", offset, length))
        for key_id, row in self.lookup_rows:
            out.extend(struct.pack("<d", float(key_id)))
            ids = []
            for col in range(1, 32):
                cell_id = self.cells.get(("武学奇术", self.sheets["武学奇术"].cell(row, col).coordinate))
                ids.append(cell_id if cell_id is not None else 0xFFFFFFFF)
            out.extend(struct.pack("<" + "I" * 31, *ids))
        for key_id, row in self.gain_rows:
            out.extend(struct.pack("<d", float(key_id)))
            ids = []
            for col in range(1, 24):
                cell_id = self.cells.get(("增益", self.sheets["增益"].cell(row, col).coordinate))
                ids.append(cell_id if cell_id is not None else 0xFFFFFFFF)
            out.extend(struct.pack("<" + "I" * 23, *ids))
        out.extend(code)
        return bytes(out)


def workbook_specs():
    files = sorted(EXCEL_DIR.glob("*.xlsx"))
    specs = []
    for class_name in FLOW_ORDER:
        matches = [path for path in files if path.name.startswith(class_name + "110阶")]
        if class_name == "牵丝翊":
            matches.sort(key=lambda path: ("2.0" not in path.stem, path.name))
        if not matches:
            raise ValueError(f"缺少流派Excel：{class_name}")
        for path in matches:
            version_match = re.search(r"计算器([0-9.]+)\.xlsx$", path.name)
            if not version_match:
                raise ValueError(f"文件名缺少版本号：{path.name}")
            version = version_match.group(1)
            flow_name = f"{class_name}@{version}" if class_name == "牵丝翊" else class_name
            specs.append((class_name, flow_name, version, path))
    if len(specs) != 11:
        raise ValueError(f"必须恰好有11份Excel，实际为{len(specs)}")
    return specs


specs = workbook_specs()
records = []
sections = []
for class_name, flow_name, version, path in specs:
    base_key = class_name if class_name in source_metadata["flowClassFields"] else next(
        key for key, mapped in source_metadata.get("flowClassNames", {}).items() if mapped == class_name
    )
    base_fields = source_metadata["flowClassFields"][base_key]
    base_kinds = source_metadata["flowClassKinds"][base_key]
    base_cells = list(source_metadata["flowClassCells"][base_key])
    # 破竹鸢 2.4 将第三、第四心法输入由 C22/C24 移到了 E22/E24。
    # 字段名称保持公开 API 兼容，但单元格位置必须以当前工作簿为准。
    if class_name == "破竹鸢" and version == "2.4":
        base_cells[base_fields.index("third_xinfa")] = "期望!E22"
        base_cells[base_fields.index("fourth_xinfa")] = "期望!E24"
    compiler = WorkbookCompiler(path, flow_name, class_name, base_cells, base_kinds)
    sections.append(compiler.binary_section())
    records.append((class_name, flow_name, version, path, list(base_fields), list(base_kinds),
                    [compiler.cell_names[cell_id] if cell_id is not None else base_cells[i]
                     for i, cell_id in enumerate(compiler.input_ids)],
                    compiler.defaults(), compiler.workbook.properties.modified,
                    compiler.cached("期望", "I10"), compiler.cached("期望", "I8"),
                    compiler.cached("期望", "I12"), compiler.cached("期望", "I14")))
    compiler.workbook.close()
    del compiler
    gc.collect()
header_size = 12 + 4 * len(sections)
offsets = []
cursor = header_size
for section in sections:
    offsets.append(cursor)
    cursor += len(section)
binary = bytearray(b"YEXL")
binary.extend(struct.pack("<II", 1, len(sections)))
binary.extend(struct.pack("<" + "I" * len(offsets), *offsets))
for section in sections:
    binary.extend(section)
DATA_PATH.write_bytes(binary)

for key in ("flowIds", "flowKeys", "flowClassNames", "flowClassFields", "flowClassKinds", "flowClassCells", "flowClassDefaultValues", "classRotationStats"):
    metadata[key] = {}
metadata["flowNames"] = []
metadata["classTableVersions"] = {"牵丝翊": []}

manifest = {"inputLength": INPUT_LEN, "outputLength": 5, "workbooks": []}
for index, record in enumerate(records):
    (class_name, flow_name, version, path, fields, kinds, cells, defaults, modified,
     baseline_total, use_time, baseline_dps, baseline_rdps) = record
    update_time = modified.replace(tzinfo=timezone.utc).astimezone().strftime("%Y年%-m月%-d日 %H:%M:%S") if modified else ""
    metadata["flowIds"][flow_name] = index
    metadata["flowKeys"][flow_name] = f"excel_{index}"
    metadata["flowClassNames"][flow_name] = class_name
    metadata["flowNames"].append(flow_name)
    metadata["flowClassFields"][flow_name] = fields
    metadata["flowClassKinds"][flow_name] = kinds
    metadata["flowClassCells"][flow_name] = cells
    metadata["flowClassDefaultValues"][flow_name] = defaults
    metadata["classRotationStats"][flow_name] = {
        "baseline": baseline_total, "baselineTotal": baseline_total,
        "useTime": use_time, "dps": baseline_dps, "baselineDps": baseline_dps,
        "baselineRdps": baseline_rdps, "version": path.stem, "updateTime": update_time,
    }
    if class_name != "牵丝翊":
        metadata["classRotationStats"][class_name] = metadata["classRotationStats"][flow_name]
    else:
        metadata["classTableVersions"][class_name].append({
            "key": version, "label": version, "flowName": flow_name, "default": version == "2.0"
        })
    manifest["workbooks"].append({
        "id": index, "className": class_name, "flowName": flow_name, "version": version,
        "file": path.name, "inputs": len(fields), "baselineTotal": baseline_total,
        "baselineDps": baseline_dps, "baselineRdps": baseline_rdps, "useTime": use_time,
    })

metadata["classDefaultValues"] = {name: metadata["flowClassDefaultValues"][name] for name in FLOW_ORDER if name in metadata["flowClassDefaultValues"]}
metadata["classDefaultValues"]["牵丝翊"] = metadata["flowClassDefaultValues"]["牵丝翊@2.0"]
METADATA_PATH.write_text("// Generated from calculator workbooks. Do not edit by hand.\nwindow.YYSLS_CALC_METADATA=" + json.dumps(metadata, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
STRINGS_PATH.write_text("// Generated from calculator workbooks. Do not edit by hand.\nwindow.YYSLS_CALC_STRINGS=" + json.dumps(strings, ensure_ascii=False, separators=(",", ":")) + ";\nwindow.YYSLS_CALC_STRING_IDS=" + json.dumps(string_ids, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")
MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps({"status": "ok", "workbooks": len(records), "strings": len(strings)}, ensure_ascii=False))
