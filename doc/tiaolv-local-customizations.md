# 调率站本地定制清单

本文记录本站相对 `study/new/new/yysls.leoq7.com/` 上游快照保留的本地定制功能。同步上游更新时，不要直接覆盖 `static/tools/yysls-tiaolv/`；应先对照本清单，保留或重新应用这些改动。

## 外置扩展脚本

文件：`static/tools/yysls-tiaolv/assets/js/local-customizations.js`

加载位置：`static/tools/yysls-tiaolv/index.html` 中，位于 `excel-runtime.js` 之后、`app.min.js` 之前。

当前已外置的功能：

| 功能 | 说明 |
| --- | --- |
| 装备等级控件注入 | 在装备录入弹窗中动态插入 `#level-select`，选项为 `110级 / 105级 / 100级 / 96级`，新建装备默认 `110级`。主脚本仍负责保存、读取和展示等级字段。 |
| 完整 JSON 备份 | 在导出/导入弹窗中动态插入 `下载完整备份` 按钮；单个明文 JSON 备份全部角色，以及每个角色的装备（保留 ID）、全部流派方案、转律状态、转律冷却和毕业率手动面板数据。格式标识为 `yysls-tiaolv-full-backup`、版本为 `schemaVersion: 2`，不包含可重建的计算缓存。 |
| 完整 JSON 恢复 | 在导出/导入弹窗中动态插入 `恢复完整备份` 文件控件；导入前校验格式、角色/装备/方案结构和装备引用，汇总展示角色数、装备数、方案数及同名角色，确认后按角色覆盖并保留未包含的本地角色；写入失败时回滚。继续兼容旧版 `1.2` 单角色装备 JSON。 |
| 手动毕业率词条数量模式 | 在“毕业率分析 → 手动填写”中增加“按词条数量 / 直接填写面板”双模式。数量模式可选择“全部按满值”或“全部按承音值”，不区分主副词条，普通词条合计最多 40 条；使用 8 件理论金装换算最终面板，定音沿用当前装备或现有贷款定音设置，并隐藏下方最终面板输入。切回直接填写时重新显示并恢复之前的手填面板，配置保存在原手动面板记录中并随完整备份迁移。 |
| 最佳配装词条汇总渲染 | 提供 `api.renderBuildStatsSummary(equippedItems)` 函数，统计 8 件装备的主词条+副词条分布（不含定音），按四行固定分类显示：三率（精准率/会心率/会意率）、五维（劲/敏/势）、攻击（各系最小/最大攻击）、神力（全武学增效/对首领单位增伤/对玩家单位增效/单体类奇术增伤/群体类奇术增伤/各武器武学增效）。每行只显示 count > 0 的词条，整行为空则隐藏。由 `app.min.js` 的最佳配装模板调用（见下方主脚本定制表）。 |
| 转律状态追踪 | 仅 105 级非承音装备可用。三种状态：锁死/默认（null，无标记）、未转律（`state:"none"`，灰色标签）、已转律可继续转（`state:"active"`，琥珀色标签 + ► 箭头 + 可转目标行）。数据存储在独立 localStorage key `zhuanlv_status_${accountName}`，不修改装备主数据。包含：编辑弹窗中注入转律 UI section（`ensureZhuanlvSection`）、`change` 事件自动保存（不依赖 submit）、卡片标签注入（`refreshAllZhuanlvBadges`）、JSON 导出时附加 `zhuanlv` 字段、JSON 导入时按 `name+slotId` 匹配还原状态、常规文件导入时清空转律数据（通过 `_pendingZhuanlvFromJson` 标志区分两种导入类型）。 |
| 承音装备隐藏转律冷却按钮 | 承音装备的编辑弹窗中隐藏「进入转律冷却」按钮和转律状态 section。通过 `patchTransmuteCdVisibility()` 在 `window.load` 时 wrap `updateEquipModalTransmuteCdVisibility` 函数实现，防止 app 调用后重新显示。 |
| 承音文字绿色显示 | 装备卡片上的「(承音)」文字颜色改为绿色（`#4caf50`），通过 `colorChengyinOnCards()` 在 MutationObserver 触发时逐卡处理，幂等（已处理的卡片加 `data-chengyin-colored` 标记跳过）。 |

同步上游时，优先保留这个文件和 `index.html` 中对它的 `<script>` 引用。

文件：`static/tools/yysls-tiaolv/assets/js/best-build-algorithms.js`

| 功能 | 说明 |
| --- | --- |
| 最佳配装算法注册中心 | 提供 `window.YYSLSBestBuildAlgorithms.register/get/list`，供最佳配装下拉框动态枚举和分派搜索算法。当前只注册 `legacy-exhaustive` 默认遍历算法，后续算法应通过同一接口接入。 |

## 仍在主脚本中的定制

文件：`static/tools/yysls-tiaolv/assets/js/app.min.js`

这些功能目前嵌入较深，涉及装备保存、渲染、最佳配装穷举或缓存键。后续可以继续拆，但现在同步上游时必须重点保护：

