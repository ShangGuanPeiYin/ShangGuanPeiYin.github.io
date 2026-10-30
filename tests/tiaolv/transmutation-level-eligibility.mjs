import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const localUrl = new URL(
  "../../static/tools/yysls-tiaolv/assets/js/local-customizations.js",
  import.meta.url,
);
const appUrl = new URL(
  "../../static/tools/yysls-tiaolv/assets/js/app.min.js",
  import.meta.url,
);
const source = fs.readFileSync(localUrl, "utf8");
const appSource = fs.readFileSync(appUrl, "utf8");

// 规则：110 级及以上（110、115）都可转律；承音与紫装不影响资格。
function extract(pattern, label) {
  const match = source.match(pattern);
  assert.ok(match, `${label} must exist`);
  return match[0];
}

const levelMatch = extract(
  /function isTransmutationLevel\(level\) \{[\s\S]*?\n    \}/,
  "shared transmutation level helper",
);
const eligibleMatch = extract(
  /function isTransmutableEquip\(equip\) \{[\s\S]*?\n    \}/,
  "transmutable equip helper",
);
const normalizeMatch = extract(
  /function normalizeZhuanlvStatus\(status, equip\) \{[\s\S]*?\n    \}/,
  "zhuanlv status normalizer",
);
const versionMatch = source.match(/const TRANSMUTATION_STATUS_MODEL_VERSION = (\d+);/);
assert.ok(versionMatch, "status model version constant must exist");

const context = {};
vm.runInNewContext(
  [
    `const TRANSMUTATION_STATUS_MODEL_VERSION = ${versionMatch[1]};`,
    levelMatch,
    eligibleMatch,
    normalizeMatch,
    "this.isTransmutationLevel = isTransmutationLevel;",
    "this.isTransmutableEquip = isTransmutableEquip;",
    "this.normalizeZhuanlvStatus = normalizeZhuanlvStatus;",
  ].join("\n"),
  context,
);

const equipAt = (level, extra = {}) => ({
  id: 1,
  level,
  isTransmutable: true,
  subStats: [{ type: "劲" }, { type: "会心率" }, { type: "精准率" }, { type: "势" }],
  ...extra,
});

// 等级门槛：110 与 115 都算可转律，低于 110 一律不可转律。
for (const level of [115, 110, "115", "110"]) {
  assert.equal(context.isTransmutableEquip(equipAt(level)), true, `level ${level} is eligible`);
}
for (const level of [105, 100, 96, undefined, null, ""]) {
  assert.equal(context.isTransmutableEquip(equipAt(level)), false, `level ${level} is not eligible`);
}
assert.equal(context.isTransmutableEquip(equipAt(115, { isTransmutable: false })), false, "explicit checkbox required");
assert.equal(context.isTransmutableEquip(equipAt(115, { isTransmutable: "true" })), false, "only boolean true qualifies");
assert.equal(context.isTransmutableEquip(null), false, "missing equip is not eligible");

// 承音、紫装不影响资格。
assert.equal(
  context.isTransmutableEquip(equipAt(115, { isChengyin: true, isPurple: true })),
  true,
  "Chengyin and purple equips keep the eligibility",
);

const status = { state: "active", subStatIndex: 1, excludedTargets: ["会意率"], modelVersion: 3 };
for (const level of [115, 110]) {
  const normalized = context.normalizeZhuanlvStatus(status, equipAt(level));
  assert.ok(normalized, `level ${level} keeps the active slot record`);
  assert.equal(normalized.subStatIndex, 1, "slot index survives");
  assert.deepEqual(Array.from(normalized.excludedTargets), ["会意率"], "excluded targets survive");
}
assert.equal(context.normalizeZhuanlvStatus(status, equipAt(105)), null, "below 110 drops the slot record");
assert.equal(
  context.normalizeZhuanlvStatus(status, equipAt(115, { isTransmutable: false })),
  null,
  "unchecked equips drop the slot record",
);

// 防回归：本文件不得再出现“精确 110”门槛，主脚本也必须保持 >=110。
assert.ok(
  !source.includes("110 === Number("),
  "local-customizations.js must not gate transmutation on exactly level 110",
);
assert.ok(
  appSource.includes("Number(e.level) >= 110 && !0 === e.isTransmutable"),
  "app.min.js keeps the >=110 eligibility gate",
);
assert.ok(
  source.includes("var allowLevel = level >= 110"),
  "the checkbox stays visible for level >= 110",
);

console.log("transmutation level eligibility tests passed");
