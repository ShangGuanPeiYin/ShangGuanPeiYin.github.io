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

    window.YYSLSBestBuildAlgorithms = Object.freeze({ register, get, list, deduplicateCandidatesByQuality });
}());
