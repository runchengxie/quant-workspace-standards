# Local workspace path configuration


Replace the illustrative absolute paths below with private machine settings. The recommended example uses a `[roots]` table and Python 3.11+. Flat top-level keys remain accepted when they do not conflict with `[roots]`. The snippet only prints paths, without modifying files or exporting shell variables. Keep resolved machine paths private.

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


See [read-only standards comparison](maintenance/tools.en.md#local-standards-drift) before updating local instructions.
