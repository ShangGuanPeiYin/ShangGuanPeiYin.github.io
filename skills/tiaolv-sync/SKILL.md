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

1. Treat `study/new/yysls.leoq7.com/` as an upstream/reference snapshot.
2. Treat `static/tools/yysls-tiaolv/` as the live customized site.
3. Never directly overwrite `static/tools/yysls-tiaolv/` with the `study` directory.
4. Prefer syncing upstream-generated/runtime files only after comparing changes.
5. Keep `static/tools/yysls-tiaolv/assets/js/local-customizations.js` and its `index.html` script tag.
6. Preserve local edits still embedded in `app.min.js`, especially:
   - equipment level save/read/display behavior;
   - defaulting missing equipment `level` to `105`;
   - max-needed-Chengyin filtering;
   - needed-Chengyin count display;
   - `(承音)` / `(需承音)` distinction;
   - Top20 best-build results.
7. Run the checker after changes:

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
