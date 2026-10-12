"""Validate portable page contracts and distributable maintenance resources."""

from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
import zipfile
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "build_pages", ROOT / "scripts/build_pages.py"
)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.links, self.ids, self.pre = [], [], {}
        self.active_pre = None
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if "id" in attributes:
            self.ids.append(attributes["id"])
        if tag == "a" and "href" in attributes:
            self.links.append(attributes["href"])
        if tag == "pre" and "id" in attributes:
            self.active_pre = attributes["id"]
            self.pre[self.active_pre] = ""

    def handle_data(self, data):
        if self.active_pre:
            self.pre[self.active_pre] += data

    def handle_endtag(self, tag):
        if tag == "pre":
            self.active_pre = None


class PagesTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp = tempfile.TemporaryDirectory()
        cls.output = Path(cls.temp.name) / "site"
        builder.build(cls.output)

    @classmethod
    def tearDownClass(cls):
        cls.temp.cleanup()

    def test_relative_links_and_fragment_targets_resolve_offline(self):
        for source in self.output.rglob("*.html"):
            page = Page(source.read_text())
            self.assertEqual(len(page.ids), len(set(page.ids)), source)
            for href in page.links:
                link = urlsplit(href)
                if link.scheme or link.netloc:
                    continue
                target = (
                    (source.parent / unquote(link.path)).resolve()
                    if link.path
                    else source
                )
                self.assertTrue(target.is_relative_to(self.output), (source, href))
                self.assertTrue(target.is_file(), (source, href))
                if link.fragment:
                    self.assertIn(unquote(link.fragment), Page(target.read_text()).ids)

    def test_copyable_prompts_preserve_complete_source(self):
        page = Page((self.output / "playbooks/index.html").read_text())
        for workflow in ("code", "docs", "closeout"):
            english = ROOT / "skills/repo-maintenance/workflows" / f"{workflow}.md"
            chinese = ROOT / "content/prompts" / f"{workflow}.zh-CN.md"
            self.assertEqual(page.pre[f"prompt-{workflow}-en-US"], english.read_text())
            self.assertEqual(page.pre[f"prompt-{workflow}-zh-CN"], chinese.read_text())

    def test_skill_archive_is_self_contained(self):
        with zipfile.ZipFile(self.output / "downloads/repo-maintenance.zip") as archive:
            expected = {
                "repo-maintenance/SKILL.md",
                "repo-maintenance/references/evidence.md",
            }
            expected.update(
                f"repo-maintenance/workflows/{name}.md"
                for name in ("code", "docs", "closeout")
            )
            self.assertEqual(set(archive.namelist()), expected)
            for name in archive.namelist():
                source = ROOT / "skills" / name
                self.assertEqual(archive.read(name), source.read_bytes())

    def test_offline_bundle_includes_pages_and_linked_resources_only(self):
        with zipfile.ZipFile(
            self.output / "downloads/engineering-practices-offline.zip"
        ) as archive:
            names = set(archive.namelist())
            self.assertIn("talk/2026-10-18/index.html", names)
            self.assertIn("talk/2026-10-18/reading.html", names)
            self.assertIn("downloads/repo-maintenance.zip", names)
            self.assertFalse(
                any(".." in Path(name).parts or name.startswith("/") for name in names)
            )
            self.assertFalse(
                any(name.startswith((".git", "tests", "docs")) for name in names)
            )
            for name in names:
                if name.endswith(".html"):
                    page = archive.read(name).decode()
                    self.assertNotIn("<script src=", page)
                    self.assertNotIn('<link rel="stylesheet"', page)
                    for href in Page(page).links:
                        link = urlsplit(href)
                        if link.scheme or link.netloc or not link.path:
                            continue
                        target = (
                            self.output / Path(name).parent / unquote(link.path)
                        ).resolve()
                        self.assertIn(target.relative_to(self.output).as_posix(), names)

    def test_locales_and_slide_identities_have_consistent_structure(self):
        locales = json.loads((ROOT / "site/locales.json").read_text())
        self.assertEqual(set(locales["en-US"]), set(locales["zh-CN"]))
        slides = json.loads((ROOT / "content/talk-slides.json").read_text())
        self.assertEqual(len(slides), len({slide["id"] for slide in slides}))
        for slide in slides:
            self.assertEqual(set(slide["title"]), {"en-US", "zh-CN"})
            self.assertEqual(
                len(slide["points"]["en-US"]), len(slide["points"]["zh-CN"])
            )

    def test_output_cannot_replace_source(self):
        for path in (
            ROOT,
            ROOT.parent,
            ROOT / "skills/output",
            ROOT / "content/output",
            ROOT / ".git",
        ):
            with self.assertRaises(ValueError):
                builder.build(path)


if __name__ == "__main__":
    unittest.main()
