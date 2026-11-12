(function () {
    "use strict";

    window.YYSLS_ACTIVE_ENGINE = "q7";
    window.YYSLS_ENGINE_MANIFEST = Object.freeze({
        q7: Object.freeze({ id: "q7", label: "Q7 原版", wasmHash: "0ad22a524ef4d8d65ccf83bca3bca02207ba0f38d48f03f3969e13a785175ab5" })
    });

    window.YYSLSWriteEngineScripts = function () {
        const scripts = [
            "assets/engines/q7/generated-calc-strings.js?v=202611121604",
            "assets/engines/q7/generated-calc-metadata.js?v=202611121604",
            "assets/engines/q7/q7-app-config.js?v=202611121604",
            "assets/engines/q7/excel-runtime.js?v=202611121604"
        ];
        document.write(scripts.map(src => `<script src="${src}"><\/script>`).join(""));
    };
}());
