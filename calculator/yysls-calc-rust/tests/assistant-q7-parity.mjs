// Assistant (新版) engine vs Q7 engine — class-calculator-layer bit parity.
//
// Scope: same 40-length class input -> bit-identical outputs[0..3] for every flow.
//
// output[4] is EXCLUDED from all comparisons: its semantics differ by design —
//   assistant output[4] = rdps/rdpsBaseline (RD!I14, 1.0 at default),
//   Q7 output[4] = rdpsGraduationRatio (placeholder, always 0.0).
//
// Floating-point associativity: the two engines are compiled by independent compilers,
// so long SUM ranges / division chains can differ by <= 1 ULP (~1e-15 relative) for some
// flows (牵丝玉/破竹尘/破竹风/破竹鸢/裂石钧). Outputs[0..3] are therefore compared with a
// relative tolerance of REL_TOL = 1e-12 (measured worst case ~8e-16, i.e. 4+ orders of
// magnitude of headroom; far below any displayed precision). A real divergence (e.g. a
// wrong 武学 path) shows up at 1e-2..1e-1 and fails the gate.
//
// Documented exceptions (kept intentionally, see doc/tiaolv-local-customizations.md):
//   1. 牵丝翊 / 破竹尘 / 裂石钧 — the assistant workbooks' 期望!I10 = SUM(L:L) carries no
//      xinfa row-selector, so the compiled assistant module is xinfa-INSENSITIVE. The Q7 WASM
//      embeds a selector (built from an older workbook), so non-default xinfa inputs diverge.
//      The parity test asserts:
//        - default build (Q7 default xinfa) -> equal;
//        - assistant output is INVARIANT across all xinfa candidates (deliberate property);
//        - Q7 variation is reported as the known divergence.
//   2. 鸣金虹 — the user-provided assistant workbook differs from Q7 (class slot 2: 6339.5 vs
//      6332.4). outputs[0,1,3] stay equal; output[2] (graduationRatio) differs by the I16
//      baseline constant (rel ~7.9e-4) and is asserted within a documented tolerance.
//
// Run: node assistant-q7-parity.mjs        (random corpus size via YYSLS_PARITY_CASES, default 2000)

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..", "..");
const live = path.join(REPO, "static/tools/yysls-tiaolv");
const MODULES = {
  牵丝玉: "excel_qsyu_1_4.wasm",
  牵丝翊: "excel_qsyi_2_3.wasm",
  破竹尘: "excel_pzchen_2_2.wasm",
  破竹风: "excel_pzfeng_1_1.wasm",
  破竹鸢: "excel_pzyuan_2_6.wasm",
  裂石威: "excel_lswei_2_4.wasm",
  裂石钧: "excel_lsjun_2_2.wasm",
  鸣金虹: "excel_mjhong_1_3.wasm",
  鸣金影: "excel_mjying_1_5.wasm",
  牵丝霖: "excel_qslin_2_1.wasm",
  破竹樽: "excel_pzzun_0_4.wasm",
};
const Q7_WASM = "assets/wasm/q7/yysls_calc.wasm";
const XINFA_INSENSITIVE = new Set(["牵丝翊", "破竹尘", "裂石钧"]);
const IL = 40;
const OL = 5;
const N = Number(process.env.YYSLS_PARITY_CASES || 2000);
const REL_TOL = 1e-12;

function loadJs(file) {
  const c = { window: {} };
  vm.createContext(c);
  vm.runInContext(fs.readFileSync(file, "utf8"), c);
  return c.window;
}
const asmMeta = loadJs(path.join(live, "assets/js/generated-calc-metadata.js")).YYSLS_CALC_METADATA;
const asmSids = loadJs(path.join(live, "assets/js/generated-calc-strings.js")).YYSLS_CALC_STRING_IDS;
const q7Meta = loadJs(path.join(live, "assets/engines/q7/generated-calc-metadata.js")).YYSLS_CALC_METADATA;
const q7Sids = loadJs(path.join(live, "assets/engines/q7/generated-calc-strings.js")).YYSLS_CALC_STRING_IDS;
const flowNames = q7Meta.flowNames || Object.keys(q7Meta.flowIds);

