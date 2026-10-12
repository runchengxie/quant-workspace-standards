[下载 repo-maintenance.zip](../downloads/repo-maintenance.zip)

```text
使用 $repo-maintenance，以 full 模式维护当前仓库及其 submodule。
基于实际实现确认问题，保留公共契约，遵循仓库已有授权的交付流程。
```

<details>
<summary>安装说明</summary>

把完整的 `repo-maintenance` 文件夹解压到工具的 Skill 目录，保留其中的工作流文件和共享证据指引。


Codex 使用 `$CODEX_HOME/skills`，未设置时使用 `~/.codex/skills`。其他工具按各自目录安装，并按要求重启或重新加载。下载压缩包本身不会安装，也不会修改生产环境。

[Skill 源文件](https://github.com/runchengxie/quant-workspace-standards/tree/main/skills/repo-maintenance) · [入口指令](../downloads/repo-maintenance/SKILL.md)

交付遵循已有用户授权与仓库控制，`audit` 始终只读。报告区分已实现、已合并、已部署和消费者已采用的状态。


</details>

<details>
<summary>模式与执行范围</summary>

`full` 按代码、文档与测试、收尾的顺序执行，按需加载工作流，共用事实记录。验证发现问题时，只回到受影响阶段。


- `audit`：只读审计，按范围选择工作流。
- `code`：检查实现，修复范围明确的问题。
- `docs`：同步文档、测试脚本和已有 i18n。
- `full`：依次执行完整的三个阶段。

只做收尾时，直接指定收尾工作流即可，不另设公开的收尾模式。


</details>
