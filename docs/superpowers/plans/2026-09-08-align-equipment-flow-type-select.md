# Align Equipment Flow Type Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the flow-type selector with the available-classes selector and make both controls use the equipment modal's existing select theme.

**Architecture:** The equipment modal already places both controls in equal-width form groups. Add the same semantic label above the available-classes display and remove the flow-type selector's legacy inline visual overrides, allowing the loaded command-classic stylesheet to supply the shared control treatment. Update the Tiaolv page timestamp and the affected JavaScript cache versions as required by project publishing rules.

**Tech Stack:** Static HTML, existing CSS cascade, Hugo site build.

## Global Constraints

- Change only the equipment modal markup and required release metadata.
- Preserve flow-type options, default value, IDs, and JavaScript behavior.
- Do not modify calculator data, JavaScript, or theme CSS.
- Publish successful Tiaolv frontend changes with `skills/auto-site-publish/scripts/publish_site.sh`.

---

### Task 1: Align Modal Field Markup

**Files:**
- Modify: `static/tools/yysls-tiaolv/index.html:28,236-249,488`
- Modify: `static/tools/yysls-tiaolv/assets/js/engine-bootstrap.js:27`
- Modify: `static/tools/yysls-tiaolv/assets/js/generated-calc-metadata.js:3`
- Test: Manual browser inspection of the equipment modal

**Interfaces:**
- Consumes: Existing `#available-classes-display` custom selector and `#flow-type-select` native selector.
- Produces: Two equal-width form groups with matching label rows and theme-controlled selector visuals.

- [ ] **Step 1: Establish the pre-change condition**

Open the equipment edit modal and confirm that the right selector is below the left custom selector because only the right group has a label.

- [ ] **Step 2: Change the markup minimally**

Add a plain label before the available-classes display, replace the styled flow-type label with a plain label, and reduce the flow-type selector style to its layout-only width declaration:

```html
<div class="form-group" style="flex:1;">
    <label>选择流派</label>
    <div class="available-classes-select-display" id="available-classes-display">
```

```html
<div class="form-group" style="flex:1;">
    <label>大/小外流</label>
    <select id="flow-type-select" style="width:100%;">
```

- [ ] **Step 3: Verify modal behavior manually**

Open the modal at desktop and mobile widths. Confirm both selector surfaces start at the same vertical position, have matching label rows, and retain their options. Select `小外流`, save the equipment, reopen it, and confirm the saved value remains selected.

- [ ] **Step 4: Build the Hugo site**

Run: `hugo --minify`

Expected: Exit code `0`.

- [ ] **Step 5: Update release metadata and cache versions**

Set `siteUpdateTime` in `generated-calc-metadata.js` and `data-site-update-time` plus placeholder text in `index.html` to the actual release time in `YYYY年M月D日 HH:mm:ss` format. Update the `generated-calc-metadata.js` cache version in `engine-bootstrap.js` and the `engine-bootstrap.js` cache version in `index.html` to the same `YYYYMMDDHHmm` timestamp.

- [ ] **Step 6: Publish the intended files**

Run:

```bash
./skills/auto-site-publish/scripts/publish_site.sh "fix: align equipment flow type selector" static/tools/yysls-tiaolv/index.html static/tools/yysls-tiaolv/assets/js/engine-bootstrap.js static/tools/yysls-tiaolv/assets/js/generated-calc-metadata.js docs/superpowers/plans/2026-09-08-align-equipment-flow-type-select.md
```

Expected: The script builds, commits the two intended files, and pushes the current branch.
