---
name: tiaolv-sync
description: Use when reviewing or synchronizing Tiaolv Panel numeric changes from study/assistant/new/yysls-assistant.cn, or when checking Tiaolv edits while preserving all local UI and behavior.
---

# Tiaolv Numeric Sync

`yysls-assistant.cn` is the Panel numeric reference for the Assistant engine only. The separately namespaced Q7 engine follows `yysls.leoq7.com`; use `skills/tiaolv-q7-engine-update/` for Q7 work. Never mix either engine's metadata, WASM, workbook, cache, or output with the other.

## Required references

Before making decisions, read:

```bash
doc/tiaolv-local-customizations.md
doc/调率站代码实现说明.md
```

## Source boundaries

- Numeric reference: `study/assistant/new/yysls-assistant.cn/`.
- Previous numeric reference: `study/assistant/old/yysls-assistant.cn/`.
- Live application: `static/tools/yysls-tiaolv/`.
- Locally maintained Panel source: `calculator/yysls-calc-rust/`.
- Q7 assets are outside this skill's scope and must remain byte-for-byte unchanged during Assistant updates.
- The 11 files under `assets/wasm/excel/`, DPS, RDPS, graduation baselines, UI, storage and best-build behavior are always local unless a separate user request explicitly changes them.

## Numeric synchronization workflow

1. Run `skills/tiaolv-upstream-update/scripts/update_upstream.sh`. It must validate the download before rotating snapshots.
2. Diff old and new assistant bundles. Identify only changes to:
   - common naked-character attributes;
   - martial arts and talent thresholds/rewards;
   - mind skills;
   - equipment fixed attributes, quality differences and tuning values;
   - sets, bow arts and armory values;
   - derived-attribute formulas;
   - resistance conversion;
   - Panel calculation stage order and rounding.
3. Record the assistant version and source bundle hash. Do not infer numeric changes merely from a renamed hashed bundle.
4. Update the structured Panel generator/source in `calculator/yysls-calc-rust/`; do not paste the assistant runtime into the live site.
5. Rebuild only `yysls_panel.wasm`. Keep the JavaScript public API, 202-item Panel input and 36-item Panel output contracts stable unless the user separately authorizes an interface migration.
6. Assert that all 11 standalone Excel WASM modules are byte-for-byte unchanged.
7. Update Panel documentation, hash/version references, affected frontend `?v=` tags and the site update time.

## Mandatory parity gate

Use an independent reference implementation parsed from the assistant snapshot; it must not reuse Rust Panel outputs as expected values.

- Cover all 10 calculable PVE flows.
- Cover martial arts, talents, supported minds, sets, all bows, common/class armories.
- Cover empty, all-gold, all-purple, mixed-quality and partially empty equipment.
- Cover normal, maximum, Chengyin, Dingyin, loaned Dingyin, manual corrections and transmutation paths.
- Run the fixed combination matrix and at least 1,000,000 fixed-seed random configurations.
- Compare all 36 raw outputs by Float64 bit pattern, including NaN, signed zero and Infinity behavior.
- Require zero differences. Any difference blocks publication.
- Run browser regression for normal calculation, manual attributes, best build and scheme restoration.
- Run `./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh` and the Hugo build.

## Local customization protection

For every Tiaolv edit, preserve the complete inventory in `doc/tiaolv-local-customizations.md`, especially `local-customizations.js`, cloud backup, equipment levels, backup/import, Chengyin behavior, Top20, cancel-search, transmutation, pvp equipment tags and removed-feature reverse guards.

The shared `app.min.js` remains local code and must preserve all custom features. Q7 supplies numeric configuration and scoring through its isolated snapshot, not by overwriting the shared application.

## Publication

If changes pass all required checks, follow `AGENTS.md`: update changed JS version tags, update all three site-time locations, publish only task-related files, and report both the Git commit and displayed last-update time.
