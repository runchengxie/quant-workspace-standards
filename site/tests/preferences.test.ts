import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeLocale,
  normalizeTheme,
  resolvedTheme,
} from "../src/client/preferences";
test("unknown preferences fall back to English and the system theme", () => {
  assert.equal(normalizeLocale("fr-FR"), "en-US");
  assert.equal(normalizeLocale(null), "en-US");
  assert.equal(normalizeLocale("zh-CN"), "zh-CN");
  assert.equal(normalizeTheme("broken"), "system");
  assert.equal(normalizeTheme(null), "system");
});
test("an explicit theme overrides the system", () => {
  assert.equal(resolvedTheme("light", true), "light");
  assert.equal(resolvedTheme("dark", false), "dark");
  assert.equal(resolvedTheme("system", true), "dark");
  assert.equal(resolvedTheme("system", false), "light");
});
