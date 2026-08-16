---
name: tiaolv-excel-update
description: Rebuild and publish the Tiaolv Assistant-engine Excel calculators whenever a class workbook or version is updated or a brand-new class workbook arrives. Use for requests to update Excel formulas, add or overwrite workbook versions in static/tools/yysls-tiaolv/excels, regenerate Excel WASM modules, refresh metadata/strings/version tags/site update time, or verify calculator parity. Only covers the Assistant engine; Q7 templates belong to tiaolv-q7-engine-update.
---

# Tiaolv Excel Update (Assistant engine)

Read `references/contracts.md` before changing the generator, runtime, metadata or modules.

## Scope

This skill covers the **Assistant engine only**. Its workbook source is
`static/tools/yysls-tiaolv/excels/` (root directory). Everything under
`excels/q7/`, `assets/engines/q7/`, `assets/wasm/q7/` belongs to
`skills/tiaolv-q7-engine-update` and must not be touched here.

The live site locks an engine at first use (default `q7`). Excel-version
updates change the Assistant engine; keep the Q7 engine byte-identical.

## Registration model

File naming is the registration mechanism — there is no manual manifest to edit:

- `excel-sources.json`, `generated-calc-metadata.js` and `generated-calc-strings.js`
  are all **generated outputs** of `calculator/yysls-calc-rust/scripts/generate_excel_engine.py`, and are committed together with the build.
- Expected: 11 classes / 12 workbooks in the root `excels/` directory, name pattern
  `<类名>110阶...计算器<版本>.xlsx`. 牵丝翊 has independent 1.2 and 2.0 copies (default 2.0).
- Each workbook maps to one module `excel_<slug>_<版本>.wasm`, keyed by
  `FLOW_ORDER` + `FLOW_SLUGS` in `generate_excel_engine.py`.
- A new version number for an existing class simply appears as a new workbook file;
  the generator emits a new module and `finalize_excel_modules.py` deletes the stale module.
- Only 牵丝翊 supports multiple simultaneously shipped versions. Other classes ship exactly
  one current workbook; do not add a second version file unless explicitly requested.

## Workflow

### For a version update or overwrite (the common case)

1. Preserve unrelated work and record the Panel WASM SHA-256
   (`sha256sum static/tools/yysls-tiaolv/assets/wasm/yysls_panel.wasm`).
2. Place the new/changed workbook(s) into `static/tools/yysls-tiaolv/excels/`,
   overwriting the previous file or adding a new version-numbered file.
3. Run `scripts/inventory_workbooks.py`. Stop on missing/duplicate flows, external
   links, cached formula errors or a workbook count other than 12.
4. Inspect the formula functions used by the new workbooks. Extend the compiler and
   its tests for every new function; never silently return zero, copy cached outputs
   as formulas, or skip unsupported cells.
5. Run `scripts/rebuild_excel_modules.sh`. It regenerates direct Rust formulas,
   builds the 12 flow-version WASMs, verifies the known large module is reproducible,
   finalizes hashes into metadata, and runs parity/performance/customization/Hugo checks.
6. Confirm the Panel WASM hash is unchanged and the 36-output / 40-input, 5-output
   contract still holds.
7. Update the frontend version surface (see below) and calculation baselines.
8. Run the browser-runtime parity harness (see below) for `assistant`.
9. Run `./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh` and `hugo --minify`.
10. Publish only task files with `skills/auto-site-publish/scripts/publish_site.sh`,
    then report the commit, displayed update time, module sizes and parity counts.

### For a brand-new class workbook (new 流派)

Same as above plus code registration:

- Add the class name to `FLOW_ORDER` and a slug to `FLOW_SLUGS` in
  `calculator/yysls-calc-rust/scripts/generate_excel_engine.py`.
- Add the class and expected count to `EXPECTED` in `scripts/inventory_workbooks.py`.
- If the new workbook reuses another class' cell structure, extend
  `BASE_KEY_FALLBACK` (e.g. 破竹樽 → 破竹鸢) and, if needed, the per-version cell
  coordinate overrides near it in the generator.
- Keep the total at 12 workbooks (11 classes present this way). Update
  `references/contracts.md` expected set if the class set itself changes.

## Frontend version surface (must-sync on every change)

Whenever the Assistant engine data changes, update together — then bump `?v=`
to the publish timestamp `YYYYMMDDHHmm` for each changed JS file:

- `assets/js/generated-calc-metadata.js` — regenerated; contains `siteUpdateTime`.
- `assets/js/generated-calc-strings.js` — regenerated.
- `assets/js/excel-runtime.js` — only if runtime logic changed.
- `assets/js/engine-bootstrap.js` — the `assistant` branch of
  `window.YYSLSWriteEngineScripts` lists `generated-calc-strings.js` and
  `generated-calc-metadata.js` with `?v=`; bump those and its own `?v=` in `index.html`.
- `static/tools/yysls-tiaolv/index.html` — bump `?v=` on every changed JS/CSS file;
  update the `#xinli-hint` visible “最后更新时间” placeholder text.

Set the page’s published time at the moment of publish, in all three places, exactly
once per release (`YYYY年M月D日 HH:mm:ss`):

1. `generated-calc-metadata.js.config.siteUpdateTime` — regenerated with
   `YYSLS_SITE_UPDATE_TIME="YYYY年M月D日 HH:mm:ss"` when running
   `generate_excel_engine.py`, or set directly.
2. `index.html` `#xinli-hint` “最后更新时间” text.
3. Do **not** change `classRotationStats.*.updateTime`; those are workbook-modified times.

## Commands

```bash
python3 skills/tiaolv-excel-update/scripts/inventory_workbooks.py
skills/tiaolv-excel-update/scripts/rebuild_excel_modules.sh
./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh
hugo --minify
```

### Browser runtime parity (assistant)

```bash
# Terminal 1 — serve the site
.tools/hugo/hugo server -p 1313 --gc --disableFastRender

# Terminal 2 — headless Chrome on 9222, keep alive across shell exit
google-chrome --headless=new --no-sandbox --disable-gpu \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-tiaolv &

# Terminal 3 — run parity
YYSLS_BROWSER_URL="http://127.0.0.1:1313/tools/yysls-tiaolv/" \
YYSLS_ENGINE="assistant" \
  node calculator/yysls-calc-rust/tests/browser-runtime-parity.mjs
```

## Hard gates

- Require 40 inputs and 5 outputs for every Excel module.
- Compare all five outputs against the migration oracle by Float64 bit pattern for the
  fixed corpus. 破竹鸢2.4 is the documented exception: the retired interpreter disagrees
  with the current workbook, so validate its default outputs against the workbook cache
  and keep the generated direct-formula tests.
- Require every module gzip size at most 1 MB and the fixed corpus to complete within
  20 seconds overall / 4 seconds per flow (the old interpreter and its 3.5×/1.8× ratios
  are gone; do not reintroduce them).
- Keep 牵丝霖 on `opt-level=2` with one codegen unit. Compile it a second time in an
  independent temporary output and require byte-for-byte equality with the published
  candidate; a hash or size difference blocks publication.
- Keep the Panel WASM byte-for-byte unchanged during Excel-only updates.
- Do not change Panel values, equipment values, resistance, Excel formulas, baselines
  or UI behavior unless separately requested.
- Never touch Q7 assets (`excels/q7`, `assets/engines/q7`, `assets/wasm/q7`); any change
  to them is a Q7-only update and must go through `skills/tiaolv-q7-engine-update`.