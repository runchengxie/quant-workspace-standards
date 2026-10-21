# 代码审计、重构与架构优化

请排查当前项目及其 submodule，结合实际代码、配置、CLI、测试、依赖关系和跨仓接口，检查正确性、架构、维护性和测试质量。在保持公共契约兼容的前提下，直接修复有证据支持、范围明确的问题，不为了产生修改而重构。

## 项目事实与基线

确认各仓库的职责、结构、入口、公共 API、CLI、配置默认值、artifact schema 和版本、数据流、data lineage，以及生产者和消费者之间的关系。修改前记录质量检查的配置、覆盖范围和实际执行结果。

## 代码与架构

- 检查 dead code、一次性脚本、重复实现、冗余逻辑、历史兼容层及未使用依赖。删除前检查静态调用、动态发现、外部引用和兼容需求。
- 检查巨型模块或类、过长函数、重复转换、过度抽象，以及循环、过深、反向或不合理依赖。
- 检查模块职责、内聚性、耦合度、跨仓重复能力和共享层边界。
- 根据语言惯例检查类型、错误处理、异常传播、资源管理、并发、I/O、配置加载和边界验证。合理运用 SOLID、PEP 8 或其他语言对应原则，不机械增加抽象。
- 排查有明确证据的性能、安全性和可测试性问题。
- 必要时使用 LOC、Cyclomatic Complexity、Cognitive Complexity、AST、static analysis、import/dependency graph、call graph、artifact/data lineage graph 和 version/dependency graph。指标用于定位和解释问题，不以降低数字作为验收目标。

## 工具与测试

Python 项目结合现有 `ruff`、`ty`、`pytest`、coverage 和 `pip-audit`。其他语言使用对应的 lint、formatter、type checker、test runner、coverage、security scanner 和 dependency audit。

检查配置范围、依赖版本、本地与 CI 的一致性。逐项判断 lint ignore、type ignore、coverage exclude 和测试跳过规则，能修复底层问题的优先修复，必要例外保留理由。

检查行为、边界、异常路径、回归，以及 API、CLI、schema、配置和 artifact contract。减少对私有实现和脆弱 mock 的依赖，验证实际固定版本下的生产消费兼容性。必要时先补有价值的回归测试再修改行为，不为覆盖率编写低价值测试。已有 i18n 的项目应保证 locale 不改变结构化结果、计算结果和机器契约。

## 修复与验收

根据正确性、安全性、契约风险和维护收益排序。复现问题，实施小范围修复，执行受影响检查并验证兼容性。对跨仓依赖和迁移说明后续步骤，缺少必要授权或消费者迁移条件时停止相关高风险修改，继续独立且已授权的工作。

报告实际检查的仓库和 submodule、带位置和证据的问题、修复依据、测试增改删、运行命令及结果，以及未解决问题和跨仓后续事项。
## 共同执行约束

修改前读取目标仓库的规则，检查工作区、分支、remote 和 worktree。将 submodule 视为独立仓库，记录路径、gitlink SHA、实际检出 SHA、未提交内容及生产消费契约。不要为了完成检查自动初始化缺失的 submodule 或升级 gitlink，明确报告无法检查的范围。

记录项目实际使用的 lint、type check、test、coverage、security 和 dependency check 基线。根据语言和项目配置选择工具，区分原有失败、新增回归和无法运行的检查。重要结论附代码或配置位置、复现方式或运行证据。

保留用户已有修改。worktree、commit、PR、merge、部署和当前任务清理由会话中已有授权及仓库规则决定，本提示词不额外授予修改其他仓库、用户数据、无关分支或生产环境的权限。破坏兼容性的变更应先说明影响和迁移步骤，仅在实际缺少必要授权时请求确认，不绕过仓库保护。

不得通过删除有效测试、扩大 ignore、降低阈值或隐藏报错制造通过结果。已经确认功能退役的测试可以有依据地删除。只报告实际执行的验证。
