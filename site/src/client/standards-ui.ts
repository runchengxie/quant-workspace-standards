export function initStandards(message: (key: string) => string): void {
  const chapters = [...document.querySelectorAll<HTMLDetailsElement>('.standard-chapter')];
  document.querySelectorAll<HTMLElement>('.chapter-controls').forEach(controls => controls.hidden = false);
  const textDisclosure = document.querySelector<HTMLDetailsElement>('.flow-notes');
  let printTextOpen: boolean | undefined;
  const subDisclosures = [...document.querySelectorAll<HTMLDetailsElement>('.flow-coordination, .flow-standard')];
  let printSubState: boolean[] | undefined;
  const visibleChapters = () => chapters.filter(chapter => !chapter.closest<HTMLElement>('[data-locale]')?.hidden);
  function revealChapter(): void {
    let id: string;
    try { id = decodeURIComponent(location.hash.slice(1)).replace(/-zh-CN$/, ''); }
    catch { return; }
    if (id === 'parallel-development') {
      document.getElementById('parallel-development')?.scrollIntoView({ block: 'start' });
      return;
    }
    if (!id.startsWith('standard-')) return;
    for (const chapter of visibleChapters()) {
      if (chapter.id.replace(/-zh-CN$/, '') === id) {
        if (textDisclosure) textDisclosure.open = true;
        chapter.closest<HTMLDetailsElement>('.flow-standard')!.open = true;
        chapter.open = true;
        chapter.scrollIntoView({ block: 'start' });
      }
    }
  }
  document.querySelectorAll('[data-expand-all]').forEach(button => button.addEventListener('click', () => visibleChapters().forEach(chapter => chapter.open = true)));
  document.querySelectorAll('[data-collapse-all]').forEach(button => button.addEventListener('click', () => visibleChapters().forEach(chapter => chapter.open = false)));
  window.addEventListener('hashchange', revealChapter);
  window.addEventListener('presentationchange', revealChapter);
  revealChapter();
  let printState: boolean[] | undefined;
  window.addEventListener('beforeprint', () => {
    if (printState) return;
    printState = chapters.map(chapter => chapter.open);
    printSubState = subDisclosures.map(item => item.open);
    subDisclosures.forEach(item => item.open = true);
    if (textDisclosure) { printTextOpen = textDisclosure.open; textDisclosure.open = true; }
    chapters.forEach(chapter => chapter.open = true);
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    chapters.forEach((chapter, index) => chapter.open = printState![index]!);
    printState = undefined;
    subDisclosures.forEach((item, index) => item.open = printSubState?.[index] ?? false);
    printSubState = undefined;
    if (textDisclosure && printTextOpen !== undefined) { textDisclosure.open = printTextOpen; printTextOpen = undefined; }
  });

  const demo = document.querySelector<HTMLElement>('#flow-demo');
  if (!demo) return;
  initFlowTooltip(demo, message);
  const play = document.querySelector<HTMLButtonElement>('#flow-play')!;
  const next = document.querySelector<HTMLButtonElement>('#flow-next')!;
  const status = document.querySelector<HTMLElement>('#flow-status')!;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let step = 7;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let playing = false;
  function stop(): void {
    clearTimeout(timer);
    timer = undefined;
    playing = false;
  }
  function render(): void {
    demo!.dataset.step = String(step);
    demo!.dataset.reducedMotion = String(reduced.matches);
    demo!.classList.toggle('is-playing', playing);
    demo!.querySelectorAll<SVGElement>('[data-reveal]').forEach(mark => {
      mark.classList.toggle('is-pending', Number(mark.dataset.reveal) > step);
    });
    play.dataset.i18n = playing ? 'flowPause' : 'flowPlay';
    play.textContent = message(play.dataset.i18n);
    next.disabled = step === 7;
    status.dataset.i18n = `flowStep${step}`;
    status.textContent = message(status.dataset.i18n);
  }
  function schedule(): void {
    timer = setTimeout(() => {
      step++;
      if (step === 7) stop();
      render();
      if (playing) schedule();
    }, 2200);
  }
  function start(restart: boolean): void {
    stop();
    if (restart || step === 7) step = 0;
    playing = true;
    render();
    schedule();
  }
  play.addEventListener('click', () => {
    if (playing) { stop(); render(); }
    else start(false);
  });
  next.addEventListener('click', () => { stop(); step = Math.min(7, step + 1); render(); });
  document.querySelector('#flow-replay')?.addEventListener('click', () => start(true));
  window.addEventListener('presentationchange', render);
  reduced.addEventListener('change', render);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); render(); } });
  let printStep: number | undefined;
  window.addEventListener('beforeprint', () => {
    if (printStep !== undefined) return;
    printStep = step;
    stop(); step = 7; render();
  });
  window.addEventListener('afterprint', () => {
    if (printStep === undefined) return;
    step = printStep; printStep = undefined; render();
  });
  demo.querySelector<HTMLElement>('.flow-controls')!.hidden = false;
  render();
}

function initFlowTooltip(demo: HTMLElement, message: (key: string) => string): void {
 const tooltip = demo.querySelector<HTMLElement>("#flow-tooltip")!;
 let active: SVGElement | undefined;
 let leaveTimer: ReturnType<typeof setTimeout> | undefined;
 let dismissed: SVGElement | undefined;
 let pinned = false;
 const nodes = [...demo.querySelectorAll<SVGElement>("g[tabindex][data-i18n-aria]")];
 function hide(): void { clearTimeout(leaveTimer); tooltip.hidden = true; pinned = false; active?.removeAttribute("aria-describedby"); active = undefined; }
 function show(node: SVGElement): void {
  if (dismissed === node || node.classList.contains("is-pending")) return;
  hide(); active = node; tooltip.textContent = message(node.dataset.i18nAria ?? ""); tooltip.hidden = false; node.setAttribute("aria-describedby", "flow-tooltip");
  const box = node.getBoundingClientRect(); const bounds = tooltip.getBoundingClientRect();
  tooltip.style.left = `${Math.max(12, Math.min(innerWidth - bounds.width - 12, box.left + box.width / 2 - bounds.width / 2))}px`;
  const above = box.top - bounds.height - 12; tooltip.style.top = `${Math.max(12, Math.min(innerHeight - bounds.height - 12, above >= 12 ? above : box.bottom + 12))}px`;
 }
 nodes.forEach(node => {
  node.addEventListener("pointerenter", () => {dismissed = undefined; show(node);});
  node.addEventListener("pointerleave", () => {if (document.activeElement !== node && !pinned) leaveTimer = setTimeout(hide, 150);});
  node.addEventListener("focus", () => {dismissed = undefined; show(node);});
  node.addEventListener("blur", hide);
  node.addEventListener("click", () => {dismissed = undefined; show(node); pinned = true;});
 });
 tooltip.addEventListener("pointerenter", () => clearTimeout(leaveTimer));
 tooltip.addEventListener("pointerleave", hide);
 document.addEventListener("keydown", event => {if (event.key === "Escape") {dismissed = active; hide();}});
 document.addEventListener("pointerdown", event => {if (!(event.target instanceof Element) || !event.target.closest("g[tabindex]")) hide();});
 function reposition(): void {
  if (!active) return;
  const node = active; const keepPinned = pinned; const box = node.getBoundingClientRect();
  if (box.bottom < 0 || box.top > innerHeight || box.width === 0) { hide(); return; }
  show(node); pinned = keepPinned;
 }
 window.addEventListener("resize", reposition);
 window.addEventListener("scroll", reposition, true);
 window.addEventListener("beforeprint", hide);
 window.addEventListener("presentationchange", () => {if (active) show(active);});
}
