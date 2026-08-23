import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..", "..");
const live = path.join(repo, "static/tools/yysls-tiaolv");
const localBytes = fs.readFileSync(path.join(live, "assets/wasm/q7/yysls_calc.wasm"));
const upstreamBytes = Buffer.from(await fetch("https://yysls.leoq7.com/assets/wasm/yysls_calc.wasm").then(response => {
  if (!response.ok) throw new Error(`Q7 WASM HTTP ${response.status}`);
  return response.arrayBuffer();
}));
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");
const expectedHash = "65e727fa03adc4eefdba59675494549629da72a45ee4c6b1b7b99b519278df35";
if (sha256(localBytes) !== expectedHash || sha256(upstreamBytes) !== expectedHash || !localBytes.equals(upstreamBytes)) throw new Error("Q7 WASM snapshot differs from upstream");
for (const filename of ["generated-calc-strings.js", "generated-calc-metadata.js", "excel-runtime.js"]) {
  const upstream = await fetch(`https://yysls.leoq7.com/assets/js/${filename}`).then(async response => {
    if (!response.ok) throw new Error(`Q7 ${filename} HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  });
  let local = fs.readFileSync(path.join(live, "assets/engines/q7", filename));
  if (filename === "excel-runtime.js") local = Buffer.from(local.toString("utf8")
    .replace("assets/wasm/q7/yysls_calc.wasm", "assets/wasm/yysls_calc.wasm")
    .replace('return num(seasonStats["赛季抗性"]) || 2.45;', 'return num(seasonStats["赛季抗性"]) || 2.15;'));
  if (!local.equals(upstream)) throw new Error(`Q7 ${filename} snapshot differs from upstream`);
}

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(live, "assets/engines/q7/generated-calc-strings.js"), "utf8"), context);
vm.runInContext(fs.readFileSync(path.join(live, "assets/engines/q7/generated-calc-metadata.js"), "utf8"), context);
const metadata = context.window.YYSLS_CALC_METADATA;
const stringCount = context.window.YYSLS_CALC_STRINGS.length;
const cases = Number(process.env.YYSLS_Q7_CASES || 1_000_000);

async function makeRunner(bytes) {
  const wasm = (await WebAssembly.instantiate(bytes, {})).instance.exports;
  const diyLen = wasm.yysls_diy_input_len(), panelLen = wasm.yysls_panel_len();
  const classLen = wasm.yysls_class_input_len(), outputLen = wasm.yysls_class_output_len();
  if (diyLen !== 184 || panelLen !== 37 || classLen !== 40 || outputLen !== 5) throw new Error(`Q7 ABI mismatch ${diyLen}/${panelLen}/${classLen}/${outputLen}`);
  const diyPtr = wasm.yysls_alloc_f64(diyLen), panelPtr = wasm.yysls_alloc_f64(panelLen);
  const classPtr = wasm.yysls_alloc_f64(classLen), outputPtr = wasm.yysls_alloc_f64(outputLen);
  return {
    panel(input) {
      new Float64Array(wasm.memory.buffer, diyPtr, diyLen).set(input);
      wasm.yysls_calc_diy(diyPtr, panelPtr);
      return Array.from(new BigUint64Array(wasm.memory.buffer, panelPtr, panelLen));
    },
    outputs(flowId, input) {
      new Float64Array(wasm.memory.buffer, classPtr, classLen).set(input);
      wasm.yysls_calc_class_outputs(flowId, classPtr, outputPtr);
      return Array.from(new BigUint64Array(wasm.memory.buffer, outputPtr, outputLen));
    }
  };
}

let state = 0x71a0c7e5;
function random() {
  state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
  return (state >>> 0) / 0x100000000;
}
function compare(label, expected, actual, index) {
  for (let i = 0; i < expected.length; i += 1) if (expected[i] !== actual[i]) {
    throw new Error(JSON.stringify({ label, case: index, field: i, expected: expected[i].toString(16), actual: actual[i].toString(16) }));
  }
}

const upstream = await makeRunner(upstreamBytes);
const local = await makeRunner(localBytes);
const diyKinds = metadata.diyKinds.slice(0, 184);
const flowIds = Object.values(metadata.flowIds);
const diy = new Float64Array(184), classInput = new Float64Array(40);
let compared = 0;
for (let index = 0; index < cases; index += 1) {
  for (let i = 0; i < diy.length; i += 1) diy[i] = diyKinds[i] === "str" ? Math.floor(random() * stringCount) : (random() - 0.1) * 800;
  for (let i = 0; i < classInput.length; i += 1) classInput[i] = i === 0 || i === 5 || i >= 38 ? Math.floor(random() * stringCount) : (random() - 0.1) * 8;
  compare("panel", upstream.panel(diy), local.panel(diy), index);
  compare("class", upstream.outputs(flowIds[index % flowIds.length], classInput), local.outputs(flowIds[index % flowIds.length], classInput), index);
  compared += 41;
}
console.log(JSON.stringify({ status: "ok", engine: "q7", wasmHash: expectedHash, cases, comparedFields: compared }));
