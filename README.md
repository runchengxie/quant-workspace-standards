# Quant Workspace Standards

Workspace-wide development standards for repositories under the quant code workspace.

The root [`AGENTS.md`](AGENTS.md) is the canonical, versioned copy. Keep local workspace instructions aligned with these standards and record the machine's resolved `CODE_ROOT`, `DATA_ROOT`, and `CONFIG_ROOT` there or in an explicitly referenced local settings file. Preserve repository-specific instructions in each project's own `AGENTS.md`.

This repository contains general development guidance. Keep credentials, personal settings, machine-specific paths, raw data, and runtime artifacts outside the repository.

## Read the standards

- [Source standard](AGENTS.md)
- [GitHub Pages site](https://runchengxie.github.io/quant-workspace-standards/)

Machine-local shared path settings belong in `CONFIG_ROOT/shared/workspace.toml`. Use the existing private configuration layout when available; otherwise, place `CONFIG_ROOT` under the owner's namespace in `XDG_CONFIG_HOME` (or `~/.config`) on Linux or `LOCALAPPDATA` on Windows. Tools must explicitly read these settings or receive the resolved paths through environment variables.
