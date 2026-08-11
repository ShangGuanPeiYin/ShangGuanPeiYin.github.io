---
name: tiaolv-q7-engine-update
description: Fetch, pin, rebuild, and validate the Q7 original calculator engine from yysls.leoq7.com. Use when adding or updating the Q7 engine, Q7 WASM, Q7 metadata, Q7 workbook templates, dual-engine switching, or Q7 parity tests in this project.
---

# Tiaolv Q7 Engine Update

Read `references/contracts.md` and `doc/tiaolv-local-customizations.md` before changing the Q7 snapshot, loader, runtime adapter, or shared application.

## Workflow

1. Record the current Assistant Panel, 11 Excel module, metadata, and workbook hashes.
2. Run `scripts/fetch_q7_snapshot.py`. It downloads into a temporary directory, validates all required assets and ten workbooks, then replaces only the namespaced Q7 snapshot.
3. Review the generated manifest. A changed upstream hash is a numeric engine update, even when the public filename is unchanged.
4. Keep upstream Q7 metadata and strings byte-identical. Limit the Q7 runtime modification to its namespaced WASM URL; generate Q7 app constants from the upstream app source.
5. Run Q7 upstream/local parity, dual-engine isolation, best-build scoring, workbook hash, browser, customization, baseline, and Hugo checks.
6. Update documentation, frontend cache tags, and all site update-time locations. Publish only after every gate passes.

## Hard gates

- Q7 uses the pinned original single WASM for Panel and five class outputs; never substitute Assistant output or silently fall back.
- Compare 36 Panel fields and five class outputs by Float64 bit pattern across ten flows, a fixed matrix, and at least 1,000,000 fixed-seed cases.
- Q7 best-build candidates use generic original-WASM scoring. Assistant alone may use the compiled direct-module fast path.
- Cache keys and workbook paths include the engine ID. Q7 exposes only its ten current workbook versions; Assistant retains its own versions.
- Switching engines persists globally and reloads the page. First use defaults to `q7`.
- Any change to Assistant WASM, workbook, or numeric baseline blocks a Q7-only update.

## Commands

```bash
python3 skills/tiaolv-q7-engine-update/scripts/fetch_q7_snapshot.py
node calculator/yysls-calc-rust/tests/q7-dual-engine-parity.mjs
./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh
hugo --minify
```
