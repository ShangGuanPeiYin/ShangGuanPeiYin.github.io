import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../../../static/tools/yysls-tiaolv/assets/js/app.min.js", import.meta.url),
  "utf8",
);

const inferMatch = source.match(/function inferFlowType\(mainStat, subStats\) \{[\s\S]*?\n\}/);
assert.ok(inferMatch, "flow type inference must exist");
const resolveMatch = source.match(/function resolveEquipFlowType\(equip\) \{[\s\S]*?\n\}/);
assert.ok(resolveMatch, "equipment flow type resolver must exist");

const context = {};
vm.runInNewContext(
  `${inferMatch[0]}\n${resolveMatch[0]}\nthis.resolve = resolveEquipFlowType;`,
  context,
);

assert.equal(context.resolve({ flowType: "小外流" }), "小外流", "an explicit flow type is preserved");
assert.equal(
  context.resolve({ mainStat: { type: "精准率" }, subStats: [{ type: "最小外功攻击" }] }),
  "不限制",
  "inferred both-usable flow is kept instead of forced to 大外流",
);
assert.equal(
  context.resolve({ mainStat: { type: "最小外功攻击" }, subStats: [{ type: "最小外功攻击" }] }),
  "小外流",
  "two minimum external attacks infer 小外流",
);
assert.equal(
  context.resolve({ mainStat: { type: "最大外功攻击" }, subStats: [{ type: "劲" }] }),
  "大外流",
  "two maximum/jin stats infer 大外流",
);
assert.equal(context.resolve(null), "大外流", "a missing equipment falls back to 大外流");

console.log("flow type normalization tests passed");
