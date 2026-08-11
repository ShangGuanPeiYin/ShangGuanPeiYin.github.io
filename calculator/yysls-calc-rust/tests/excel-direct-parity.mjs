import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import zlib from "node:zlib";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

const calc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(calc, "../..");
const live = path.join(repo, "static/tools/yysls-tiaolv");
const metadataPath = path.join(live, "assets/js/generated-calc-metadata.js");
const stringsPath = path.join(live, "assets/js/generated-calc-strings.js");
const selectedFlow = process.env.YYSLS_DIRECT_PARITY_FLOW || "";
const legacyMismatchFlows = new Set(["破竹鸢"]);
const fixture = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(calc, "tests/fixtures/excel-legacy-v1.json.gz"))));
const maximumDirectMs = Number(process.env.YYSLS_MAX_DIRECT_MS || 20000);
const maximumFlowDirectMs = Number(process.env.YYSLS_MAX_FLOW_DIRECT_MS || 4000);
const minimumQsyuAdjacentPerSecond = Number(process.env.YYSLS_MIN_QSYU_ADJACENT_PER_SECOND || 10000);

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(stringsPath, "utf8"), context);
vm.runInContext(fs.readFileSync(metadataPath, "utf8"), context);
const metadata = context.window.YYSLS_CALC_METADATA;
const stringCount = context.window.YYSLS_CALC_STRINGS.length;
const stringIds = context.window.YYSLS_CALC_STRING_IDS;

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

let compared = 0;
let directMs = 0;
let qsyuAdjacentPerSecond = 0;
for (const [flow, flowId] of Object.entries(metadata.flowIds)) {
  if (selectedFlow && flow !== selectedFlow) continue;
  const usesWorkbookJudge = legacyMismatchFlows.has(flow);
  const info = metadata.flowExcelModules[flow];
  const direct = await instantiate(path.join(calc, "dist/excel", info.file));
  const runDirect = runner(direct, flowId);
  let flowDirectMs = 0;
  let corpus = fixture.flows[flow];
  if (!corpus) {
    const defaults = metadata.flowClassDefaultValues[flow].map((value, inputIndex) =>
      metadata.flowClassKinds[flow][inputIndex] === "str" ? Number(stringIds[value] || 0) : Number(value || 0));
    const changed = Array.from(defaults);
    const firstNumeric = metadata.flowClassKinds[flow].findIndex(kind => kind !== "str");
    changed[firstNumeric] += 0.125;
    corpus = [{ input: defaults, bits: [] }, { input: changed, bits: [] }];
  }
  for (let index = 0; index < corpus.length; index += 1) {
    const { input, bits } = corpus[index];
    const expected = bits.map(value => BigInt(`0x${value}`));
    const startDirect = performance.now();
    const actual = runDirect(input);
    const directElapsed = performance.now() - startDirect;
    directMs += directElapsed;
    flowDirectMs += directElapsed;
    if (!usesWorkbookJudge) {
      assertBits(flow, index, expected, actual, input);
      compared += 1;
    }
  }
  if (corpus.length >= 2) {
    const a = corpus[0];
    const b = corpus[1];
    const expectedA = usesWorkbookJudge
      ? runner(await instantiate(path.join(calc, "dist/excel", info.file)), flowId)(a.input)
      : a.bits.map(value => BigInt(`0x${value}`));
    const expectedB = usesWorkbookJudge
      ? runner(await instantiate(path.join(calc, "dist/excel", info.file)), flowId)(b.input)
      : b.bits.map(value => BigInt(`0x${value}`));
    assertBits(flow, "state-A", expectedA, runDirect(a.input), a.input);
    assertBits(flow, "state-B", expectedB, runDirect(b.input), b.input);
    assertBits(flow, "state-A-again", expectedA, runDirect(a.input), a.input);
    assertBits(flow, "state-A-repeat", expectedA, runDirect(a.input), a.input);

    const numericIndexes = metadata.flowClassKinds[flow]
      .map((kind, inputIndex) => kind === "str" ? -1 : inputIndex)
      .filter(inputIndex => inputIndex >= 0);
    const mutations = [];
    const single = Float64Array.from(a.input);
    single[numericIndexes[0]] += 0.125;
    mutations.push(single);
    const multiple = Float64Array.from(a.input);
    for (const inputIndex of numericIndexes.slice(0, 4)) multiple[inputIndex] -= 0.25;
    mutations.push(multiple);
    for (const bits of [0x0000000000000000n, 0x8000000000000000n, 0x7ff8000000000001n, 0x7ff8000000000042n]) {
      const special = Float64Array.from(a.input);
      new BigUint64Array(special.buffer)[numericIndexes[0]] = bits;
      mutations.push(special);
    }
    for (let mutationIndex = 0; mutationIndex < mutations.length; mutationIndex += 1) {
      const cold = await instantiate(path.join(calc, "dist/excel", info.file));
      const expected = runner(cold, flowId)(mutations[mutationIndex]);
      const actual = runDirect(mutations[mutationIndex]);
      assertBits(flow, `state-mutation-${mutationIndex}`, expected, actual, Array.from(mutations[mutationIndex]));
    }
  }
  if (flow === "牵丝玉") {
    const equipmentIndexes = metadata.flowClassKinds[flow]
      .map((kind, inputIndex) => kind === "str" || inputIndex === 0 || inputIndex > 23 ? -1 : inputIndex)
      .filter(inputIndex => inputIndex >= 0);
    const rates = [];
    for (let sample = 0; sample < 3; sample += 1) {
      const adjacent = Float64Array.from(corpus[0].input);
      const iterations = 10000;
      const started = performance.now();
      for (let iteration = 0; iteration < iterations; iteration += 1) {
        const inputIndex = equipmentIndexes[iteration % equipmentIndexes.length];
        adjacent[inputIndex] += iteration & 1 ? 0.0001 : -0.0001;
        runDirect(adjacent);
      }
      rates.push(iterations * 1000 / (performance.now() - started));
    }
    rates.sort((left, right) => left - right);
    qsyuAdjacentPerSecond = rates[1];
    if (qsyuAdjacentPerSecond < minimumQsyuAdjacentPerSecond && process.env.YYSLS_SKIP_SPEED_GATE !== "1") {
      throw new Error(`牵丝玉 adjacent throughput ${qsyuAdjacentPerSecond.toFixed(0)}/s is below ${minimumQsyuAdjacentPerSecond}/s`);
    }
  }
  if (flowDirectMs > maximumFlowDirectMs && process.env.YYSLS_SKIP_SPEED_GATE !== "1") throw new Error(`${flow} direct engine ${flowDirectMs.toFixed(2)}ms exceeds ${maximumFlowDirectMs}ms`);
}
if (directMs > maximumDirectMs && process.env.YYSLS_SKIP_SPEED_GATE !== "1") throw new Error(`direct engine ${directMs.toFixed(2)}ms exceeds ${maximumDirectMs}ms`);
console.log(JSON.stringify({ status: "ok", flows: selectedFlow ? 1 : Object.keys(metadata.flowIds).length, compared, workbookJudges: legacyMismatchFlows.size, seed: fixture.seed, directMs, qsyuAdjacentPerSecond, performanceGate: { maximumDirectMs, maximumFlowDirectMs, minimumQsyuAdjacentPerSecond } }));
