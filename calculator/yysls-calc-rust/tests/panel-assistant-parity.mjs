import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "../..");
const assistantSource = fs.readFileSync(path.join(repo, "study/yysls-assistant.cn/assets/index-C5SFDSbW.js"), "utf8");
const stringsSource = fs.readFileSync(path.join(repo, "static/tools/yysls-tiaolv/assets/js/generated-calc-strings.js"), "utf8");
const wasmPath = process.env.YYSLS_PANEL_WASM || path.join(root, "dist/yysls_panel.wasm");
const randomCases = Number(process.env.YYSLS_PANEL_CASES || 1_000_000);

function extractAssistantMetadata(source) {
  const start = source.indexOf("const JS=") + "const JS=".length;
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") quote = char;
    else if (char === "{") depth += 1;
    else if (char === "}" && --depth === 0) return vm.runInNewContext(`(${source.slice(start, index + 1)})`);
  }
  throw new Error("assistant metadata not found");
}

const assistant = extractAssistantMetadata(assistantSource);
const strings = JSON.parse(stringsSource.match(/YYSLS_CALC_STRINGS=(\[[\s\S]*?\]);\s*window\.YYSLS_CALC_STRING_IDS/)[1]);
const stringId = value => strings.indexOf(value);
const keyName = key => assistant.keyMap[key]?.name || key;
const wasm = (await WebAssembly.instantiate(fs.readFileSync(wasmPath), {})).instance.exports;

const buildKeys = {
  "鸣金虹": "MINGJIN_HONG", "鸣金影": "MINGJIN_YING", "破竹尘": "POZHU_CHEN",
  "破竹风": "POZHU_FENG", "破竹鸢": "POZHU_YUAN", "裂石威": "LIESHI_WEI",
  "裂石钧": "LIESHI_JUN", "牵丝玉": "QIANSI_YU", "牵丝翊": "QIANSI_YI", "牵丝霖": "QIANSI_LIN",
};
const setKeys = {
  "浣花": "SET_WEAPON_HUANHUA", "烟柳": "SET_WEAPON_YANLIU", "时雨": "SET_WEAPON_SHIYU",
  "裁云": "SET_WEAPON_CAIYUN", "撼天": "SET_WEAPON_HANTIAN", "断岳": "SET_WEAPON_DUANYUE",
  "连星": "SET_WEAPON_LIANXING", "燕归": "SET_WEAPON_YANGUI", "飞隼": "SET_WEAPON_FEISUN", "玉斗": "SET_WEAPON_YUDOU",
};
const bowKeys = { "精准": "SET_BOW_YINYU", "会心": "SET_BOW_JINGXIAN", "会意": "SET_BOW_ZHUIYING" };
const rowStarts = [2, 11, 20, 29, 38, 46, 55, 63, 71, 79, 87, 96, 104, 112, 120, 128, 136, 144, 152, 160, 168, 176];
const rowKeys = [
  "JIN", "MIN", "SHI", "MIN_EXTERNAL_ATTACK", "MAX_EXTERNAL_ATTACK", "ACCURACY_RATE", "CRITICAL_RATE", "INSIGHT_RATE",
  "MIN_MINGJIN_ATTACK", "MAX_MINGJIN_ATTACK", "MIN_LIESHI_ATTACK", "MAX_LIESHI_ATTACK", "MIN_QIANSI_ATTACK", "MAX_QIANSI_ATTACK",
  "MIN_POZHU_ATTACK", "MAX_POZHU_ATTACK", "MIN_WUXIANG_ATTACK", "MAX_WUXIANG_ATTACK", "WEAPON_DAMAGE", "SINGLEQS_DAMAGE",
  "BOSS_DAMAGE", "WUXUE_DAMAGE",
];
const percentRows = new Set(["ACCURACY_RATE", "CRITICAL_RATE", "INSIGHT_RATE", "WEAPON_DAMAGE", "SINGLEQS_DAMAGE", "BOSS_DAMAGE", "WUXUE_DAMAGE"]);
const resistedKeys = new Set(["WEAPON_DAMAGE", "WUXUE_DAMAGE", "BOSS_DAMAGE", "SINGLEQS_DAMAGE", "EXTERNAL_PENETRATION", "WUXIANG_PENETRATION"]);

const round = (value, digits = 4) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};
const roundWithEpsilon = (value, digits = 4) => {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};
const add = (target, key, value) => { target[key] = round(Number(target[key] || 0) + Number(value || 0)); };
const addEntries = (target, entries = []) => entries.forEach(entry => add(target, entry.key, entry.value));