function makeRunner(wasm) {
  const ip = wasm.yysls_alloc_f64(IL);
  const op = wasm.yysls_alloc_f64(OL);
  return (flowId, input) => {
    new Float64Array(wasm.memory.buffer, ip, IL).set(input);
    wasm.yysls_calc_class_outputs(flowId, ip, op);
    return Array.from(new Float64Array(wasm.memory.buffer, op, OL));
  };
}
const q7Wasm = (await WebAssembly.instantiate(fs.readFileSync(path.join(live, Q7_WASM)), {})).instance.exports;
const q7Run = makeRunner(q7Wasm);
const asmRuns = {};
for (const flow of flowNames) {
  const mod = path.join(live, "assets/wasm/excel", MODULES[flow]);
  asmRuns[flow] = makeRunner((await WebAssembly.instantiate(fs.readFileSync(mod), {})).instance.exports);
}

function kindsFor(engine, flow) {
  return engine === "a" ? asmMeta.flowClassKinds[flow] : (q7Meta.flowClassKinds && q7Meta.flowClassKinds[flow]) || q7Meta.classKinds;
}
function strId(engine, value) {
  const s = engine === "a" ? asmSids : q7Sids;
  return Number(s[value] || 0);
}
// Canonical semantic default: assistant defaults, xinfa positions overridden to the Q7 default
// (the parity target's default build). Keeps g1/g5/rates identical to the workbook lineage.
function semanticDefault(flow) {
  const af = asmMeta.flowClassFields[flow] || [];
  const base = asmMeta.flowClassDefaultValues[flow] || [];
  const arr = new Array(IL).fill(0);
  base.forEach((v, i) => { arr[i] = v; });
  for (const xi of q7Meta.classXinfaInputs[flow] || []) {
    const idx = af.indexOf(xi.field);
    if (idx >= 0) arr[idx] = xi.default;
  }
  return arr;
}
function encode(engine, flow, sem) {
  const kinds = kindsFor(engine, flow);
  return sem.map((v, i) => kinds && kinds[i] === "str" ? strId(engine, v) : Number(v || 0));
}
function compare(flow, aOut, qOut) {
  const rows = [];
  for (let k = 0; k < 4; k++) {
    const rel = Math.abs(aOut[k] - qOut[k]) / Math.max(1, Math.abs(qOut[k]));
    if (rel > REL_TOL) rows.push(`output[${k}] A=${aOut[k]} Q=${qOut[k]} rel=${rel.toExponential(2)}`);
  }
  return rows;
}

const lines = [];
let failures = 0;
function fail(msg) { failures++; lines.push("  FAIL: " + msg); }

// --- 1) default build ---------------------------------------------------------
lines.push(`默认构建（规范输入 = 助手默认 + Q7 默认 xinfa）逐位对比 (output[4] 语义不同，排除)`);
for (const flow of flowNames) {
  const sem = semanticDefault(flow);
  const aOut = asmRuns[flow](0, encode("a", flow, sem));
  const qOut = q7Run(q7Meta.flowIds[flow], encode("q", flow, sem));
  const rows = compare(flow, aOut, qOut);
  if (flow === "鸣金虹" && rows.length === 1 && rows[0].startsWith("output[2]")) {
    const a2 = aOut[2], q2 = qOut[2];
    const rel = Math.abs(a2 - q2) / Math.max(1, Math.abs(q2));
    const ok = rel < 0.005;
    if (!ok) fail(`鸣金虹 output[2] 超出文档化容差 (rel=${(rel * 100).toFixed(4)}%)`);
    lines.push(`  ${flow}: OK (输出0,1,3逐位一致; output[2] 文档化差异 ${a2.toFixed(7)} vs ${q2.toFixed(7)}, rel=${(rel * 100).toFixed(4)}%)`);
  } else if (rows.length) {
    fail(`${flow} 默认构建不一致: ${rows.join(" | ")}`);
    lines.push(`  ${flow}: ${rows.join(" | ")}`);
  } else {
    lines.push(`  ${flow}: OK (逐位一致)`);
  }
}

