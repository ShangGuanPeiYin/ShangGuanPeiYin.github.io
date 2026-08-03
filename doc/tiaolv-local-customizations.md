# 调率站本地定制清单

本文记录本站相对 `study/new/yysls.leoq7.com/` 上游快照保留的本地定制功能。同步上游更新时，不要直接覆盖 `static/tools/yysls-tiaolv/`；应先对照本清单，保留或重新应用这些改动。

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
| 主页词条数量汇总 | 在主页毕业数值面板下方使用 `#home-stat-count-summary` 展示当前八件装备的全部主、副词条数量及普通词条 `N/40`，不区分首副、不累计数值、不含定音。统计读取方案转律覆盖后的有效装备；常用输出词条按三率、五维、攻击、神力排列，生存类和未知词条进入“其他”，切换装备、方案、角色或转律模拟时随主页计算同步刷新。 |
| 转律资格与状态追踪 | 110级装备通过与“承音”“紫装”并列的“可转律”复选框显式记录资格，承音装备同样可用；非110级直接隐藏并清除该资格。未勾选为不可转律，勾选但未指定副词条为待转律，勾选并指定一个真实副词条为已转律。资格保存在装备字段 `isTransmutable`，已转律槽位继续保存在 `zhuanlv_status_${accountName}`；卡片分别不显示标签、显示灰色待转律或琥珀色已转律标签。 |
| 承音文字绿色显示 | 装备卡片上的「(承音)」文字颜色改为绿色（`#4caf50`），通过 `colorChengyinOnCards()` 在 MutationObserver 触发时逐卡处理，幂等（已处理的卡片加 `data-chengyin-colored` 标记跳过）。 |

文件：`static/tools/yysls-tiaolv/assets/js/cloud-backup.js`

加载位置：`static/tools/yysls-tiaolv/index.html` 中，位于固定版本的 Supabase UMD SDK 之后。

| 功能 | 说明 |
| --- | --- |
| Supabase 邮箱密码登录 | 只提供管理员预建账号的登录、会话保持和退出，不包含公开注册、邮箱验证码或找回密码；前端仅保存可公开的 Publishable key，数据隔离依赖 Supabase RLS。 |
| 本地优先自动备份 | 继续以 `localStorage` 为即时数据源，监听角色、装备、方案、转律和手动面板记录，停止变更 30 秒后单向上传；摘要忽略导出时间并使用 SHA-256 去重，dirty 状态跨页面持久化，启动时重新比较本机与云端，断网失败不影响本地数据。 |
| 最新备份与历史快照 | `backup_latest` 保存每个用户的最新完整备份，`backup_snapshots` 最多保留 20 份；自动快照间隔至少 30 分钟，手动备份和恢复前保护总是创建快照。恢复成功后才写入新基线，恢复失败不会伪造已同步状态。 |
| 云备份兼容性 | 前端兼容旧表缺少 `server_updated_at`、历史快照缺少 `created_at`、Supabase `jsonb` 字段重排导致的旧哈希差异；旧备份结构校验通过即可恢复，恢复后自动写回新版稳定哈希。 |
| 多设备覆盖保护 | 每次上传前重新读取云端 latest，并比较本地哈希、上次同步基线和当前云端哈希；普通上传使用旧哈希条件更新，防止读取后另一设备抢先写入时被静默覆盖。首次连接、其他设备已更新或本机数据属于另一云账号时暂停自动上传，必须明确选择恢复云端或以本机覆盖。没有本地角色时始终禁止覆盖云端。 |
| 角色改名完整迁移 | 观察 `game_account_list` 的单角色等长替换，将 `zhuanlv_status_旧角色名` 原样迁移到新角色名，避免云端备份在角色改名后漏掉已转律槽位。 |
| 事务恢复 | 云端数据复用 `local-customizations.js` 的完整备份校验和恢复事务；恢复前先写 `before_restore` 快照，失败则不执行本地覆盖。 |