| 功能 | 位置/关键词 | 说明 |
| --- | --- | --- |
| “关于本工具”弹窗 | `showAuthorInfo`、`自用装备管理台` | 使用本站自有工具说明、浏览器本地数据备份提示、上游来源致谢及数据免责声明；不保留上游署名和教程链接。 |
| 装备等级数据保存 | `levelSelect`、`level`、`handleSaveEquip`、`handleEditEquip` | 保存装备时写入 `level`，编辑装备时回填等级。 |
| 装备等级展示 | `levelColor`、`levelText` | 在装备卡片、穿搭槽位、最佳配装装备卡片显示 `[110]`、`[105]`、`[100]`、`[96]` 等等级标签。 |
| 旧数据默认等级 | `getDB()` 中 `if (!item.level) item.level = 105` | 旧装备数据没有等级时默认按 105 处理。 |
| 最多需要承音筛选 | `maxNeedChengyin`、`max-need-chengyin-select`、`countNeedChengyin` | 在最佳配装搜索阶段限制 `(需承音)` 装备数量。 |
| 最佳配装算法选择 | `bestBuildAlgorithmId`、`best-build-algorithm-select`、`runBestBuildAlgorithm` | 最佳配装页根据算法注册中心动态生成下拉框；普通搜索和指定转律搜索通过统一算法入口分派，缓存键包含算法 ID。 |
| 默认遍历性能优化 | `compileBestBuildEquip`、`calculateBestBuildCompiled`、`needChengyinCount`、最小堆 | 默认遍历预编译装备稀疏属性向量，搜索栈只传递装备索引并提前剪掉超过承音上限的分支；Top 200 使用固定容量最小堆维护，完整装备对象仅在候选入榜时生成。 |
| 词条数量限制与剪枝 | `statCountLimits`、`candidateStatCounts`、`suffixCountMin`、`suffixCountMax` | 高级设置可按主副词条条数设置最少、最多或固定数量；搜索前检查理论可达范围，DFS 中按剩余最少/最多条数提前剪枝，定音不计数，转律按最终副词条计数。 |
| 需承音数量展示 | `needChengyinCount`、`需承音` | 每套最佳方案显示 `需承音：N 件`。 |
| `(承音)` / `(需承音)` 区分 | `id.toString().includes("_chengyin")` | 原本已有承音显示 `(承音)`，系统模拟的承音版显示 `(需承音)`。 |
| 最佳配装 Top20 | `top10Builds: o.slice(0, 20)` | 上游通常保留前 10 套，本站保留前 20 套并支持切换。 |
| 最佳配装词条汇总调用 | `renderBuildStatsSummary`、`window.TiaolvLocalCustomizations` | 在最佳配装方案模板末尾（`.best-build-equips` 关闭后）插入词条汇总区块，调用 `local-customizations.js` 中的同名函数。 |
| 统计文字位置调整 | `共检查了`、`border-bottom` | 将"共检查了 N 种装备组合，找到 N 套最佳方案"从横线下方移至横线上方（`border-top` 改为 `border-bottom`），并缩小下方空白（`margin-top: 15px; padding-bottom: 8px`）。 |
| 装备库排序功能 | `sortDB`、`currentSort`、`sortSelect`、`filterDB` | 新增 `sortDB` 函数和 `AppState.currentSort` 状态，在 `filterDB` 的四个非 equipped 返回点包裹 `sortDB`，绑定 `#sort-select` 下拉框事件。排序规则：等级降序 → 同等级金先紫后 → 同等级同色非承音先承音后 → 按首词条种类（大外/小外/精准率/会心率/会意率/劲/敏/势/神力）。`index.html` 中需保留 `<select id="sort-select">` 元素。 |
| 可用/全流派切换开关 | `AppState.classFilter`、`filterDB`、`initFilters`、`.filter-toggle-btn` | 将原「可用」过滤按钮改为全局切换开关。`AppState.classFilter`（默认 `true`）控制所有槽位/全部模式是否按流派过滤。开关为绿色时（可用），头/胸/佩等槽位按钮和「全部」只显示本流派装备；灰色时（全流派），显示所有装备。`filterDB` 的 `"all"`、`weapon_`、槽位分支均加入 `classFilter` 判断；`"available"` 分支已删除，原重置 `currentFilter = "available"` 的两处改为 `"all"`。样式类 `.filter-toggle-btn.toggle-on/.toggle-off` 追加在 `assets/css/style.css` 末尾。 |
| pvp 流派选项 | `ClassConfig.CLASSES` | 在 `CLASSES` 数组末尾新增 `"pvp"`，使装备录入弹窗的「可用流派限制」多选和右侧流派下拉均包含 pvp 选项。无 `WEAPON_RULES` 条目，不限武器类型。 |

## 同步上游建议

1. 先更新 `study/new/yysls.leoq7.com/`，不要直接覆盖正式目录。
2. 对比上游新旧差异，再把需要的源站更新合并进 `static/tools/yysls-tiaolv/`。
3. 保留 `local-customizations.js` 和 `index.html` 中的加载引用。
4. 对 `app.min.js` 检查上表关键词，确认深层定制没有被覆盖。
5. 本地运行 `.tools/hugo/hugo --gc --minify`，确认构建成功后再发布。
