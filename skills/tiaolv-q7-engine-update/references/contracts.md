# Q7 engine contracts

- Single engine: `q7`.
- `window.YYSLS_ACTIVE_ENGINE` is fixed to `q7` before metadata, strings, runtime, and app configuration load.
- `window.YYSLSExcelRuntime` remains the application facade. Q7 exposes `ready`, `panelReady`, `ensureExcel`, `calculate`, `calculatePanel`, `calculateFromPanel`, `exportClassInputData`, and `clearCache`.
- Q7 uses `assets/wasm/q7/yysls_calc.wasm`, Q7 metadata/strings (`assets/engines/q7/`), and `excels/q7/`. It intentionally does not expose compiled best-build methods.
- The pinned Q7 WASM, metadata, strings, workbooks, equipment values, rotations, and graduation baselines remain upstream-identical. The sole local numeric override is `CommonData.SEASON_STATS["赛季抗性"] = 2.45`, replacing upstream `2.15` for precision, critical, intent, cap, and overflow calculations.
- `assets/engines/q7/manifest.json` records the override as `localOverrides.seasonResistance`; the Q7 runtime fallback must also be `2.45`. Snapshot regeneration must reapply both values and must not silently restore `2.15`.
- Engine changes reload the page; no in-process metadata hot swap is permitted.
- Equipment records and schemes are shared user data. Numeric caches, flow versions, graduation profiles, and exports are engine-specific.
