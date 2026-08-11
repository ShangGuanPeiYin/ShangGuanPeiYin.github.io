# Q7 dual-engine contracts

- Engine IDs are `q7` and `assistant`; `q7` is the first-visit default.
- Global persistence key is `yysls_calculator_engine`.
- `window.YYSLS_ACTIVE_ENGINE` is fixed before metadata, strings, runtime, and app configuration load.
- `window.YYSLSExcelRuntime` remains the application facade. Both engines expose `ready`, `panelReady`, `ensureExcel`, `calculate`, `calculatePanel`, `calculateFromPanel`, `exportClassInputData`, and `clearCache`.
- Q7 uses `assets/wasm/q7/yysls_calc.wasm`, Q7 metadata/strings, and `excels/q7/`. It intentionally does not expose compiled best-build methods.
- Assistant uses `assets/wasm/yysls_panel.wasm`, eleven lazy Excel modules, and `excels/`.
- Engine changes reload the page; no in-process metadata hot swap is permitted.
- Equipment records and schemes are shared user data. Numeric caches, flow versions, graduation profiles, and exports are engine-specific.
