import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../../../static/tools/yysls-tiaolv/assets/js/app.min.js", import.meta.url),
  "utf8",
);
const match = source.match(/function buildFlowTypeTagHtml\(flowType\) \{[\s\S]*?\n\}/);
assert.ok(match, "flow type tag builder must exist");

const context = {};
vm.runInNewContext(`${match[0]}\nthis.buildTag = buildFlowTypeTagHtml;`, context);

assert.match(context.buildTag("大外流"), /background:#ff9800/, "大外流 keeps its orange tag");
assert.match(context.buildTag("大外流"), />大外流</, "大外流 label is unchanged");
assert.match(context.buildTag("小外流"), /background:#00bcd4/, "小外流 keeps its cyan tag");
assert.match(context.buildTag("小外流"), />小外流</, "小外流 label is unchanged");
assert.match(context.buildTag("不限制"), /background:#6b7280/, "both-usable flow gets a neutral gray tag");
assert.match(context.buildTag("不限制"), />大\/小外流</, "both-usable flow label reads 大/小外流");
assert.equal(context.buildTag(""), "", "an unknown flow type renders no tag");
assert.equal(context.buildTag(undefined), "", "a missing flow type renders no tag");

console.log("flow type tag tests passed");
