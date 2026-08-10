---
name: tiaolv-upstream-update
description: Use this skill to fetch and validate the latest numeric-reference snapshot from yysls-assistant.cn. It is only for Panel values and formulas, never frontend or Excel/DPS synchronization.
---

# Tiaolv Numeric Upstream Update

Fetches the latest application bundle from `yysls-assistant.cn` solely so its Panel values and formulas can be inspected. Do not copy its UI or runtime into the live site.

## Directory layout

```
study/
  old/yysls-assistant.cn/   ← previous validated numeric snapshot
  new/yysls-assistant.cn/   ← latest validated numeric snapshot
  yysls-assistant.cn/       ← frozen seed snapshot before first rotation
```

## Workflow

Run the update script:

```bash
./skills/tiaolv-upstream-update/scripts/update_upstream.sh
```

The script will:

1. Download into a temporary directory without touching valid snapshots.
2. Recursively fetch the versioned JavaScript and CSS asset graph referenced by the page bundles.
3. Validate the HTTP result and require recognizable Panel data markers and a `110_*` version marker.
4. Write a manifest containing fetch time, source URL and SHA-256 hashes.
5. Only after validation, rotate `new` to `old` and promote the temporary snapshot to `new`.

It does not download or replace the live `app.min.js`, Panel WASM, Excel WASM, HTML, CSS or images.

## After running

Compare the validated snapshots to identify numeric changes:

```bash
diff -ru study/old/yysls-assistant.cn/assets \
         study/new/yysls-assistant.cn/assets
```

Then follow `skills/tiaolv-sync/SKILL.md`. A changed bundle is evidence to review, not permission to copy code into the live site.
