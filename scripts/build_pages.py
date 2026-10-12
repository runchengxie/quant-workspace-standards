#!/usr/bin/env python3
"""Build portable HTML pages, the maintenance Skill and an offline site bundle."""

from __future__ import annotations

import argparse
import html
import io
import json
import shutil
import zipfile
from pathlib import Path

import markdown
import qrcode
import qrcode.image.svg

ROOT = Path(__file__).resolve().parents[1]
SITE_URL = "https://runchengxie.github.io/quant-workspace-standards/"
ROUTES = {
    "home": "index.html",
    "standards": "standards/index.html",
    "cases": "cases/index.html",
    "playbooks": "playbooks/index.html",
    "talk": "talk/2026-10-18/index.html",
}
LANGUAGES = ("en-US", "zh-CN")


def render(source: Path) -> str:
    return markdown.markdown(
        source.read_text(encoding="utf-8"),
        extensions=["fenced_code", "tables", "sane_lists"],
        output_format="html5",
    )


def bilingual(name: str) -> str:
    return "".join(
        f'<section class="locale-panel document" data-locale="{locale}"'
        f"{' hidden' if locale != 'en-US' else ''}>"
        f"{render(ROOT / 'content' / (name + '.' + ('en' if locale == 'en-US' else locale) + '.md'))}"
        "</section>"
        for locale in LANGUAGES
    )


def prompt_cards() -> str:
    cards = []
    for name in ("code", "docs", "closeout"):
        for locale in LANGUAGES:
            path = (
                ROOT / "skills/repo-maintenance/workflows" / f"{name}.md"
                if locale == "en-US"
                else ROOT / "content/prompts" / f"{name}.zh-CN.md"
            )
            text = path.read_text(encoding="utf-8")
            title = text.splitlines()[0].removeprefix("# ")
            identifier = f"prompt-{name}-{locale}"
            cards.append(
                f'<section class="prompt" data-locale="{locale}"'
                f"{' hidden' if locale != 'en-US' else ''}>"
                f'<div class="prompt-head"><h2>{html.escape(title)}</h2>'
                f'<button data-copy="{identifier}" data-i18n="copy">Copy full prompt</button></div>'
                f'<pre id="{identifier}" tabindex="0">{html.escape(text)}</pre></section>'
            )
    return (
        '<p id="copy-status" class="status" role="status" aria-live="polite"></p>'
        + "".join(cards)
    )


def qr_svg() -> str:
    image = qrcode.make(
        SITE_URL + "playbooks/", image_factory=qrcode.image.svg.SvgPathImage
    )
    buffer = io.BytesIO()
    image.save(buffer)
    return (
        buffer.getvalue().decode().replace("<?xml version='1.0' encoding='UTF-8'?>", "")
    )


def deck() -> str:
    slides = json.loads((ROOT / "content/talk-slides.json").read_text(encoding="utf-8"))
    rendered = []
    for number, slide in enumerate(slides, 1):
        body = []
        for locale in LANGUAGES:
            title = html.escape(slide["title"][locale])
            points = "".join(
                f"<li>{html.escape(point)}</li>" for point in slide["points"][locale]
            )
            body.append(
                f'<div data-locale="{locale}"{" hidden" if locale != "en-US" else ""}>'
                f"<h1>{title}</h1><ul>{points}</ul></div>"
            )
        if slide.get("case"):
            body.append(
                f'<a href="../../cases/index.html" data-i18n="evidence">Case evidence</a> · #{slide["case"]}'
            )
        if number == len(slides):
            body.append(
                '<div class="resources"><div class="qr" role="img" aria-label="QR: prompts and Skill">'
                + qr_svg()
                + '</div><a href="../../playbooks/index.html" data-i18n="resources">Prompts and Skill</a></div>'
            )
        rendered.append(
            f'<section class="slide" id="{html.escape(slide["id"], quote=True)}"'
            f' data-notes="{html.escape(slide["notes"], quote=True)}"'
            f"{' hidden' if number != 1 else ''}>"
            f'<div class="slide-number">{number:02d} / {len(slides):02d}</div>'
            + "".join(body)
            + "</section>"
        )
    return (
        "".join(rendered)
        + """
<div class="progress"><span id="progress-bar"></span></div>
<div class="deck-controls">
<button id="previous" data-i18n="previous">Previous</button>
<span id="page-count" role="status" aria-live="polite"></span>
<button id="next" data-i18n="next">Next</button>
<button id="fullscreen" data-i18n="fullscreen">Fullscreen</button>
<button id="notes-toggle" data-i18n="notes" aria-expanded="false" aria-controls="speaker-notes">Speaker notes</button>
</div>
<p class="help" data-i18n="keyboard">← → / Space to navigate · F fullscreen · N notes · Home / End</p>
<p id="deck-status" role="status"></p>
<aside class="speaker-notes document" id="speaker-notes" hidden lang="zh-CN"><p id="notes-text"></p></aside>
<a class="reading-link" href="reading.html" data-i18n="reading">Read the complete Chinese talk</a>
<a href="https://runchengxie.github.io/quant-workspace-standards/downloads/engineering-practices-offline.zip" data-i18n="offline">Download the complete offline site</a>
"""
    )


