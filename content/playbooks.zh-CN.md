# 三个提示词，一个维护 Skill

临时任务可以直接复制提示词，反复维护时可以下载 Skill，共用事实基线和阶段交接。三个工作流都能独立使用。

| 工作流 | 修改内容 | 边界 |
| --- | --- | --- |
| 代码与架构 | 实现、行为测试、质量配置 | 有证据的修复，保留公共契约 |
| 文档与测试 | 英文事实、中文本地化、示例、测试脚本 | 不主动做无关架构重构 |
| 仓库收尾 | 确认无效的残留、项目规则、最终验证 | 不清理无关分支或用户工作 |

## Skill 模式

- `audit` 只读审计，按范围选择工作流。
- `code` 检查实现并修复范围明确的问题。
- `docs` 同步文档、测试脚本和已有 i18n。
- `full` 依次执行代码、文档、收尾，验证发现问题时只回到受影响阶段。

只做收尾时可以直接指定收尾工作流。worktree 和 PR 管理作为三个阶段共用的交付协议，无需另设第四个维护 Skill。

## 安装与调用

[下载 repo-maintenance.zip](../downloads/repo-maintenance.zip)，把完整的 `repo-maintenance` 文件夹解压到工具的 Skill 目录。Codex 使用 `$CODEX_HOME/skills`，未设置时使用 `~/.codex/skills`。其他工具按各自目录安装，并根据工具要求重启或重新加载。下载压缩包本身不会安装，也不会修改生产环境。

```text
使用 $repo-maintenance，以 full 模式维护当前仓库及其 submodule。
基于实际实现确认问题，保留公共契约，遵循仓库已有授权的交付流程。
```

[Skill 源文件](https://github.com/runchengxie/quant-workspace-standards/tree/main/skills/repo-maintenance) · [入口指令](../downloads/repo-maintenance/SKILL.md)

Skill 按需加载工作流，共用事实记录，区分已实现、已合并、已部署和消费者已采用的状态。已有授权优先于通用确认措辞，`audit` 始终只读。

## 完整提示词

英文提示词直接从 Skill 的 canonical 工作流生成，中文保持相同要求。复制按钮复制当前语言的完整内容；浏览器不能访问剪贴板时，可以选择显示的文本手动复制。

## 设计参考

[卡兹克的 neat-freak](https://github.com/KKKKhazix/khazix-skills/tree/main/neat-freak) 为收尾思路提供了参考。本仓库独立组织工作流，没有复制或依赖该 Skill。
