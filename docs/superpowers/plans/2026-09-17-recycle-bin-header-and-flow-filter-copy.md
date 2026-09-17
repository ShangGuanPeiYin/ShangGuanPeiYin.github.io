# 回收站位置与流派筛选文案 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将回收站按钮移至“全部重命名”左侧，并将装备库流派范围开关显示为“当前流派/全流派”。

**Architecture:** 回收站继续在页面加载后由 `equip-recycle-bin.js` 创建，插入目标从筛选栏的录入按钮改为顶部既有的重命名按钮。筛选开关继续使用 `AppState.classFilter` 和既有持久化键，仅替换启用状态显示文本。

**Tech Stack:** 原生 JavaScript、CSS Grid、Node.js `node:test`、Chrome Headless、Hugo。

## Global Constraints

- 不更改回收站的 ID、计数、禁用状态、弹窗和本地存储格式。
- 不更改 `tiaolv_class_filter` 的语义或保存值。
- 仅修改受影响 JavaScript 文件的 `?v=` 缓存版本，并在发布前更新调率站页面显示时间。
- 通过 `publish_site.sh` 仅暂存本次涉及文件。

---

### Task 1: 回收站顶部插入与布局回归

**Files:**
- Modify: `static/tools/yysls-tiaolv/assets/js/equip-recycle-bin.js:133-145`
- Modify: `tests/tiaolv-filter-bar-layout.test.js`

**Interfaces:**
- Consumes: 顶部既有按钮 `#rename-all-btn`。
- Produces: 动态创建的 `#recycle-bin-btn` 位于 `#rename-all-btn` 之前。

- [ ] **Step 1: 写入失败的浏览器布局测试**

在 `tests/tiaolv-filter-bar-layout.test.js` 的 HTML fixture 中创建 `.account-select-group`、`#rename-all-btn` 和筛选栏；加载真实 `equip-recycle-bin.js`，并在 `load` 后写入回收站与重命名按钮的相邻关系：

```js
const accountGroup = document.querySelector(".account-select-group");
accountGroup.dataset.recyclePlacement = accountGroup.firstElementChild.id === "recycle-bin-btn" && accountGroup.children[1].id === "rename-all-btn" ? "before-rename" : "wrong";
```

断言 Chrome `--dump-dom` 输出包含 `data-recycle-placement="before-rename"`，同时保留对 `data-add-row="first"` 的断言。

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/tiaolv-filter-bar-layout.test.js`

Expected: FAIL，因为当前脚本将回收站插入 `#add-btn` 之前。

- [ ] **Step 3: 以最小改动切换插入目标**

将初始化目标改为：

```js
var renameAllButton = document.getElementById("rename-all-btn");
if (!renameAllButton) return;
renameAllButton.parentNode.insertBefore(button, renameAllButton);
```

删除 `button.style.marginRight = "8px"`，让顶部 `.account-select-group` 的既有 `gap` 控制间距。

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/tiaolv-filter-bar-layout.test.js tests/tiaolv-recycle-bin.test.js`

Expected: PASS，回收站位于全部重命名左侧，且现有回收站数据逻辑无回归。

- [ ] **Step 5: 提交**

```bash
git add static/tools/yysls-tiaolv/assets/js/equip-recycle-bin.js tests/tiaolv-filter-bar-layout.test.js
git commit -m "fix: move recycle bin to header controls"
```

### Task 2: 流派筛选状态文案

**Files:**
- Modify: `static/tools/yysls-tiaolv/assets/js/app.min.js:6944-6960`
- Test: `tests/tiaolv-flow-filter-copy.test.js`

**Interfaces:**
- Consumes: 布尔状态 `AppState.classFilter`。
- Produces: 启用时显示“当前流派”，停用时显示“全流派”。

- [ ] **Step 1: 写入失败的页面文案测试**

创建 `tests/tiaolv-flow-filter-copy.test.js`，使用 Chrome Headless 打开本地工具页面；等待页面初始化后断言筛选开关初始文本为“当前流派”。在页面上下文将 `localStorage.tiaolv_class_filter` 设为 `0` 并重新加载，断言文本为“全流派”。

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/tiaolv-flow-filter-copy.test.js`

Expected: FAIL，启用状态目前显示“可用”。

- [ ] **Step 3: 替换启用状态文案**

在 `paintToggle` 中将：

```js
toggleBtn.textContent = AppState.classFilter ? "可用" : "全流派";
```

改为：

```js
toggleBtn.textContent = AppState.classFilter ? "当前流派" : "全流派";
```

- [ ] **Step 4: 运行测试确认通过**

Run: `node --test tests/tiaolv-flow-filter-copy.test.js`

Expected: PASS，两个持久化状态分别显示指定文案。

- [ ] **Step 5: 提交**

```bash
git add static/tools/yysls-tiaolv/assets/js/app.min.js tests/tiaolv-flow-filter-copy.test.js
git commit -m "fix: clarify flow filter labels"
```

### Task 3: 全量验证与发布

**Files:**
- Modify: `static/tools/yysls-tiaolv/index.html`
- Modify: `static/tools/yysls-tiaolv/assets/js/engine-bootstrap.js`
- Modify: `static/tools/yysls-tiaolv/assets/js/generated-calc-metadata.js`

**Interfaces:**
- Consumes: 本次修改的 `equip-recycle-bin.js` 与 `app.min.js`。
- Produces: 更新后的 JavaScript 资源版本和页面“最后更新时间”。

- [ ] **Step 1: 更新版本与页面时间**

使用实际发布时的 `YYYYMMDDHHmm` 更新 `index.html` 中 `equip-recycle-bin.js`、`app.min.js` 与 `engine-bootstrap.js` 的 `?v=`；同步更新 `#xinli-hint`。更新 `engine-bootstrap.js` 中 Assistant 元数据脚本的 `?v=`，并将 `generated-calc-metadata.js` 的 `siteUpdateTime` 设为相同发布时间。

- [ ] **Step 2: 运行完整验证**

Run: `node --test tests/tiaolv-filter-bar-layout.test.js tests/tiaolv-recycle-bin.test.js tests/tiaolv-flow-filter-copy.test.js`

Run: `./skills/tiaolv-sync/scripts/check_tiaolv_customizations.sh`

Expected: 全部测试通过，保护检查包含 `Hugo build` 成功。

- [ ] **Step 3: 发布**

```bash
./skills/auto-site-publish/scripts/publish_site.sh "fix: reorganize recycle bin controls" static/tools/yysls-tiaolv/assets/js/equip-recycle-bin.js static/tools/yysls-tiaolv/assets/js/app.min.js static/tools/yysls-tiaolv/assets/js/engine-bootstrap.js static/tools/yysls-tiaolv/assets/js/generated-calc-metadata.js static/tools/yysls-tiaolv/index.html tests/tiaolv-filter-bar-layout.test.js tests/tiaolv-flow-filter-copy.test.js docs/superpowers/specs/2026-09-17-recycle-bin-header-placement-design.md docs/superpowers/plans/2026-09-17-recycle-bin-header-and-flow-filter-copy.md
```
