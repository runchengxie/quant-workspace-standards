export function initDeck(message: (key: string) => string): void {
  const slides = [...document.querySelectorAll<HTMLElement>(".slide")];
  if (!slides.length) return;

  const illustrations = [
    ...document.querySelectorAll<HTMLDetailsElement>(".talk-image-disclosure"),
  ];
  let beforePrint: boolean[] | undefined;
  window.addEventListener("beforeprint", () => {
    if (beforePrint) return;
    beforePrint = illustrations.map((item) => item.open);
    illustrations.forEach((item) => {
      item.open = true;
    });
  });
  window.addEventListener("afterprint", () => {
    if (!beforePrint) return;
    illustrations.forEach((item, index) => {
      item.open = beforePrint?.[index] ?? false;
    });
    beforePrint = undefined;
  });

  let current = 0;
  const previous = document.querySelector<HTMLButtonElement>("#previous");
  const next = document.querySelector<HTMLButtonElement>("#next");
  const notesToggle = document.querySelector<HTMLButtonElement>("#notes-toggle");

  function show(index: number, updateHash = true): void {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, slideIndex) => {
      slide.hidden = slideIndex !== current;
    });
    const slide = slides[current];
    if (!slide) return;

    const count = document.getElementById("page-count");
    if (count) count.textContent = `${current + 1} / ${slides.length}`;
    const progress = document.getElementById("progress-bar");
    if (progress) progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    if (previous) previous.disabled = current === 0;
    if (next) next.disabled = current === slides.length - 1;
    const notes = document.getElementById("notes-text");
    if (notes) notes.textContent = slide.dataset["notes"] ?? "";
    if (updateHash) history.replaceState(null, "", `#${slide.id}`);
    if (document.fullscreenElement) window.scrollTo(0, 0);
    window.dispatchEvent(new Event("talkslidechange"));
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
      else {
        await document.documentElement.requestFullscreen();
        // Move focus off the now-hidden fullscreen button so slide shortcuts work.
        const main = document.getElementById("main");
        main?.setAttribute("tabindex", "-1");
        main?.focus({ preventScroll: true });
      }
    } catch {
      const status = document.getElementById("deck-status");
      if (status) status.textContent = message("fullscreenFallback");
    }
  }

  document.getElementById("fullscreen")?.addEventListener("click", () => {
    void fullscreen();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && document.fullscreenElement) {
      void fullscreen();
      return;
    }
    if (
      (event.target instanceof Element &&
        event.target.closest("select,button,input,textarea,a,summary")) ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    if (["ArrowRight", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      show(current + 1);
    }
    if (["ArrowLeft", "PageUp"].includes(event.key)) {
      event.preventDefault();
      show(current - 1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      show(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      show(slides.length - 1);
    }
    if (event.key.toLowerCase() === "f") void fullscreen();
    if (event.key.toLowerCase() === "n") notesToggle?.click();
  });
  window.addEventListener("hashchange", fromHash);
  fromHash();
}
