---
name: tiaolv-sync
description: Use when syncing or checking updates from study/new/yysls.leoq7.com into static/tools/yysls-tiaolv, or when changing the Tiaolv tool while preserving local customizations such as equipment levels, JSON import/export, Chengyin filters, needed-Chengyin display, and Top20 best-build results.
---

# Tiaolv Sync

Use this skill whenever the Tiaolv upstream/reference snapshot in `study/new/yysls.leoq7.com/` is updated, or when asked to merge/check the live Tiaolv tool in `static/tools/yysls-tiaolv/`.

## Required references

Before making sync decisions, read:

```bash
doc/tiaolv-local-customizations.md
```

That file is the source of truth for local features that must survive upstream syncs.

## Workflow

1. Treat `study/new/new/yysls.leoq7.com/` as the latest upstream snapshot, and `study/new/old/yysls.leoq7.com/` as the previous snapshot.
2. Treat `static/tools/yysls-tiaolv/` as the live customized site.
3. Never directly overwrite `static/tools/yysls-tiaolv/` with the `study` directory.
4. Prefer syncing upstream-generated/runtime files only after comparing changes.
5. Keep `static/tools/yysls-tiaolv/assets/js/local-customizations.js` and its `index.html` script tag.
6. **For `app.min.js`: always use the new upstream as the base and re-apply all local customizations on top.** Never patch the old live file in-place — that approach risks misplacing changes when context strings are not unique.

   Recommended method:
   1. Copy `study/new/yysls.leoq7.com/assets/js/app.min.js?v=*` as a fresh starting point.
   2. Generate a diff between `study/old/yysls.leoq7.com/assets/js/app.min.js?v=*` and the previous live `static/tools/yysls-tiaolv/assets/js/app.min.js` to capture all local customizations as a patch.
   3. Apply that patch to the fresh file.
   4. Verify the result with the checker.

   Local customizations that must survive (all checked by the checker script):
   - equipment level save/read/display behavior (`levelSelect`, `levelColor`, `levelText`);
   - defaulting missing equipment `level` to `105`;
   - max-needed-Chengyin filtering (`maxNeedChengyin`, `countNeedChengyin`);
   - needed-Chengyin count display (`needChengyinCount`, `需承音`);
   - `(承音)` / `(需承音)` distinction;
   - Top20 best-build results;
   - `renderBuildStatsSummary` call in best-build solution template;
   - cancel-search support (`bestBuildCancelled`);
   - stats text above border line (`border-bottom`).
7. **Always update the WASM binary** when the upstream JS files change. Check the `ASSET_VERSION` constant in `excel-runtime.js` — if it differs from the previous snapshot, the WASM must also be updated:
   ```bash
   curl -L "https://yysls.leoq7.com/assets/wasm/yysls_calc.wasm?v=<ASSET_VERSION>" \
     -H "Referer: https://yysls.leoq7.com/" \
     -o static/tools/yysls-tiaolv/assets/wasm/yysls_calc.wasm
   ```
   Skipping this step causes flowId mismatches and wildly wrong graduation rates (e.g. 10000%+) for any newly added flow.
8. Run the checker after changes:

```bash
./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh
```

## Validation

At minimum, the checker should pass. For larger syncs, also inspect the page in a browser and confirm:

- equipment entry shows the equipment-level selector;
- export/import dialog shows `下载 JSON` and `上传 JSON`;
- best-build tab shows the max-needed-Chengyin selector;
- best-build results show `需承音：N 件`;
- best-build results still distinguish `(承音)` from `(需承音)`;
- best-build result navigation can show up to 20 retained builds.

If code or content changed and validation passes, publish using the project publishing rule in `AGENTS.md`.
