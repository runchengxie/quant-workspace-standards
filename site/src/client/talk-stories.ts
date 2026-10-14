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
    {status:'storyQuestions2',focus:['loop-stuck'],muted:['check']},
    {status:'storyQuestions3',focus:['question'],muted:['loop']},
    {status:'storyQuestions4',focus:['mismatch'],muted:['loop']},
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
    {status:'storyWorkflows4',done:['branchB'],merged:['branchB']},
    {status:'storyWorkflows5',focus:['branchA','syncA'],done:['branchB'],merged:['branchB']},
    {status:'storyWorkflows6',done:['branchA','branchB'],merged:['branchA','branchB']},
    {status:'storyWorkflows7',focus:['syncC'],done:['branchA','branchB','branchC'],merged:['branchA','branchB','branchC']},
  ],
};

/** Click-driven state; motion is finite and never advances the story itself. */
export function initTalkStories(message: (key: string) => string): void {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll<HTMLElement>('[data-talk-story]').forEach(root => {
    const id = root.dataset['talkStory'] ?? '';
    const phases = stories[id];
    const controls = root.querySelector<HTMLElement>('.talk-story-controls');
    const next = root.querySelector<HTMLButtonElement>('[data-story-next]');
    const overview = root.querySelector<HTMLButtonElement>('[data-story-overview]');
    const status = root.querySelector<HTMLElement>('[data-story-status]');
    const count = root.querySelector<HTMLElement>('[data-story-count]');
    if (!phases || !controls || !next || !overview || !status || !count) return;
    let step = 0;
    let printStep: number | undefined;
    const units = (names: string[]) => names.flatMap(name => [...root.querySelectorAll<HTMLElement | SVGElement>(`[data-story-unit="${name}"]`)]);
    function stopMotion(): void {
      root.getAnimations({subtree:true}).forEach(animation => animation.cancel());
      root.querySelectorAll('.talk-flow-packet').forEach(packet => packet.remove());
    }
    function animate(element: Element, frames: Keyframe[], options: KeyframeAnimationOptions = {}): void {
      if (reduced.matches || document.hidden || printStep !== undefined) return;
      element.animate(frames, {duration:650, easing:'ease-in-out', ...options});
    }
    function travel(names: string[], iterations = 1): void {
      if (reduced.matches || document.hidden || printStep !== undefined) return;
      const targets = names.map(name => units([name]).find(el => el.getBoundingClientRect().width > 0)).filter((el): el is HTMLElement | SVGElement => !!el);
      if (targets.length < 2) return;
      const frame = root.getBoundingClientRect();
      const packet = document.createElement('span');
      packet.className = 'talk-flow-packet';
      packet.setAttribute('aria-hidden','true');
      root.append(packet);
      const motion = packet.animate(targets.map(target => {
        const box = target.getBoundingClientRect();
        return {transform:`translate(${box.left-frame.left+box.width/2-5}px, ${box.bottom-frame.top+4}px)`};
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
        if(step===6) travel(['original','early']);
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
    function render(motion = false): void {
      stopMotion();
      root.classList.add('talk-story-enabled');
      root.dataset['storyStep'] = String(step);
      root.dataset['storyReducedMotion'] = String(reduced.matches);
      root.dataset['storyMotion'] = String(motion && !reduced.matches && !document.hidden && printStep === undefined);
      root.querySelectorAll('[data-story-unit]').forEach(el => el.classList.remove('story-focus','story-muted','story-error','story-done','story-merged'));
      const phase = phases![step-1];
      if (phase) for(const field of ['focus','muted','error','done','merged'] as const) units(phase[field] ?? []).forEach(el=>el.classList.add(`story-${field}`));
      const label=step===0?'storyPlay':step===phases!.length?'storyReplay':'storyNext';
      next!.dataset['i18n']=label;next!.textContent=message(label);
      overview!.disabled=step===0;
      count!.textContent=step===0?'':`${step} / ${phases!.length}`;
      status!.textContent=message(phase?.status ?? 'storyOverviewHint');
      if(motion) runMotion();
    }
    controls.hidden=false;
    next.addEventListener('click',()=>{step=step===phases.length?1:step+1;render(true);});
    overview.addEventListener('click',()=>{step=0;render();});
    window.addEventListener('presentationchange',()=>render());
    window.addEventListener('talkslidechange',stopMotion);
    document.addEventListener('visibilitychange',()=>{if(document.hidden) stopMotion();});
    reduced.addEventListener('change',()=>render());
    window.addEventListener('beforeprint',()=>{if(printStep!==undefined) return;printStep=step;step=0;render();});
    window.addEventListener('afterprint',()=>{if(printStep===undefined) return;step=printStep;printStep=undefined;render();});
    render();
  });
}
