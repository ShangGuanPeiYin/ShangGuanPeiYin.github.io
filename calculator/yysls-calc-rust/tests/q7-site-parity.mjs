// Q7 site-level parity: compares the local Q7 full runtime (namespaced snapshot
// + local CommonData/ClassConfig) against the live upstream yysls.leoq7.com
// runtime across all 11 flows with realistic per-flow builds.
//
// Before syncing the Q7 snapshot this reports the stale-engine gap; after a
// snapshot refresh it should report only the documented season-resistance
// override (白字率 / 溢出 display values) as differing.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..", "..");
const live = path.join(repo, "static/tools/yysls-tiaolv");
const q7 = (...p) => path.join(live, "assets/engines/q7", ...p);
const baseUrl = "https://yysls.leoq7.com";

const fetchText = async url => Buffer.from(await fetch(url).then(r => {
  if (!r.ok) throw new Error(`${url} HTTP ${r.status}`);
  return r.arrayBuffer();
}));
const sha256 = bytes => crypto.createHash("sha256").update(bytes).digest("hex");

// --- upstream snapshot (live) -------------------------------------------------
const upstream = {
  wasm: Buffer.from(await fetch(`${baseUrl}/assets/wasm/yysls_calc.wasm`).then(r => {
    if (!r.ok) throw new Error(`WASM HTTP ${r.status}`);
    return r.arrayBuffer();
  })),
  strings: await fetchText(`${baseUrl}/assets/js/generated-calc-strings.js`),
  metadata: await fetchText(`${baseUrl}/assets/js/generated-calc-metadata.js`),
  runtime: await fetchText(`${baseUrl}/assets/js/excel-runtime.js`),
  app: await fetchText(`${baseUrl}/assets/js/app.min.js`)
};

function extractAppConfig(appText) {
  const start = appText.indexOf("const CommonData =");
  const end = appText.indexOf("OCRHandler =", start);
  if (start < 0 || end < 0) throw new Error("Q7 app config block not found");
  const block = appText.slice(start, end)
    .replace(/^const CommonData\s*=\s*/, "globalThis.CommonData = ")
    .replace(/,\s*ClassConfig\s*=\s*/, ";\nglobalThis.ClassConfig = ")
    .replace(/,\s*$/, ";");
  const context = {};
  vm.createContext(context);
  vm.runInContext(block, context);
  return { CommonData: context.CommonData, ClassConfig: context.ClassConfig };
}

const localConfig = JSON.parse(fs.readFileSync(q7("q7-app-config.js"), "utf8")
  .match(/YYSLS_Q7_APP_CONFIG=(\{.*\})/s)[1]);
const upstreamConfig = extractAppConfig(upstream.app.toString("utf8"));

// YYSLS_Q7_NORMALIZE_SEASON=1: align local season resistance to upstream so any
// remaining diff is a genuine inconsistency rather than the documented override.
if (process.env.YYSLS_Q7_NORMALIZE_SEASON === "1") {
  localConfig.CommonData.SEASON_STATS["赛季抗性"] = upstreamConfig.CommonData.SEASON_STATS["赛季抗性"];
}

