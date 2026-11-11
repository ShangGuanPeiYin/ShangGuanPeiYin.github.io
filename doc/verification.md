# 验证、验收与发布

> 编写日期：2026-11-08。代码基线：`fa6a1a9b9de81f81415e710f7131d6e827bc598f`。业务依据：本轮用户逐项确认。实现与验证状态见 [SRS](SRS.md) 和 [验证说明](verification.md)。

## 验证边界

文档一致性、静态源代码核对、现有测试、浏览器端到端和真实云服务是不同证据层级。已有测试通过不能证明 SRS 的全部期望已实现。2026-11-08文档轮次未更新引擎或测试；2026-11-11引擎同步结果单列在下文。两个轮次均未执行破坏性恢复或云端写入。

## 需求与场景

| 场景编号 | 关联需求／机制 | 输入与预期 | 证据或覆盖缺口 |
| --- | --- | --- | --- |
| V-01 | SRS-CALC-001、GDD-CALC-001 | 基准过旧产生 102%，原样展示 | 旧 Excel 公式已静态核对；当前 UI 场景未运行 |
| V-02 | SRS-SEARCH-002、GDD-CHENGYIN-002 | 114/115 级、91.99/92/95.99/96% 按阈值生成候选 | 源码已核对，边界组合未单独运行 |
| V-03 | SRS-SEARCH-001、002 | 已承音不计额度；额度0且必需部位仅110未承音时无解；不跨角色／回收站取材 | 静态路径与目标对照，端到端未验证 |
| V-04 | SRS-SEARCH-004、005 | 100.004排在100.001前；同分先少承音再少转律；不同承音安排保留 | 当前排序有差异；候选去重测试仅覆盖其断言 |
| V-05 | SRS-SEARCH-003、GDD-TRANSMUTATION | 资格、选定位置、重复词条、排除目标、原词条保留 | 现有 transmutation 测试及静态包装函数；完整模式矩阵未运行 |
| V-06 | SRS-EQUIP-002 | 状态不同分别保留；顺序和定音差异不阻止判重 | 现实现有差异，未新增测试 |
| V-07 | SRS-SCHEME-001、002 | 应用、保存、重载保持承音/转律/满定音；实际承音后减少额度 | 需浏览器验证，存在持久化疑点 |
| V-08 | SRS-SCHEME-002、003 | 词条被替换使模拟失效；删除装备不替代；版本缺失提示 | 尚未动态验收 |
| V-09 | SRS-ANALYSIS-001、002 | 替换不重复叠加；数量≤40但部位冲突不能视为合法；手填面板自由试算 | 分配器静态检查，人工场景未执行 |
| V-10 | SRS-SEARCH-007 | 第二次搜索取消，丢弃中间结果并保留带旧条件的第一次结果 | 当前实现有差异 |
| V-11 | SRS-DATA-002、003 | 备份仅A，当前A/B，目标恢复后只有A；空位合法、悬空引用整份拒绝 | 当前实现有差异；不执行覆盖测试 |
| V-12 | SRS-DATA-004 | 两设备变化暂停覆盖；用户选择前保留双方 | 前端保护静态存在；真实多设备/RLS未验证 |

## 可执行检查

以下命令从仓库根目录执行。本次执行结果见下节。

```bash
./skills/tiaolv-site-checks/scripts/check_tiaolv_customizations.sh
for test_file in tests/tiaolv/*.mjs; do
  node "$test_file" || exit 1
done
./gitw diff --check
```

定制检查主要检查文件、字符串、JS 语法及本地 Hugo 构建，不等价于浏览器自动操作。前端测试包括：bow-selection、candidate-dedup、eta-format、flow-type-filter/tag/normalization、genetic-optimizer-core、transmutation-level-eligibility/card-hint/target-refresh，共 10 个文件；具体保证以每个文件断言为准。

Q7 专项检查属于引擎变更流程，2026-11-08文档轮次未执行；2026-11-11结果见下节。示例保留关键参数：

```bash
bash tests/q7/check-baseline.sh
YYSLS_Q7_CASES=1000000 node tests/q7/q7-dual-engine-parity.mjs
YYSLS_Q7_NORMALIZE_SEASON=1 node tests/q7/q7-site-parity.mjs
YYSLS_BROWSER_URL=http://127.0.0.1:8000/tools/yysls-tiaolv/ YYSLS_ENGINE=q7 node tests/q7/browser-runtime-parity.mjs
```

浏览器命令需要先准备对应本地静态服务和浏览器依赖；这里不表示服务已经启动。归一化赛季的比对不能代替本地 2.45 覆盖检查；恢复测试必须使用隔离测试档案，不覆盖真实数据。

## 2026-11-08历史结果

