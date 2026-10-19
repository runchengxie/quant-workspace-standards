# 量化工作区工程规范

根目录 [`AGENTS.md`](AGENTS.md) 是版本管理中的英文权威规范。保持本地工作区说明与其一致，在本地说明或配置中记录已解析的 `CODE_ROOT`、`DATA_ROOT` 和 `CONFIG_ROOT`，各项目继续维护自己的 `AGENTS.md`。

本仓库只保存通用规范。凭据、个人设置、机器路径、原始数据和运行产物都应放在仓库外。

## 阅读规范

- [英文源文件](AGENTS.md)
- [GitHub Pages 网站](https://runchengxie.github.io/quant-workspace-standards/)
- [下载英文规范](https://runchengxie.github.io/quant-workspace-standards/downloads/AGENTS.md)和[中文译版](https://runchengxie.github.io/quant-workspace-standards/downloads/AGENTS.zh-CN.md)
- [并行 worktree 流程](https://runchengxie.github.io/quant-workspace-standards/standards/index.html#parallel-development)

## 网站内容

规范页展示默认 worktree 流程图和七个与源文件对应的章节。提示词页提供三个完整提示词和可下载的 `repo-maintenance` Skill。

网站默认英文，并提供持续记忆选择的简体中文界面，以及跟随系统、浅色和深色主题。未知 locale 回退到英文；缺失的中文界面翻译先回退到英文，再回退到稳定键名。语言和主题只改变呈现，不改变规范源文件、提示词或下载内容。

构建后的站点可直接从 `index.html` 离线打开，页面内嵌样式、语言目录和浏览器脚本。访问在线来源和下载仍需联网。安装 Skill 时复制完整的 `skills/repo-maintenance` 文件夹，以保留其中的工作流文件。

机器本地路径设置保存在 `CONFIG_ROOT/shared/workspace.toml`。工具需要主动读取或通过环境变量接收已解析路径，TOML 不会自动导出 shell 变量。沿用已有私有配置布局；没有现成布局时使用 `~/.config/<owner>/`，并遵循显式设置的 `XDG_CONFIG_HOME`。工具专用配置放在工具要求的位置。

## 构建与验证

在仓库根目录运行 `node scripts/check-doc-links.mjs`，可检查 `docs/` 下 Markdown 的本地文件链接和标题锚点。文档或检查器变更会单独触发这项 CI 检查，不构建或部署站点。

网站使用 Astro 7、TypeScript 和 Bun 1.4.3。Bun 管理锁定的 `site/bun.lock`；Astro 要求 Node.js 22.12.0 或更新版本。实现边界见[站点指引](site/AGENTS.md)。

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