// --- runtime environment factory ----------------------------------------------
async function makeSite(label, { wasm, strings, metadata, runtime, config }) {
  const ctx = { window: {}, console, setTimeout, clearTimeout };
  ctx.window.CommonData = config.CommonData;
  ctx.window.ClassConfig = config.ClassConfig;
  const resolveFetch = async url => {
    const key = String(url);
    if (key.includes("/yysls_calc.wasm")) {
      const bytes = new Uint8Array(wasm);
      return { ok: true, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
    }
    throw new Error(`${label}: unexpected fetch ${key}`);
  };
  ctx.fetch = resolveFetch;
  ctx.window.fetch = resolveFetch;
  vm.createContext(ctx);
  vm.runInContext(strings.toString("utf8"), ctx);
  vm.runInContext(metadata.toString("utf8"), ctx);
  vm.runInContext(runtime.toString("utf8"), ctx);
  const engine = ctx.window.YYSLSExcelRuntime;
  if (!engine) throw new Error(`${label}: YYSLSExcelRuntime missing`);
  await engine.ready;
  return { ctx, engine, label };
}

const localSite = await makeSite("local", {
  wasm: fs.readFileSync(path.join(live, "assets/wasm/q7/yysls_calc.wasm")),
  strings: fs.readFileSync(q7("generated-calc-strings.js")),
  metadata: fs.readFileSync(q7("generated-calc-metadata.js")),
  runtime: fs.readFileSync(q7("excel-runtime.js")),
  config: localConfig
});
const upstreamSite = await makeSite("upstream", {
  wasm: upstream.wasm,
  strings: upstream.strings,
  metadata: upstream.metadata,
  runtime: upstream.runtime,
  config: upstreamConfig
});

// --- realistic per-flow build data ----------------------------------------------
const meta = JSON.parse(fs.readFileSync(q7("generated-calc-metadata.js"), "utf8")
  .match(/YYSLS_CALC_METADATA=(\{.*\})\s*;?\s*$/s)[1]);
const flowNames = meta.flowNames || Object.keys(meta.flowIds);
const weaponTypeNames = {
  1: "剑", 2: "枪", 3: "伞", 4: "扇", 5: "绳标",
  6: "双刀", 7: "陌刀", 8: "横刀", 9: "拳甲", 10: "鼓"
};
const weaponStatByType = {
  1: "剑武学增效", 2: "枪武学增效", 3: "伞武学增效", 4: "扇武学增效", 5: "绳标武学增效",
  6: "双刀武学增效", 7: "陌刀武学增效", 8: "横刀武学增效", 9: "拳甲武学增效", 10: "鼓武学增效"
};

function defaultFlowConfig(flowName) {
  const fields = meta.flowClassFields && meta.flowClassFields[flowName] || meta.classFields;
  const defaults = meta.flowClassDefaultValues && meta.flowClassDefaultValues[flowName]
    || meta.classDefaultValues && meta.classDefaultValues[flowName] || [];
  const at = field => {
    const i = fields.indexOf(field);
    return i >= 0 ? defaults[i] : undefined;
  };
  const setField = (meta.classSetFields && meta.classSetFields[flowName]) || "g5";
  const xinfa = fields.map((f, i) => /xinfa/.test(f) ? defaults[i] : null).filter(v => v !== null && v !== undefined);
  return {
    className: flowName,
    bow: "precision",
    setName: at(setField) || "",
    armory: "本系",
    xinfa
  };
}

const WEAPON_RULES = localConfig.ClassConfig.WEAPON_RULES;
function buildEquipment(flowName) {
  const weapons = (WEAPON_RULES && WEAPON_RULES[flowName]) || ["1", "2"];
  const weaponTypes = weapons.slice(0, 2).map(id => Number(id));
  const weaponStat = weaponTypes[0] !== undefined ? weaponStatByType[weaponTypes[0]] : "指定武学增效";
  const outer = (slot, i) => ({
    slotId: i === 0 ? 1 : 3,
    isPurple: false,
    mainStat: { type: i % 2 === 0 ? "最大外功攻击" : "最小外功攻击", value: i % 2 === 0 ? 105.6 : 105.6 },
    subStats: [
      { type: weaponStat, value: 8.6 },
      { type: "精准率", value: 10.8 },
      { type: "会心率", value: 12.2 },
      { type: "劲", value: 66.8 }
    ],
    dingyinStat: { type: "外功穿透", value: 16.8 }
  });
  return {
    weapon1: { slotId: 1, weaponTypeId: weaponTypes[0], isPurple: false, mainStat: { type: "最大外功攻击", value: 105.6 }, subStats: [{ type: weaponStat, value: 8.6 }, { type: "精准率", value: 10.8 }, { type: "会心率", value: 12.2 }], dingyinStat: { type: "外功穿透", value: 16.8 } },
    weapon2: { slotId: 1, weaponTypeId: weaponTypes[1] !== undefined ? weaponTypes[1] : 1, isPurple: false, mainStat: { type: "最小外功攻击", value: 105.6 }, subStats: [{ type: weaponStat, value: 8.6 }, { type: "会意率", value: 6 }, { type: "势", value: 66.8 }], dingyinStat: { type: "外功穿透", value: 16.8 } },
    ring: { slotId: 3, isPurple: false, mainStat: { type: "最大外功攻击", value: 105.6 }, subStats: [{ type: "精准率", value: 10.8 }, { type: "会心率", value: 12.2 }, { type: "劲", value: 66.8 }], dingyinStat: { type: "外功穿透", value: 16.8 } },
    pendant: { slotId: 4, isPurple: false, mainStat: { type: "最大外功攻击", value: 105.6 }, subStats: [{ type: "精准率", value: 10.8 }, { type: "会心率", value: 12.2 }, { type: "势", value: 66.8 }], dingyinStat: { type: "外功穿透", value: 16.8 } },
    head: { slotId: 5, isPurple: false, mainStat: { type: "精准率", value: 10.8 }, subStats: [{ type: "会心率", value: 12.2 }, { type: "会意率", value: 6 }, { type: "劲", value: 66.8 }], dingyinStat: { type: "指定武学技能增伤", value: 9.2 } },
    chest: { slotId: 6, isPurple: false, mainStat: { type: "会心率", value: 12.2 }, subStats: [{ type: "精准率", value: 10.8 }, { type: "会意率", value: 6 }, { type: "势", value: 66.8 }], dingyinStat: { type: "指定武学技能增伤", value: 9.2 } },
    legs: { slotId: 7, isPurple: false, mainStat: { type: "会意率", value: 6 }, subStats: [{ type: "精准率", value: 10.8 }, { type: "会心率", value: 12.2 }, { type: "劲", value: 66.8 }], dingyinStat: { type: "指定武学技能增伤", value: 9.2 } },
    hands: { slotId: 8, isPurple: false, mainStat: { type: "劲", value: 66.8 }, subStats: [{ type: "精准率", value: 10.8 }, { type: "会心率", value: 12.2 }, { type: "会意率", value: 6 }], dingyinStat: { type: "指定武学技能增伤", value: 9.2 } }
  };
}

// --- comparison helpers ---------------------------------------------------------
const numericKeys = ["totalDamage", "dps", "rdps", "useTime", "baseline", "baselineTotal", "graduationRate", "rdpsGraduationRate"];

function pctDelta(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return "n/a";
  if (a === b) return "0%";
  if (b === 0) return a === 0 ? "0%" : "inf";
  return `${(((a - b) / b) * 100).toFixed(3)}%`;
}

function panelDiffs(localPanel, upstreamPanel) {
  const keys = new Set([...Object.keys(localPanel), ...Object.keys(upstreamPanel)]);
  const rows = [];
  for (const key of keys) {
    const lv = localPanel[key], uv = upstreamPanel[key];
    if (!(key in localPanel) || !(key in upstreamPanel)) {
      rows.push({ field: key, local: key in localPanel ? lv : "—", upstream: key in upstreamPanel ? uv : "—", note: "仅一侧存在" });
    } else if (typeof lv === "number" && typeof uv === "number") {
      const same = Object.is(lv, uv);
      if (!same) rows.push({ field: key, local: lv, upstream: uv, delta: pctDelta(lv, uv) });
    } else if (lv !== uv) {
      rows.push({ field: key, local: JSON.stringify(lv), upstream: JSON.stringify(uv) });
    }
  }
  return rows;
}

function classInputDiffs(localExport, upstreamExport) {
  const lf = localExport.fields, uf = upstreamExport.fields;
  const lk = localExport.kinds, uk = upstreamExport.kinds;
  const lv = localExport.values, uv = upstreamExport.values;
  const lmap = new Map(lf.map((f, i) => [f, { kind: lk[i], value: lv[i] }]));
  const umap = new Map(uf.map((f, i) => [f, { kind: uk[i], value: uv[i] }]));
  const onlyLocal = lf.filter(f => !umap.has(f));
  const onlyUpstream = uf.filter(f => !lmap.has(f));
  const rows = [];
  for (const f of lf.filter(f => umap.has(f))) {
    const a = lmap.get(f), b = umap.get(f);
    if (a.kind !== b.kind) { rows.push({ field: f, note: "kind 不同" }); continue; }
    if (a.kind === "str") {
      if (String(a.value) !== String(b.value)) rows.push({ field: f, local: a.value, upstream: b.value, note: "str" });
    } else if (!Object.is(Number(a.value), Number(b.value))) {
      rows.push({ field: f, local: a.value, upstream: b.value, delta: pctDelta(Number(a.value), Number(b.value)), note: "num" });
    }
  }
  return { rows, onlyLocal, onlyUpstream };
}

const builds = ["空装", "毕业", "溢出"];
const results = [];

for (const flowName of flowNames) {
  const base = defaultFlowConfig(flowName);
  const flow = { flowName, cases: {} };
  for (const variant of builds) {
    const options = { ...base, equippedItems: {} };
    if (variant === "毕业" || variant === "溢出") options.equippedItems = buildEquipment(flowName);
    if (variant === "溢出") {
      options.modifiers = [
        { type: "精准率", value: 100 },
        { type: "会心率", value: 80 },
        { type: "会意率", value: 40 }
      ];
    }
    const lr = localSite.engine.calculate({ ...options });
    const ur = upstreamSite.engine.calculate({ ...options });
    if (!lr || !ur) throw new Error(`calculate null for ${flowName}/${variant}: local=${!!lr} upstream=${!!ur}`);
    const le = localSite.engine.exportClassInputData(options);
    const ue = upstreamSite.engine.exportClassInputData(options);
    const resultDiffs = {};
    for (const key of numericKeys) {
      const a = Number(lr[key]), b = Number(ur[key]);
      if (!Object.is(a, b)) resultDiffs[key] = { local: a, upstream: b, delta: pctDelta(a, b) };
    }
    flow.cases[variant] = {
      dps: { local: lr.dps, upstream: ur.dps, delta: pctDelta(lr.dps, ur.dps) },
      rdps: { local: lr.rdps, upstream: ur.rdps, delta: pctDelta(lr.rdps, ur.rdps) },
      graduationRate: { local: lr.graduationRate, upstream: ur.graduationRate, delta: pctDelta(lr.graduationRate, ur.graduationRate) },
      resultDiffs,
      panel: panelDiffs(lr.panel, ur.panel),
      classInput: classInputDiffs(le, ue)
    };
  }
  results.push(flow);
}

// --- report ----------------------------------------------------------------------
const lines = [];
lines.push(`Q7 站点级对比（local vs 上游 ${baseUrl}）`);
lines.push(`本地 WASM sha256 ${sha256(fs.readFileSync(path.join(live, "assets/wasm/q7/yysls_calc.wasm"))).slice(0, 16)}`);
lines.push(`上游 WASM sha256 ${sha256(upstream.wasm).slice(0, 16)}`);
lines.push(`本地 赛季抗性 ${localConfig.CommonData.SEASON_STATS["赛季抗性"]} | 上游 赛季抗性 ${upstreamConfig.CommonData.SEASON_STATS["赛季抗性"]}`);
lines.push("");
for (const flow of results) {
  lines.push(`【${flow.flowName}】`);
  for (const [variant, c] of Object.entries(flow.cases)) {
    lines.push(`  ${variant}: DPS ${c.dps.local?.toFixed?.(2)} -> ${c.dps.upstream?.toFixed?.(2)} (${c.dps.delta}) | 毕业率 ${c.graduationRate.local?.toFixed?.(4)} -> ${c.graduationRate.upstream?.toFixed?.(4)} (${c.graduationRate.delta})`);
    if (c.panel.length) {
      const sample = c.panel.slice(0, 8);
      for (const d of sample) lines.push(`    panel差异 ${d.field}: ${formatVal(d.local)} vs ${formatVal(d.upstream)} (${d.delta || d.note || ""})`);
      if (c.panel.length > 8) lines.push(`    ... 共 ${c.panel.length} 个面板字段差异`);
    }
    if (c.classInput.onlyLocal.length || c.classInput.onlyUpstream.length || c.classInput.rows.length) {
      lines.push(`    职业输入: ${c.classInput.rows.length} 个共同字段差异` +
        (c.classInput.onlyLocal.length ? `, 仅本地字段 ${c.classInput.onlyLocal.length} 个` : "") +
        (c.classInput.onlyUpstream.length ? `, 仅上游字段 ${c.classInput.onlyUpstream.length} 个` : ""));
    }
  }
}
function formatVal(v) {
  return typeof v === "number" && Number.isFinite(v) ? v.toFixed(4) : JSON.stringify(v);
}
console.log(lines.join("\n"));
console.log(JSON.stringify({ status: "ok", flows: results.length, casesPerFlow: builds.length, localWasm: sha256(fs.readFileSync(path.join(live, "assets/wasm/q7/yysls_calc.wasm"))).slice(0, 16), upstreamWasm: sha256(upstream.wasm).slice(0, 16) }));
