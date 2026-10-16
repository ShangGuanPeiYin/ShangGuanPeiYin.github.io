(function () {
    "use strict";

    window.YYSLS_ACTIVE_ENGINE = "q7";
    window.YYSLS_ENGINE_MANIFEST = Object.freeze({
        q7: Object.freeze({ id: "q7", label: "Q7 原版", wasmHash: "780d39622231860a44e21d922fb1a248e09ae2b4528638958757c222adefe82e" })
    });

    window.YYSLSWriteEngineScripts = function () {
        const scripts = [
            "assets/engines/q7/generated-calc-strings.js?v=202610162141",
            "assets/engines/q7/generated-calc-metadata.js?v=202610162141",
            "assets/engines/q7/q7-app-config.js?v=202610162141",
            "assets/engines/q7/excel-runtime.js?v=202610162141"
        ];
        document.write(scripts.map(src => `<script src="${src}"><\/script>`).join(""));
    };
}());