// --- 2) xinfa sensitivity (documented exceptions) -----------------------------
lines.push(`\n心法输入敏感性（文档化例外: 牵丝翊/破竹尘/裂石钧 助理引擎不敏感）`);
for (const flow of flowNames) {
  const xi = (asmMeta.classXinfaInputs[flow] || []).filter(x => x.candidates && x.candidates.length);
  if (!xi.length) { lines.push(`  ${flow}: 无心法候选`); continue; }
  const sem = semanticDefault(flow);
  const af = asmMeta.flowClassFields[flow] || [];
  const baseA = asmRuns[flow](0, encode("a", flow, sem));
  const insensitive = XINFA_INSENSITIVE.has(flow);
  for (const x of xi) {
    const idx = af.indexOf(x.field);
    if (idx < 0) continue;
    const parts = [];
    let assistantVariant = false;
    let q7Variant = false;
    for (const cand of x.candidates) {
      const s = Array.from(sem);
      s[idx] = cand;
      const aOut = asmRuns[flow](0, encode("a", flow, s));
      const qOut = q7Run(q7Meta.flowIds[flow], encode("q", flow, s));
      if (!Object.is(aOut[0], baseA[0])) assistantVariant = true;
      const qRows = compare(flow, baseA, qOut);
      if (qRows.length) q7Variant = true;
      parts.push(`${cand}:A=${aOut[0].toFixed(0)}/Q=${qOut[0].toFixed(0)}`);
    }
    if (insensitive) {
      if (assistantVariant) fail(`${flow} ${x.field}: 助理引擎应当心法不敏感但输出变化`);
      lines.push(`  ${flow} ${x.field}（文档化差异）: 助理不敏感(${assistantVariant ? "变化!" : "恒定"}), Q7${q7Variant ? "敏感" : "亦不敏感"} — ${parts.join(" | ")}`);
    } else {
      const bad = [];
      for (const cand of x.candidates) {
        const s = Array.from(sem);
        s[idx] = cand;
        const aOut = asmRuns[flow](0, encode("a", flow, s));
        const qOut = q7Run(q7Meta.flowIds[flow], encode("q", flow, s));
        const rows = compare(flow, aOut, qOut);
        if (rows.length) bad.push(`${cand}: ${rows.join("; ")}`);
      }
      if (bad.length) fail(`${flow} ${x.field} 心法变化不一致: ${bad.join(" | ")}`);
      else lines.push(`  ${flow} ${x.field}: OK (两引擎响应逐位一致) — ${parts.join(" | ")}`);
    }
  }
}

// --- 3) random corpus (non-xinfa numeric fields) ------------------------------
lines.push(`\n随机语料 ${N} 例/流派（数值槽扰动，字符串槽保持默认）`);
let state = 0x9e3779b9;
function rand() {
  state ^= state << 13; state ^= state >>> 17; state ^= state << 5;
  return ((state >>> 0) / 4294967296);
}
for (const flow of flowNames) {
  const sem = semanticDefault(flow);
  const kinds = asmMeta.flowClassKinds[flow];
  let mismatch = 0;
  const worst = [0, 0, 0, 0];
  for (let i = 0; i < N; i++) {
    const s = Array.from(sem);
    for (let j = 0; j < IL; j++) {
      if (kinds[j] !== "str" && Number(sem[j] || 0) !== 0) {
        s[j] = Number(sem[j]) * (1 + (rand() * 0.4 - 0.2));
      }
    }
    const aOut = asmRuns[flow](0, encode("a", flow, s));
    const qOut = q7Run(q7Meta.flowIds[flow], encode("q", flow, s));
    for (let o = 0; o < 4; o++) {
      const rel = Math.abs(aOut[o] - qOut[o]) / Math.max(1, Math.abs(qOut[o]));
      if (rel > worst[o]) worst[o] = rel;
    }
    const rows = compare(flow, aOut, qOut);
    if (flow === "鸣金虹") {
      const rows0 = rows.filter(r => !r.startsWith("output[2]"));
      if (rows0.length) { mismatch++; if (mismatch <= 2) lines.push(`    鸣金虹 例${i}: ${rows0.join(" | ")}`); }
      const rel2 = Math.abs(aOut[2] - qOut[2]) / Math.max(1, Math.abs(qOut[2]));
      if (rel2 >= 0.005) { mismatch++; if (mismatch <= 2) lines.push(`    鸣金虹 例${i}: output[2] rel=${(rel2 * 100).toFixed(3)}%`); }
    } else if (rows.length) {
      mismatch++;
      if (mismatch <= 2) lines.push(`    ${flow} 例${i}: ${rows.join(" | ")}`);
    }
  }
  if (mismatch) fail(`${flow} 随机语料 ${mismatch}/${N} 例不一致`);
  lines.push(`  ${flow}: ${mismatch ? mismatch + "/" + N + " 不一致" : "全部通过 (容差内)"} — 最坏相对差 ` +
    worst.map((v, o) => v === 0 ? `o${o}=0` : `o${o}=${v.toExponential(2)}`).join(" "));
}

// --- report -------------------------------------------------------------------
lines.unshift("Assistant (新版) vs Q7 — 计算器层 parity");
lines.unshift("=".repeat(60));
if (failures) lines.unshift(`FAIL: ${failures} 项失败`);
else lines.unshift("PASS: 全部通过");
console.log(lines.join("\n"));
console.log(JSON.stringify({ status: failures ? "fail" : "ok", flows: flowNames.length, randomCasesPerFlow: N, failures }));
process.exitCode = failures ? 1 : 0;