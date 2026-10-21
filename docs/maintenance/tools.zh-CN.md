# 仓库维护的只读检查

这组命令用于推送、清理和更新规范之前收集本地证据，需要 Python 3.11+ 和 Git。它们不访问网络、不推送、不删除、不安装 hook，也不覆盖指令文件。JSON 字段与状态值保持稳定。输出可能含有本机 worktree 路径和提交标识，按私有工作记录处理。

## 推送目的地与版本

在规范仓库中执行，将示例替换为实际任务目录和预期 GitHub 仓库：

```sh
python3 -B scripts/repo-preflight.py push \
  --repo /path/to/task-worktree \
  --remote origin --target main \
  --expected-repository owner/repository
```

`--target` 指合入目标，推送来源是当前任务分支。报告提供明确的 `HEAD:refs/heads/<branch>` refspec，并显示全部展开后的推送目的地、当前 HEAD、本地记录的目标版本、相对目标分支的提交和待推送提交。本地没有远端任务分支时，使用合入目标作为比较基线；这不能证明远端没有该分支。

目的地不匹配、从 main/master 直接推送、工作区有未保存修改、配置了自定义推送 refspec 或镜像推送，都会列为阻碍。含凭据的 HTTPS 地址会被拦截并隐藏；不支持的地址类型不会被当成匹配。

退出码 0 表示支持的本地检查未发现已知阻碍，状态仍为 `review_required`。授权、远端是否最新、GitHub 必要检查仍为 `not_verified`。按已有授权获取远端状态，并确认验证后源分支和目标分支没有变化。退出码 1 表示有已知阻碍，2 表示输入无效或证据不可得。脚本不能替代分支保护，也不能授予推送权限。

同一 remote 若从上游拉取、向 fork 推送，它的跟踪引用就不能证明 fork 的状态，报告会阻止把这些版本当成目的仓库证据。应明确选择拉取与推送都指向预期仓库的 remote。工具只支持标准的全部分支跟踪 refspec，自定义映射会报告证据不可得。

## 清理盘点

```sh
python3 -B scripts/repo-preflight.py cleanup \
  --repo /path/to/repository \
  --candidate /path/to/task-worktree --base main
```

命令只检查明确指定的已登记 worktree：是否有未提交或未跟踪文件、是否锁定、是否为主 checkout 或受保护分支、HEAD 和基线版本，以及尚未被基线包含的提交。未登记或不可访问的目录保留，不按目录名称扫描“残留”，不读取其他 worktree 的文件内容。

决定始终为 `retain`。本地 Git 无法证明任务归属、PR 合并状态和外部任务是否仍依赖该目录。squash 合并后，即使交付内容一致，原提交也可能不在目标分支的祖先链上。实际清理前仍需独立核对 PR、任务归属、工作是否保存、运行资源登记和退役条件，并依据已有授权执行。工作区干净、没有独有提交，都不足以证明可以删除。退出码 1 表示需要继续核对，2 表示证据收集失败。

## 本地规范差异

```sh
python3 -B scripts/check-workspace-sync.py \
  --canonical AGENTS.md --local "$CODE_ROOT/AGENTS.md"
```

先解析 `CODE_ROOT`，TOML 不会自动导出变量。标准文件使用可信的英文原文，本地副本使用相同章节语言。脚本按 Markdown 块精确比较，不做语义判断或翻译比较。比较引言和二级章节，忽略一级标题、块顺序和换行格式，保留多行列表项及代码围栏。改写但语义相近的规则仍会被列为缺失，需要人工判断。

退出码 0 表示每条标准块都出现在对应章节，允许本地增补；1 表示共同规则或章节缺失、变化；2 表示输入或结构不可用。输出包括缺失的标准原文、本地增补数量和仅本地存在的章节名，不输出本地增补正文与机器配置引言。章节名本身也可能属于私有信息，应在本机审阅。选择需要更新的规则后，手工补入并保留个人配置；脚本不写入任何文件。

运行确定性测试：

```sh
python3 -B -m unittest discover -s scripts -p 'test_*.py'
```

另见[行为评估](evaluation.md)与[完整演练](../content/maintenance-example.zh-CN.md)，区分脚本检查与 agent 判断。