function reference(input) {
  const flowName = strings[input[95] | 0];
  const buildKey = buildKeys[flowName];
  const source = {};
  const equipment = {};
  addEntries(source, assistant.attributes);

  const martials = assistant.martials.filter(item => item.buildKey === buildKey);
  martials.forEach(item => addEntries(source, item.attr));
  for (const index of [10, 19, 28, 37]) {
    const mindName = strings[input[index] | 0];
    addEntries(source, assistant.minds.find(item => keyName(item.key) === mindName)?.attr);
  }

  const setName = strings[input[1] | 0];
  const setKey = setKeys[setName] || (setName === "会心" ? "SET_WEAPON_HUANHUA" : "");
  addEntries(source, assistant.sets.find(item => item.key === setKey)?.attr);
  addEntries(source, assistant.sets.find(item => item.key === bowKeys[strings[input[0] | 0]])?.attr);
  const arsenalKey = (input[54] | 0) === stringId("通用") ? "COMMON" : martials[0]?.elementKey;
  addEntries(source, assistant.arsenals.find(item => item.key === arsenalKey)?.attr);

  for (let slot = 0; slot < 8; slot += 1) {
    if (input[184 + slot] > 0) {
      const purple = input[192 + slot] > 0;
      if (slot < 2) {
        add(equipment, "MIN_EXTERNAL_ATTACK", purple ? 90 : 100);
        add(equipment, "MAX_EXTERNAL_ATTACK", purple ? 209 : 232);
      } else if (slot === 2) add(equipment, "MIN_EXTERNAL_ATTACK", purple ? 120 : 133);
      else if (slot === 3) add(equipment, "MAX_EXTERNAL_ATTACK", purple ? 179 : 199);
    }
  }
  for (let row = 0; row < rowKeys.length; row += 1) {
    for (let slot = 0; slot < 8; slot += 1) {
      let value = Number(input[rowStarts[row] + slot] || 0);
      if (percentRows.has(rowKeys[row])) value *= 100;
      add(equipment, rowKeys[row], value);
    }
  }
  Object.entries(equipment).forEach(([key, value]) => add(source, key, value));

  for (const martial of martials) {
    for (let index = 0; index < (martial.needKey1 || []).length; index += 2) {
      const detection = martial.needKey1[index];
      const reward = martial.needKey1[index + 1];
      const current = round(Number(source[detection.key] || 0));
      const ratio = detection.value > 0 ? Math.min(Math.max(round(current / detection.value, 12), 0), 1) : 0;
      add(source, reward.key, round(reward.value * ratio));
    }
  }

  const benefitResistance = Number(source.BENEFIT_RESISTANCE || 0);
  if (benefitResistance > 0) {
    for (const [key, equipmentValue] of Object.entries(equipment)) {
      if (equipmentValue !== 0 && resistedKeys.has(key)) {
        source[key] = roundWithEpsilon(Number(source[key] || 0) - equipmentValue + equipmentValue / benefitResistance, 8);
      }
    }
  }

  source.MIN_EXTERNAL_ATTACK += Number(source.MIN || 0) * 0.9 + Number(source.JIN || 0) * 0.22;
  source.MAX_EXTERNAL_ATTACK += Number(source.SHI || 0) * 0.9 + Number(source.JIN || 0) * 1.36;
  source.CRITICAL_RATE += Number(source.MIN || 0) * 0.076;
  source.INSIGHT_RATE += Number(source.SHI || 0) * 0.038;

  const resistance = Number(source.LEVEL_RESISTANCE || 0);
  const computedRate = key => round(round(Number(source[key] || 0)) / resistance) / 100;
  const accuracy = round(65 + Math.max(round(Number(source.ACCURACY_RATE || 0)) - 65, 0) / resistance) / 100;
  const percent = key => Number(source[key] || 0) / 100;
  return [
    source.MIN_EXTERNAL_ATTACK || 0, source.MAX_EXTERNAL_ATTACK || 0, accuracy,
    computedRate("CRITICAL_RATE"), percent("DIRECT_CRITICAL_RATE"), percent("CRITICAL_DAMAGE"),
    computedRate("INSIGHT_RATE"), percent("DIRECT_INSIGHT_RATE"), percent("INSIGHT_DAMAGE"),
    source.MIN_MINGJIN_ATTACK || 0, source.MAX_MINGJIN_ATTACK || 0,
    source.MIN_LIESHI_ATTACK || 0, source.MAX_LIESHI_ATTACK || 0,
    source.MIN_QIANSI_ATTACK || 0, source.MAX_QIANSI_ATTACK || 0,
    source.MIN_POZHU_ATTACK || 0, source.MAX_POZHU_ATTACK || 0,
    source.MIN_WUXIANG_ATTACK || 0, source.MAX_WUXIANG_ATTACK || 0,
    0, 0, 0, source.EXTERNAL_PENETRATION || 0, percent("EXTERNAL_DAMAGE"),
    source.MINGJIN_PENETRATION || 0, percent("MINGJIN_DAMAGE"),
    source.LIESHI_PENETRATION || 0, percent("LIESHI_DAMAGE"),
    source.QIANSI_PENETRATION || 0, percent("QIANSI_DAMAGE"),
    source.POZHU_PENETRATION || 0, percent("POZHU_DAMAGE"),
    percent("WEAPON_DAMAGE"), percent("SINGLEQS_DAMAGE"), percent("BOSS_DAMAGE") + percent("COMMON_DAMAGE"), percent("WUXUE_DAMAGE"),
  ];
}

