---
name: tiaolv-excel-update
description: Rebuild and publish the Tiaolv Excel calculators after workbooks are replaced or versions are added. Use for requests to update Excel formulas, regenerate Excel WASM modules, change workbook versions, or verify calculator parity from static/tools/yysls-tiaolv/excels.
---

# Tiaolv Excel Update

Read `references/contracts.md` before changing the generator, runtime, metadata or modules.

## Workflow

1. Preserve unrelated work and record the Panel WASM SHA-256.
2. Run `scripts/inventory_workbooks.py`. Stop on missing/duplicate flows, external links, cached formula errors or an unexpected workbook count.
3. Inspect formula functions used by the new workbooks. Extend the compiler and its tests for every new function; never silently return zero, copy cached outputs as formulas, or skip unsupported cells.
4. Run `scripts/rebuild_excel_modules.sh`. It regenerates direct Rust formulas, builds 11 flow-version WASMs, finalizes hashes, and runs parity/performance checks.
5. Confirm the Panel WASM hash and 36-output contract are unchanged.
6. Test normal calculation, manual attributes, best build, cultivation, transmutation, flow-version persistence and Excel export. Verify the initial page requests no Excel module and each flow module loads at most once.
7. Update calculation documentation, modified JS `?v=` tags, all site-update-time locations and calculator baselines.
8. Run the Tiaolv customization check and Hugo build. Publish only task files with the project publication script, then report commit, displayed update time, module sizes and parity counts.

## Hard gates

- Require 40 inputs and 5 outputs for every Excel module.
- Compare all five outputs against the migration oracle by Float64 bit pattern for the fixed corpus. 破竹鸢2.4 is the documented exception because the retired interpreter disagrees with the current workbook; validate its default outputs against the workbook cache and keep its generated direct-formula tests instead of reproducing the old error.
- Require every module gzip size to be at most 1 MB. The accepted migration performance floor is at least 3.5× overall and 1.8× for every individual flow; record any flow below the original 5× target.
- Keep the old interpreter until all gates pass; after migration, keep the checked-in parity fixture/tooling needed to validate future Excel replacements.
- Do not change Panel values, equipment values, resistance, Excel formulas, baselines or UI behavior unless separately requested.

## Commands

```bash
python3 skills/tiaolv-excel-update/scripts/inventory_workbooks.py
skills/tiaolv-excel-update/scripts/rebuild_excel_modules.sh
./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh
hugo --minify
```
