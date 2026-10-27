# Codex 修改记录

## 2026-10-27

- 修改目的：同步上游 Q7 计算引擎更新。
- 涉及文件：`static/tools/yysls-tiaolv/assets/engines/q7/`、`static/tools/yysls-tiaolv/assets/wasm/q7/yysls_calc.wasm`、`static/tools/yysls-tiaolv/excels/q7/`、`static/tools/yysls-tiaolv/index.html`、`static/tools/yysls-tiaolv/assets/js/engine-bootstrap.js`、`tests/q7/q7-baseline.sha256`、`tests/q7/q7-dual-engine-parity.mjs`。
- 实际修改及设计理由：更新上游 Q7 WASM、元数据、字符串、运行时配置和 14 份工作簿；保留本站唯一数值覆盖“赛季抗性 2.45”。同步引擎哈希、缓存版本和页面更新时间，确保浏览器加载新资源；更新测试基线与 WASM 断言，避免旧快照误报。
- 验证方式与结果：抓取器完成上游资源校验；哈希基线、百万组固定种子 parity（1,000,000 cases、41,000,000 fields）、站点级 14 流派对比、Q7 定制检查和 Hugo 构建均通过；发布结果由本次提交记录。
