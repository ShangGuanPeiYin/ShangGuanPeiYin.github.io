---
name: tiaolv-q7-engine-update
description: Fetch, pin, rebuild, and validate the Q7 original calculator engine from yysls.leoq7.com. Use when adding or updating the Q7 engine, Q7 WASM, Q7 metadata, Q7 workbook templates, or Q7 parity tests in this project.
---

# Tiaolv Q7 Engine Update

Read `references/contracts.md` and `doc/tiaolv-local-customizations.md` before changing the Q7 snapshot, loader, or runtime adapter.

## Workflow

1. Record the current Q7 WASM, metadata, strings, runtime, app config, and workbook hashes from `assets/engines/q7/manifest.json`.
2. Run `scripts/fetch_q7_snapshot.py`. It downloads into a temporary directory, validates all required assets and workbooks, then replaces only the namespaced Q7 snapshot.
3. Review the generated manifest. A changed upstream hash is a numeric engine update, even when the public filename is unchanged.
4. Keep upstream Q7 metadata and strings byte-identical. Limit runtime changes to the namespaced WASM URL and the documented `2.45` season-resistance fallback; generate Q7 app constants from upstream and then apply the sole local numeric override `SEASON_STATS.赛季抗性 = 2.45`.
5. Run Q7 upstream/local parity, best-build scoring, workbook hash, browser, site-customization, baseline, and Hugo checks.
6. Update documentation, frontend cache tags, and all site update-time locations. Publish only after every gate passes.

## Hard gates

- Q7 uses the pinned original single WASM for Panel and five class outputs; never substitute another engine's output or silently fall back.
- Compare 37 Panel fields and five class outputs by Float64 bit pattern across every flow, a fixed matrix, and at least 1,000,000 fixed-seed cases.
- Q7 best-build candidates use generic original-WASM scoring; the compiled direct-module fast path no longer exists.
- Cache keys and workbook paths include the engine ID. Q7 exposes only its current workbook versions.
- Q7's pinned WASM, metadata, strings, workbooks, and all other constants remain upstream-identical; the season resistance is intentionally overridden from upstream `2.15` to local `2.45`.

## Commands

```bash
python3 skills/tiaolv-q7-engine-update/scripts/fetch_q7_snapshot.py
node tests/q7/q7-dual-engine-parity.mjs
./skills/tiaolv-site-checks/scripts/check_tiaolv_customizations.sh
hugo --minify
```
