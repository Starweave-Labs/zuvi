# 中断整站运行后的原字节恢复

2026-11-27 09:38 CST 重新检查时，原 E2E 进程句柄已经不存在，临时报告、trace 和 `/tmp` 快照也不可用。保留下来的日志最后完成到第 149 项，包含 143 个通过标记、6 个失败标记，没有最终汇总。此记录不把该轮算作完成的 316 项验收；无法取回的临时 trace 也不视为已保全。

`interrupted-316-recovery.json` 将恢复前后的实际身份绑定到既有 `baseline-manifest.json`。3485 个基线对象中，3471 个原字节未变，14 张旧 builder PNG 已由中断运行重生成，无新增或缺失对象。这 14 张实际新 PNG 先另存到 `../regenerated-history/interrupted-316/files/`，再从 Git HEAD 中取回并验证与既有基线 SHA 完全相同的原件。原始中断日志另存到同轮的 `validation/e2e-final.txt`。恢复没有改写此前 `full-e2e/` 的保全记录，也没有改写本批既有基线、专项 manifest 或 snapshot 收据。

恢复后使用原只读入口重新核对 **3485 对象、634240868 bytes、95 份 gzip 原件**，全部通过。`recover-interrupted-e2e.py` 保存本次恢复步骤，要求明确 cue，拒绝覆盖该轮归档，并且在任何 live 恢复前要求所有候选 Git/gzip 原字节与基线 SHA 一致。

根代理随后明确授权持久化快照。`rebuild-persistent-baseline.py` 先核对恢复后的 live 对象，再复制到仓库内被 Git 忽略的 `.release/audit-backups/word-sheet-pdf-20261127/`；该目录包含原基线 manifest 的精确副本及全部 3485 对象。`persistent-backup-receipt.json` 记录此次重建来源与最终验证结果，明确区分于已经失踪的旧临时快照。

后续整站运行应在结束后使用独立轮次归档，避免覆盖 `interrupted-316`：

```sh
python3 -B docs/audits/2026-11-27/word-sheet-pdf-integration/evidence-preservation/restore-audit-run.py restore \
  --run-label full-316-rerun \
  --snapshot-dir .release/audit-backups/word-sheet-pdf-20261127 \
  --cue root-post-rerun-cue
python3 -B docs/audits/2026-11-27/word-sheet-pdf-integration/evidence-preservation/restore-audit-run.py verify \
  --run-label full-316-rerun \
  --snapshot-dir .release/audit-backups/word-sheet-pdf-20261127
```

`restore-audit-run.py` 只有收到结束后的明确 cue 才执行真实 restore。它逐轮先保留变化和新增原字节，然后恢复同一份不可变基线；每轮有独立目录及收据。旧轮次不会被覆盖。新增的 4 项临时夹具检查覆盖多轮隔离、损坏快照、未索引或损坏归档、链接对象及外部目标保护，结果在 `named-run-protocol-tests.txt`。这些测试未恢复实际审计树，不能代替下一轮实际结束后的收据。
