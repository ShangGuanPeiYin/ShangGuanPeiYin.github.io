import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../../../static/tools/yysls-tiaolv/assets/js/best-build-algorithms.js", import.meta.url), "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);

const registry = context.window.YYSLSBestBuildAlgorithms;
assert.equal(typeof registry.createGeneticCore, "function", "genetic core must be exported");
assert.ok(registry.get("genetic-optimizer"), "genetic optimizer must be registered");

const core = registry.createGeneticCore({ seed: "same search context" });
const repeat = registry.createGeneticCore({ seed: "same search context" });
assert.deepEqual(
  Array.from({ length: 8 }, () => core.random()),
  Array.from({ length: 8 }, () => repeat.random()),
  "the context-seeded PRNG must be deterministic",
);

const population = [
  { genes: [0, 0], fitness: 1 },
  { genes: [1, 1], fitness: 4 },
  { genes: [2, 2], fitness: 3 },
  { genes: [3, 3], fitness: 2 },
];
assert.equal(core.tournament(population, 4).fitness, 4, "tournament selection must keep the strongest sampled individual");

const [left, right] = core.crossover({ genes: [0, 0, 0, 0] }, { genes: [1, 1, 1, 1] }, 1);
assert.equal(left.genes.length, 4, "crossover preserves chromosome length");
assert.equal(right.genes.length, 4, "crossover produces a second child");
assert.ok(left.genes.some((gene, index) => gene !== right.genes[index]), "uniform crossover mixes parent genes");

const mutated = core.mutate({ genes: [0, 0, 0] }, [[0, 1], [0, 1], [0, 1]], 1);
assert.notDeepEqual(mutated.genes, [0, 0, 0], "mutation changes a gene when its rate is one");

const repaired = core.repair({ genes: [0, 0] }, [[{ originalId: "same" }], [{ originalId: "same" }, { originalId: "other" }]]);
assert.deepEqual(repaired.genes, [0, 1], "repair replaces a conflicting physical equipment gene");

const islands = [
  [{ genes: [0], fitness: 1 }, { genes: [1], fitness: 4 }],
  [{ genes: [2], fitness: 2 }, { genes: [3], fitness: 3 }],
];
core.migrate(islands, 1);
assert.ok(islands[1].some(individual => individual.fitness === 4), "migration forwards island elites");

let evaluations = 0;
assert.equal(core.cachedEvaluate("a", () => ++evaluations), 1);
assert.equal(core.cachedEvaluate("a", () => ++evaluations), 1, "evaluation cache reuses prior values");
assert.equal(evaluations, 1);
core.setCached("b", { fitness: 9 });
assert.deepEqual(core.getCached("b"), { fitness: 9 }, "batch evaluation can reuse an explicit cached value");
assert.throws(() => core.ensureActive(() => true), /cancelled/, "cancellation aborts optimizer work");

console.log("genetic optimizer core tests passed");
