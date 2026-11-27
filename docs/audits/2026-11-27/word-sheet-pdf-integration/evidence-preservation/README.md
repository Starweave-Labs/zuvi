# 本批整站运行的审计原字节保全流程

当前只完成流程准备和 advisory inventory，尚未对真实 `docs/audits` 执行 snapshot 或 restore。两次操作都等待根代理的明确 cue；active Native UI 日志不会提前成为验收基线。脚本使用 Python 标准库和只读 Git 命令，没有生产源码、台账、提交、构建或浏览器运行操作。

快照覆盖 `docs/audits` 的文件和链接对象，包括旧日期、此前 P008/X023/X024 归档和本批已经收尾的专项。只排除以下三个当前 integration 子树，避免把运行中的总验证日志和保全流程自身加入基线：

- `2026-11-27/word-sheet-pdf-integration/validation/`
- `2026-11-27/word-sheet-pdf-integration/regenerated-history/`
- `2026-11-27/word-sheet-pdf-integration/evidence-preservation/`

其他 integration 文件仍会被纳入；如根代理明确要求额外排除一个会持续编写的报告，可在 snapshot 时传 `--exclude-prefix`，实际排除项会写入基线。不会改写或替换此前 `full-e2e/` 的 1663 份保全记录。

`preserve-audits.py inventory` 只盘点名称、大小、Git 忽略状态和运行时缓存类别。当前 `ignored-inventory.json` 记录六个新专项的 27 份 ignored `.log`，合计 52978 bytes：sheet-view 12 份、pdf-text-layer 7 份、static-entry-budget 8 份。word-basic-format、pdf-native-ui、pdf-native-annotations 的当前盘点没有 ignored 文件。数字可能随尚未结束的原生浏览器运行变化，正式清单以 cue 后的 snapshot 为准。

Fontconfig `font-cache/` 单独标为 `runtime-font-cache`。当前 host-migration 盘点有 17 个对象：12 个链接、4 个 `.cache-12` 文件和一个 `CACHEDIR.TAG`，链接当前均指向同目录 `.cache-12`。全树快照保留链接的目标字符串及其字节数/SHA，复制和验证不会跟随链接读取外部缓存。它们是渲染工作流可重建的本机缓存，不是 PDF/PNG/原生源文件/test/log 的可移植验收输入；提交时可将重建脚本、字体输入和链接元数据作为复核依据，避免把实际缓存链接当作必需产品依赖。正式原字节验证仍会明确核对这些本机对象，不会把未校验的缓存算作已验证。

在根代理确认专项完成、原件及产物冻结后，从仓库根目录执行：

```sh
ZUVI_AUDIT_PYTHON=/Users/meaili/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3
ZUVI_AUDIT_SNAPSHOT=/tmp/zuvi-office-integration-audits-before-full-e2e-20261127
"$ZUVI_AUDIT_PYTHON" -B docs/audits/2026-11-27/word-sheet-pdf-integration/evidence-preservation/preserve-audits.py snapshot --snapshot-dir "$ZUVI_AUDIT_SNAPSHOT" --cue root-pre-full-e2e-cue
```

snapshot 要求临时目录和正式基线不存在，禁止覆盖已有保全记录。每个对象复制前后验证原字节，并复核整个文件集合没有并发增删；只有原件及 ignored gzip 全部成功后才发布 `baseline-manifest.json`。完整原字节备份在临时 `files/`，相同基线清单留在本目录。文件记录包含原路径、kind、类别、大小和 SHA；链接额外记录 `symlinkTarget`。

所有基线中被 Git 忽略的文件按原字节 gzip 保存至 `ignored-originals/`，并写 `ignored-evidence-manifest.json`，包含压缩字节 SHA、解压原字节 SHA 和原路径。这包含未结束前不能正式登记的新专项日志，以及已存在的旧 ignored 日志；不改原日志空白，也不改变其专项 manifest 中的旧 SHA。压缩设置 `mtime=0`，gzip 中不嵌入本机文件名。

整站结束且根代理明确 cue 后执行：

```sh
"$ZUVI_AUDIT_PYTHON" -B docs/audits/2026-11-27/word-sheet-pdf-integration/evidence-preservation/preserve-audits.py restore --snapshot-dir "$ZUVI_AUDIT_SNAPSHOT" --cue root-post-full-e2e-cue
"$ZUVI_AUDIT_PYTHON" -B docs/audits/2026-11-27/word-sheet-pdf-integration/evidence-preservation/preserve-audits.py verify --snapshot-dir "$ZUVI_AUDIT_SNAPSHOT"
```

restore 先验证所有备份，再将实际变化及新增原字节保存在 `../regenerated-history/`：二进制文件在 `files/`，日志、失败上下文及链接对象在 `gzip/`。保留每项 before/after SHA、原路径、archivePath 和 encoding；新增文件的 before 明确为 null，消失的基线文件单独登记。生成副本全部验证且文件集合仍稳定后，才恢复改变/缺失的原件，并删除已另存的新产物。最后比较完整基线文件集合及每项原字节，复核 regenerated 目录与索引完全一一对应。`restoration-manifest.json` 与原清单都留在本目录，不覆盖旧 full-e2e 清单。

verify 是只读操作，可以反复执行。在没有 `/tmp` 备份的新 checkout 中，仍可验证实际保留文件和已提交的 ignored gzip；若 ignored 日志没有 materialize，使用 `verify --allow-missing-ignored` 会从其 gzip 复核原字节并明确列出缺失的 live 路径。它不会静默跳过未归档的文件、缓存或损坏对象。

`test_preserve_audits.py` 的 11 个临时夹具检查已通过，日志为 `protocol-tests.txt`。覆盖原空白、变化/新增/缺失、并发写入、损坏备份、重复目标、cue 必填、缺失 ignored 日志的解压复核、regenerated 索引完整性和链接/目录链接保全。测试只使用临时小型仓库，未快照真实审计树。
