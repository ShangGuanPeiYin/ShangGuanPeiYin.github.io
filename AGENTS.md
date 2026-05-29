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
