# 调率站本地定制清单

本文记录本站相对 `study/new/new/yysls.leoq7.com/` 上游快照保留的本地定制功能。同步上游更新时，不要直接覆盖 `static/tools/yysls-tiaolv/`；应先对照本清单，保留或重新应用这些改动。

## 外置扩展脚本

文件：`static/tools/yysls-tiaolv/assets/js/local-customizations.js`

加载位置：`static/tools/yysls-tiaolv/index.html` 中，位于 `excel-runtime.js` 之后、`app.min.js` 之前。

当前已外置的功能：

| 功能 | 说明 |
| --- | --- |
| 装备等级控件注入 | 在装备录入弹窗中动态插入 `#level-select`，选项为 `105级 / 100级 / 96级`。主脚本仍负责保存、读取和展示等级字段。 |
| JSON 下载 | 在导出/导入弹窗中动态插入 `下载 JSON` 按钮，导出明文 JSON，包含 `version`、`format`、`accountName`、`exportedAt`、`equipData`。 |
| JSON 上传 | 在导出/导入弹窗中动态插入 `上传 JSON` 文件控件；读取 JSON 后转换为原有备份码格式，再复用现有导入确认流程。 |
| 最佳配装词条汇总渲染 | 提供 `api.renderBuildStatsSummary(equippedItems)` 函数，统计 8 件装备的主词条+副词条分布（不含定音），按四行固定分类显示：三率（精准率/会心率/会意率）、五维（劲/敏/势）、攻击（各系最小/最大攻击）、神力（全武学增效/对首领单位增伤/对玩家单位增效/单体类奇术增伤/群体类奇术增伤/各武器武学增效）。每行只显示 count > 0 的词条，整行为空则隐藏。由 `app.min.js` 的最佳配装模板调用（见下方主脚本定制表）。 |

同步上游时，优先保留这个文件和 `index.html` 中对它的 `<script>` 引用。

## 仍在主脚本中的定制

文件：`static/tools/yysls-tiaolv/assets/js/app.min.js`

这些功能目前嵌入较深，涉及装备保存、渲染、最佳配装穷举或缓存键。后续可以继续拆，但现在同步上游时必须重点保护：

| 功能 | 位置/关键词 | 说明 |
| --- | --- | --- |
| 装备等级数据保存 | `levelSelect`、`level`、`handleSaveEquip`、`handleEditEquip` | 保存装备时写入 `level`，编辑装备时回填等级。 |
| 装备等级展示 | `levelColor`、`levelText` | 在装备卡片、穿搭槽位、最佳配装装备卡片显示 `[105]`、`[100]`、`[96]` 等等级标签。 |
| 旧数据默认等级 | `getDB()` 中 `if (!item.level) item.level = 105` | 旧装备数据没有等级时默认按 105 处理。 |
| 最多需要承音筛选 | `maxNeedChengyin`、`max-need-chengyin-select`、`countNeedChengyin` | 在最佳配装搜索阶段限制 `(需承音)` 装备数量。 |
| 需承音数量展示 | `needChengyinCount`、`需承音` | 每套最佳方案显示 `需承音：N 件`。 |
| `(承音)` / `(需承音)` 区分 | `id.toString().includes("_chengyin")` | 原本已有承音显示 `(承音)`，系统模拟的承音版显示 `(需承音)`。 |
| 最佳配装 Top20 | `top10Builds: o.slice(0, 20)` | 上游通常保留前 10 套，本站保留前 20 套并支持切换。 |
| 最佳配装词条汇总调用 | `renderBuildStatsSummary`、`window.TiaolvLocalCustomizations` | 在最佳配装方案模板末尾（`.best-build-equips` 关闭后）插入词条汇总区块，调用 `local-customizations.js` 中的同名函数。 |
| 统计文字位置调整 | `共检查了`、`border-bottom` | 将"共检查了 N 种装备组合，找到 N 套最佳方案"从横线下方移至横线上方（`border-top` 改为 `border-bottom`），并缩小下方空白（`margin-top: 15px; padding-bottom: 8px`）。 |
| 装备库排序功能 | `sortDB`、`currentSort`、`sortSelect`、`filterDB` | 新增 `sortDB` 函数和 `AppState.currentSort` 状态，在 `filterDB` 的四个非 equipped 返回点包裹 `sortDB`，绑定 `#sort-select` 下拉框事件。排序规则：等级降序 → 同等级金先紫后 → 同等级同色非承音先承音后 → 按首词条种类（大外/小外/精准率/会心率/会意率/劲/敏/势/神力）。`index.html` 中需保留 `<select id="sort-select">` 元素。 |

## 同步上游建议

1. 先更新 `study/new/yysls.leoq7.com/`，不要直接覆盖正式目录。
2. 对比上游新旧差异，再把需要的源站更新合并进 `static/tools/yysls-tiaolv/`。
3. 保留 `local-customizations.js` 和 `index.html` 中的加载引用。
4. 对 `app.min.js` 检查上表关键词，确认深层定制没有被覆盖。
5. 本地运行 `.tools/hugo/hugo --gc --minify`，确认构建成功后再发布。

