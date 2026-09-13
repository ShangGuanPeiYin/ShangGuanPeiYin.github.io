import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../../../static/tools/yysls-tiaolv/assets/js/app.min.js", import.meta.url),
  "utf8",
);
const match = source.match(/formatBestBuildEta = seconds => \{[\s\S]*?\n    \},/);
assert.ok(match, "best-build ETA formatter must exist");

const context = {};
vm.runInNewContext(`${match[0].replace(/,$/, ";")} this.format = formatBestBuildEta;`, context);

assert.equal(context.format(0.4), "不到 1 秒", "sub-second remainder is described as under one second");
assert.equal(context.format(30), "30 秒", "under a minute uses whole seconds");
assert.equal(context.format(90), "1 分 30 秒", "under an hour uses minutes and seconds");
assert.equal(context.format(3725), "1 小时 2 分", "an hour or more uses hours and minutes");
assert.equal(context.format(Infinity), "--", "an unknown speed yields a placeholder");
assert.equal(context.format(NaN), "--", "a non-numeric estimate yields a placeholder");
assert.equal(context.format(-1), "--", "a negative estimate yields a placeholder");

console.log("best-build ETA format tests passed");
