---
name: tiaolv-upstream-update
description: Use this skill to fetch the latest upstream code from yysls.leoq7.com into study/new/. Rotates old snapshot to study/old/ first. Run this before comparing upstream changes or syncing into the live tiaolv tool.
---

# Tiaolv Upstream Update

Fetches the latest frontend code from `yysls.leoq7.com` and updates the local reference snapshots.

## Directory layout

```
study/
  old/yysls.leoq7.com/   ← previous upstream snapshot (read-only reference)
  new/yysls.leoq7.com/   ← latest upstream snapshot (just fetched)
```

## Workflow

Run the update script:

```bash
./skills/tiaolv-upstream-update/scripts/update_upstream.sh
```

The script will:
1. Delete the contents of `study/old/`
2. Move the contents of `study/new/` into `study/old/`
3. Download the latest code from `yysls.leoq7.com` into `study/new/yysls.leoq7.com/`:
   - `index.html`
   - All versioned JS files (versions read from the downloaded `index.html`)
   - `assets/wasm/yysls_calc.wasm` (version read from `excel-runtime.js`)
   - `assets/css/style.css`
   - `assets/images/`

## After running

Compare the new snapshot against the old to decide what to merge into the live tool:

```bash
diff study/old/yysls.leoq7.com/assets/js/generated-calc-metadata.js?* \
     study/new/yysls.leoq7.com/assets/js/generated-calc-metadata.js?*
```

Then follow the sync workflow in `skills/tiaolv-sync/SKILL.md` to apply upstream changes to `static/tools/yysls-tiaolv/`.
