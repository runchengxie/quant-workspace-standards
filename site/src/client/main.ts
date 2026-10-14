import { initStandards } from './standards-ui';
import { initTalkStories } from './talk-stories';
import {
  normalizeLocale,
  normalizeTheme,
  readPresentationPreference,
  savePreference,
  resolvedTheme,
  type Locale,
} from "./preferences";
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
  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    el.textContent = message(el.dataset["i18n"] ?? "");
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-aria]").forEach((el) => {
    el.setAttribute("aria-label", message(el.dataset["i18nAria"] ?? ""));
  });
  document.querySelectorAll<HTMLElement>("[data-locale]").forEach((el) => {
    el.hidden = el.dataset["locale"] !== locale;
  });
  document.querySelectorAll<HTMLSelectElement>(".locale").forEach((el) => {
    el.value = locale;
  });
  document.title = `${message(document.body.dataset["titleKey"] ?? "home")} · ${message("brand")}`;
  document.getElementById("copy-status")?.replaceChildren();
  savePreference("maintenance-locale", locale);
  syncOfflinePreferences();
  window.dispatchEvent(new Event('presentationchange'));
}
document
  .querySelectorAll<HTMLSelectElement>(".locale")
  .forEach((el) => el.addEventListener("change", () => applyLocale(el.value)));
applyLocale(locale);
function applyTheme(): void {
  document.documentElement.dataset["theme"] = resolvedTheme(
    theme,
    media.matches,
  );
  syncOfflinePreferences();
  document.querySelectorAll<HTMLSelectElement>(".theme").forEach((el) => {
    el.value = theme;
  });
}
document.querySelectorAll<HTMLSelectElement>(".theme").forEach((el) =>
  el.addEventListener("change", () => {
    theme = normalizeTheme(el.value);
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
const stages = [...document.querySelectorAll<HTMLElement>("[data-stage]")];
const phaseButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-phase]")];
function selectPhase(name: string): void {
 stages.forEach(stage => stage.hidden = stage.dataset["stage"] !== name);
 phaseButtons.forEach(button => button.setAttribute("aria-pressed", String(button.dataset["phase"] === name)));
 document.getElementById("copy-status")?.replaceChildren();
}
if (stages.length) {
 const controls = document.querySelector<HTMLElement>(".prompt-switch");
 if (controls) controls.hidden = false;
 selectPhase("code");
 phaseButtons.forEach(button => button.addEventListener("click", () => selectPhase(button.dataset["phase"] ?? "code")));
}

document.querySelectorAll<HTMLButtonElement>("[data-copy]").forEach((button) =>
  button.addEventListener("click", async () => {
    const content = document.getElementById(button.dataset["copy"] ?? "");
    const status = document.getElementById("copy-status");
    if (!content || !status) return;
    try {
      await navigator.clipboard.writeText(content.textContent ?? "");
      status.textContent = message("copied");
    } catch {
      const disclosure = content.closest<HTMLDetailsElement>("details");
      if (disclosure) disclosure.open = true;
      const range = document.createRange();
      range.selectNodeContents(content);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      status.textContent = message("copyFallback");
    }
  }),
);
const slides = [...document.querySelectorAll<HTMLElement>(".slide")];
if (slides.length) {
  const illustrations = [...document.querySelectorAll<HTMLDetailsElement>('.talk-image-disclosure')];
  let beforePrint: boolean[] | undefined;
  window.addEventListener('beforeprint', () => {
    if (beforePrint) return;
    beforePrint = illustrations.map(item => item.open);
    illustrations.forEach(item => { item.open = true; });
  });
  window.addEventListener('afterprint', () => {
    if (!beforePrint) return;
    illustrations.forEach((item, i) => { item.open = beforePrint![i] ?? false; });
    beforePrint = undefined;
  });
  let current = 0;
  const previous = document.querySelector<HTMLButtonElement>("#previous");
  const next = document.querySelector<HTMLButtonElement>("#next");
  const notesToggle =
    document.querySelector<HTMLButtonElement>("#notes-toggle");
  function show(index: number, updateHash = true): void {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
    });
    const slide = slides[current];
    if (!slide) return;
    const count = document.getElementById("page-count");
    if (count) count.textContent = `${current + 1} / ${slides.length}`;
    const progress = document.getElementById("progress-bar");
    if (progress)
      progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    if (previous) previous.disabled = current === 0;
    if (next) next.disabled = current === slides.length - 1;
    const notes = document.getElementById("notes-text");
    if (notes) notes.textContent = slide.dataset["notes"] ?? "";
    if (updateHash) history.replaceState(null, "", `#${slide.id}`);
    window.dispatchEvent(new Event('talkslidechange'));
  }
  function fromHash(): void {
    const index = slides.findIndex((slide) => `#${slide.id}` === location.hash);
    show(index < 0 ? 0 : index, false);
  }
  previous?.addEventListener("click", () => show(current - 1));
  next?.addEventListener("click", () => show(current + 1));
  notesToggle?.addEventListener("click", () => {
    const notes = document.getElementById("speaker-notes");
    if (!notes) return;
    notes.hidden = !notes.hidden;
    notesToggle.setAttribute("aria-expanded", String(!notes.hidden));
  });
  async function fullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      const status = document.getElementById("deck-status");
      if (status) status.textContent = message("fullscreenFallback");
    }
  }
  document.getElementById("fullscreen")?.addEventListener("click", () => {
    void fullscreen();
  });
  document.addEventListener("keydown", (e) => {
    if (
      (e.target instanceof Element &&
        e.target.closest("select,button,input,textarea,a,summary")) ||
      e.altKey ||
      e.ctrlKey ||
      e.metaKey
    )
      return;
    if (["ArrowRight", "PageDown", " "].includes(e.key)) {
      e.preventDefault();
      show(current + 1);
    }
    if (["ArrowLeft", "PageUp"].includes(e.key)) {
      e.preventDefault();
      show(current - 1);
    }
    if (e.key === "Home") {
      e.preventDefault();
      show(0);
    }
    if (e.key === "End") {
      e.preventDefault();
      show(slides.length - 1);
    }
    if (e.key.toLowerCase() === "f") void fullscreen();
    if (e.key.toLowerCase() === "n") notesToggle?.click();
  });
  window.addEventListener("hashchange", fromHash);
  fromHash();
}
