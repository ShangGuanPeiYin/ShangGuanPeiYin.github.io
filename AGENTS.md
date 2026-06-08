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

## Tiaolv upstream snapshots

The `study/` directory holds local snapshots of the upstream site `yysls.leoq7.com`:

- `study/new/yysls.leoq7.com/` — latest upstream snapshot (use this as reference)
- `study/old/yysls.leoq7.com/` — previous upstream snapshot (for diffing)

To fetch the latest upstream code (rotate old → new, download fresh into new):

```bash
./skills/tiaolv-upstream-update/scripts/update_upstream.sh
```

## Tiaolv upstream sync

`static/tools/yysls-tiaolv/` is the live customized version of the upstream/reference site kept under `study/new/yysls.leoq7.com/`.

When syncing updates from `study/new/yysls.leoq7.com/` into `static/tools/yysls-tiaolv/`, do not directly overwrite the live directory. Use the project skill:

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

**For `app.min.js`, always use the new upstream file as the base and re-apply local customizations on top** — never patch the old live file in-place. See `skills/tiaolv-sync/SKILL.md` for the recommended method (diff → patch → apply).

After syncing or editing the Tiaolv tool, run:

```bash
./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh
```

## Tiaolv JS version tags

**每次推送前，无论修改了哪个文件，都必须同时完成两件事，缺一不可：**

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
