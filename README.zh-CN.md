# 量化工作区工程规范

根目录 [AGENTS.md](AGENTS.md) 是权威英文规范。本仓库保存通用开发约定，个人配置、机器路径、凭据、原始数据和运行产物放在仓库外。具体项目仍需遵循各自的 AGENTS.md。

机器本地路径设置保存在 `CONFIG_ROOT/shared/workspace.toml`，记录 `CODE_ROOT`、`DATA_ROOT` 和 `CONFIG_ROOT`。工具需要主动读取或接收已解析路径，TOML 不会自动导出环境变量。优先沿用已有私有配置布局，否则使用 `~/.config/<owner>/`，并遵循已设置的 `XDG_CONFIG_HOME`。工具专用配置放在工具要求的位置。

## 网站内容

规范页提供分支汇合图，点击后可播放、暂停、逐步推进和重播。七个章节支持折叠、全部展开或收起，以及直接定位；章节默认收起，worktree 演示在页面顶部直接展示。打印时展开完整规范，结束后恢复阅读状态，下载的 Markdown 仍保留全文。

网站采用工程手册式排版，以素色背景、标题层级、细分隔线和合适的正文行宽组织内容。首页只保留主题标题与三个内容入口；提示词页在共同阶段说明下，左右对照完整提示词与可重复调用的 Skill，较窄屏幕上纵向排列。

[下载英文 AGENTS.md](https://runchengxie.github.io/quant-workspace-standards/downloads/AGENTS.md) · [下载中文译版](https://runchengxie.github.io/quant-workspace-standards/downloads/AGENTS.zh-CN.md) · [并行开发流程图](https://runchengxie.github.io/quant-workspace-standards/standards/index.html#parallel-development)。下载文件直接复制对应规范源文件，完整离线包也包含两份规范。

[Pages 网站](https://runchengxie.github.io/quant-workspace-standards/) 提供工程规范、三个提示词、可下载 Skill，以及 2026 年 10 月 18 日的分享页。网站默认英文，可显式切换中文并保存选择。未知的保存或选择语言回退到英文，中文界面键缺失时先使用英文，再使用键名。工程规范以英文为准，中文正文由 AGENTS.zh-CN.md 提供完整本地化，中文分享是独立的个人叙述。所有页面支持跟随系统、浅色和深色主题。

[repo-maintenance](skills/repo-maintenance/SKILL.md) 提供 `audit`、`code`、`docs` 和 `full` 模式，按需读取代码、文档和收尾工作流。英文工作流也是网站的英文提示词，[中文提示词](content/prompts/) 保持相同要求。安装时复制完整 Skill 文件夹，单独复制 SKILL.md 会缺少工作流。

演示页支持方向键、空格翻页、全屏、深链接、中文备注、完整阅读稿和离线包。worktree 和 PR 流程遵循已有授权及仓库保护。

## 构建与验证

网站使用 Astro 7、TypeScript 和 Bun 1.4.3。Bun 管理唯一的 `site/bun.lock` 并运行脚本，Astro CLI 使用 Node >=22.12.0。[站点指引](site/AGENTS.md) 说明实现边界，无需 React 运行时。

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

执行前从机器配置解析 `DATA_ROOT`，TOML 不会自动导出变量。输出目录必须为空或由本构建器通过 `.standards-site.json` 标记为自身产物，包含其他文件时拒绝覆盖。Astro 先在临时目录构建，再写入明确的产物。保留的输出放在数据目录，CI 和测试使用一次性临时目录。浏览器测试需要通过 `bunx playwright install chromium` 安装 Chromium，CI 还会安装系统依赖。

本地开发使用 `bun run dev`。构建后可以直接打开 `index.html`，也可以通过静态 HTTP 服务阅读。HTML 内嵌样式、语言目录和编译后的普通浏览器脚本，离线站点无需服务或网络。为处理 file:// 存储的不一致，离线文件链接携带语言和主题查询参数，线上页面在 localStorage 中保存偏好。存储被拒绝时仍能在当前页面切换。二维码指向线上提示词页，再次下载和访问来源需要联网。

主题默认跟随系统，在系统模式下响应系统变化，并保存明确选择的浅色或深色。初始主题在 head 中先于样式应用，减少闪烁。主题不改变正文事实、投影片、提示词源文及下载内容。英文 [AGENTS.md](AGENTS.md) 是 canonical，中文 [AGENTS.zh-CN.md](AGENTS.zh-CN.md) 保持相同规则。分享按约十分钟准备。

修改 `content/`、`AGENTS.zh-CN.md`、`site/locales.json`、`site/src/` 或英文 Skill 工作流后重新构建。Astro 组件共用导航、文档渲染、提示词卡片和演示内容。`site/scripts/build.ts` 保留原有 reading.html 地址，只打包明确的页面和 Skill 资源，沿用 Skill 和离线站点压缩包名称。内容、Skill 和站点变更触发检查，main 推送和手动触发会部署，PR 只构建。

旧 Python HTML 构建器退役前，其提示词、压缩包、链接和输出边界契约已迁移到 TypeScript 与浏览器测试。网站构建不再依赖 Python。

提示词页一次选择一个阶段，无需展开原文即可复制完整提示词，安装与模式说明按需展开。规范页优先展示 worktree 图表，下载入口放在简介一侧。

首页依次列出开发规范、提示词与 Skill、分享。规范下载为顶部主操作，图表节点提供简短悬停提示，完整解释集中在默认收起的“文字说明”中。

规范简介与章节统一放在“文字说明”内。章节深链接自动展开外层说明，打印展开全文并在结束后恢复状态。

规范页并列说明英文权威文件与中文译版的用途。图表节点悬停、键盘聚焦或点击时立即显示说明，Escape 可关闭；“文字说明”分为短流程、隔离协调表格与完整规范。页尾保留简短 GitHub 入口，提示词页不再展示未使用的来源说明。

规范页以统一标题连接 AGENTS.md 指令文件与默认开发流程图解。分享阅读稿和双语投影片同步采用约八分钟脱敏版本，不包含私有稿件备注与原稿链接，保留原有投影片定位 ID。
