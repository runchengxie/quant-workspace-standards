# Local workspace path configuration


Replace the illustrative absolute paths below with private machine settings. This example uses flat TOML keys and Python 3.11+; adapt the reader if your existing layout uses tables. It only prints paths, without modifying files or exporting shell variables. Keep resolved machine paths private.

```toml
# CONFIG_ROOT/shared/workspace.toml
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
for key in ("CODE_ROOT", "DATA_ROOT", "CONFIG_ROOT"):
    value = Path(settings[key])
    if not value.is_absolute():
        raise SystemExit(f"{key} must be an absolute path")
    print(f"{key}: {value}")
PYTHON
```


See [read-only standards comparison](maintenance/tools.en.md#local-standards-drift) before updating local instructions.
