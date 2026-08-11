(function () {
    "use strict";
    const runtime = window.YYSLSExcelRuntime;
    const engine = window.YYSLS_ACTIVE_ENGINE || "q7";
    if (!runtime) throw new Error(`计算引擎未初始化：${engine}`);
    runtime.engineId = engine;
    if (engine === "q7") {
        runtime.panelReady = runtime.ready;
        runtime.ensureExcel = async function () {
            await runtime.ready;
            if (!runtime.available) throw new Error("Q7 原版计算引擎加载失败");
            return runtime;
        };
        runtime.isExcelReady = function () { return !!runtime.available; };
        runtime.loadedExcelFlows = function () {
            return runtime.available ? Object.keys(window.YYSLS_CALC_METADATA.flowIds || {}) : [];
        };
    }
    window.YYSLSCalculatorEngines = Object.freeze({
        active: engine,
        manifest: window.YYSLS_ENGINE_MANIFEST,
        runtime
    });
}());
