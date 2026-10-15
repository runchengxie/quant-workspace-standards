/** Complete static scenes are the default; a deliberate click plays once. */
export function initTalkStories(message: (key: string) => string): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll<HTMLElement>('[data-talk-story]').forEach(root => {
    const toggle = root.querySelector<HTMLButtonElement>('[data-story-toggle]');
    const stop = root.querySelector<HTMLButtonElement>('[data-story-stop]');
    const controls = root.querySelector<HTMLElement>('.talk-story-controls');
    if (!toggle || !stop || !controls) return;
    let playback: 'idle' | 'playing' | 'paused' | 'finished' = 'idle';
    let animations: Animation[] = [];
    let generation = 0;
    let printing = false;
    function sync(): void {
      root.dataset['storyPlayback'] = playback;
      const key = playback === 'playing' ? 'storyPause' : playback === 'paused' ? 'quietResume' : 'quietPlay';
      toggle!.dataset['i18n'] = key;
      toggle!.textContent = message(key);
      toggle!.setAttribute('aria-pressed', String(playback === 'playing'));
      stop!.disabled = playback === 'idle';
    }
    function pause(): void {
      if (playback !== 'playing') return;
      animations.forEach(animation => animation.pause());
      playback = 'paused'; sync();
    }
    function reset(): void {
      generation++;
      animations.forEach(animation => animation.cancel()); animations = [];
      playback = 'idle'; sync();
    }
    function play(): void {
      if (printing || document.hidden || root.closest<HTMLElement>('.slide')?.hidden) return;
      if (playback === 'playing') { pause(); return; }
      if (playback === 'paused') { animations.forEach(animation => animation.play()); playback = 'playing'; sync(); return; }
      reset();
      if (reduced.matches) { playback = 'finished'; sync(); return; }
      const frames: Record<string, Keyframe[]> = {
        direction: [{opacity:.12},{opacity:1}],
        back: [{transform:'translate(14px,10px)'},{transform:'translate(0,0)'}],
        back2: [{transform:'translate(7px,5px)'},{transform:'translate(0,0)'}],
        report: [{opacity:1},{opacity:.3}],
        list: [{opacity:.2,transform:'translateX(-18px)'},{opacity:1,transform:'translateX(0)'}],
        delivery: [{left:'75%'},{left:'8%'}],
        buffer: [{opacity:.1,transform:'scaleX(.1)'},{opacity:1,transform:'scaleX(1)'}],
      };
      animations = [...root.querySelectorAll<HTMLElement>('[data-quiet-motion]')].map(el => el.animate(frames[el.dataset['quietMotion']!]!, {duration:2400,easing:'ease-in-out',fill:'both'}));
      const current = generation;
      playback = 'playing'; sync();
      Promise.all(animations.map(animation => animation.finished)).then(() => {
        if (current !== generation) return;
        playback = 'finished'; sync();
      }).catch(() => { /* Stop cancels pending completion. */ });
    }
    controls.hidden = false;
    toggle.addEventListener('click', play);
    stop.addEventListener('click', reset);
    window.addEventListener('talkslidechange', () => { if (root.closest<HTMLElement>('.slide')?.hidden) pause(); });
    window.addEventListener('presentationchange', () => { pause(); sync(); });
    document.addEventListener('visibilitychange', () => { if(document.hidden) pause(); });
    reduced.addEventListener('change', reset);
    window.addEventListener('beforeprint', () => { printing = true; pause(); root.classList.add('quiet-print'); });
    window.addEventListener('afterprint', () => { printing = false; root.classList.remove('quiet-print'); });
    sync();
  });
}
