---
name: tiaolv-site-checks
description: Verify the local tiaolv calculator keeps its Q7-only engine wiring and local customizations after edits. Use before publishing any change under static/tools/yysls-tiaolv.
---

# Tiaolv Site Checks

The live calculator runs a single engine: the Q7 original (`yysls.leoq7.com`), namespaced under `assets/engines/q7/`, `assets/wasm/q7/`, and `excels/q7/`. There is no engine switch and no Assistant / 测试新版 engine.

Run:

```bash
./skills/tiaolv-site-checks/scripts/check_tiaolv_customizations.sh
```

The script asserts:

- the Q7 engine bootstrap, adapter, manifest, app config, runtime and WASM are present and wired;
- no engine switch and no shared Assistant assets remain in `index.html`;
- the local customizations embedded in `app.min.js`, `local-customizations.js`, `cloud-backup.js`, and `excel-export.js` are intact;
- JavaScript syntax and the Hugo build succeed.

This replaces the former `skills/tiaolv-sync` customization check after the Assistant engine was removed.
