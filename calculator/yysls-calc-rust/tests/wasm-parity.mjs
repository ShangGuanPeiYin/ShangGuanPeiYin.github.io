import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "../..");
const legacyPath = path.join(repo, "static/tools/yysls-tiaolv/assets/wasm/yysls_calc.wasm");
const nextPath = path.join(root, "dist/yysls_calc_next.wasm");
const metadataPath = path.join(repo, "static/tools/yysls-tiaolv/assets/js/generated-calc-metadata.js");
const stringsPath = path.join(repo, "static/tools/yysls-tiaolv/assets/js/generated-calc-strings.js");

function loadGeneratedData() {
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(stringsPath, "utf8"), context);
  vm.runInContext(fs.readFileSync(metadataPath, "utf8"), context);
  return {
    metadata: context.window.YYSLS_CALC_METADATA,
    strings: context.window.YYSLS_CALC_STRINGS,
  };
}

async function loadWasm(filename) {
  const module = await WebAssembly.instantiate(fs.readFileSync(filename), {});
  return module.instance.exports;
}

function createBuffer(exports, len) {
  return { ptr: exports.yysls_alloc_f64(len), len };
}

function writeBuffer(exports, buffer, values) {
  new Float64Array(exports.memory.buffer, buffer.ptr, buffer.len).set(values);
}

function readBits(exports, buffer) {
  return Array.from(new BigUint64Array(exports.memory.buffer, buffer.ptr, buffer.len));
}

function bitsToHex(value) {
  return `0x${value.toString(16).padStart(16, "0")}`;
}

function assertBitsEqual(label, legacyBits, nextBits, input) {
  if (legacyBits.length !== nextBits.length) {
    throw new Error(`${label}: output length ${legacyBits.length} != ${nextBits.length}`);
  }
  for (let index = 0; index < legacyBits.length; index += 1) {
    if (legacyBits[index] !== nextBits[index]) {
      throw new Error(JSON.stringify({
        label,
        index,
        legacy: bitsToHex(legacyBits[index]),
        next: bitsToHex(nextBits[index]),
        input,
      }));
    }
  }
}

function rng(seed) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

function randomInput(kinds, stringCount, random) {
  const boundaries = [0, 4.6, 6.58, 7, 9.21, 11.66, 13.16, 14, 64.67, 68.8, 72.19, 76.8, 114.12, 121.4];
  return Float64Array.from(kinds.map(kind => {
    if (kind === "str") return Math.floor(random() * stringCount);
    const mode = Math.floor(random() * 4);
    if (mode === 0) return boundaries[Math.floor(random() * boundaries.length)];
    if (mode === 1) return Math.round(random() * 20000) / 100;
    if (mode === 2) return 0;
    return Math.round(random() * 1000000) / 10000;
  }));
}

function edgeInputs(kinds) {
  const numericEdges = [-0, -121.4, Number.MIN_VALUE, Number.MAX_VALUE, Infinity, -Infinity, NaN];
  return numericEdges.map(edge => Float64Array.from(kinds.map(kind => kind === "str" ? 0 : edge)));
}

function assertAbi(legacy, next) {
  for (const name of [
    "yysls_diy_input_len",
    "yysls_panel_len",
    "yysls_class_input_len",
    "yysls_class_output_len",
  ]) {
    const legacyValue = legacy[name]();
    const nextValue = next[name]();
    if (legacyValue !== nextValue) throw new Error(`${name}: ${legacyValue} != ${nextValue}`);
  }
}

