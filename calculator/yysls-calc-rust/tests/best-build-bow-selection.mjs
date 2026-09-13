import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../../../static/tools/yysls-tiaolv/assets/js/app.min.js", import.meta.url),
  "utf8",
);
const match = source.match(/normalizeBestBuildBowTypes = \(selectedBowTypes, currentBowType\) => \{[\s\S]*?\n    \},/);
assert.ok(match, "best-build bow selection normalizer must exist");

const context = { BEST_BUILD_BOW_TYPES: ["precision", "crit", "intent"] };
vm.runInNewContext(`${match[0].replace(/,$/, ";")} this.normalize = normalizeBestBuildBowTypes;`, context);

assert.deepEqual(
  Array.from(context.normalize(undefined, "crit")),
  ["crit"],
  "an unset selection defaults to the current bow",
);
assert.deepEqual(
  Array.from(context.normalize(["precision", "intent"], "crit")),
  ["precision", "intent"],
  "any two selected bows are searched together",
);
assert.deepEqual(
  Array.from(context.normalize(["intent", "precision", "crit"], "precision")),
  ["precision", "crit", "intent"],
  "all three bows are accepted in stable search order",
);
assert.deepEqual(
  Array.from(context.normalize(["crit", "crit", "invalid"], "precision")),
  ["crit"],
  "duplicates and unknown bow types are ignored",
);
assert.deepEqual(
  Array.from(context.normalize([], "intent")),
  ["intent"],
  "an empty selection falls back to the current bow",
);

console.log("best-build bow selection tests passed");
