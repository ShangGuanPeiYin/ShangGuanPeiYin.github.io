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
- local customizations still embedded in `app.min.js`, including equipment levels, JSON import/export support, max-needed-Chengyin filtering, `(承音)` / `(需承音)` distinction, needed-Chengyin count display, and Top20 best-build results.

After syncing or editing the Tiaolv tool, run:

```bash
./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh
```

## Tiaolv JS version tags

Every time a JS file under `static/tools/yysls-tiaolv/assets/js/` is modified, update its `?v=` parameter in `static/tools/yysls-tiaolv/index.html` to the current datetime in `YYYYMMDDHHmm` format (e.g. `?v=202606041430`). This busts the browser cache so users load the new file immediately.

Files that require version tag updates:

- `app.min.js`
- `local-customizations.js`
- `excel-runtime.js`
- `generated-calc-metadata.js`
- `generated-calc-strings.js`
- `generated-best40-stats.js`

Use a new timestamp for each push, even if the file was already updated earlier the same day.

After each push, update the table below with the new version tags:

| 文件 | 当前版本号 | 最后更新 |
| --- | --- | --- |
| `app.min.js` | `202606080049` | 2026-06-08 同步上游 |
| `local-customizations.js` | `202606041027` | 2026-06-04 取消按钮 |
| `excel-runtime.js` | `202606080049` | 2026-06-08 同步上游 |
| `generated-calc-metadata.js` | `202606080049` | 2026-06-08 同步上游 |
| `generated-calc-strings.js` | `202606080049` | 2026-06-08 同步上游 |
| `generated-best40-stats.js` | `202606080049` | 2026-06-08 同步上游 |
