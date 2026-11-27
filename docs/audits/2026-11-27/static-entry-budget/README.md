# 静态入口体积关卡（2026-11-27）

本批在 `packages/ui/src/config/locale.ts` 抽取 17 段固定键顺序和一个带数组长度约束的泛型 helper，保留十语言所有文案及各 locale 的独立对象。转换涉及 170 个文案段、1320 个字符串；原 chart、dataGrid、date 结构沿用。

实际 fresh UI build 后，`node scripts/check-bundle-size.mjs` 统计全部静态依赖：2 个模块、424168 bytes、**124134 gzip bytes**，原预算 `<124928`，余量 **794 bytes**。此次构建包含当时已冻结的 OfficeStudio 原生 PDF props / 结构校验及 UI 变动。静态模块 hash 在 browser build 和 distribution 检查后再次确认一致；记录见 `verification.json`。

通过的检查：

- Locale 独立类型检查；完整值、键序、属性描述符 / 原型、对象独立性、修改隔离和部分 merge / weekdays 数组复制等价检查。
- ConfigProvider：14/14；见 `config-provider.log`。
- UI ESM / CommonJS / declarations 构建与 browser 构建；见 `ui-build.log`、`browser-build.log`。
- 同次静态入口预算；见 `bundle-size.log`。
- Button / Chart tree shaking、PURE 保留、ESM / CommonJS 导出、client boundary、SSR、lazy 模块导入及各包 npm pack；见 `distribution.log`。

原始 locale 值保存于 `expected-locales.json`。可从仓库根运行以下命令，复验当前源码与实际 ESM / CommonJS locale 值：

```sh
node docs/audits/2026-11-27/static-entry-budget/verify-locale-equivalence.mjs
```

`check-consumer.mjs` 在旧 CLI bundled source 校验处停止，首个过期项为 `packages/ui/src/config/locale.ts`。只读核对发现 Registry 一致，487 个源文件中 13 项 bundled source 与当前源码不同，详见 `consumer-stale-sources.json` 与 `consumer.log`。CLI / MCP 等待最终门禁统一重建，因此消费者源码编译仍待复验。

`old-closure-locale-trials.json` 保存旧 dist 的 AST 替换探索结果：17 段省 1686 gzip bytes。它用于选择方案；本批预算结论来自上面的真实 fresh build。后续原生事务修复或其他源码变动须在最终构建后重新检查预算和分发。
