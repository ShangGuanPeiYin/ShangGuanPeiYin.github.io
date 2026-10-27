(function () {
    "use strict";

    window.YYSLS_ACTIVE_ENGINE = "q7";
    window.YYSLS_ENGINE_MANIFEST = Object.freeze({
        q7: Object.freeze({ id: "q7", label: "Q7 原版", wasmHash: "a0db77a599681eaf4c6368f83ae784ba942a89bbc5a81b787ec2b600c64138c0" })
    });

    window.YYSLSWriteEngineScripts = function () {
        const scripts = [
            "assets/engines/q7/generated-calc-strings.js?v=202610271052",
            "assets/engines/q7/generated-calc-metadata.js?v=202610271052",
            "assets/engines/q7/q7-app-config.js?v=202610271052",
            "assets/engines/q7/excel-runtime.js?v=202610271052"
        ];
        document.write(scripts.map(src => `<script src="${src}"><\/script>`).join(""));
    };
}());
