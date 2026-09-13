import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../../../static/tools/yysls-tiaolv/assets/js/local-customizations.js", import.meta.url),
  "utf8",
);

const viewMatch = source.match(/function buildZhuanlvTargetView\(subStats, subStatIndex, targets\) \{[\s\S]*?\n    \}/);
assert.ok(viewMatch, "transmutation target view builder must exist");

const excludedMatch = source.match(/function resolveZhuanlvExcludedTargets\(slotIndex, perSlotDraft, savedStatus, defaultExcluded, availableTargets\) \{[\s\S]*?\n    \}/);
assert.ok(excludedMatch, "per-slot transmutation exclusion resolver must exist");

const context = {};
vm.runInNewContext(
  `${viewMatch[0]}\n${excludedMatch[0]}\nthis.buildView = buildZhuanlvTargetView; this.resolveExcluded = resolveZhuanlvExcludedTargets;`,
  context,
);

const targets = ["最大外功攻击", "会意率", "精准率", "劲"];

const before = context.buildView([{ type: "最小外功攻击" }, { type: "精准率" }], 0, targets);
assert.equal(before.disabledReasons["最小外功攻击"], "自身词条，无需转律", "the checked row stat is the self stat");
assert.match(before.disabledReasons["精准率"], /重复/, "another row stat is reported as duplicate");
assert.equal(before.disabledReasons["最大外功攻击"], undefined, "unrelated stats stay selectable");

const after = context.buildView([{ type: "最大外功攻击" }, { type: "精准率" }], 0, targets);
assert.equal(after.disabledReasons["最大外功攻击"], "自身词条，无需转律", "changing the row stat updates the self stat");
assert.equal(after.disabledReasons["最小外功攻击"], undefined, "the previously blocked stat becomes selectable");
assert.match(after.disabledReasons["精准率"], /重复/, "duplicate detection follows the live form");

assert.deepEqual(
  Array.from(context.resolveExcluded(1, { 1: ["会意率", "非法词条"] }, { state: "active", subStatIndex: 1, excludedTargets: ["劲"] }, ["会意率", "精准率"], targets)),
  ["会意率"],
  "the per-slot draft wins and is filtered to available targets",
);
assert.deepEqual(
  Array.from(context.resolveExcluded(1, {}, { state: "active", subStatIndex: 1, excludedTargets: ["劲", "非法词条"] }, ["会意率"], targets)),
  ["劲"],
  "a saved status matching the slot is used when no draft exists",
);
assert.deepEqual(
  Array.from(context.resolveExcluded(2, {}, { state: "active", subStatIndex: 1, excludedTargets: ["劲"] }, ["会意率"], targets)),
  ["会意率"],
  "a saved status for another slot falls back to defaults",
);
assert.deepEqual(
  Array.from(context.resolveExcluded(0, {}, null, ["劲"], targets)),
  ["劲"],
  "defaults apply when nothing else matches",
);

console.log("transmutation target refresh tests passed");
