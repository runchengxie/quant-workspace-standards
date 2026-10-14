type Phase = {
  status: string;
  focus?: string[];
  muted?: string[];
  error?: string[];
  done?: string[];
  merged?: string[];
};
const stories: Record<string, Phase[]> = {
  questions: [
    {status:'storyQuestions1',focus:['loop-tune'],muted:['check']},
    {status:'storyQuestions2',error:['loop-stuck'],muted:['check']},
    {status:'storyQuestions3',focus:['question'],muted:['loop']},
    {status:'storyQuestions4',error:['mismatch'],muted:['loop']},
    {status:'storyQuestions5',focus:['decide'],muted:['loop'],done:['mismatch','decide']},
  ],
  customers: [
    {status:'storyCustomers1',focus:['information'],muted:['stock-list','our-work']},
    {status:'storyCustomers2',focus:['customer-work'],muted:['stock-list','our-work']},
    {status:'storyCustomers3',focus:['stock-list'],muted:['information','customer-work']},
    {status:'storyCustomers4',focus:['our-work','stock-list'],muted:['information','customer-work'],done:['stock-list']},
  ],
  ownership: [
    {status:'storyOwnership1',focus:['download'],muted:['clean','model','send','early','recovery']},
    {status:'storyOwnership2',error:['clean'],muted:['model','send','early','recovery']},
    {status:'storyOwnership3',focus:['model'],done:['download','clean'],muted:['send','early','recovery']},
    {status:'storyOwnership4',focus:['send'],done:['download','clean','model'],muted:['early','recovery']},
    {status:'storyOwnership5',focus:['original','market'],muted:['early','recovery']},
    {status:'storyOwnership6',focus:['early'],muted:['original']},
    {status:'storyOwnership7',focus:['early','recovery'],done:['download','clean','model','send']},
  ],
  workflows: [
    {status:'storyWorkflows1',focus:['branchA','branchB','branchC']},
    {status:'storyWorkflows2',focus:['branchA','branchB','branchC']},
    {status:'storyWorkflows3',focus:['branchB'],done:['branchB']},
    {status:'storyWorkflows4',focus:['merged-main'],done:['branchB'],merged:['branchB']},
    {status:'storyWorkflows5',focus:['branchA','syncA'],done:['branchB'],merged:['branchB']},
    {status:'storyWorkflows6',focus:['merged-main'],done:['branchA','branchB'],merged:['branchA','branchB']},
    {status:'storyWorkflows7',focus:['syncC','merged-main'],done:['branchA','branchB','branchC'],merged:['branchA','branchB','branchC']},
  ],
};

const PHASE_MS = 4000;
type Playback = 'idle' | 'playing' | 'paused';

