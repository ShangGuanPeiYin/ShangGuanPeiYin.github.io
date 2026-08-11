# Excel calculator contracts

## Sources and products

- Source directory: `static/tools/yysls-tiaolv/excels/`.
- Expected source set: 10 PVE classes and 11 workbook versions; 牵丝翊 has independent 1.2 and 2.0 versions, defaulting to 2.0.
- Generated modules: `static/tools/yysls-tiaolv/assets/wasm/excel/excel_<flow>_<version>.wasm`.
- Mapping and hashes: `YYSLS_CALC_METADATA.flowExcelModules`.

## ABI

Each module owns separate WebAssembly memory and exports:

- `memory`
- `yysls_alloc_f64(len)` / `yysls_free_f64(ptr, len)`
- `yysls_class_input_len()` → `40`
- `yysls_class_output_len()` → `5`
- `yysls_calc_class(flowId, inputPtr)`
- `yysls_calc_class_outputs(flowId, inputPtr, outputPtr)`

Output order is total damage, ADPS, graduation ratio, RDPS, RDPS graduation ratio. Percent inputs use Excel decimal units. String inputs use IDs from `generated-calc-strings.js`.

## Runtime

- `YYSLSExcelRuntime.ready` and `panelReady` resolve when the 29 KB Panel module is usable.
- `ensureExcel(flowName)` loads only the selected flow-version module and caches its instance.
- Synchronous calculations return no graduation result while a module is loading and schedule an automatic recalculation after loading.
- Panel calculation must remain available without any Excel request.

## Version and publication invariants

- Workbook filename supplies class/version; metadata supplies module filename and SHA-256 cache key.
- `flowGraduationProfiles` remains version-specific.
- 破竹鸢2.4以当前工作簿公式及有效缓存输出为数值裁判；旧39 MB解释器的该流派结果已确认过期，不得作为新模块预期值。
- Panel WASM must remain byte-for-byte unchanged during Excel-only updates.
- 性能验收下限为10个旧引擎可比流派整体至少3.5倍、任一单流派至少1.8倍；模块gzip仍不得超过1 MB。
- Follow `AGENTS.md` for JS tags, site time, validation, scoped staging and publication.
