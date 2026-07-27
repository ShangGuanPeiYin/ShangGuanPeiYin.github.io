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

    window.YYSLSBestBuildAlgorithms = Object.freeze({ register, get, list });
}());
