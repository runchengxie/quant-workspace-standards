# 网站构建与发布

这些说明用于维护规范网站。采用开发规范的项目不需要安装本站的构建工具。未另行说明时，从仓库根目录执行命令。


在仓库根目录运行 `node scripts/check-doc-links.mjs`，可检查 `docs/` 说明文档及根 README 的本地文件链接和标题锚点；`docs/content/` 使用构建后的网站路径，由产物检查验证。文档或检查器变更会单独触发这项 CI 检查，不构建或部署站点。

网站使用 Astro 7、TypeScript 和 Bun 1.4.3。Bun 管理锁定的 `site/bun.lock`；Astro 要求 Node.js 22.12.0 或更新版本。实现边界见[站点指引](../site/AGENTS.md)。

```sh
cd site
bun install --frozen-lockfile
bun run check
bun run test:unit
bun run build --output-dir "${DATA_ROOT}/quant/quant-workspace-standards/site"
STANDARDS_SITE_OUTPUT_DIR="${DATA_ROOT}/quant/quant-workspace-standards/site" bun run test:artifacts
STANDARDS_SITE_OUTPUT_DIR="${DATA_ROOT}/quant/quant-workspace-standards/site" bun run test:browser
bun audit
```

构建前从本机配置解析 `DATA_ROOT`。输出目录必须为空，或包含本构建器写入的 `.standards-site.json` 标记；发现其他文件时会拒绝写入。构建器先在临时目录生成产物，再发布已知文件。保留的构建结果放在 `DATA_ROOT`，CI 和测试使用临时目录。浏览器测试需要 Chromium；本地可通过 `bunx playwright install chromium` 安装，CI 会安装浏览器和系统依赖。

本地开发使用 `bun run dev`。构建器保留 `repo-maintenance.zip` 和 `engineering-practices-offline.zip` 两个下载文件名。旧 Python 构建器及其测试已由 TypeScript 构建、浏览器和产物检查接替；构建网站不依赖 Python。

规范、网站、内容、Skill 或 Pages 工作流发生变化时会触发检查。PR 只构建和验证，不部署。推送到 `main` 和手动触发工作流时会部署 Pages 网站。


维护脚本的验证方式见[只读工具说明](maintenance/tools.zh-CN.md)。独立工作流在 Linux 和 Windows 上运行确定性测试，不调用模型。