/** Only the visible slide autoplays; explicit pause and stop remain authoritative. */
export function initTalkStories(message: (key: string) => string): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll<HTMLElement>('[data-talk-story]').forEach(root => {
    const id = root.dataset['talkStory'] ?? '';
    const phases = stories[id];
    const controls = root.querySelector<HTMLElement>('.talk-story-controls');
    const toggle = root.querySelector<HTMLButtonElement>('[data-story-toggle]');
    const stop = root.querySelector<HTMLButtonElement>('[data-story-stop]');
    const status = root.querySelector<HTMLElement>('[data-story-status]');
    const count = root.querySelector<HTMLElement>('[data-story-count]');
    const progress = root.querySelector<HTMLElement>('[data-story-progress]');
    const fill = progress?.querySelector<HTMLElement>('span');
    if (!phases || !controls || !toggle || !stop || !status || !count || !progress || !fill) return;
    let step = 0;
    let playback: Playback = 'idle';
    let timer: number | undefined;
    let deadline = 0;
    let remaining = PHASE_MS;
    let restartMotion = false;
    let interacted = false;
    let printState: {step: number; playback: Playback} | undefined;
    const units = (names: string[]) => names.flatMap(name => [...root.querySelectorAll<HTMLElement | SVGElement>(`[data-story-unit="${name}"]`)]);
    function stopMotion(): void {
      root.getAnimations({subtree:true}).forEach(animation => animation.cancel());
      root.querySelectorAll('.talk-flow-packet').forEach(packet => packet.remove());
    }
    function animate(element: Element, frames: Keyframe[], options: KeyframeAnimationOptions = {}): void {
      if (reduced.matches || document.hidden || printState !== undefined) return;
      element.animate(frames, {duration:650, easing:'ease-in-out', ...options});
    }
    function travel(names: string[], iterations = 1, clock = false): void {
      if (reduced.matches || document.hidden || printState !== undefined) return;
      const targets = names.map(name => units([name]).find(el => el.getBoundingClientRect().width > 0)).filter((el): el is HTMLElement | SVGElement => !!el);
      if (targets.length < 2) return;
      const frame = root.getBoundingClientRect();
      const packet = document.createElement('span');
      packet.className = clock ? 'talk-flow-packet talk-clock-packet' : 'talk-flow-packet';
      if (clock) {
        const symbol = targets[0]?.querySelector('.talk-symbol');
        if (symbol) packet.append(symbol.cloneNode(true));
      }
      packet.setAttribute('aria-hidden','true');
      root.append(packet);
      const motion = packet.animate(targets.map(target => {
        const box = target.getBoundingClientRect();
        return {transform:`translate(${box.left-frame.left+box.width/2-(clock?18:5)}px, ${clock?box.top-frame.top-40:box.bottom-frame.top+4}px)`};
      }), {duration:Math.max(700,targets.length*350),iterations,easing:'ease-in-out'});
      motion.finished.then(() => packet.remove()).catch(() => packet.remove());
    }
    function runMotion(): void {
      if (id === 'questions') {
        const routes = [['loop-fail','loop-tune','loop-stuck','loop-fail'],['loop-stuck','loop-fail'],['loop-stuck','question'],['question','mismatch'],['mismatch','decide']];
        travel(routes[step-1] ?? [],step===1?2:1);
      } else if (id === 'customers') {
        if (step===1) root.querySelectorAll('.talk-paper-long i').forEach((line,index) => animate(line,[{opacity:0,transform:'scaleX(.1)'},{opacity:1,transform:'scaleX(1)'}],{delay:index*110}));
        if (step===3) {
          units(['information']).forEach(el=>animate(el,[{transform:'scale(1)'},{transform:'scale(.92)'}]));
          units(['stock-list']).forEach(el=>animate(el,[{opacity:.2,transform:'translateX(-32px) scaleY(.6)'},{opacity:1,transform:'translateX(0) scaleY(1)'}]));
        }
      } else if (id === 'ownership') {
        if(step===1) travel(['download','clean']);
        if(step===3) travel(['clean','model']);
        if(step===4) travel(['model','send']);
        if(step===6) travel(['original','early'],1,true);
        if(step===7) units(['recovery']).forEach(el=>animate(el,[{transform:'scaleX(.15)',opacity:.2},{transform:'scaleX(1)',opacity:1}]));
      } else if(id==='workflows') {
        if(step===1) root.querySelectorAll('.talk-branch-out').forEach(el=>animate(el,[{strokeDashoffset:1},{strokeDashoffset:0}],{duration:900}));
        if(step===2) units(['branchA','branchB','branchC']).forEach(el=>{
          const dot=el.querySelector('circle');
          if(dot) animate(dot,[{transform:'translateX(0)'},{transform:'translateX(245px)'}],{duration:1000});
          else animate(el,[{backgroundColor:'transparent'},{backgroundColor:'var(--soft)'},{backgroundColor:'transparent'}]);
        });
      }
    }
    function syncControls(): void {
      root.dataset['storyPlayback'] = playback;
      const label = playback === 'playing' ? 'storyPause' : 'storyPlay';
      toggle!.dataset['i18nAria'] = label;
      toggle!.setAttribute('aria-label', message(label));
      toggle!.title = message(label);
      toggle!.setAttribute('aria-pressed', String(playback === 'playing'));
      stop!.disabled = step === 0;
      stop!.title = message('storyStop');
      count!.textContent = step === 0 ? '' : `${step} / ${phases!.length}`;
      const phaseMessage = message(phases![step-1]?.status ?? 'storyOverviewHint');
      status!.textContent = phaseMessage;
      progress!.setAttribute('aria-valuemax', String(phases!.length));
      progress!.setAttribute('aria-valuenow', String(step));
      progress!.setAttribute('aria-valuetext', phaseMessage);
      fill!.style.width = `${step / phases!.length * 100}%`;
    }
    function clearTimer(): void {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
    }
    function pausePlayback(): void {
      if (playback !== 'playing') return;
      remaining = Math.max(0, deadline - performance.now());
      clearTimer();
      root.getAnimations({subtree:true}).filter(animation => animation.playState === 'running' || animation.pending).forEach(animation => animation.pause());
      playback = 'paused';
      syncControls();
    }
    function schedule(): void {
      clearTimer();
      if (playback !== 'playing') return;
      deadline = performance.now() + remaining;
      timer = window.setTimeout(() => {
        timer = undefined;
        if (playback !== 'playing') return;
        if (document.hidden || root.closest<HTMLElement>('.slide')?.hidden) { pausePlayback(); return; }
        step = step === phases!.length ? 1 : step + 1;
        remaining = PHASE_MS;
        render(true);
        schedule();
      }, remaining);
    }
    function render(motion = false): void {
      stopMotion();
      root.classList.add('talk-story-enabled');
      root.dataset['storyStep'] = String(step);
      root.dataset['storyReducedMotion'] = String(reduced.matches);
      root.dataset['storyMotion'] = String(motion && !reduced.matches && !document.hidden && printState === undefined);
      root.querySelectorAll('[data-story-unit]').forEach(el => el.classList.remove('story-focus','story-muted','story-error','story-done','story-merged'));
      const phase = phases![step-1];
      if (phase) for(const field of ['focus','muted','error','done','merged'] as const) units(phase[field] ?? []).forEach(el=>el.classList.add(`story-${field}`));
      syncControls();
      if(motion) runMotion();
    }
    controls.hidden=false;
    function startPlayback(): void {
      step = 1; playback = 'playing'; remaining = PHASE_MS; restartMotion = false; render(true); schedule();
    }
    toggle.addEventListener('click', () => {
      interacted = true;
      if (playback === 'playing') { pausePlayback(); return; }
      if (playback === 'paused' && step > 0) {
        playback = 'playing';
        if (restartMotion) { remaining = PHASE_MS; restartMotion = false; render(true); }
        else { root.getAnimations({subtree:true}).filter(animation => animation.playState === 'paused').forEach(animation => animation.play()); syncControls(); }
      } else { step = 1; playback = 'playing'; remaining = PHASE_MS; restartMotion = false; render(true); }
      schedule();
    });
    stop.addEventListener('click', () => { interacted = true; clearTimer(); step = 0; playback = 'idle'; remaining = PHASE_MS; restartMotion = false; render(); });
    function interruptLayout(): void {
      if (step === 0) { syncControls(); return; }
      pausePlayback();
      remaining = PHASE_MS;
      restartMotion = true;
      render();
    }
    window.addEventListener('presentationchange', interruptLayout);
    window.addEventListener('resize', interruptLayout);
    window.addEventListener('talkslidechange', () => {
      if (root.closest<HTMLElement>('.slide')?.hidden) interruptLayout();
      else if (!interacted && step === 0 && !reduced.matches && !document.hidden && printState === undefined) startPlayback();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) pausePlayback(); });
    reduced.addEventListener('change', () => { if (reduced.matches) pausePlayback(); restartMotion = true; render(); });
    window.addEventListener('beforeprint', () => {
      if (printState !== undefined) return;
      printState = {step, playback};
      pausePlayback(); clearTimer(); step = 0; playback = 'idle'; render();
    });
    window.addEventListener('afterprint', () => {
      if (printState === undefined) return;
      step = printState.step;
      playback = printState.playback === 'playing' ? 'paused' : printState.playback;
      printState = undefined;
      remaining = PHASE_MS; restartMotion = step > 0; render();
    });
    render();
  });
}
