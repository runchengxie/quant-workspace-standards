"""Exercise locale presentation contracts without a browser or network."""

import shutil
import subprocess
import unittest
from pathlib import Path


class LocaleRuntimeTests(unittest.TestCase):
    def test_default_unknown_missing_translation_and_storage_failure(self):
        node = shutil.which("node")
        if node is None:
            self.skipTest("Node.js is unavailable for the JavaScript runtime check")
        script = Path(__file__).resolve().parents[1] / "site/assets/site.js"
        harness = r'''
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const source = fs.readFileSync(process.argv[1], "utf8");
for (const stored of [null, "en-US", "zh-CN", "unknown", "throws"]) {
  const catalog = {"en-US": {label: "English", missing: "Fallback"},
                   "zh-CN": {label: "中文"}};
  const label = {dataset: {i18n: "label"}};
  const panels = ["en-US", "zh-CN"].map(locale => ({dataset: {locale}}));
  const switcher = {addEventListener() {}};
  const storage = {getItem() {
    if (stored === "throws") throw new Error("Storage denied");
    return stored;
  }, setItem() { if (stored === "throws") throw new Error("Storage denied"); }};
  const document = {documentElement: {},
    getElementById(id) {
      return id === "locale-catalog" ? {textContent: JSON.stringify(catalog)} : null;
    }, querySelectorAll(selector) {
      return selector === "[data-i18n]" ? [label] :
             selector === "[data-locale]" ? panels :
             selector === ".locale" ? [switcher] : [];
    }};
  const context = vm.createContext({document, localStorage: storage});
  vm.runInContext(source, context);
  assert.equal(label.textContent, stored === "zh-CN" ? "中文" : "English");
  vm.runInContext('applyLocale("zh-CN")', context);
  assert.equal(vm.runInContext('message("missing")', context), "Fallback");
  assert.equal(vm.runInContext('message("unknownKey")', context), "unknownKey");
  assert.equal(label.textContent, "中文");
  assert.deepEqual(panels.map(panel => panel.hidden), [true, false]);
  vm.runInContext('applyLocale("unknown")', context);
  assert.equal(label.textContent, "English");
  assert.equal(document.documentElement.lang, "en");
  assert.equal(switcher.value, "en-US");
  assert.deepEqual(panels.map(panel => panel.hidden), [false, true]);
  assert.deepEqual(catalog, {"en-US": {label: "English", missing: "Fallback"},
                             "zh-CN": {label: "中文"}});
}
'''
        result = subprocess.run([node, "-e", harness, str(script)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
