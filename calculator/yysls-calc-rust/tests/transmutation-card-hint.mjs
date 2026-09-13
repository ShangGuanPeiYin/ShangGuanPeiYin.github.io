import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../../../static/tools/yysls-tiaolv/assets/js/local-customizations.js", import.meta.url),
  "utf8",
);
const match = source.match(/function buildZhuanlvTargetHint\(equip, subStatIndex, status\) \{[\s\S]*?\n    \}/);
assert.ok(match, "card transmutation hint builder must exist");

const context = {
  CommonData: {
    TRANSMUTATION_POOLS: {
      shared: ["最大外功攻击", "会意率", "劲", "势", "最大无相攻击"],
    },
  },
  ZHUANLV_STAT_ABBR: {
    "最大外功攻击": "大外",
    "最小外功攻击": "小外",
    "最大无相攻击": "无相",
    "会意率": "会意",
  },
  filterTransmutationTargetsForEquip: (_, targets) => targets,
};
vm.runInNewContext(`${match[0]}; this.buildHint = buildZhuanlvTargetHint;`, context);

const hint = context.buildHint(
  {
    subStats: [{ type: "最小外功攻击" }, { type: "精准率" }],
  },
  0,
  { excludedTargets: ["会意率", "最大无相攻击"] },
);

assert.equal(hint, "（大外/劲/势）", "card hint must only show checked usable targets");

console.log("transmutation card hint tests passed");