const inputPointer = wasm.yysls_alloc_f64(202);
const outputPointer = wasm.yysls_alloc_f64(36);
const inputView = new Float64Array(wasm.memory.buffer, inputPointer, 202);
const outputView = new Float64Array(wasm.memory.buffer, outputPointer, 36);
function calculate(input) {
  inputView.set(input);
  wasm.yysls_calc_diy(inputPointer, outputPointer);
  return outputView;
}

function bits(value) {
  return new BigUint64Array(new Float64Array([value]).buffer)[0];
}
function assertEqual(input, label) {
  const actual = calculate(input);
  const expected = reference(input);
  for (let index = 0; index < 36; index += 1) {
    if (bits(actual[index]) !== bits(expected[index])) {
      throw new Error(JSON.stringify({ label, index, actual: actual[index], expected: expected[index], input: Array.from(input) }));
    }
  }
}

const flows = Object.keys(buildKeys);
const setNames = Object.keys(setKeys);
const bowNames = Object.keys(bowKeys);
const mindNames = assistant.minds.map(item => keyName(item.key)).filter(name => stringId(name) >= 0);
const values = [0, 4.61, 4.9, 4.79, 5.1, 6.58, 7, 9.21, 9.8, 11.66, 12.4, 13.16, 14, 64.67, 68.8, 72.19, 76.8, 114.12, 121.4];

for (const flow of flows) {
  for (const setName of setNames) {
    for (const bowName of bowNames) {
      for (const armory of ["通用", flow]) {
        const input = new Float64Array(202);
        input[95] = stringId(flow);
        input[1] = stringId(setName === "浣花" ? "会心" : setName);
        input[0] = stringId(bowName);
        input[54] = stringId(armory);
        assertEqual(input, `matrix:${flow}:${setName}:${bowName}:${armory}`);
      }
    }
  }
}

let state = 0x21652c0c;
const random = () => {
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return (state >>> 0) / 0x100000000;
};
const pick = list => list[Math.floor(random() * list.length)];
for (let caseIndex = 0; caseIndex < randomCases; caseIndex += 1) {
  const input = new Float64Array(202);
  const flow = pick(flows);
  input[95] = stringId(flow);
  input[0] = stringId(pick(bowNames));
  const setName = pick(setNames);
  input[1] = stringId(setName === "浣花" ? "会心" : setName);
  input[54] = stringId(random() < 0.5 ? "通用" : flow);
  for (const index of [10, 19, 28, 37]) input[index] = stringId(pick(mindNames));
  for (let slot = 0; slot < 8; slot += 1) {
    input[184 + slot] = random() < 0.9 ? 1 : 0;
    input[192 + slot] = random() < 0.35 ? 1 : 0;
    for (let row = 0; row < rowKeys.length; row += 1) {
      if (random() < 0.3) input[rowStarts[row] + slot] = pick(values) * (percentRows.has(rowKeys[row]) ? 0.01 : 1);
    }
  }
  assertEqual(input, `random:${caseIndex}:${flow}:${setName}`);
}

console.log(JSON.stringify({ status: "ok", version: assistant.currentVersion.key, matrixCases: flows.length * setNames.length * bowNames.length * 2, randomCases, comparedFields: (flows.length * setNames.length * bowNames.length * 2 + randomCases) * 36 }));
