/** Gentle loops run only on the visible slide, respecting an explicit pause. */
export function initTalkStories(message: (key: string) => string): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll<HTMLElement>('[data-talk-story]').forEach(root => {
    const toggle = root.querySelector<HTMLButtonElement>('[data-story-toggle]');
    const controls = root.querySelector<HTMLElement>('.talk-story-controls');
    if (!toggle || !controls) return;
    let animations: Animation[] = [];
    let userPaused = false;
    let printing = false;
    // Equal first/last frames eliminate the jump at the loop boundary.
    // Motion occupies 30% of the cycle, followed by a long reading hold.
    function cycle(start: Keyframe, end: Keyframe): Keyframe[] {
      return [{...start,offset:0},{...start,offset:.12},{...end,offset:.42},
        {...end,offset:.80},{...start,offset:1}].map(frame => ({...frame,easing:'cubic-bezier(.45,0,.2,1)'}));
    }
    function update(): void {
      if (reduced.matches) {
        animations.forEach(a => a.cancel()); animations = [];
      }
      const playing = !userPaused && !printing && !document.hidden && !reduced.matches
        && !root.closest<HTMLElement>('.slide')?.hidden;
      if (playing && !animations.length) {
        const frames: Record<string, Keyframe[]> = {
          direction: cycle({opacity:.35},{opacity:1}),
          back: cycle({transform:'translate(14px,10px)'},{transform:'translate(9px,7px)'}),
          back2: cycle({transform:'translate(7px,5px)'},{transform:'translate(4px,3px)'}),
          report: cycle({opacity:1},{opacity:.6}),
          list: cycle({opacity:.55,transform:'translateX(-8px)'},{opacity:1,transform:'translateX(0)'}),
          delivery: cycle({left:'75%'},{left:'8%'}),
          buffer: cycle({opacity:.25,transform:'scaleX(.08)'},{opacity:1,transform:'scaleX(1)'}),
        };
        animations = [...root.querySelectorAll<HTMLElement>('[data-quiet-motion]')].map(el =>
          el.animate(frames[el.dataset['quietMotion']!]!, {
            duration:8000,iterations:Infinity,fill:'both'
          }));
      }
      animations.forEach(a => playing ? a.play() : a.pause());
      root.dataset['storyPlayback'] = reduced.matches ? 'idle' : playing ? 'playing' : 'paused';
      const key = playing ? 'storyPause' : 'storyPlay';
      toggle!.dataset['i18n'] = key;
      toggle!.textContent = message(key);
      toggle!.setAttribute('aria-pressed', String(playing));
      toggle!.disabled = reduced.matches;
    }
    controls.hidden = false;
    toggle.addEventListener('click', () => { userPaused = !userPaused; update(); });
    window.addEventListener('talkslidechange', update);
    window.addEventListener('presentationchange', update);
    document.addEventListener('visibilitychange', update);
    reduced.addEventListener('change', update);
    window.addEventListener('beforeprint', () => { printing = true; root.classList.add('quiet-print'); update(); });
    window.addEventListener('afterprint', () => { printing = false; root.classList.remove('quiet-print'); update(); });
    update();
  });
}
