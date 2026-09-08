(function () {
    "use strict";

    const algorithms = new Map();

    function register(algorithm) {
        if (!algorithm || typeof algorithm !== "object") throw new TypeError("最佳配装算法必须是对象");
        const id = String(algorithm.id || "").trim();
        const name = String(algorithm.name || "").trim();
        if (!id) throw new Error("最佳配装算法缺少 id");
        if (!name) throw new Error(`最佳配装算法 ${id} 缺少 name`);
        if (typeof algorithm.search !== "function") throw new Error(`最佳配装算法 ${id} 缺少 search(context)`);
        if (algorithms.has(id)) throw new Error(`最佳配装算法已注册: ${id}`);
        const normalized = Object.freeze({
            id,
            name,
            description: String(algorithm.description || ""),
            search: algorithm.search
        });
        algorithms.set(id, normalized);
        return normalized;
    }

    function get(id) {
        return algorithms.get(String(id || "")) || null;
    }

    function list() {
        return Array.from(algorithms.values());
    }

    function deduplicateCandidatesByQuality(candidates, getQuality) {
        const bestByStats = new Map();
        const isBetter = (candidate, current) => {
            const qualityDiff = Number(getQuality(candidate)) - Number(getQuality(current));
            if (qualityDiff) return qualityDiff > 0;
            const candidateTransmuted = !!candidate.__transmutationMeta;
            const currentTransmuted = !!current.__transmutationMeta;
            if (candidateTransmuted !== currentTransmuted) return !candidateTransmuted;
            const candidateNeedsChengyin = String(candidate.id || "").includes("_chengyin");
            const currentNeedsChengyin = String(current.id || "").includes("_chengyin");
            return candidateNeedsChengyin !== currentNeedsChengyin && !candidateNeedsChengyin;
        };
        (candidates || []).forEach(candidate => {
            if (!candidate) return;
            const key = [
                candidate.slotId || "",
                candidate.weaponTypeId || "",
                candidate.mainStat && candidate.mainStat.type || "",
                (candidate.subStats || []).map(stat => stat && stat.type || "").sort().join("\u0001")
            ].join("\u0002");
            const current = bestByStats.get(key);
            if (!current || isBetter(candidate, current)) bestByStats.set(key, candidate);
        });
        return Array.from(bestByStats.values());
    }

    const GENETIC_DEFAULTS = Object.freeze({
        islands: 4,
        population: 64,
        generations: 40,
        elitism: 8,
        tournamentSize: 4,
        crossoverRate: .85,
        mutationMin: .12,
        mutationMax: .35,
        migrationEvery: 5,
        migrants: 4,
        stagnationGenerations: 10,
        archiveSize: 200
    });

    function hashSeed(value) {
        let hash = 2166136261;
        const text = String(value || "genetic-optimizer");
        for (let index = 0; index < text.length; index++) {
            hash ^= text.charCodeAt(index);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0 || 1;
    }

    function createGeneticCore(options) {
        let state = hashSeed(options && options.seed);
        const cache = new Map();
        const random = () => {
            state += 0x6D2B79F5;
            let value = state;
            value = Math.imul(value ^ value >>> 15, value | 1);
            value ^= value + Math.imul(value ^ value >>> 7, value | 61);
            return ((value ^ value >>> 14) >>> 0) / 4294967296;
        };
        const clone = individual => ({ ...individual, genes: individual.genes.slice() });
        const tournament = (population, size) => {
            let selected = null;
            for (let index = 0; index < Math.max(1, size); index++) {
                const candidate = population[Math.floor(random() * population.length)];
                if (!selected || candidate.fitness > selected.fitness) selected = candidate;
            }
            return clone(selected);
        };
        const crossover = (left, right, rate) => {
            const first = clone(left), second = clone(right);
            if (random() >= rate) return [first, second];
            for (let index = 0; index < first.genes.length; index++) {
                if (random() < .5) [first.genes[index], second.genes[index]] = [second.genes[index], first.genes[index]];
            }
            // Keep the two weapon genes linked in half of crossovers.
            if (first.genes.length > 1 && random() < .5) {
                [first.genes[0], first.genes[1]] = [left.genes[0], left.genes[1]];
                [second.genes[0], second.genes[1]] = [right.genes[0], right.genes[1]];
            }
            return [first, second];
        };
        const mutate = (individual, pools, rate) => {
            const result = clone(individual);
            const edits = random() < .25 ? 2 : 1;
            for (let edit = 0; edit < edits; edit++) {
                if (random() >= rate) continue;
                const index = Math.floor(random() * result.genes.length);
                const pool = pools[index] || [];
                if (pool.length > 1) {
                    let next = Math.floor(random() * pool.length);
                    if (next === result.genes[index]) next = (next + 1) % pool.length;
                    result.genes[index] = next;
                }
            }
            return result;
        };
        const repair = (individual, pools) => {
            const result = clone(individual), used = new Set();
            result.genes.forEach((gene, index) => {
                const pool = pools[index] || [];
                let candidate = pool[gene];
                const identity = item => {
                    const id = item && (item.originalId || item.sourceEquipId || item.id);
                    return String(id || "").replace(/_chengyin(?:_trans_.*)?$|_trans_.*$/, "");
                };
                if (candidate && used.has(identity(candidate))) {
                    const replacement = pool.findIndex(item => item && !used.has(identity(item)));
                    if (replacement >= 0) {
                        result.genes[index] = replacement;
                        candidate = pool[replacement];
                    }
                }
                if (candidate) used.add(identity(candidate));
            });
            return result;
        };
        const migrate = (islands, count) => {
            const outgoing = islands.map(island => island.slice().sort((left, right) => right.fitness - left.fitness).slice(0, count).map(clone));
            islands.forEach((island, index) => {
                const incoming = outgoing[(index - 1 + islands.length) % islands.length];
                island.sort((left, right) => left.fitness - right.fitness);
                incoming.forEach((individual, incomingIndex) => { island[incomingIndex] = individual; });
            });
        };
        return {
            random, tournament, crossover, mutate, repair, migrate,
            cachedEvaluate(key, evaluate) {
                if (!cache.has(key)) cache.set(key, evaluate());
                return cache.get(key);
            },
            getCached(key) {
                return cache.get(key);
            },
            setCached(key, value) {
                cache.set(key, value);
                return value;
            },
            ensureActive(isCancelled) {
                if (isCancelled && isCancelled()) throw new Error("genetic optimizer cancelled");
            }
        };
    }

    register({
        id: "genetic-optimizer",
        name: "智能遗传搜索",
        description: "近似搜索：多岛遗传优化，适合大型装备库",
        search: context => context.owner.findBestBuildGenetic(context)
    });

    window.YYSLSBestBuildAlgorithms = Object.freeze({ register, get, list, deduplicateCandidatesByQuality, createGeneticCore, GENETIC_DEFAULTS });
}());
