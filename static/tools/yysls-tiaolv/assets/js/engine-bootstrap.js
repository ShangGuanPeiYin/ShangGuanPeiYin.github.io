(function () {
    "use strict";

    const STORAGE_KEY = "yysls_calculator_engine";
    const VALID_ENGINES = new Set(["q7", "assistant"]);
    let engine = "q7";
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (VALID_ENGINES.has(saved)) engine = saved;
    } catch (_) {}

    window.YYSLS_ACTIVE_ENGINE = engine;
    window.YYSLS_ENGINE_STORAGE_KEY = STORAGE_KEY;
    window.YYSLS_ENGINE_MANIFEST = Object.freeze({
        q7: Object.freeze({ id: "q7", label: "Q7 原版", wasmHash: "5194ba0c7debed8b2a5c49a5bb2fda13fc5f2fd28dc2d84cb2080f381b0d5d25" }),
        assistant: Object.freeze({ id: "assistant", label: "测试新版" })
    });

    window.YYSLSWriteEngineScripts = function () {
        const scripts = engine === "q7" ? [
            "assets/engines/q7/generated-calc-strings.js?v=fb1b0ce4",
            "assets/engines/q7/generated-calc-metadata.js?v=9edc0cd6",
            "assets/engines/q7/q7-app-config.js?v=84d042ea",
            "assets/engines/q7/excel-runtime.js?v=21aa2e62"
        ] : [
            "assets/js/generated-calc-strings.js?v=202608110029",
            "assets/js/generated-calc-metadata.js?v=202608131401",
            "assets/js/excel-runtime.js?v=202608121302"
        ];
        document.write(scripts.map(src => `<script src="${src}"><\/script>`).join(""));
    };

    function bindSelector() {
        const select = document.getElementById("engine-source-select");
        if (!select) return;
        select.value = engine;
        select.addEventListener("change", function () {
            const next = VALID_ENGINES.has(select.value) ? select.value : "q7";
            if (next === engine) return;
            try { localStorage.setItem(STORAGE_KEY, next); } catch (_) {}
            select.disabled = true;
            window.location.reload();
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindSelector, { once: true });
    else bindSelector();
}());
