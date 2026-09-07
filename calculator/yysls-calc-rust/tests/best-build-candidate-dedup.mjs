import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../../../static/tools/yysls-tiaolv/assets/js/best-build-algorithms.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);

const deduplicate = context.window.YYSLSBestBuildAlgorithms.deduplicateCandidatesByQuality;
assert.equal(typeof deduplicate, "function", "candidate quality deduplicator must be exported");

function equip(id, mainValue, subStats, extra = {}) {
  return {
    id,
    slotId: "5",
    mainStat: { type: "精准率", value: mainValue },
    subStats: subStats.map(([type, value]) => ({ type, value })),
    ...extra,
  };
}

const lower = equip("lower", 90, [["会心率", 90], ["劲", 90]]);
const higher = equip("higher", 100, [["劲", 100], ["会心率", 100]]);
const different = equip("different", 100, [["会意率", 100], ["劲", 100]]);
const quality = item => [item.mainStat, ...item.subStats].reduce((sum, stat) => sum + stat.value, 0) / (item.subStats.length + 1);

assert.deepEqual(
  Array.from(deduplicate([lower, higher, different], quality), item => item.id),
  ["higher", "different"],
  "same final stat structure should keep the highest average-quality candidate",
);

const transmuted = equip("transmuted", 100, [["会心率", 100]], { __transmutationMeta: { toStat: "会心率" } });
const original = equip("original", 100, [["会心率", 100]]);
assert.equal(
  deduplicate([transmuted, original], quality)[0].id,
  "original",
  "equal quality should prefer a candidate without transmutation",
);

const syntheticChengyin = equip("synthetic_chengyin", 100, [["会心率", 100]]);
assert.equal(
  deduplicate([syntheticChengyin, original], quality)[0].id,
  "original",
  "equal quality should prefer a candidate without synthetic Chengyin",
);

console.log("best-build candidate dedup tests passed");
