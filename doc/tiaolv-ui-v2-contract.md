# 调率器 V2 UI 契约

## 范围

V2 只重构显示层，不改变装备、角色、配装、OCR、毕业率和最佳配装的业务逻辑。

正式入口：

```text
/tools/yysls-tiaolv/
```

保留入口：

```text
/tools/yysls-tiaolv/index-v2.html
```

旧版回退入口：

```text
/tools/yysls-tiaolv/index-legacy.html
```

## 文件边界

V2 显示层文件：

- `index.html`
- `index-v2.html`
- `index-legacy.html`
- `assets/css/ui-v2.css`
- `assets/js/ui-v2-presenter.js`

V2 不修改：

- `assets/js/app.min.js`
- `assets/js/local-customizations.js`
- `assets/js/excel-runtime.js`
- `assets/js/generated-calc-metadata.js`
- `assets/js/generated-calc-strings.js`
- `assets/js/generated-best40-stats.js`
- `assets/wasm/yysls_calc.wasm`

`ui-v2-presenter.js` 只能管理移动端视图、ARIA 属性和展示状态，不得读写装备数据、角色数据、计算参数或 localStorage。

## DOM 兼容要求

正式 `index.html` 和 `index-v2.html` 必须保留旧版 `index-legacy.html` 的全部业务元素 ID。当前基线共 142 个静态 ID。

关键入口包括：

- 角色：`account-select`、`create-account-btn`、`rename-account-btn`、`delete-account-btn`
- 装备：`main-content`、`filter-container`、`sort-select`、`add-btn`、`equipment-grid`
- 配装：`simulator-panel`、`class-select`、`flow-version-select`、`armory-select`
- 方案：`scheme-select`、`new-scheme-btn`、`edit-scheme-name-btn`、`delete-scheme-btn`
- 套装：`bow-select`、`set-select`
- 计算：`graduation-rate-display`、`excel-rate-display`、`total-damage-display`、`stats-display`
- 装备表单：`equip-form`、`slot-select`、`weapon-type-select`、`main-stat-type`、`sub-stats-container`
- 分析：`graduation-modal`、`tab-best-build`、`tab-compare`、`tab-cultivation`
- 数据：`export-import-modal`、`export-import-textarea`、`batch-ocr-modal`

禁止更改这些元素的 ID、表单类型、`data-slot-key`、内联业务事件或脚本加载顺序。

## 视觉系统

```text
宣纸灰  #EDF1EF  页面背景
墨黑    #17211F  顶栏和标题
青铜绿  #146B63  主操作和选中状态
朱砂红  #B8473B  危险操作
琥珀金  #C6911D  毕业率和穿戴状态
铅灰    #6F7880  次要信息
```

字体角色：

- 标题：Noto Serif CJK SC
- 正文：Noto Sans CJK SC
- 数值：DejaVu Sans Mono 或系统等宽字体

所有新样式必须以 `body.ui-v2` 为作用域。

## 验收清单

- 新建、改名、切换和删除角色
- 录入、修改和删除装备
- 装备筛选与排序
- 流派、表格、武库、弓诀、套装和心法切换
- 配装槽穿戴与卸下
- 毕业率、伤害和属性计算
- 最佳配装启动、进度、取消和结果展示
- 培养、比较、转律和冷却提醒
- JSON 导入导出
- 单张 OCR 与批量 OCR
- 刷新后数据恢复
- 360、390、768、1280、1440 和 1920 像素宽度下无横向溢出
- 键盘焦点可见，移动端触控目标不小于 44 像素
- 浏览器控制台无未处理异常

## 回滚

发现问题时，可将 `index-legacy.html` 恢复为 `index.html`。计算文件、业务逻辑和全部用户数据不受影响。
