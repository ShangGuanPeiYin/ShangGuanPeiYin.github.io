import fs from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const assistantPath = new URL("../../study/yysls-assistant.cn/assets/index-C5SFDSbW.js", root);
const stringsPath = new URL("../../static/tools/yysls-tiaolv/assets/js/generated-calc-strings.js", root);
const outputPath = new URL("src/panel_v2_generated.rs", root);

function extractObject(source) {
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
  throw new Error("assistant metadata object not found");
}

const assistant = extractObject(fs.readFileSync(assistantPath, "utf8"));
const stringsSource = fs.readFileSync(stringsPath, "utf8");
const stringsMatch = stringsSource.match(/YYSLS_CALC_STRINGS=(\[[\s\S]*?\]);\s*window\.YYSLS_CALC_STRING_IDS/);
if (!stringsMatch) throw new Error("calculator string table not found");
const strings = JSON.parse(stringsMatch[1]);
const stringId = value => strings.indexOf(value);
const rust = value => JSON.stringify(value).replaceAll('"', '\\"');

const attrKeys = [...new Set([
  ...assistant.attributes.map(item => item.key),
  ...assistant.martials.flatMap(item => [...item.attr, ...(item.needKey1 || [])]).map(item => item.key),
  ...assistant.arsenals.flatMap(item => item.attr).map(item => item.key),
  ...assistant.sets.flatMap(item => item.attr).map(item => item.key),
  ...assistant.minds.flatMap(item => item.attr).map(item => item.key),
  "DIRECT_CRITICAL_RATE", "DIRECT_INSIGHT_RATE", "COMMON_DAMAGE", "EXTERNAL_DAMAGE",
  "QIANSI_DAMAGE", "LIESHI_DAMAGE", "MINGJIN_DAMAGE", "POZHU_DAMAGE",
  "WUXUE_DAMAGE", "BOSS_DAMAGE", "SINGLEQS_DAMAGE", "AOEQS_DAMAGE", "WEAPON_DAMAGE"
])].sort();
const enumName = key => key.split("_").map(part => part[0] + part.slice(1).toLowerCase()).join("");

function attrs(items = []) {
  return `&[${items.map(item => `(Attr::${enumName(item.key)}, ${Number(item.value).toFixed(12).replace(/0+$/, "").replace(/\.$/, ".0")})`).join(", ")}]`;
}

function keyName(key) {
  return assistant.keyMap[key]?.name || key;
}

const setAliases = new Map([
  ["浣花", "SET_WEAPON_HUANHUA"], ["烟柳", "SET_WEAPON_YANLIU"], ["时雨", "SET_WEAPON_SHIYU"],
  ["裁云", "SET_WEAPON_CAIYUN"], ["撼天", "SET_WEAPON_HANTIAN"], ["断岳", "SET_WEAPON_DUANYUE"],
  ["连星", "SET_WEAPON_LIANXING"], ["燕归", "SET_WEAPON_YANGUI"], ["飞隼", "SET_WEAPON_FEISUN"],
  ["玉斗", "SET_WEAPON_YUDOU"]
]);

let out = `// Generated from yysls-assistant.cn ${assistant.exportedAt}, ${assistant.currentVersion.key}.\n`;
out += `#[derive(Clone, Copy, Debug, PartialEq, Eq)]\npub enum Attr {\n${attrKeys.map(key => `    ${enumName(key)},`).join("\n")}\n}\n\n`;
out += `pub const ATTR_COUNT: usize = ${attrKeys.length};\n`;
out += `pub const fn attr_index(attr: Attr) -> usize { attr as usize }\n\n`;
out += `pub const BASE_ATTRS: &[(Attr, f64)] = ${attrs(assistant.attributes)};\n\n`;
out += `pub struct Martial { pub attrs: &'static [(Attr, f64)], pub talents: &'static [(Attr, f64, Attr, f64)] }\n`;
out += `pub fn martials(class_id: i32) -> &'static [Martial] { match class_id {\n`;
const classNames = {MINGJIN_HONG:"鸣金虹",MINGJIN_YING:"鸣金影",POZHU_CHEN:"破竹尘",POZHU_FENG:"破竹风",POZHU_YUAN:"破竹鸢",LIESHI_WEI:"裂石威",LIESHI_JUN:"裂石钧",QIANSI_YU:"牵丝玉",QIANSI_YI:"牵丝翊",QIANSI_LIN:"牵丝霖"};
for (const [buildKey, name] of Object.entries(classNames)) {
  const id = stringId(name);
  const list = assistant.martials.filter(item => item.buildKey === buildKey);
  out += `    ${id} => &[${list.map(item => {
    const pairs = [];
    for (let i = 0; i < (item.needKey1 || []).length; i += 2) {
      const a = item.needKey1[i], b = item.needKey1[i + 1];
      pairs.push(`(Attr::${enumName(a.key)}, ${Number(a.value).toFixed(1)}, Attr::${enumName(b.key)}, ${Number(b.value).toFixed(1)})`);
    }
    return `Martial { attrs: ${attrs(item.attr)}, talents: &[${pairs.join(", ")}] }`;
  }).join(", ")}],\n`;
}
out += `    _ => &[],\n} }\n\n`;

out += `pub fn mind_attrs(id: i32) -> &'static [(Attr, f64)] { match id {\n`;
for (const item of assistant.minds) {
  const id = stringId(keyName(item.key));
  if (id >= 0) out += `    ${id} => ${attrs(item.attr)}, // ${rust(keyName(item.key))}\n`;
}
out += `    _ => &[],\n} }\n\n`;

out += `pub fn set_attrs(id: i32) -> &'static [(Attr, f64)] { match id {\n`;
for (const [name, key] of setAliases) {
  const item = assistant.sets.find(entry => entry.key === key);
  const id = name === "浣花" ? stringId("会心") : stringId(name);
  out += `    ${id} => ${attrs(item?.attr)}, // ${rust(name)}\n`;
}
out += `    _ => &[],\n} }\n\n`;
out += `pub fn set_key(id: i32) -> &'static str { match id {\n${[...setAliases].map(([name,key]) => `    ${name === "浣花" ? stringId("会心") : stringId(name)} => "${key}",`).join("\n")}\n    _ => "",\n} }\n\n`;

out += `pub fn bow_attrs(id: i32) -> &'static [(Attr, f64)] { match id {\n`;
for (const [name, key] of [["精准","SET_BOW_YINYU"],["会心","SET_BOW_JINGXIAN"],["会意","SET_BOW_ZHUIYING"]]) {
  out += `    ${stringId(name)} => ${attrs(assistant.sets.find(item => item.key === key)?.attr)},\n`;
}
out += `    _ => &[],\n} }\n\n`;

out += `pub fn arsenal_attrs(common: bool, class_id: i32) -> &'static [(Attr, f64)] { if common { return ${attrs(assistant.arsenals.find(x=>x.key==='COMMON').attr)}; } match class_id {\n`;
for (const [buildKey, name] of Object.entries(classNames)) {
  const element = assistant.martials.find(x=>x.buildKey===buildKey)?.elementKey;
  out += `    ${stringId(name)} => ${attrs(assistant.arsenals.find(x=>x.key===element)?.attr)},\n`;
}
out += `    _ => &[],\n} }\n`;

fs.writeFileSync(outputPath, out);
console.log(`generated ${outputPath.pathname} (${out.length} bytes)`);