云备份是本站正式定制功能，不属于上游代码。同步上游时必须同时保留 `cloud-backup.js`、固定版本 Supabase SDK 引用、`local-customizations.js` 的完整备份公共接口、`index.html` 脚本引用及版本号。`check_tiaolv_customizations.sh` 必须检查登录、延迟备份、哈希去重、latest/快照表、条件更新、多设备冲突、账号归属和恢复前保护标记。

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
   - 神力数量遵守装备来源上限：对首领单位增伤最多2条、全武学增效最多2条、同一种具体武器增效最多1条；双武器流派可分别选择两种不同武器增效。
   - 毕业率数值使用现有 `metric-gold` 金色样式；数量模式与直接填写模式使用独立结果节点，完整计算后同步渲染，避免旧防抖任务造成数字闪动。
   - 数量模式沿用当前方案的赛季、PVP、心法、套装、武库、高级参数和“贷款定音”；勾选贷款定音后，其外穿与增伤数值必须进入最终面板和毕业率。
3. **真实装备可实现性校验（按词条数量模式）**
   - 统一分配器 `allocateManualStatCounts` / `runManualStatMinCostFlow` 将用户填写的总数量映射到 8 件装备，容量固定为首词条 `8`、副词条 `32`、普通词条合计 `40`，并优先寻找占用首词条最少的合法方案。
   - 每件装备最多 1 个首词条、4 个副词条；同一种属性在同一件装备上最多占一个副词条，但允许同件装备的首词条和副词条为同一种属性。
   - 首词条池按真实部位联合校验：大小外攻共享两武器、环、佩；三率共享冠胄、胸甲、胫甲、腕甲；劲可用两武器、胫甲、腕甲；敏、势、无相攻击只可用两武器。
   - 副词条只使用天然来源，不把转律当作额外来源：武器增效绑定对应武器，全武学增效绑定环、佩，单体/群体奇术增伤绑定冠胄、胸甲，对首领增伤/对玩家增效绑定胫甲、腕甲。
   - 多种属性共享首词条部位时联合限制，例如大外 11 条后小外最多 9 条；精准 10 + 会心 10 后会意最多 8 条；敏 10 后势最多 8 条。
   - 每行上限随当前组合动态变化，达到上限时禁用加号；非法增加只降低本次修改的词条，并提示争用属性、所需首词条数和可用部位数。
   - 页脚实时显示 `首词条 N/8`、`副词条 N/32`、`普通词条 N/40`；不足 40 条的空位视为无输出收益或生存词条。
   - 理论装备、毕业率和右侧最终面板统一使用合法分配结果；三率白值溢出直接使用最终面板结果。增减词条、切换组合、弓箭、满值/承音值和流派时同步重算。
   - 三率溢出提示沿用主页口径，直接读取最终面板结果；当前换算为 `溢出白值 = 超限黄值 × 2.15`，不得从已格式化DOM反推。
   - 旧组合保持原存储字段和备份格式，载入时按原字段顺序迁移；后出现的冲突词条降至合法数量并显示调整提示。
4. **词条组合方案**
   - 每个角色、流派和流派版本可保存最多 50 套命名组合。
   - 支持保存为新组合、切换、更新、重命名、删除和未保存改动 `*` 提示。
   - 保存词条数量与满值/承音值模式；毕业率按当前心法、套装、武库、定音等环境实时重算。
   - 组合数据保存在手动面板记录的 `__statCountConfig.presets` 中，并随完整 JSON 备份迁移。
5. **110级显式转律资格**
   - `isTransmutableEquip` 统一规定只有 `level === 110 && isTransmutable === true` 的装备可以进入转律功能；承音和紫装均不影响资格，其他等级仍可作为普通装备参与配装。
   - 非110级装备不显示“可转律”复选框，切换到其他等级时自动取消勾选并清除指定槽位；110级新装备默认不勾选。
   - `migrateTransmutationToExplicitEligibility` 将已有合法 active 状态迁移为已勾选并保留槽位；其他旧装备默认不可转律。完整备份和旧JSON会迁移同一字段。
6. **不可转律／待转律／已转律模型**
   - 未勾选“可转律”即不可转律；勾选但下拉保持“暂未指定”即待转律；选择一个当前存在的副词条后即已转律，不登记目标词条。
   - `TRANSMUTATION_STATUS_MODEL_VERSION = 2` 标识已转律槽位记录；待转律不额外写状态对象，只由装备上的 `isTransmutable:true` 表达。
   - 完整备份保持 `schemaVersion: 2`，只导出和恢复合法的新模型 active 记录；旧 `targets` 数据及无模型版本的 active 记录会被忽略。
   - 最佳配装提供“不考虑转律 / 自动优化已转律装备 / 同时规划待转律装备”三种模式；模式按角色记住，方案只保存最终转律选择。
