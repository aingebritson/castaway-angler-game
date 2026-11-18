/**
 * Coach marks for the opening: a short story, then a spotlight on the one
 * thing to do next, with a bubble saying why.
 */
import { useEffect, useLayoutEffect, useState } from 'preact/hooks';
import { type CoachStep, FLEAS_NEEDED } from '../state/tutorial';
import { useGame, useGameState } from './hooks';

const INTRO = [
  'The storm came out of nowhere. You remember the mast going over, the cold, a long time holding on to something. Then nothing.',
  'You wake on hot sand with salt in your mouth. The ship is gone. A few of her timbers are still coming ashore.',
  'You are alive. You are alone. And you are very hungry.',
];

export function Intro({ onDone }: { onDone(): void }) {
  const { audio } = useGame();
  const [i, setI] = useState(0);
  const next = () => {
    audio.play('tap');
    if (i < INTRO.length - 1) setI(i + 1);
    else onDone();
  };
  return (
    <div class={`intro step-${i}`} onClick={next}>
      <button class="intro-skip" onClick={(e) => { e.stopPropagation(); onDone(); }}>Skip</button>
      <p key={i}>{INTRO[i]}</p>
      <div class="intro-dots">{INTRO.map((_, k) => <i key={k} class={k === i ? 'on' : ''} />)}</div>
      <div class="intro-tap">{i < INTRO.length - 1 ? 'Tap to continue' : 'Tap to get up'}</div>
    </div>
  );
}

interface Spec {
  target?: string;
  text: string;
  /** Where the bubble sits relative to the target, or on screen without one. */
  at: 'above' | 'below' | 'top' | 'middle';
  demo?: 'drag';
  ok?: string;
  urgent?: boolean;
}

function spec(step: CoachStep, fleas: number): Spec | null {
  switch (step) {
    case 'rod':
      return { target: '[data-hs="old-rod"]', at: 'above', text: 'Something long and thin is tangled in the wrack line. Tap it.' };
    case 'bait':
      return {
        target: '[data-hs="swash"]', at: 'below',
        text: `Fish will not bite a bare hook. The wet sand is full of sand fleas: tap it to dig some up. (${fleas}/${FLEAS_NEEDED})`,
      };
    case 'map':
      return { target: '[data-nav="map"]', at: 'above', text: 'The rocks out at the point look fishy. Open the map.' };
    case 'map-pin':
      return { target: '[data-pin="rocky-point"]', at: 'below', text: 'Tap Rocky Point to walk there.' };
    case 'cast':
      return { at: 'top', demo: 'drag', text: 'Put your thumb on the water, drag down, and let go, like a slingshot. Pull further to cast further.' };
    case 'wait':
      return { at: 'top', text: 'Watch the float. Little twitches are fish testing the bait. Wait for it to go right under.' };
    case 'bite':
      return { at: 'middle', urgent: true, text: 'It is under! Tap now!' };
    case 'guide':
      return {
        target: '[data-nav="guide"]', at: 'above', ok: 'Got it',
        text: 'Your first fish. Every new kind you catch, see or hear about fills a page in the field guide. And when you are not sure what to do next: keep fishing. Something always turns up.',
      };
    case 'to-camp':
      return { target: '[data-nav="map"]', at: 'above', text: 'You have worked out how to make a hook. Things are made at camp: open the map.' };
    case 'camp-pin':
      return { target: '[data-pin="camp"]', at: 'below', text: 'Tap Camp.' };
    case 'workbench':
      return { target: '[data-hs="workbench"]', at: 'below', text: 'This is the workbench. Everything you learn to make shows up here, with what it needs and where to find it.' };
    default:
      return null;
  }
}

/** Find the target and keep the spotlight on it as things move. */
function useRect(selector: string | undefined): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useLayoutEffect(() => {
    if (!selector) {
      setRect(null);
      return;
    }
    let raf = 0;
    const frame = document.querySelector('.frame');
    const tick = () => {
      const el = document.querySelector(selector);
      const fr = frame?.getBoundingClientRect();
      if (el && fr) {
        const r = el.getBoundingClientRect();
        setRect((old) => (old && Math.abs(old.x - (r.x - fr.x)) < 0.5 && Math.abs(old.y - (r.y - fr.y)) < 0.5 && old.width === r.width ? old : new DOMRect(r.x - fr.x, r.y - fr.y, r.width, r.height)));
      } else setRect(null);
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [selector]);
  return rect;
}

export function Coach({ step }: { step: CoachStep }) {
  const { store, audio } = useGame();
  const s = useGameState();
  const sp = spec(step, s.inventory['sand-flea'] ?? 0);
  const rect = useRect(sp?.target);
  useEffect(() => {
    if (step === 'bite') return;
    audio.play('nibble');
  }, [step]);
  if (!sp) return null;
  if (sp.target && !rect) return null;

  const pad = 8;
  const ring = rect && { left: rect.x - pad, top: rect.y - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 };
  let bubbleStyle: Record<string, string> = {};
  if (ring && sp.at === 'above') bubbleStyle = { bottom: `calc(100% - ${ring.top - 12}px)` };
  else if (ring && sp.at === 'below') bubbleStyle = { top: `${ring.top + ring.height + 12}px` };
  else if (sp.at === 'top') bubbleStyle = { top: 'calc(var(--safe-t) + 70px)' };
  else bubbleStyle = { top: '30%' };
  const arrowX = ring ? ring.left + ring.width / 2 : null;

  const skip = () => store.act((d) => { d.flags.tutDone = true; });
  const ok = () => store.act((d) => { d.flags.tutGuide = true; });
  return (
    <div class={`coach ${sp.urgent ? 'urgent' : ''}`}>
      {ring && <div class={`coach-ring ${step === 'guide' ? 'soft' : ''}`} style={{ left: `${ring.left}px`, top: `${ring.top}px`, width: `${ring.width}px`, height: `${ring.height}px` }} />}
      {sp.demo === 'drag' && (
        <div class="coach-drag">
          <div class="trail" />
          <div class="finger" />
        </div>
      )}
      <div class={`coach-bubble ${sp.at}`} style={bubbleStyle}>
        {arrowX != null && sp.at !== 'top' && sp.at !== 'middle' && (
          <i class={`coach-arrow ${sp.at}`} style={{ left: `clamp(14px, ${arrowX - 25}px, calc(100% - 32px))` }} />
        )}
        <span>{sp.text}</span>
        <div class="coach-actions">
          {sp.ok && <button class="btn small" onClick={ok}>{sp.ok}</button>}
          {!sp.urgent && !sp.ok && <button class="coach-skip" onClick={skip}>Skip tutorial</button>}
        </div>
      </div>
    </div>
  );
}
