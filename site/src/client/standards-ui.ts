export function initStandards(message: (key: string) => string): void {
  const chapters = [...document.querySelectorAll<HTMLDetailsElement>('.standard-chapter')];
  document.querySelectorAll<HTMLElement>('.chapter-controls').forEach(controls => controls.hidden = false);
  const textDisclosure = document.querySelector<HTMLDetailsElement>('.flow-notes');
  let printTextOpen: boolean | undefined;
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
    if (textDisclosure) { printTextOpen = textDisclosure.open; textDisclosure.open = true; }
    chapters.forEach(chapter => chapter.open = true);
  });
  window.addEventListener('afterprint', () => {
    if (!printState) return;
    chapters.forEach((chapter, index) => chapter.open = printState![index]!);
    printState = undefined;
    if (textDisclosure && printTextOpen !== undefined) { textDisclosure.open = printTextOpen; printTextOpen = undefined; }
  });

  const demo = document.querySelector<HTMLElement>('#flow-demo');
  if (!demo) return;
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