7. **两状态转律建议**
   - 恢复“毕业率分析 → 转律建议”；待转律装备一次比较所有副词条，给出最值得指定的槽位及其最佳转律词条。
   - 已转律装备只分析状态中指定的副词条，不允许算法改换槽位；原词条始终作为合法候选，最优时明确建议切回或保持原词条。
   - 建议只替换当前分析部位并保持其他七件装备不变，按当前流派、弓箭、套装、心法、赛季与贷款定音环境实时计算，不再混入全库换装收益。
   - 每个副词条显示最佳目标、最终毕业率和相对原词条差值；旧的单件“指定转律目标”入口仍保持隐藏。
8. **最佳配装自动转律与方案覆盖层**
   - 搜索为每件物理装备建立“原装 + 合法转律变体”互斥候选组；已转律装备只变化指定槽位，规划模式可为待转律装备同时选择槽位和目标。
   - 转换后禁止同件装备出现两个相同副词条，主词条与副词条允许重复；真实承音和系统“需承音”形态均继承110级显式转律资格。
   - Top20按八件原始装备 ID 与承音实现状态去重；高级设置、最终面板和词条汇总均使用转换后的词条。
   - 方案字段 `transmutationSelections` 保存非破坏性覆盖层。使用规划结果不会修改装备库原词条或真实转律状态；切换方案后按覆盖层计算并显示模拟操作清单。
   - 完整备份版本保持 `schemaVersion: 2`，方案白名单校验并恢复转律选择；旧方案无此字段时按无覆盖处理。

### 2026-08-01 新增定制

1. **最佳配装转律三模式**
   - 页面必须同时保留三个选项：`不考虑转律`、`自动优化已转律装备`、`同时规划待转律装备`；默认关闭转律，并使用 `best_build_transmutation_mode_<account>` 按角色记住上次选择，不写入装备方案。
   - 已转律模式只为 `zhuanlv_status_<account>` 中指定的副词条槽位生成变体；规划模式还会遍历待转律装备的所有有效副词条槽位。原词条始终保留为候选。
   - 转律目标允许从全部流派武库选择；其中流派属性攻击只保留当前流派对应种类。替换后同一装备的副词条不得重复，首词条与副词条允许相同。非110级或未勾选 `isTransmutable` 的装备不得生成变体，110级承音装备不受排除。
2. **物理装备互斥、承音继承与Top20去重**
   - `getOriginalEquipId` 将原装、`_chengyin` 和 `_trans_...` 变体归并到同一个物理装备 ID；DFS 必须阻止同一物理装备同时占据两个槽位。
   - 系统“需承音”形态继承原装备的可转律资格和槽位状态，并继续受 `maxNeedChengyin` 限制。
   - 候选堆阶段即以“八件原装备 ID + 各自是否需承音”为键去重，转律目标不进入去重键；同一基础配装持续保留快速毕业率最高的转律组合，Excel复核后再安全去重并取真正的Top20，避免重复候选提前挤占名额。
3. **转律搜索结果与方案保存**
   - 每条结果元数据保留 `sourceEquipId / slotKey / subStatIndex / fromStat / toStat / planned`，结果页显示已转律或待转律规划、逐件变化、使用数量和需承音数量。
   - 点击“使用该方案”只把最终选择写入当前方案的 `transmutationSelections`，不能修改装备库原词条、`isTransmutable` 或真实 `zhuanlv_status`。
   - `applySchemeTransmutationSelections` 在计算前生成临时装备覆盖层；主页最终面板、Excel毕业率和方案提示必须读取覆盖后的装备。失效资格、槽位、目标或装备引用回退原词条，并在 `#scheme-transmutation-summary` 提示。
   - 待转律规划后来完成且指定槽位一致时，展示为已完成切换；槽位不一致时不得擅自迁移规划。
4. **完整备份与缓存联动**
   - `SCHEME_FIELDS` 必须包含 `transmutationSelections`；导入时只接受现有装备 ID、非负整数 `subStatIndex`、非空 `targetStat` 和布尔语义的 `planned`，旧方案缺失字段时兼容为空。
   - `getTransmutationStateDigest` 必须进入最佳配装缓存键；装备等级、资格、承音状态、指定槽位或副词条类型变化后，旧搜索结果不得复用。
   - 完整备份仍不得恢复已删除的转律CD字段，也不得导出最佳40、搜索结果等可重建缓存。

