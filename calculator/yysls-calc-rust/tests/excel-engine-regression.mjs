import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const calc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(calc, "../..");
const live = path.join(repo, "static/tools/yysls-tiaolv");

async function makeRunner(bytes) {
  const wasm = (await WebAssembly.instantiate(bytes, {})).instance.exports;
  const classLen = wasm.yysls_class_input_len();
  const outputLen = wasm.yysls_class_output_len();
  if (classLen !== 40 || outputLen !== 5) throw new Error(`ABI mismatch ${classLen}/${outputLen}`);
  const classPtr = wasm.yysls_alloc_f64(classLen);
  const outputPtr = wasm.yysls_alloc_f64(outputLen);
  return {
    outputs(flowId, input) {
      new Float64Array(wasm.memory.buffer, classPtr, classLen).set(input);
      wasm.yysls_calc_class_outputs(flowId, classPtr, outputPtr);
      return Array.from(new BigUint64Array(wasm.memory.buffer, outputPtr, outputLen));
    }
  };
}

function readF64(bits) {
  const buffer = new ArrayBuffer(8);
  new BigUint64Array(buffer)[0] = bits;
  return new Float64Array(buffer)[0];
}

const newContext = { window: {} };
vm.createContext(newContext);
vm.runInContext(fs.readFileSync(path.join(live, "assets/js/generated-calc-strings.js"), "utf8"), newContext);
vm.runInContext(fs.readFileSync(path.join(live, "assets/js/generated-calc-metadata.js"), "utf8"), newContext);
const newMeta = newContext.window.YYSLS_CALC_METADATA;
const newStringIds = newContext.window.YYSLS_CALC_STRING_IDS;

const q7Context = { window: {} };
vm.createContext(q7Context);
vm.runInContext(fs.readFileSync(path.join(live, "assets/engines/q7/generated-calc-strings.js"), "utf8"), q7Context);
vm.runInContext(fs.readFileSync(path.join(live, "assets/engines/q7/generated-calc-metadata.js"), "utf8"), q7Context);
const q7Meta = q7Context.window.YYSLS_CALC_METADATA;

function numericInput(meta, stringIds, flow) {
  return meta.flowClassDefaultValues[flow].map((value, inputIndex) =>
    meta.flowClassKinds[flow][inputIndex] === "str" ? Number(stringIds[value] || 0) : Number(value || 0));
}

const failures = [];
function check(label, condition, detail) {
  if (!condition) failures.push({ label, detail });
}

{
  const flow = "牵丝玉";
  const module = newMeta.flowExcelModules[flow].file;
  const newEngine = await makeRunner(fs.readFileSync(path.join(calc, "dist/excel", module)));
  const q7Engine = await makeRunner(fs.readFileSync(path.join(live, "assets/wasm/q7/yysls_calc.wasm")));
  const q7FlowId = q7Meta.flowIds[flow];
  const newFlowId = newMeta.flowIds[flow];
  if (typeof q7FlowId !== "number") throw new Error(`Q7 缺少流派: ${flow}`);

  const slot = newMeta.flowClassKinds[flow].findIndex((kind, i) => kind !== "str" && i === 4);
  if (slot !== 4) throw new Error(`牵丝玉 slot4 应为数值输入，实际 kind=${newMeta.flowClassKinds[flow][4]}`);

  const newInput = numericInput(newMeta, newStringIds, flow);
  const q7Input = numericInput(q7Meta, q7Context.window.YYSLS_CALC_STRING_IDS, flow);
  const q7Default = q7Engine.outputs(q7FlowId, q7Input);
  const q7Perturbed = q7Engine.outputs(q7FlowId, Float64Array.from(q7Input).map((v, i) => i === slot ? v + 0.01 : v));
  const q7Ratio = readF64(q7Perturbed[0]) / readF64(q7Default[0]);

  const newDefault = newEngine.outputs(newFlowId, newInput);
  const newPerturbed = newEngine.outputs(newFlowId, Float64Array.from(newInput).map((v, i) => i === slot ? v + 0.01 : v));
  const newRatio = readF64(newPerturbed[0]) / readF64(newDefault[0]);

  check("牵丝玉-e5-slot4-接线", Math.abs(newRatio - q7Ratio) / q7Ratio < 1e-3,
    `slot4(+0.01) DPS 倍率 NEW=${newRatio.toFixed(6)} Q7=${q7Ratio.toFixed(6)}`);
  check("牵丝玉-默认-DPS-与-Q7一致", Math.abs(readF64(newDefault[0]) / readF64(q7Default[0]) - 1) < 1e-3,
    `默认 DPS NEW=${readF64(newDefault[0]).toFixed(4)} Q7=${readF64(q7Default[0]).toFixed(4)}`);
}

{
  const flow = "破竹樽";
  const fields = newMeta.flowClassFields[flow];
  const kinds = newMeta.flowClassKinds[flow];
  const cells = newMeta.flowClassCells[flow];
  const values = newMeta.flowClassDefaultValues[flow];
  check("破竹樽-字段数-39", fields.length === 39, `flowClassFields=${fields.length}`);
  check("破竹樽-无-fourth_xinfa", !fields.includes("fourth_xinfa"), `fields=${JSON.stringify(fields)}`);
  check("破竹樽-kinds-39", kinds.length === 39, `flowClassKinds=${kinds.length}`);
  check("破竹樽-cells-39", cells.length === 39, `flowClassCells=${cells.length}`);
  check("破竹樽-defaults-39", values.length === 39, `flowClassDefaultValues=${values.length}`);
  const third = fields.indexOf("third_xinfa");
  check("破竹樽-保留-third_xinfa-于-E22", third >= 0 && cells[third] === "期望!E22",
    `third_xinfa index=${third} cell=${cells[third]}`);
}

if (failures.length) {
  throw new Error("回归失败:\n" + failures.map(f => `- ${f.label}: ${JSON.stringify(f.detail)}`).join("\n"));
}
console.log(JSON.stringify({ status: "ok", test: "excel-engine-regression" }));
