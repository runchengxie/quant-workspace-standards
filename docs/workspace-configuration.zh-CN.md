# 本地工作区路径配置


将以下示例路径替换为私有机器配置。推荐示例使用 `[roots]` 表和 Python 3.11+。顶层键在与 `[roots]` 不冲突时仍然可用。代码只显示路径，不修改文件或导出 shell 变量。解析结果保持私有。

```toml
# CONFIG_ROOT/shared/workspace.toml
[roots]
CODE_ROOT = "/srv/example/code"
DATA_ROOT = "/srv/example/data"
CONFIG_ROOT = "/srv/example/config"
```

```sh
# Set CONFIG_ROOT to the existing private configuration directory first.
python3 - "$CONFIG_ROOT/shared/workspace.toml" <<'PYTHON'
import sys
import tomllib
from pathlib import Path

settings = tomllib.loads(Path(sys.argv[1]).read_text())
nested = settings.get("roots", {})
if not isinstance(nested, dict):
    raise SystemExit("roots must be a table")
for key in ("CODE_ROOT", "DATA_ROOT", "CONFIG_ROOT"):
    if key in settings and key in nested and settings[key] != nested[key]:
        raise SystemExit(f"{key} has conflicting values")
    raw = nested.get(key, settings.get(key))
    if raw is None:
        raise SystemExit(f"{key} is missing")
    value = Path(raw)
    if not value.is_absolute():
        raise SystemExit(f"{key} must be an absolute path")
    print(f"{key}: {value}")
PYTHON
```


更新本地指令前，先使用[规范差异检查](maintenance/tools.zh-CN.md#本地规范差异)。
