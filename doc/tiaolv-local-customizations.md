# 调率站本地定制清单

本文记录本站相对 `study/new/new/yysls.leoq7.com/` 上游快照保留的本地定制功能。同步上游更新时，不要直接覆盖 `static/tools/yysls-tiaolv/`；应先对照本清单，保留或重新应用这些改动。

## 外置扩展脚本

文件：`static/tools/yysls-tiaolv/assets/js/local-customizations.js`

加载位置：`static/tools/yysls-tiaolv/index.html` 中，位于 `excel-runtime.js` 之后、`app.min.js` 之前。

当前已外置的功能：

| 功能 | 说明 |
| --- | --- |
| 装备等级控件注入 | 在装备录入弹窗中动态插入 `#level-select`，选项为 `110级 / 105级 / 100级 / 96级`，新建装备默认 `110级`。主脚本仍负责保存、读取和展示等级字段。 |
| 完整 JSON 备份 | 在导出/导入弹窗中动态插入 `下载完整备份` 按钮；单个明文 JSON 备份全部角色，以及每个角色的装备（保留 ID）、全部流派方案、转律状态和毕业率手动面板数据。格式标识为 `yysls-tiaolv-full-backup`、版本为 `schemaVersion: 2`，不包含可重建的计算缓存。 |
| 完整 JSON 恢复 | 在导出/导入弹窗中动态插入 `恢复完整备份` 文件控件；导入前校验格式、角色/装备/方案结构和装备引用，汇总展示角色数、装备数、方案数及同名角色，确认后按角色覆盖并保留未包含的本地角色；写入失败时回滚。继续兼容旧版 `1.2` 单角色装备 JSON。 |
| 手动毕业率词条数量模式 | 在“毕业率分析 → 手动填写”中增加“按词条数量 / 直接填写面板”双模式。数量模式可选择满值或承音值，用户只填总数量；统一分配器按 8 个首词条、32 个副词条及每件装备的天然词条池寻找占用首词条最少的合法方案，动态限制每行上限，并显示首/副/普通词条计数。理论面板直接使用该真实分配，不计转律额外来源；旧组合按原字段顺序自动收敛并提示。三率、五维、当前流派攻击和神力以快捷专栏展示，弓箭与当前方案同步；少见词条收进“其他词条”。右侧最终面板复用最佳配装分组，并直接展示计算结果中的三率白值溢出。每个角色、流派及版本可保存最多 50 个组合。双输入模式使用隔离结果节点，避免旧防抖任务造成闪动。配置保存在原手动面板记录中并随完整备份迁移。 |
| 最佳配装词条汇总渲染 | 提供 `api.renderBuildStatsSummary(equippedItems)` 函数，统计 8 件装备的主词条+副词条分布（不含定音），按四行固定分类显示：三率（精准率/会心率/会意率）、五维（劲/敏/势）、攻击（各系最小/最大攻击）、神力（全武学增效/对首领单位增伤/对玩家单位增效/单体类奇术增伤/群体类奇术增伤/各武器武学增效）。每行只显示 count > 0 的词条，整行为空则隐藏。由 `app.min.js` 的最佳配装模板调用（见下方主脚本定制表）。 |
| 转律状态追踪 | 仅 105 级非承音装备可用。三种状态：锁死/默认（null，无标记）、未转律（`state:"none"`，灰色标签）、已转律可继续转（`state:"active"`，琥珀色标签 + ► 箭头 + 可转目标行）。数据存储在独立 localStorage key `zhuanlv_status_${accountName}`，不修改装备主数据。包含：编辑弹窗中注入转律 UI section（`ensureZhuanlvSection`）、`change` 事件自动保存（不依赖 submit）、卡片标签注入（`refreshAllZhuanlvBadges`）、JSON 导出时附加 `zhuanlv` 字段、JSON 导入时按 `name+slotId` 匹配还原状态、常规文件导入时清空转律数据（通过 `_pendingZhuanlvFromJson` 标志区分两种导入类型）。 |
| 承音文字绿色显示 | 装备卡片上的「(承音)」文字颜色改为绿色（`#4caf50`），通过 `colorChengyinOnCards()` 在 MutationObserver 触发时逐卡处理，幂等（已处理的卡片加 `data-chengyin-colored` 标记跳过）。 |

### 2026-07-31 新增定制

以下功能均为本站本地定制，后续同步上游时必须完整保留：

