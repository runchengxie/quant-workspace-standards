#!/usr/bin/env python3
"""Build the GitHub Pages site from the canonical Markdown standard."""

from __future__ import annotations

import argparse
from pathlib import Path

import markdown


ROOT = Path(__file__).resolve().parents[1]
TEMPLATE = ROOT / "site" / "index.template.html"
DOCUMENTS = {
    "{{ENGLISH_DOCUMENT}}": ROOT / "AGENTS.md",
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-dir", type=Path, default=ROOT / "_site")
    args = parser.parse_args()

    html = TEMPLATE.read_text(encoding="utf-8")
    for marker, source in DOCUMENTS.items():
        if html.count(marker) != 1:
            raise ValueError(f"Expected exactly one {marker} marker in {TEMPLATE}")
        rendered = markdown.markdown(
            source.read_text(encoding="utf-8"),
            extensions=["fenced_code", "tables", "sane_lists"],
            output_format="html5",
        )
        html = html.replace(marker, rendered)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    (args.output_dir / "index.html").write_text(html, encoding="utf-8")


if __name__ == "__main__":
    main()
