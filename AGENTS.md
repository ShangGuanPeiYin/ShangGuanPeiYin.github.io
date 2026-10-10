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

## Tiaolv calculator engine

The live tool runs a single calculator engine: the **Q7 original** engine, which references `yysls.leoq7.com`. There is no engine switch and no second/Assistant engine. `yysls.leoq7.com` is the complete upstream: Panel values, formulas, combined WASM, DPS, RDPS, graduation rates, workbook versions, templates, and best-build scoring. The sole local numeric override is season resistance `2.45` instead of upstream `2.15`.

The `study/q7/` directory holds Q7 numeric-reference snapshots (`new` = latest, `old` = previous).

Q7 production snapshots are namespaced under `static/tools/yysls-tiaolv/assets/engines/q7/`, `assets/wasm/q7/`, and `excels/q7/`. Update them only with `skills/tiaolv-q7-engine-update/`.

## Local app and customization preservation

`static/tools/yysls-tiaolv/` is a locally maintained application. Never overwrite its frontend files from the reference site. Before and after any Tiaolv edit, read and preserve the local customization inventory `doc/tiaolv-local-customizations.md`.

Pay special attention to preserving:

- `static/tools/yysls-tiaolv/assets/js/local-customizations.js`;
- the `index.html` script tag that loads `local-customizations.js`;
- local customizations embedded in `app.min.js`: equipment levels, JSON import/export, max-needed-Chengyin filtering, `(承音)` / `(需承音)` distinction, needed-Chengyin count display, Top20 best-build results, `renderBuildStatsSummary` call, cancel-search support, stats text above border line.
- best-build transmutation integration: three search modes, `getOriginalEquipId` physical-equipment mutual exclusion, transmutation-aware cache digest, Chengyin-state Top20 deduplication, result metadata, and non-destructive `transmutationSelections` scheme overlays.
- the cross-file transmutation chain: `index.html` mode/summary controls, `app.min.js` search and scheme calculation, `local-customizations.js` backup validation, and reverse guards that keep the removed transmutation-CD feature absent.

After editing the Tiaolv tool, run:

```bash
./skills/tiaolv-site-checks/scripts/check_tiaolv_customizations.sh
```

## Tiaolv tests

- Q7 parity and browser checks live in `tests/q7/`:
  - `node tests/q7/q7-dual-engine-parity.mjs` — 1,000,000-case Float64 parity against upstream;
  - `node tests/q7/q7-site-parity.mjs` — site-level runtime parity;
  - `node tests/q7/browser-runtime-parity.mjs` — headless browser check (requires `YYSLS_BROWSER_URL`);
  - `tests/q7/check-baseline.sh` — Q7 asset hash baseline.
- Frontend app regression tests live in `tests/tiaolv/`.

## Tiaolv JS version tags

**每次推送涉及调率站前端文件时，必须同时完成两件事，缺一不可：**

1. 将 `static/tools/yysls-tiaolv/index.html` 中**所有被修改过的** JS 文件的 `?v=` 更新为当前时间戳（格式 `YYYYMMDDHHmm`，如 `?v=202606081843`）
2. 运行 `publish_site.sh` 将改动推送到线上

需要维护版本号的文件：

- `app.min.js`
- `local-customizations.js`
- `generated-best40-stats.js`

Q7 引擎脚本的版本号在 `static/tools/yysls-tiaolv/assets/js/engine-bootstrap.js` 中维护（`assets/engines/q7/*.js?v=`）。

同一次推送中多次修改同一文件，只需在最终推送时更新一次版本号即可。

## Tiaolv site update time

**每次完成并准备发布任何调率站更新时，必须同步更新页面顶部的“最后更新时间”，不得继续沿用上一次发布时间。**

发布时间使用实际最终发布时间，格式为 `YYYY年M月D日 HH:mm:ss`。发布前必须同时修改：

1. `static/tools/yysls-tiaolv/index.html` 中 `#xinli-hint` 的 `data-site-update-time` 属性（页面实际显示值）；
2. `static/tools/yysls-tiaolv/index.html` 中 `#xinli-hint` 的占位文字。

Q7 引擎文件的 `?v=` 在 `engine-bootstrap.js` 中维护；`engine-bootstrap.js` 自身在 `index.html` 的 `?v=` 需同步更新。

不要修改各流派 `classRotationStats.*.updateTime`，那些字段表示对应 Excel/流派数据本身的更新时间，不是网站发布时间。

每次调率站更新发布成功后的最终回复，必须同时明确告知用户：

- 本次发布的 Git 提交版本号；
- 页面实际显示的“最后更新时间”。

不得只报告版本号而遗漏最后更新时间。
