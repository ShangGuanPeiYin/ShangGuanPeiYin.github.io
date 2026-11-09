(function () {
    "use strict";

    window.YYSLS_ACTIVE_ENGINE = "q7";
    window.YYSLS_ENGINE_MANIFEST = Object.freeze({
        q7: Object.freeze({ id: "q7", label: "Q7 原版", wasmHash: "4ffa137fce77359fe4ccd9923429c9e2fb4243156f3d3241d36fb0f0371ff7b8" })
    });

    window.YYSLSWriteEngineScripts = function () {
        const scripts = [
            "assets/engines/q7/generated-calc-strings.js?v=202611091558",
            "assets/engines/q7/generated-calc-metadata.js?v=202611091558",
            "assets/engines/q7/q7-app-config.js?v=202611091558",
            "assets/engines/q7/excel-runtime.js?v=202611091558"
        ];
        document.write(scripts.map(src => `<script src="${src}"><\/script>`).join(""));
    };
}());
