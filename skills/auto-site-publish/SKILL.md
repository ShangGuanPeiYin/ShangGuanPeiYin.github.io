---
name: auto-site-publish
description: Use this project skill after changing this Hugo blog. By default, successful code or content edits should be built, committed, pushed, and deployed through GitHub Pages unless the user explicitly says not to publish.
---

# Auto Site Publish

This project is a Hugo + Blowfish static blog. The live site is deployed by GitHub Pages through `.github/workflows/hugo.yaml`.

Default to publishing after successful code or content edits in this project. After completing a requested change, run:

```bash
./skills/auto-site-publish/scripts/publish_site.sh "commit message" path/to/changed-file path/to/changed-dir
```

Pass only task-related paths when unrelated changes exist.

The script builds Hugo locally, commits the selected changes, pushes the current branch to `origin`, and lets GitHub Actions deploy the site.

Skip publishing only when the user explicitly says not to publish, asks only for analysis, or the local build/validation fails.

Do not reset, discard, or overwrite unrelated user changes.
