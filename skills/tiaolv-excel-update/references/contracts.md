# Excel calculator contracts (Assistant engine)

## Scope

These contracts cover the **Assistant** engine only. `excels/q7/`,
`assets/engines/q7/`, and `assets/wasm/q7/` are owned by
`skills/tiaolv-q7-engine-update` and must not be changed here.

## Sources and products

- Source directory: `static/tools/yysls-tiaolv/excels/` (root). Never write to the
  `q7/` subdirectory from this skill.
- Expected source set: 11 classes, 11 workbook versions (one current workbook each), aligned with the Q7 engine's workbook versions. 牵丝翊 ships only its current 2.2 version; the retired 1.2 is not part of the Assistant set.
- Generated modules: `static/tools/yysls-tiaolv/assets/wasm/excel/excel_<flow>_<version>.wasm`.
- Mapping, hashes and gzip sizes: `YYSLS_CALC_METADATA.flowExcelModules`, written by
  `calculator/yysls-calc-rust/scripts/finalize_excel_modules.py`.
- `calculator/yysls-calc-rust/excel-sources.json` is a generated manifest (input length,
  output length, per-workbook baseline/use-time), committed alongside every build.

## Registration and naming

- The root `excels/` filename is the registration: `<类名>110阶...计算器<版本>.xlsx`.
- `FLOW_ORDER` and `FLOW_SLUGS` in
  `calculator/yysls-calc-rust/scripts/generate_excel_engine.py` map class → slug →
  module name; a brand-new class must be added to both (and to
  `scripts/inventory_workbooks.py` `EXPECTED`).
- 破竹樽 reuses 破竹鸢's cell structure via `BASE_KEY_FALLBACK`; the per-version cell
  coordinate overrides in the generator remain authoritative for 破竹樽 (third/fourth
  xinfa at `期望!E22`/`期望!E24`).
- A changed workbook content with the same filename, or a new version-numbered file,
  both count as an update. The generator emits module artifacts for every indexed
  workbook and `finalize_excel_modules.py` deletes stale `excel_*.wasm` not in the set.

## ABI

Each module owns separate WebAssembly memory and exports:

- `memory`
- `yysls_alloc_f64(len)` / `yysls_free_f64(ptr, len)`
- `yysls_class_input_len()` → `40`
- `yysls_class_output_len()` → `5`
- `yysls_calc_class(flowId, inputPtr)`
- `yysls_calc_class_outputs(flowId, inputPtr, outputPtr)`

Output order is total damage, ADPS, graduation ratio, RDPS, RDPS graduation ratio.
Percent inputs use Excel decimal units. String inputs use IDs from
`generated-calc-strings.js`. 36 output fields are compared by Float64 bit pattern.

## Runtime

- `YYSLSExcelRuntime.ready` and `panelReady` resolve when the 29 KB Panel module is usable.
- `ensureExcel(flowName)` loads only the selected flow-version module and caches its instance.
- General synchronous display calculations may return no graduation result while a module
  is loading and schedule an automatic recalculation after loading. Best build, cultivation,
  transmutation and Excel export must await the selected module before their first
  synchronous calculation; they must never continue with zero values or an old-engine fallback.
- Panel calculation must remain available without any Excel request.

## Version and publication invariants

- Workbook filename supplies class/version; metadata supplies module filename and SHA-256 cache key.
- `flowGraduationProfiles` remains version-specific.
- Only one workbook version per class is shipped for the Assistant engine
  (`classTableVersions` stays empty), matching the Q7 engine's single-version set.
- Panel WASM must remain byte-for-byte unchanged during Excel-only updates.
- `siteUpdateTime` reflects the page publish timestamp; `classRotationStats.*.updateTime`
  reflects the workbook's modified time. Keep them distinct.
- Fixed parity corpus: overall ≤ 20 s, per flow ≤ 4 s; module gzip ≤ 1 MB. The retired
  interpreter (and its 3.5×/1.8× ratios and migration-oracle role) no longer exists —
  every flow's oracle is the current workbook's cached outputs.
- 牵丝霖 fixed at `opt-level=2`, single codegen unit; the published candidate must match
  an independent second compile byte-for-byte.
- Follow `AGENTS.md` for JS tags, site time, validation, scoped staging and publication.