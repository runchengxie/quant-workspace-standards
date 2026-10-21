# AI 辅助开发规范

这套规范说明怎样和 AI 编程助手一起维护项目。从动手前了解项目，到分开处理多个任务、验证修改，再到提交和收尾，都有对应的规则。

[English](README.md) · [在线阅读](https://runchengxie.github.io/quant-workspace-standards/)

## 主要管什么

- 修改前先读项目要求，检查当前分支和已有改动。
- 独立任务使用各自的分支和工作目录。
- 代码、测试和文档保持一致，只报告实际运行的检查。
- 按已有授权走 PR 流程，合并前对照最新主线验证。
- 收尾时保留别人的工作和仍在使用的运行资源。
- 私有配置、数据和运行产物放在源码仓库之外。

## 怎么用

先读[中文规范](AGENTS.zh-CN.md)，需要核对原文时看[英文规范](AGENTS.md)。按自己的工作区调整通用规则，再把项目边界和验证命令写进各项目的 AGENTS.md。采用前留意交付规则，本工作区允许直接合并已授权任务的做法，需要按团队情况调整。

反复做仓库维护时，可以使用 [repo-maintenance](scripts/repo-maintenance/SKILL.md)。它支持只读审计、代码维护、文档检查和任务收尾。[提示词与 Skill 页面](https://runchengxie.github.io/quant-workspace-standards/playbooks/index.html)提供完整提示词、安装方法和一次模拟演练。

## 需要时再看

- [本地配置](docs/workspace-configuration.zh-CN.md)
- [推送、清理与规范差异的只读检查](docs/maintenance/tools.zh-CN.md)
- [行为评估结果与发现的问题](docs/maintenance/evaluation-2026-10-21.md)
- [仓库结构与文档入口](docs/README.md)

英文 AGENTS.md 是规范原文。这个仓库保留通用规则和可复用工具，个人设置、凭据和运行数据另行保存。
