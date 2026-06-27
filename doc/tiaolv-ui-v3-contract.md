# 调率器 V3 UI 契约

## 定位

V3 是独立的第三套显示层方案，视觉概念为“燕云军械终端”。它采用控制轨、装备仓、装配台三段式工作区，不替换正式入口，也不删除旧版和 V2。

独立预览入口：

```text
/tools/yysls-tiaolv/index-v3.html
```

现有入口保持不变：

```text
/tools/yysls-tiaolv/                  正式 V2
/tools/yysls-tiaolv/index-v2.html    V2 保留页
/tools/yysls-tiaolv/index-legacy.html 旧版回退页
```

## 文件边界

V3 只包含以下文件：

- `index-v3.html`
- `assets/css/ui-v3.css`
- `assets/js/ui-v3-presenter.js`

V3 不修改：

- `index.html`
- `index-v2.html`
- `index-legacy.html`
- `assets/css/style.css`
- `assets/css/ui-v2.css`
- `assets/js/app.min.js`
- `assets/js/local-customizations.js`
- `assets/js/excel-runtime.js`
- `assets/js/generated-calc-metadata.js`
- `assets/js/generated-calc-strings.js`
- `assets/js/generated-best40-stats.js`
- `assets/wasm/yysls_calc.wasm`

## 业务兼容

V3 必须与 V2 保持以下契约一致：

- 142 个静态业务元素 ID；
- 全部 `data-slot-key`；
- 表单控件类型与业务内联事件；
- 计算脚本及其加载顺序；
- 角色、装备、方案和转律相关的 localStorage 数据结构。

`ui-v3-presenter.js` 只允许：

- 切换移动端装备、筛选、装配和面板视图；
- 同步 ARIA 状态；
- 标记工作区是否就绪；
- 为装备条目添加纯展示编号。

它不得读写角色、装备、方案、计算参数或 localStorage。

## 布局规则

桌面端：

- 顶部命令栏：角色和数据操作；
- 左侧控制轨：装备筛选、排序和录入；
- 中央装备仓：装备数据库；
- 右侧装配台：流派、方案、心法、八件装备和结果面板。

小于等于 1100px：

- 使用底部四视图导航；
- 装备、筛选、装配和面板独立显示；
- 页面本身不得横向溢出。

## 验收要求

- V2 与 V3 的业务 ID、槽位键和业务脚本顺序一致；
- 角色、装备、方案、心法、弓诀和套装操作正常；
- 毕业率、伤害、属性与最佳配装计算正常；
- 最佳配装进度、取消和 Top20 结果正常；
- JSON 导入导出、单张 OCR 和批量 OCR 正常；
- V2、V3 和旧版之间的数据互通；
- 360、390、560、768、1280、1440 和 1920px 无页面级横向溢出；
- 键盘焦点可见，移动端主要触控目标不小于 44px；
- 浏览器控制台无未处理异常。

## 发布与回退

V3 只通过 `index-v3.html` 访问。发生显示问题时无需回滚业务文件，继续使用正式入口或其他保留页即可。
