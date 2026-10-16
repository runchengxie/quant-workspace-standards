import { initDeck } from "./deck-ui";
import { initPlaybooks } from "./playbooks-ui";
import { initStandards } from "./standards-ui";
import { initTalkStories } from "./talk-stories";
import {
  normalizeLocale,
  normalizeTheme,
  readPresentationPreference,
  resolvedTheme,
  savePreference,
} from "./preferences";
import type { Locale } from "../lib/locale";

const catalogElement = document.getElementById("locale-catalog");
if (!catalogElement?.textContent) throw new Error("Locale catalog missing");
const catalog: Record<Locale, Record<string, string>> = JSON.parse(
  catalogElement.textContent,
);
let locale = normalizeLocale(
  readPresentationPreference("maintenance-locale", "locale"),
);
let theme = normalizeTheme(
  readPresentationPreference("maintenance-theme", "theme"),
);
const media = window.matchMedia("(prefers-color-scheme: dark)");

function syncOfflinePreferences(): void {
  if (location.protocol !== "file:") return;
  const current = new URL(location.href);
  current.searchParams.set("locale", locale);
  current.searchParams.set("theme", theme);
  history.replaceState(null, "", current.href);
  document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((link) => {
    if (link.getAttribute("href")?.startsWith("#")) return;
    const target = new URL(link.href);
    if (target.protocol !== "file:" || !target.pathname.endsWith(".html"))
      return;
    target.searchParams.set("locale", locale);
    target.searchParams.set("theme", theme);
    link.href = target.href;
  });
}

function message(key: string): string {
  return catalog[locale][key] ?? catalog["en-US"][key] ?? key;
}

function applyLocale(value: unknown): void {
  locale = normalizeLocale(value);
  document.documentElement.lang = locale === "en-US" ? "en" : locale;
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((element) => {
    element.textContent = message(element.dataset["i18n"] ?? "");
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((element) => {
    element.setAttribute(
      "aria-label",
      message(element.dataset["i18nAria"] ?? ""),
    );
  });
  document.querySelectorAll<HTMLElement>("[data-locale]").forEach((element) => {
    element.hidden = element.dataset["locale"] !== locale;
  });
  document.querySelectorAll<HTMLSelectElement>(".locale").forEach((element) => {
    element.value = locale;
  });
  document.title = `${message(document.body.dataset["titleKey"] ?? "home")} · ${message("brand")}`;
  document.getElementById("copy-status")?.replaceChildren();
  savePreference("maintenance-locale", locale);
  syncOfflinePreferences();
  window.dispatchEvent(new Event("presentationchange"));
}

document.querySelectorAll<HTMLSelectElement>(".locale").forEach((element) =>
  element.addEventListener("change", () => applyLocale(element.value)),
);
applyLocale(locale);

function applyTheme(): void {
  document.documentElement.dataset["theme"] = resolvedTheme(
    theme,
    media.matches,
  );
  syncOfflinePreferences();
  document.querySelectorAll<HTMLSelectElement>(".theme").forEach((element) => {
    element.value = theme;
  });
}

document.querySelectorAll<HTMLSelectElement>(".theme").forEach((element) =>
  element.addEventListener("change", () => {
    theme = normalizeTheme(element.value);
    savePreference("maintenance-theme", theme);
    applyTheme();
  }),
);
media.addEventListener("change", () => {
  if (theme === "system") applyTheme();
});
applyTheme();

initStandards(message);
initTalkStories(message);
initPlaybooks(message);
initDeck(message);