def write_page(
    output: Path,
    route: str,
    content: str,
    *,
    key: str,
    title: str,
    body_class: str = "",
) -> None:
    root_link = "../" * (len(Path(route).parts) - 1)
    navigation = "".join(
        f'<a href="{root_link}{target}" data-i18n="{name}"'
        f"{' aria-current=page' if name == key else ''}>{name.title()}</a>"
        for name, target in ROUTES.items()
    )
    replacements = {
        "TITLE": html.escape(title),
        "BODY_CLASS": body_class,
        "ROOT": root_link,
        "NAV": navigation,
        "CONTENT": content,
        "STYLE": (ROOT / "site/assets/site.css").read_text(encoding="utf-8"),
        "SCRIPT": (ROOT / "site/assets/site.js").read_text(encoding="utf-8"),
        "CATALOG": (ROOT / "site/locales.json")
        .read_text(encoding="utf-8")
        .replace("<", "\\u003c"),
    }
    template = (ROOT / "site/index.template.html").read_text(encoding="utf-8")
    for marker, value in replacements.items():
        token = "{{" + marker + "}}"
        if template.count(token) != 1:
            raise ValueError(f"Expected exactly one {token} marker")
        template = template.replace(token, value)
    destination = output / route
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(template, encoding="utf-8")


def build(output: Path) -> None:
    output = output.resolve()
    # Avoid overwriting source files or bundling arbitrary repository/user files.
    if ROOT.is_relative_to(output) or (
        output.is_relative_to(ROOT) and output != ROOT / "_site"
    ):
        raise ValueError("Output must be a dedicated generated-site directory")
    output.mkdir(parents=True, exist_ok=True)
    write_page(
        output,
        ROUTES["home"],
        bilingual("home"),
        key="home",
        title="Engineering practices",
        body_class="home",
    )
    write_page(
        output,
        ROUTES["standards"],
        '<p class="notice" data-i18n="canonical"></p><article class="document" lang="en">'
        + render(ROOT / "AGENTS.md")
        + "</article>",
        key="standards",
        title="Workspace standards",
    )
    write_page(
        output,
        ROUTES["cases"],
        bilingual("cases"),
        key="cases",
        title="Engineering cases",
    )
    write_page(
        output,
        ROUTES["playbooks"],
        bilingual("playbooks") + prompt_cards(),
        key="playbooks",
        title="Prompts and Skill",
    )
    write_page(
        output,
        ROUTES["talk"],
        deck(),
        key="talk",
        title="2026-10-18 talk",
        body_class="deck",
    )
    write_page(
        output,
        "talk/2026-10-18/reading.html",
        '<article class="document" lang="zh-CN">'
        + render(ROOT / "content/talk.zh-CN.md")
        + "</article>",
        key="talk",
        title="分享阅读稿",
    )
    files = [Path(route) for route in ROUTES.values()] + [
        Path("talk/2026-10-18/reading.html")
    ]
    skill_source = ROOT / "skills/repo-maintenance"
    skill_files = sorted(path for path in skill_source.rglob("*") if path.is_file())
    download = output / "downloads"
    download.mkdir(exist_ok=True)
    with zipfile.ZipFile(
        download / "repo-maintenance.zip", "w", zipfile.ZIP_DEFLATED
    ) as archive:
        for source in skill_files:
            relative = Path("repo-maintenance") / source.relative_to(skill_source)
            target = download / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
            archive.write(source, relative.as_posix())
            files.append(Path("downloads") / relative)
    files.append(Path("downloads/repo-maintenance.zip"))
    with zipfile.ZipFile(
        download / "engineering-practices-offline.zip", "w", zipfile.ZIP_DEFLATED
    ) as archive:
        for relative in files:
            archive.write(output / relative, relative.as_posix())
    (output / ".nojekyll").write_text("", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        type=Path,
        required=True,
        help="Dedicated generated output directory, normally under DATA_ROOT",
    )
    build(parser.parse_args().output_dir)


if __name__ == "__main__":
    main()
