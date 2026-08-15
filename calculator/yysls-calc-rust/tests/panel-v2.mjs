import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "../..");
const wasm = (await WebAssembly.instantiate(fs.readFileSync(path.join(root, "dist/yysls_panel.wasm")), {})).instance.exports;
const stringsSource = fs.readFileSync(path.resolve(root, "../../static/tools/yysls-tiaolv/assets/js/generated-calc-strings.js"), "utf8");
const strings = JSON.parse(stringsSource.match(/YYSLS_CALC_STRINGS=(\[[\s\S]*?\]);\s*window\.YYSLS_CALC_STRING_IDS/)[1]);
const id = value => strings.indexOf(value);

if (wasm.yysls_diy_input_len() !== 202 || wasm.yysls_panel_len() !== 36) throw new Error("unexpected panel ABI");

function calculate(mutator = () => {}) {
  const inputPtr = wasm.yysls_alloc_f64(202);
  const outputPtr = wasm.yysls_alloc_f64(36);
  const input = new Float64Array(wasm.memory.buffer, inputPtr, 202);
  input[54] = id("通用");
  mutator(input);
  wasm.yysls_calc_diy(inputPtr, outputPtr);
  return [...new Float64Array(wasm.memory.buffer, outputPtr, 36)];
}

function close(actual, expected, label, tolerance = 1e-10) {
  if (Math.abs(actual - expected) > tolerance) throw new Error(`${label}: ${actual} != ${expected}`);
}
const round = (value, digits = 4) => Math.round(value * 10 ** digits) / 10 ** digits;

const naked = calculate();
close(naked[0], 930 + 0.9 * 283 + 0.22 * 283 + 186, "naked min external");
close(naked[1], 1688.4 + 0.9 * 283 + 1.36 * 283 + 373, "naked max external");
close(naked[2], round(65 + (110.1 - 65) / 2.45) / 100, "naked accuracy");
close(naked[3], round((24 + 0.076 * 283) / 2.45) / 100, "naked critical");
close(naked[6], round((12 + 0.038 * 283) / 2.45) / 100, "naked insight");

const gold = calculate(input => { input[184] = 1; input[186] = 1; input[187] = 1; });
close(gold[0] - naked[0], 233, "gold weapon+ring min fixed");
close(gold[1] - naked[1], 431, "gold weapon+pendant max fixed");
const purple = calculate(input => { input[184] = 1; input[186] = 1; input[187] = 1; input[192] = 1; input[194] = 1; input[195] = 1; });
close(purple[0] - naked[0], 210, "purple weapon+ring min fixed");
close(purple[1] - naked[1], 388, "purple weapon+pendant max fixed");

const ysg = calculate(input => { input[10] = id("易水歌"); });
close(ysg[0] - naked[0], 40.5, "mind min external");
close(ysg[1] - naked[1], 80.9, "mind max external");
close(ysg[4], 0.046, "mind direct critical");

const mingjinBase = calculate(input => { input[95] = id("鸣金影"); });
const feisun = calculate(input => { input[95] = id("鸣金影"); input[1] = id("飞隼"); });
close(feisun[0], mingjinBase[0], "Feisun must not multiply minimum external attack");
close(feisun[1], mingjinBase[1], "Feisun must not multiply maximum external attack");
close(feisun[6] - mingjinBase[6], 0.028572, "Feisun insight only");

const pozhuBase = calculate(input => { input[95] = id("破竹鸢"); });
const hantian = calculate(input => { input[95] = id("破竹鸢"); input[1] = id("撼天"); });
close(hantian[0] - pozhuBase[0], 121, "Hantian minimum external attack only");
close(hantian[1], pozhuBase[1], "Hantian must not multiply maximum external attack");
for (let index = 9; index <= 18; index += 1) close(hantian[index], pozhuBase[index], `Hantian must not multiply elemental attack ${index}`);

for (const [rowStart, value, outputIndex] of [[152, 0.098, 32], [160, 0.154, 33], [168, 0.051, 34], [176, 0.049, 35]]) {
  const panel = calculate(input => { input[rowStart] = value; });
  const expected = Math.round((value * 100 / 1.15 + Number.EPSILON) * 1e8) / 1e8 / 100;
  if (Object.is(panel[outputIndex], expected) === false) throw new Error(`benefit resistance rounding ${outputIndex}: ${panel[outputIndex]} != ${expected}`);
}

const flows = ["鸣金虹", "鸣金影", "破竹尘", "破竹风", "破竹鸢", "破竹樽", "裂石威", "裂石钧", "牵丝玉", "牵丝翊", "牵丝霖"];
for (const flow of flows) {
  const panel = calculate(input => { input[95] = id(flow); });
  if (panel.length !== 36 || panel.some(value => !Number.isFinite(value))) throw new Error(`invalid panel: ${flow}`);
}

const appSource = fs.readFileSync(path.join(repo, "static/tools/yysls-tiaolv/assets/js/app.min.js"), "utf8");
const readList = name => JSON.parse(appSource.match(new RegExp(`${name}: (\\[[^\\n]+?\\])`))?.[1] || "null");
if (JSON.stringify(readList("CLASSES")) !== JSON.stringify(flows)) throw new Error("main calculable class list is not the expected 11 PVE flows");
if (JSON.stringify(readList("AVAILABLE_CLASSES")) !== JSON.stringify([...flows, "pvp"])) throw new Error("equipment available-class list must contain 11 PVE flows plus pvp");
if (!appSource.includes('AppState.allClassLoadouts["裂石钧（纯唐）"]') || !appSource.includes('? "裂石钧" : n.currentClass')) {
  throw new Error("legacy pure-Tang save migration is missing");
}
console.log(JSON.stringify({ status: "ok", version: "110_RBDZ_DOWN", flows: flows.length }));
