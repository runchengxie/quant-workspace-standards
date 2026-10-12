# 量化工作区工程规范

根目录 [AGENTS.md](AGENTS.md) 是英文 canonical 规范。本仓库保存通用开发约定，个人配置、机器路径、凭据、原始数据和运行产物放在仓库外。具体项目仍需遵循各自的 AGENTS.md。

机器本地路径设置保存在 `CONFIG_ROOT/shared/workspace.toml`，记录 `CODE_ROOT`、`DATA_ROOT` 和 `CONFIG_ROOT`。工具需要主动读取或接收已解析路径，TOML 不会自动导出环境变量。优先沿用已有私有配置布局，否则使用 `~/.config/<owner>/`，并遵循已设置的 `XDG_CONFIG_HOME`。工具专用配置放在工具要求的位置。

## 网站内容

[Pages 网站](https://runchengxie.github.io/quant-workspace-standards/) 提供工程规范、案例、三个提示词、可下载 Skill，以及 2026 年 10 月 18 日的分享页。网站默认英文，可显式切换中文并保存选择。工程规范仍以英文为准，中文分享是独立的个人叙述。

[repo-maintenance](skills/repo-maintenance/SKILL.md) 提供 `audit`、`code`、`docs` 和 `full` 模式，按需读取代码、文档和收尾工作流。英文工作流也是网站的英文提示词，[中文提示词](content/prompts/) 保持相同要求。安装时复制完整 Skill 文件夹，单独复制 SKILL.md 会缺少工作流。

演示页支持方向键、空格翻页、全屏、深链接、中文备注、完整阅读稿和离线包。案例证据区分仓库记录、回忆及尚未核实的数量。worktree 和 PR 流程遵循已有授权及仓库保护。

## 构建与验证

```sh
python -m pip install -r requirements-pages.txt
python -m unittest discover -s tests -v
python scripts/build_pages.py --output-dir "${DATA_ROOT}/quant/quant-workspace-standards/site"
```

执行前从机器配置解析 `DATA_ROOT`。生成页面及保留预览放在数据目录，CI 使用临时 `_site`，测试使用一次性临时目录。

可以直接打开生成的 `index.html`，也可以通过静态 HTTP 服务阅读。HTML 内嵌样式、脚本和语言目录，演示不依赖 API 或网络。二维码指向线上提示词页，离线包保留本地导航和提示词，再次下载和访问 PR 来源需要联网。

修改 `content/`、`site/locales.json`、`site/assets/` 或英文 Skill 工作流后重新构建。内容、Skill 和站点变更会触发 CI 验证和构建，只有 main 推送会部署。构建生成 Skill 压缩包和完整离线站点包，打包范围只包含明确的页面及资源。