### 跨文件依赖与同步顺序

以下功能不能只保留单个关键词，必须作为一组同步：

| 功能链 | 必须同时保留 |
| --- | --- |
| 完整迁移 | `local-customizations.js` 的备份白名单、方案校验与恢复事务；`app.min.js` 的方案字段读写；`index.html` 的备份按钮和脚本版本号 |
| 云端备份 | `cloud-backup.js`、固定版本 Supabase SDK、`local-customizations.js` 导出的完整备份生成/校验/恢复接口、`index.html` 的加载引用和版本号 |
| 词条数量模式 | 数量输入UI、真实分配器、词条组合存储、独立结果节点、最终面板、弓箭同步、贷款定音环境和完整备份中的手动数据 |
| 转律资格 | `index.html` 的“可转律”控件、装备字段 `isTransmutable`、`zhuanlv_status_<account>` 槽位记录、迁移函数、卡片徽标和110级显示规则 |
| 最佳配装自动转律 | 三模式选择器、候选生成、物理ID互斥、转律元数据、Top20去重、方案覆盖层、主页计算、备份白名单和方案提示节点 |
| 已删除转律CD | 页面入口、运行时、存储、备份字段均保持不存在，同时保留一次性历史数据清理迁移 |

同步完成后必须运行 `check_tiaolv_customizations.sh`；若任何一组只恢复了一部分，即使JavaScript语法和Hugo构建成功，也视为同步失败。

主要保护标记：`FULL_BACKUP_KIND`、`MANUAL_STAT_COUNT_CONFIG_KEY`、`allocateManualStatCounts`、`runManualStatMinCostFlow`、`isTransmutableEquip`、`TRANSMUTATION_EXPLICIT_ELIGIBILITY_MARKER`、`TRANSMUTATION_STATUS_MODEL_VERSION`、`is-transmutable`、`transmutable-checkbox-wrapper`、`grad-manual-main-count-total`、`grad-manual-sub-count-total`、`grad-manual-stat-preset-select`、`grad-manual-stat-count-result`、`writeManualPanelInputs(container, panel, false)`。

最佳配装转律保护标记：`bestBuildTransmutationMode`、`best-build-transmutation-mode`、`transmutationSelections`、`applySchemeTransmutationSelections`、`getTransmutationStateDigest`、`sourceEquipId`、`待转律规划`。

转律交互与一致性保护：装备卡片必须由主渲染器写入稳定的 `data-equip-id`，不得按名称猜测 ID；编辑弹窗中的槽位仅作为草稿，只有装备保存成功才调用 `commitZhuanlvFromModal`，取消不得写入；切换转律搜索模式前必须保留弓箭套装、忽略可用流派和承音上限等尚未执行的搜索选项；毕业率分析弹窗必须先应用当前方案的 `transmutationSelections` 覆盖层。

同步上游时，优先保留 `local-customizations.js`、`cloud-backup.js` 和 `index.html` 中对它们的 `<script>` 引用。

### 寒铁主题字体

- `assets/css/ui-codex-command-classic.css` 为装备主、副词条的 `.stat-line` / `.stat-row` 明确指定 `var(--cc-mono)` 等宽字体栈，并启用等宽数字。
- 该显式规则用于防止上游样式或后续局部样式改变词条字体；字体栈依次为 IBM Plex Mono、Sarasa Mono SC、Noto Sans Mono CJK SC、Consolas 和系统等宽字体。

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
| 最佳配装转律三模式 | `bestBuildTransmutationMode`、`best-build-transmutation-mode`、`transmutationSelections` | 搜索可关闭转律、优化已转律或同时规划待转律；结果按物理装备与承音状态去重，方案用非破坏性覆盖层恢复计算。 |
| 需承音数量展示 | `needChengyinCount`、`需承音` | 每套最佳方案显示 `需承音：N 件`。 |
| `(承音)` / `(需承音)` 区分 | `id.toString().includes("_chengyin")` | 原本已有承音显示 `(承音)`，系统模拟的承音版显示 `(需承音)`。 |
| 最佳配装 Top20 | `top10Builds: t.slice(0, 20)` | 上游通常保留前 10 套，本站按基础装备去重后保留前 20 套并支持切换。 |
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
