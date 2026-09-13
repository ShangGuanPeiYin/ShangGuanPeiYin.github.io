import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../../../static/tools/yysls-tiaolv/assets/js/app.min.js", import.meta.url),
  "utf8",
);
const match = source.match(/function matchesFlowTypeFilter\(equipFlowType, filter\) \{[\s\S]*?\n\}/);
assert.ok(match, "flow type filter matcher must exist");

const context = {};
vm.runInNewContext(`${match[0]}\nthis.matches = matchesFlowTypeFilter;`, context);

assert.equal(context.matches("大外流", "大外流"), true, "the selected flow matches itself");
assert.equal(context.matches("不限制", "大外流"), true, "both-usable equipment appears under 大外流");
assert.equal(context.matches("不限制", "小外流"), true, "both-usable equipment appears under 小外流");
assert.equal(context.matches("小外流", "大外流"), false, "a different single flow is excluded");
assert.equal(context.matches(undefined, "大外流"), true, "legacy equipment without flow type still appears");
assert.equal(context.matches("小外流", null), true, "no active filter keeps every equipment");

console.log("flow type filter tests passed");
