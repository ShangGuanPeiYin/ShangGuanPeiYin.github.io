(function () {
    "use strict";

    window.YYSLS_ACTIVE_ENGINE = "q7";
    window.YYSLS_ENGINE_MANIFEST = Object.freeze({
        q7: Object.freeze({ id: "q7", label: "Q7 原版", wasmHash: "521c96b64d8ca6056024838c76950c67fc13005e6afa6a62a2995ade394c0d06" })
    });

    window.YYSLSWriteEngineScripts = function () {
        const scripts = [
            "assets/engines/q7/generated-calc-strings.js?v=202610101717",
            "assets/engines/q7/generated-calc-metadata.js?v=202610101717",
            "assets/engines/q7/q7-app-config.js?v=202610101717",
            "assets/engines/q7/excel-runtime.js?v=202610101717"
        ];
        document.write(scripts.map(src => `<script src="${src}"><\/script>`).join(""));
    };
}());
