"use strict";
const catalog = JSON.parse(
  document.getElementById("locale-catalog").textContent,
);
let locale = "en-US";
try {
  if (localStorage.getItem("maintenance-locale") === "zh-CN") locale = "zh-CN";
} catch (_) {}
function message(key) {
  return catalog[locale][key] ?? catalog["en-US"][key] ?? key;
}
function applyLocale(value) {
  locale = value === "zh-CN" ? value : "en-US";
  document.documentElement.lang = locale === "en-US" ? "en" : "zh-CN";
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = message(el.dataset.i18n);
  });
  document.querySelectorAll("[data-locale]").forEach((el) => {
    el.hidden = el.dataset.locale !== locale;
  });
  document.querySelectorAll(".locale").forEach((el) => {
    el.value = locale;
  });
  document.getElementById("copy-status")?.replaceChildren();
  try {
    localStorage.setItem("maintenance-locale", locale);
  } catch (_) {}
}
document
  .querySelectorAll(".locale")
  .forEach((el) => el.addEventListener("change", () => applyLocale(el.value)));
applyLocale(locale);
document.querySelectorAll("[data-copy]").forEach((button) =>
  button.addEventListener("click", async () => {
    const content = document.getElementById(button.dataset.copy);
    const status = document.getElementById("copy-status");
    try {
      await navigator.clipboard.writeText(content.textContent);
      status.textContent = message("copied");
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(content);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      status.textContent = message("copyFallback");
    }
  }),
);
const slides = [...document.querySelectorAll(".slide")];
if (slides.length) {
  let current = 0;
  const previous = document.getElementById("previous");
  const next = document.getElementById("next");
  function show(index, updateHash = true) {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
    });
    document.getElementById("page-count").textContent =
      `${current + 1} / ${slides.length}`;
    document.getElementById("progress-bar").style.width =
      `${((current + 1) / slides.length) * 100}%`;
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    document.getElementById("notes-text").textContent =
      slides[current].dataset.notes;
    if (updateHash) history.replaceState(null, "", `#${slides[current].id}`);
  }
  function fromHash() {
    const index = slides.findIndex((slide) => `#${slide.id}` === location.hash);
    show(index < 0 ? 0 : index, false);
  }
  previous.addEventListener("click", () => show(current - 1));
  next.addEventListener("click", () => show(current + 1));
  document.getElementById("notes-toggle").addEventListener("click", (e) => {
    const notes = document.getElementById("speaker-notes");
    notes.hidden = !notes.hidden;
    e.currentTarget.setAttribute("aria-expanded", String(!notes.hidden));
  });
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch (_) {
      document.getElementById("deck-status").textContent =
        message("fullscreenFallback");
    }
  }
  document.getElementById("fullscreen").addEventListener("click", fullscreen);
  document.addEventListener("keydown", (e) => {
    if (
      e.target.closest("select,button,input,textarea,a") ||
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
    if (e.key.toLowerCase() === "f") fullscreen();
    if (e.key.toLowerCase() === "n")
      document.getElementById("notes-toggle").click();
  });
  window.addEventListener("hashchange", fromHash);
  fromHash();
}
