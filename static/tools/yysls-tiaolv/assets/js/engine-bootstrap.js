(function () {
    "use strict";

    window.YYSLS_ACTIVE_ENGINE = "q7";
    window.YYSLS_ENGINE_MANIFEST = Object.freeze({
        q7: Object.freeze({ id: "q7", label: "Q7 原版", wasmHash: "881f10a3f2d393d06612a2080157a3e3ad2438f351b269594aeaa8450f2659fc" })
    });

    window.YYSLSWriteEngineScripts = function () {
        const scripts = [
            "assets/engines/q7/generated-calc-strings.js?v=202611111402",
            "assets/engines/q7/generated-calc-metadata.js?v=202611111402",
            "assets/engines/q7/q7-app-config.js?v=202611111402",
            "assets/engines/q7/excel-runtime.js?v=202611111402"
        ];
        document.write(scripts.map(src => `<script src="${src}"><\/script>`).join(""));
    };
}());