1. **单文件完整迁移**
   - `下载完整备份` 导出全部角色、装备稳定 ID、全部流派配装方案、转律状态和毕业率手动数据。
   - `恢复完整备份` 支持同名角色确认覆盖、非同名角色保留、装备引用校验、失败回滚和旧版 `1.2` 单角色 JSON 兼容。
   - 格式标识固定为 `yysls-tiaolv-full-backup`，当前 `schemaVersion` 为 `2`。
2. **按词条数量计算毕业率**
   - 手动填写页支持“按词条数量 / 直接填写面板”双模式，以及“全部按满值 / 全部按承音值”两种取值方式。
   - 三率、五维、当前流派攻击、神力使用快捷专栏；无关武器增效不会显示或参与计算。
   - 神力专栏底部提供弓箭选择，支持精准弓、会心弓和会意弓；选择结果与当前装备方案同步并立即重算。
   - PVE 隐藏对玩家单位增效，PVP 显示；单体/群体奇术增伤保留在“其他词条”中。
   - 毕业率数值使用现有 `metric-gold` 金色样式；数量模式与直接填写模式使用独立结果节点，完整计算后同步渲染，避免旧防抖任务造成数字闪动。
3. **真实装备可实现性校验（按词条数量模式）**
   - 统一分配器 `allocateManualStatCounts` / `runManualStatMinCostFlow` 将用户填写的总数量映射到 8 件装备，容量固定为首词条 `8`、副词条 `32`、普通词条合计 `40`，并优先寻找占用首词条最少的合法方案。
   - 每件装备最多 1 个首词条、4 个副词条；同一种属性在同一件装备上最多占一个副词条，但允许同件装备的首词条和副词条为同一种属性。
   - 首词条池按真实部位联合校验：大小外攻共享两武器、环、佩；三率共享冠胄、胸甲、胫甲、腕甲；劲可用两武器、胫甲、腕甲；敏、势、无相攻击只可用两武器。
   - 副词条只使用天然来源，不把转律当作额外来源：武器增效绑定对应武器，全武学增效绑定环、佩，单体/群体奇术增伤绑定冠胄、胸甲，对首领增伤/对玩家增效绑定胫甲、腕甲。
   - 多种属性共享首词条部位时联合限制，例如大外 11 条后小外最多 9 条；精准 10 + 会心 10 后会意最多 8 条；敏 10 后势最多 8 条。
   - 每行上限随当前组合动态变化，达到上限时禁用加号；非法增加只降低本次修改的词条，并提示争用属性、所需首词条数和可用部位数。
   - 页脚实时显示 `首词条 N/8`、`副词条 N/32`、`普通词条 N/40`；不足 40 条的空位视为无输出收益或生存词条。
   - 理论装备、毕业率和右侧最终面板统一使用合法分配结果；三率白值溢出直接使用最终面板结果。增减词条、切换组合、弓箭、满值/承音值和流派时同步重算。
   - 旧组合保持原存储字段和备份格式，载入时按原字段顺序迁移；后出现的冲突词条降至合法数量并显示调整提示。
4. **词条组合方案**
   - 每个角色、流派和流派版本可保存最多 50 套命名组合。
   - 支持保存为新组合、切换、更新、重命名、删除和未保存改动 `*` 提示。
   - 保存词条数量与满值/承音值模式；毕业率按当前心法、套装、武库、定音等环境实时重算。
   - 组合数据保存在手动面板记录的 `__statCountConfig.presets` 中，并随完整 JSON 备份迁移。

主要保护标记：`FULL_BACKUP_KIND`、`MANUAL_STAT_COUNT_CONFIG_KEY`、`allocateManualStatCounts`、`runManualStatMinCostFlow`、`grad-manual-main-count-total`、`grad-manual-sub-count-total`、`grad-manual-stat-preset-select`、`grad-manual-stat-count-result`、`writeManualPanelInputs(container, panel, false)`。

同步上游时，优先保留这个文件和 `index.html` 中对它的 `<script>` 引用。

### 已移除的上游功能

- **转律CD提醒**已完整移除：不保留装备编辑入口、提醒页签、7天计时、冷却列表或备份字段。
- `purgeRemovedTransmutationCooldownData` 会在升级后首次加载时删除所有历史 `game_transmutation_cd_*` 记录并写入完成标记；旧版 `schemaVersion: 2` 备份中的 `transmutationCooldowns` 字段可被兼容读取，但会被忽略。
- 后续同步上游时不得重新引入 `TransmutationCd`、`transmutation-cd`、`enter-transmute-cd-btn` 或冷却记录迁移逻辑。转律状态追踪、转律建议和最佳配装转律计算不属于删除范围。

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
