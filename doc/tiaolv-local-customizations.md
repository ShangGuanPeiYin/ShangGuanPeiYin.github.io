# 调率站本地定制清单

> 编写日期：2026-11-08。代码基线：`fa6a1a9b9de81f81415e710f7131d6e827bc598f`。业务依据：本轮用户逐项确认。实现与验证状态见 [SRS](SRS.md) 和 [验证说明](verification.md)。

此清单重建并核对当前本地功能，服务上游更新保护。它描述当前实现，不把 [SRS](SRS.md) 中的期望差异宣称为现有能力。历史同名清单可从基线提交读取，原有修改历史由 Git 及 Codex 日志保留。

## 上游边界

Q7 是唯一引擎。上游负责数值配置、面板、伤害、毕业率、WASM、模板和评分所需数据，本地负责应用、搜索组织与扩展。唯一数值覆盖为赛季抗性 2.45（上游 2.15），同时核对应用配置、manifest 与运行时兜底。使用 [Q7 更新技能](../skills/tiaolv-q7-engine-update/SKILL.md)，不得用上游前端覆盖本站应用。

## 当前功能与保护位置

所有源文件链接见 [SDS](SDS.md)，以下按功能记录符号，便于定位。

| 本地能力 | 关键位置／依赖 | 更新保护要求 |
| --- | --- | --- |
| 等级、承音、金紫及流派记录 | app 的 handleSaveEquip；local 的 level-select 与迁移 | 保留等级与资格关联、115级选项、真实与需承音区分，不能依旧文档恢复仅110级限制 |
| OCR 与自动命名 | Tesseract、saveOcrResultsToAccount、buildAutoNameFromStats | 保留手动名称及批量入口，定音不参与普通词条命名 |
| 完整备份与旧格式兼容 | local 的 validateFullBackup、restoreFullBackup、schemaVersion=3 | 保留装备ID、角色/方案/转律/手动数据/回收站和校验回滚；当前保留备份外角色，不能声称已整体替换 |
| 云备份 | cloud-backup、Supabase 2.57.4、local 公共接口 | 保留登录、60000ms延迟、SHA256去重、latest/snapshots、条件更新、账号归属、remote_changed、before_restore保护 |
| 回收站 | equip-recycle-bin、YYSLSEquipRecycleBin | 15天保留，恢复只回库；清理、导出恢复及角色隔离一起检查 |
| 数量试算与面板试算 | local 的 allocateManualStatCounts、runManualStatMinCostFlow | 保留8主32副合法分配、动态上限、预设、修正项、输入模式结果隔离和最终面板渲染 |
| 词条数量汇总与溢出显示 | renderBuildStatsSummary、renderHomeStatCountSummary、decoratePanelRateOverflow | 主页读取转律覆盖后装备；不含定音；统计数量与数值计算分工明确 |
| 转律资格与位置 | isTransmutableEquip、normalizeZhuanlvStatus、commitZhuanlvFromModal | 110级及以上显式资格，承音可用；保存装备时提交状态，取消编辑不能提前写档 |
| 转律词库及目标过滤 | getTransmutationVariants、installTransmutationVariantFilter | 保留武器专属过滤/补齐、用户excludedTargets、原词条候选和副词条互斥 |
| 转律编辑实时刷新 | buildZhuanlvTargetView、readSubStatsByRow、resolveZhuanlvExcludedTargets | 使用当前表单；保留各槽位草稿排除目标；保存仍是单个选定位置 |
| 最佳配装三模式 | bestBuildTransmutationMode、getTransmutationStateDigest | 模式与排除设置进入候选/缓存语义；同实体互斥用getOriginalEquipId |
| 最佳配装算法 | best-build-algorithms、legacy-exhaustive、遗传搜索 | 算法注册与主脚本加载依赖保留；承音阈值、弓多选、限制、取消、进度ETA与Top20不丢失 |
| 方案转律覆盖 | transmutationSelections、effectiveEquippedItems、applySchemeTransmutationSelections | 覆盖层计算不改写库；备份白名单与主页/分析入口同步维护 |
| 流向与流派标签 | resolveEquipFlowType、matchesFlowTypeFilter、buildFlowTypeTagHtml、buildClassPillsHtml | 保留大小外均可语义，列表筛选不变成搜索隐含条件；颜色与全部流派区别保留 |
| Excel回填 | excel-export、ensureExcel | 等待对应模板就绪；导出使用当前Q7资源；保留workbookPatch公式/下拉补丁和no-store模板请求 |
| 外观和选择器 | custom-selects、ui-codex-command-classic.css、style.css | 保留承音文字着色、等宽数字、结果统计位置及标签样式 |

## 必须一起维护的链路

1. 页面 script 标签 → bootstrap/adapter → local扩展/算法注册 → app → Supabase/云备份/导出；不能因资源同步打断顺序。
2. 转律表单 → 装备资格与位置档案 → 候选过滤 → 物理装备互斥 → 方案覆盖 → 面板分析 → 备份恢复。
3. 装备变化与转律模式变化 → 搜索缓存摘要与失效 → 显示结果；不要复用不匹配的缓存。
4. local 的备份公共API → cloud 的恢复前保护 → 恢复完成通知；保留当前接口，不借文档更新改变恢复语义。

## 已移除功能与验证

保持引擎切换与第二套 Assistant 引擎入口缺席。保持转律 CD 功能、旧第三状态和旧目标编辑入口不回归；保留旧数据清理迁移。不要从历史资料恢复这些功能。

修改前后执行 [定制检查脚本](../skills/tiaolv-site-checks/scripts/check_tiaolv_customizations.sh)，并结合 [验证说明](verification.md) 的相关回归场景。字符串检查只能证明保护标记存在，运行正确性仍需针对性验证。未实现的判重、成本排序、模拟持久化和整体恢复列在 SRS，不能通过改清单宣称已经修复。

## 2026-11-11 同步保护补充

Q7快照更新至2026年11月10日21:19:51。仅为兼容上游新增破竹樽第四心法，向本地excel-export移植工作簿公式/下拉补丁；保持Q7模板路径与ensureExcel保护。app.min.js、local-customizations.js及其全部本地功能保持原样。新增Excel补丁单元回归和浏览器真实工作簿验收，详见[验证说明](verification.md)。


## 2026-11-12 同步保护补充

同步2026年11月11日19:14:56快照，新增鸣金虹（流枫）输出版本。app.min.js、local-customizations.js和excel-export.js均未修改，本地搜索、转律、备份与Excel补丁链路保留；赛季抗性仍2.45。