function runDiyCase(legacy, next, input, index) {
  const inputLen = legacy.yysls_diy_input_len();
  const outputLen = legacy.yysls_panel_len();
  const legacyInput = createBuffer(legacy, inputLen);
  const legacyOutput = createBuffer(legacy, outputLen);
  const nextInput = createBuffer(next, inputLen);
  const nextOutput = createBuffer(next, outputLen);
  writeBuffer(legacy, legacyInput, input);
  writeBuffer(next, nextInput, input);
  legacy.yysls_calc_diy(legacyInput.ptr, legacyOutput.ptr);
  next.yysls_calc_diy(nextInput.ptr, nextOutput.ptr);
  assertBitsEqual(`diy:${index}`, readBits(legacy, legacyOutput), readBits(next, nextOutput), Array.from(input));
  legacy.yysls_free_f64(legacyInput.ptr, inputLen);
  legacy.yysls_free_f64(legacyOutput.ptr, outputLen);
  next.yysls_free_f64(nextInput.ptr, inputLen);
  next.yysls_free_f64(nextOutput.ptr, outputLen);
}

function runClassCase(legacy, next, flowId, input, index) {
  const inputLen = legacy.yysls_class_input_len();
  const outputLen = legacy.yysls_class_output_len();
  const legacyInput = createBuffer(legacy, inputLen);
  const legacyOutput = createBuffer(legacy, outputLen);
  const nextInput = createBuffer(next, inputLen);
  const nextOutput = createBuffer(next, outputLen);
  writeBuffer(legacy, legacyInput, input);
  writeBuffer(next, nextInput, input);
  legacy.yysls_calc_class_outputs(flowId, legacyInput.ptr, legacyOutput.ptr);
  next.yysls_calc_class_outputs(flowId, nextInput.ptr, nextOutput.ptr);
  assertBitsEqual(`class:${flowId}:${index}`, readBits(legacy, legacyOutput), readBits(next, nextOutput), Array.from(input));

  const legacyValue = legacy.yysls_calc_class(flowId, legacyInput.ptr);
  const nextValue = next.yysls_calc_class(flowId, nextInput.ptr);
  const legacyBits = new BigUint64Array(new Float64Array([legacyValue]).buffer)[0];
  const nextBits = new BigUint64Array(new Float64Array([nextValue]).buffer)[0];
  assertBitsEqual(`class-total:${flowId}:${index}`, [legacyBits], [nextBits], Array.from(input));
  legacy.yysls_free_f64(legacyInput.ptr, inputLen);
  legacy.yysls_free_f64(legacyOutput.ptr, outputLen);
  next.yysls_free_f64(nextInput.ptr, inputLen);
  next.yysls_free_f64(nextOutput.ptr, outputLen);
}

const cases = Number(process.env.YYSLS_PARITY_CASES || 2000);
const seed = Number(process.env.YYSLS_PARITY_SEED || 0x21652c0c);
const { metadata, strings } = loadGeneratedData();
const [legacy, next] = await Promise.all([loadWasm(legacyPath), loadWasm(nextPath)]);
assertAbi(legacy, next);
const random = rng(seed);

runDiyCase(legacy, next, new Float64Array(metadata.diyKinds.length), 0);
edgeInputs(metadata.diyKinds).forEach((input, index) => runDiyCase(legacy, next, input, `edge-${index}`));
for (let index = 1; index <= cases; index += 1) {
  runDiyCase(legacy, next, randomInput(metadata.diyKinds, strings.length, random), index);
}

for (const flowId of Object.values(metadata.flowIds)) {
  const kinds = metadata.flowClassKinds[Object.keys(metadata.flowIds).find(key => metadata.flowIds[key] === flowId)];
  runClassCase(legacy, next, flowId, new Float64Array(metadata.classFields.length), 0);
  edgeInputs(kinds).forEach((source, index) => {
    const input = new Float64Array(metadata.classFields.length);
    input.set(source.subarray(0, input.length));
    runClassCase(legacy, next, flowId, input, `edge-${index}`);
  });
  for (let index = 1; index <= cases; index += 1) {
    const source = randomInput(kinds, strings.length, random);
    const input = new Float64Array(metadata.classFields.length);
    input.set(source.subarray(0, input.length));
    runClassCase(legacy, next, flowId, input, index);
  }
}

console.log(JSON.stringify({ status: "ok", seed, casesPerModule: cases, flows: Object.keys(metadata.flowIds).length }));
