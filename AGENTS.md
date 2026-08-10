# Project Agent Instructions

This is a Hugo + Blowfish static blog. The live site is published through GitHub Pages.

## Publishing after edits

Default to publishing after successful code or content edits in this project. After completing a requested change, run:

```bash
./skills/auto-site-publish/scripts/publish_site.sh "commit message" path/to/changed-file path/to/changed-dir
```

Pass the files or directories changed for the task. If no paths are passed, the script stages all changes except common generated/cache outputs.

Skip publishing only when the user explicitly says not to publish, asks only for analysis, or the local build/validation fails.

The script:

1. builds the Hugo site locally;
2. stages the intended changes;
3. commits them;
4. pushes the current branch to `origin`;
5. lets `.github/workflows/hugo.yaml` deploy GitHub Pages.

## Safety

- Do not use destructive git commands.
- Do not reset or discard user changes.
- If unrelated changes already exist, mention them and pass only task-related paths to `skills/auto-site-publish/scripts/publish_site.sh`.
- If the user explicitly asks not to publish, build or test locally but do not commit or push.

## Tiaolv numeric upstream snapshots

`yysls-assistant.cn` is the only upstream reference for Tiaolv **numeric panel data and panel formulas**. It is not a frontend-code upstream and is not the upstream for the Excel WASM, DPS, RDPS, graduation rates, UI, storage, import/export, or best-build behavior.

The `study/` directory holds numeric-reference snapshots:

- `study/new/yysls-assistant.cn/` — latest validated numeric snapshot;
- `study/old/yysls-assistant.cn/` — previous validated numeric snapshot;
- `study/yysls-assistant.cn/` — frozen seed snapshot retained until the first successful rotation.

The former `study/new/yysls.leoq7.com/` and `study/old/yysls.leoq7.com/` directories are historical archives only and must not be used as an update source.

To fetch the latest numeric reference (validate first, then rotate old → new):

```bash
./skills/tiaolv-upstream-update/scripts/update_upstream.sh
```

## Tiaolv numeric upstream sync

`static/tools/yysls-tiaolv/` is a locally maintained application. Never overwrite its frontend files from either reference site.

When numeric changes are detected in `study/new/yysls-assistant.cn/`, use the project skill:

```bash
skills/tiaolv-sync/
```

Before and after any sync, read and preserve the local customization inventory:

```bash
doc/tiaolv-local-customizations.md
```

Pay special attention to preserving:

- `static/tools/yysls-tiaolv/assets/js/local-customizations.js`;
- the `index.html` script tag that loads `local-customizations.js`;
- local customizations embedded in `app.min.js`: equipment levels, JSON import/export, max-needed-Chengyin filtering, `(承音)` / `(需承音)` distinction, needed-Chengyin count display, Top20 best-build results, `renderBuildStatsSummary` call, cancel-search support, stats text above border line.
- best-build transmutation integration: three search modes, `getOriginalEquipId` physical-equipment mutual exclusion, transmutation-aware cache digest, Chengyin-state Top20 deduplication, result metadata, and non-destructive `transmutationSelections` scheme overlays.
- the cross-file transmutation chain: `index.html` mode/summary controls, `app.min.js` search and scheme calculation, `local-customizations.js` backup validation, and reverse guards that keep the removed transmutation-CD feature absent.

Only Panel inputs, constants, formulas, stage ordering, resistance conversion, and rounding rules may be synchronized. `app.min.js`, the UI, and `yysls_excel.wasm` remain local. See `skills/tiaolv-sync/SKILL.md` for the numeric extraction and parity workflow.

After syncing or editing the Tiaolv tool, run:

```bash
./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh
```

## Tiaolv JS version tags

**每次推送涉及调率站前端文件时，必须同时完成两件事，缺一不可：**

1. 将 `static/tools/yysls-tiaolv/index.html` 中**所有被修改过的** JS 文件的 `?v=` 更新为当前时间戳（格式 `YYYYMMDDHHmm`，如 `?v=202606081843`）
2. 运行 `publish_site.sh` 将改动推送到线上

需要维护版本号的文件：

- `app.min.js`
- `local-customizations.js`
- `excel-runtime.js`
- `generated-calc-metadata.js`
- `generated-calc-strings.js`
- `generated-best40-stats.js`

同一次推送中多次修改同一文件，只需在最终推送时更新一次版本号即可。

## Tiaolv site update time

**每次完成并准备发布任何调率站更新时，必须同步更新页面顶部的“最后更新时间”，不得继续沿用上一次发布时间。**

发布时间使用实际最终发布时间，格式为 `YYYY年M月D日 HH:mm:ss`。发布前必须同时修改：

1. `static/tools/yysls-tiaolv/assets/js/generated-calc-metadata.js` 中的 `siteUpdateTime`（页面实际显示值）；
2. `static/tools/yysls-tiaolv/index.html` 中 `#xinli-hint` 的“最后更新时间”占位文字；
3. `static/tools/yysls-tiaolv/index.html` 中 `generated-calc-metadata.js` 的 `?v=` 时间戳。

不要修改各流派 `classRotationStats.*.updateTime`，那些字段表示对应 Excel/流派数据本身的更新时间，不是网站发布时间。

每次调率站更新发布成功后的最终回复，必须同时明确告知用户：

- 本次发布的 Git 提交版本号；
- 页面实际显示的“最后更新时间”。

不得只报告版本号而遗漏最后更新时间。