2026-11-08，本轮实际验证结果：

| 检查 | 结果 | 能证明的范围 |
| --- | --- | --- |
| 七份文件与相对链接检查 | 7 份文件，失效链接 0 | 文件存在、相对链接目标存在；不验证外部网站 |
| 定制检查脚本 | 通过 | 保护标记、JS 语法及脚本所列检查 |
| Hugo 构建 | 通过（定制检查脚本调用） | 当前站点可构建 |
| tests/tiaolv 下全部 10 个 .mjs | 10/10 通过 | 现有测试断言，不涵盖全部新需求 |
| Git 差异空白检查 | 通过 | 已跟踪差异无空白错误 |
| 百万样本 Q7、站点数值 parity、浏览器、云端写入和实际恢复 | 本次未执行 | 不宣称通过或数值／服务行为改善 |

检查输出保存在本机临时文件 `/tmp/myboke-doc-check.log`；临时日志不作为长期必需依赖。长期证据是本节结果、[修改记录](../logs/codex_changes.md)和对应测试源码。新增期望仍按 SRS 差异表标记，不因旧测试通过而消除差异。

相关测试入口：[前端回归目录](../tests/tiaolv/)、[Q7 检查目录](../tests/q7/)。

## 发布与维护

实际 Git 操作为 `./gitw`（.gitrepo）；当前发布分支 main，工作流监听 main。执行发布前检查 status 和 cached diff，确认无无关暂存项。只传递本次文件路径，不传整个 doc 目录，以免带入历史删除。

```bash
./skills/auto-site-publish/scripts/publish_site.sh "docs: establish tiaolv development documentation" doc/README.md doc/PRD.md doc/GDD.md doc/SRS.md doc/SDS.md doc/verification.md doc/tiaolv-local-customizations.md logs/codex_changes.md
```

脚本运行 Hugo --gc --minify，再提交、推送并触发 GitHub Pages。提交成功、推送成功、部署成功分别报告，不能互相替代。2026-11-08纯文档更新未改页面更新时间和 JS 查询版本，也不把 doc 自动当作博客内容页面发布。以后修改调率前端时，遵守 AGENTS.md 的 JS 时间戳、页面更新时间及定制检查要求。

## 2026-11-11 上游同步验证结果

验证对象：上游2026年11月10日21:19:51快照，WASM `881f10a3f2d393d06612a2080157a3e3ad2438f351b269594aeaa8450f2659fc`，15个输出版本。本站抗性保持2.45。

| 检查 | 实际结果与边界 |
| --- | --- |
| 百万固定种子原版WASM对比 | 1,000,000例通过，每例37面板字段和5输出逐位一致；脚本comparedFields仍输出41,000,000（历史计数器每例加41，实际42字段），未据此减少断言 |
| 站点级数值对比 | 15流派×3场景，统一抗性后result/panel/classInput零差异；Node直连两次超时，临时以curl从同一上游取资源执行原测试，并增加差异硬断言；没有用本地数据冒充上游 |
| 浏览器运行与最佳配装 | 15流派、首次计算、Q7加载、评分与直接运行时一致、模板可下载、武器转律目标检查通过；抗性2.45断言通过 |
| 破竹樽实际导出XLSX | 第四心法断石写入E24，13项公式、2项下拉选项逐项与元数据比对通过；替换公式无旧缓存值，RD仅校验补丁也写回 |
| 前端回归 | tests/tiaolv全部11个文件通过（原10个+Excel补丁回归）；新增回归在旧实现失败、移植后通过 |
| Q7哈希基线 | 21项资源通过，15份模板按manifest固定；原始破竹樽4.0模板字节未变化，仅导出时应用补丁 |
| 本地定制、语法与Hugo | 更新前后定制检查及Hugo --gc --minify通过；本地app和local-customizations无差异，Excel导出语法通过 |
| 文档与差异 | 70个相对链接无失效；15行工作簿版本/轴长/基准与元数据一致；Git差异空白检查通过 |

新增浏览器检查等待Excel导出脚本就绪（在外部Supabase脚本之后加载），避免仅等待引擎就绪导致误报。长期回归入口为[浏览器测试](../tests/q7/browser-runtime-parity.mjs)和[Excel补丁测试](../tests/tiaolv/excel-export-workbook-patches.mjs)。

验证证明与上游的一致性及所测本地链路正确，未进行Excel/WPS全表重算、游戏实测、真实云备份或用户档案恢复；没有量化性能或配装收益，既有SRS差异保持原标记。

页面发布时间：`2026年11月11日 14:02:59`；引擎资源、bootstrap及excel-export缓存版本：`202611111402`。发布按精确路径提交，既有doc/prd删除不纳入。
