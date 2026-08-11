import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const calc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(calc, "../..");
const live = path.join(repo, "static/tools/yysls-tiaolv");
const legacyPath = path.join(live, "assets/wasm/yysls_excel.wasm");
const metadataPath = path.join(live, "assets/js/generated-calc-metadata.js");
const stringsPath = path.join(live, "assets/js/generated-calc-strings.js");
const selectedFlow = process.env.YYSLS_DIRECT_PARITY_FLOW || "";
const legacyMismatchFlows = new Set(["破竹鸢"]);
const fixture = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(calc, "tests/fixtures/excel-legacy-v1.json.gz"))));
const minimumOverallSpeedup = Number(process.env.YYSLS_MIN_SPEEDUP || 3.5);
const minimumFlowSpeedup = Number(process.env.YYSLS_MIN_FLOW_SPEEDUP || 1.8);

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(stringsPath, "utf8"), context);
vm.runInContext(fs.readFileSync(metadataPath, "utf8"), context);
const metadata = context.window.YYSLS_CALC_METADATA;
const stringCount = context.window.YYSLS_CALC_STRINGS.length;

async function instantiate(filename) {
  return (await WebAssembly.instantiate(fs.readFileSync(filename), {})).instance.exports;
}

function runner(wasm, flowId) {
  const inputLen = wasm.yysls_class_input_len();
  const outputLen = wasm.yysls_class_output_len();
  if (inputLen !== 40 || outputLen !== 5) throw new Error(`ABI mismatch ${inputLen}/${outputLen}`);
  const inputPtr = wasm.yysls_alloc_f64(inputLen);
  const outputPtr = wasm.yysls_alloc_f64(outputLen);
  return input => {
    new Float64Array(wasm.memory.buffer, inputPtr, inputLen).set(input);
    wasm.yysls_calc_class_outputs(flowId, inputPtr, outputPtr);
    return Array.from(new BigUint64Array(wasm.memory.buffer, outputPtr, outputLen));
  };
}

function random(seedValue) {
  let state = seedValue >>> 0;
  return () => {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function assertBits(flow, index, expected, actual, input) {
  for (let i = 0; i < 5; i += 1) {
    if (expected[i] !== actual[i]) throw new Error(JSON.stringify({ flow, case: index, output: i, expected: expected[i].toString(16), actual: actual[i].toString(16), input }));
  }
}

const legacy = fs.existsSync(legacyPath) ? await instantiate(legacyPath) : null;
let compared = 0;
let legacyMs = 0;
let directMs = 0;
for (const [flow, flowId] of Object.entries(metadata.flowIds)) {
  if (selectedFlow && flow !== selectedFlow) continue;
  if (legacyMismatchFlows.has(flow)) continue;
  const info = metadata.flowExcelModules[flow];
  const direct = await instantiate(path.join(calc, "dist/excel", info.file));
  const runLegacy = legacy ? runner(legacy, flowId) : null;
  const runDirect = runner(direct, flowId);
  let flowLegacyMs = 0;
  let flowDirectMs = 0;
  const corpus = fixture.flows[flow];
  for (let index = 0; index < corpus.length; index += 1) {
    const { input, bits } = corpus[index];
    const expected = bits.map(value => BigInt(`0x${value}`));
    if (runLegacy) {
      const startLegacy = performance.now();
      assertBits(flow, index, expected, runLegacy(input), input);
      const elapsed = performance.now() - startLegacy;
      legacyMs += elapsed;
      flowLegacyMs += elapsed;
    }
    const startDirect = performance.now();
    const actual = runDirect(input);
    const directElapsed = performance.now() - startDirect;
    directMs += directElapsed;
    flowDirectMs += directElapsed;
    assertBits(flow, index, expected, actual, input);
    compared += 1;
  }
  if (legacy && flowLegacyMs / flowDirectMs < minimumFlowSpeedup && process.env.YYSLS_SKIP_SPEED_GATE !== "1") throw new Error(`${flow} direct engine speedup ${(flowLegacyMs / flowDirectMs).toFixed(2)}x is below ${minimumFlowSpeedup}x`);
}
const speedup = legacyMs / directMs;
if (legacy && speedup < minimumOverallSpeedup && process.env.YYSLS_SKIP_SPEED_GATE !== "1") throw new Error(`direct engine speedup ${speedup.toFixed(2)}x is below ${minimumOverallSpeedup}x`);
console.log(JSON.stringify({ status: "ok", flows: selectedFlow ? 1 : Object.keys(metadata.flowIds).length - legacyMismatchFlows.size, compared, seed: fixture.seed, legacyMs, directMs, speedup: legacy ? speedup : null }));
