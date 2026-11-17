/**
 * Dev-only test harness (never bundled into production). Lets a script drive
 * the game faster than real time: window.T.fast(120) plays two minutes.
 */
import type { Engine } from '../scenes/engine';
import type { Game } from '../ui/hooks';

interface Bot {
  pull?: number;
  dx?: number;
  keep?: boolean;
  noCast?: boolean;
}

const tick = () =>
  new Promise<void>((r) => {
    const c = new MessageChannel();
    c.port1.onmessage = () => r();
    c.port2.postMessage(0);
  });

export function installHarness(): void {
  const w = window as unknown as { engine: Engine; game: Game; T: unknown };
  const eng = () => w.engine as unknown as {
    paused: boolean;
    frame(dt: number): void;
    fishing: null | {
      phase: string; holding: boolean; fight: null | { jumping: boolean; tension: number }; lure: { speed: number };
      pointerDown(x: number, y: number): void; pointerMove(x: number, y: number): void; pointerUp(x: number, y: number): void;
    };
  };
  const step = (bot: Bot) => {
    const f = eng().fishing;
    if (f) {
      if (f.phase === 'idle' && !bot.noCast) {
        f.pointerDown(190, 450);
        f.pointerMove(190 + (bot.dx ?? 0), 450 + (bot.pull ?? 150));
        f.pointerUp(190, 600);
      } else if (f.phase === 'bite') {
        f.pointerDown(100, 100);
        f.pointerUp(100, 100);
      } else if (f.phase === 'fight' && f.fight) {
        const want = f.fight.jumping || f.fight.tension < 0.7;
        if (want && !f.holding) f.pointerDown(100, 100);
        if (!want && f.holding) f.pointerUp(100, 100);
      } else if (f.phase === 'retrieve') {
        const want = f.lure.speed < 0.5;
        if (want && !f.holding) f.pointerDown(100, 100);
        if (!want && f.holding) f.pointerUp(100, 100);
      }
    }
    eng().paused = false;
    eng().frame(1 / 30);
  };
  const cardButton = (keep: boolean): HTMLButtonElement | null => {
    const btns = [...document.querySelectorAll<HTMLButtonElement>('.card .actions .btn')].filter((b) => !b.disabled);
    if (!btns.length) return null;
    return keep ? btns[0] : btns.find((b) => /Release|Good|Keep the page/.test(b.textContent ?? '')) ?? btns[0];
  };
  const T = {
    noAnim() {
      const st = document.createElement('style');
      st.textContent = '*{animation-duration:0s!important;transition:none!important}';
      document.head.appendChild(st);
    },
    async start() {
      T.noAnim();
      for (let i = 0; i < 50 && !document.querySelector('.title-screen .btn'); i++) await tick();
      document.querySelector<HTMLButtonElement>('.title-screen .btn')?.click();
      await tick();
    },
    /** Play for `seconds` of game time with a simple bot. Returns a compact summary. */
    async fast(seconds: number, bot: Bot = {}) {
      const cards: Record<string, number> = {};
      const toasts = new Set<string>();
      for (let i = 0; i < seconds * 30; i++) {
        document.querySelectorAll('.toast').forEach((t) => toasts.add(t.textContent ?? ''));
        const btn = cardButton(bot.keep ?? false);
        if (btn) {
          const key = `${document.querySelector('.card .banner')?.textContent ?? ''}|${document.querySelector('.card h2')?.textContent ?? ''}`;
          cards[key] = (cards[key] ?? 0) + 1;
          btn.click();
          await tick();
          await tick();
          continue;
        }
        step(bot);
        if (i % 4 === 0) await tick();
      }
      const s = w.game.store.state;
      return { cards, toasts: [...toasts].slice(0, 12), stats: s.stats, phase: eng().fishing?.phase, creel: s.creel.length };
    },
    /** Advance until the fishing phase matches, without dismissing cards. */
    async until(phase: string, maxSeconds = 120, bot: Bot = {}) {
      for (let i = 0; i < maxSeconds * 30; i++) {
        if (eng().fishing?.phase === phase) return true;
        step(bot);
        if (i % 4 === 0) await tick();
      }
      return false;
    },
    /** Run frames with no bot input. */
    async idle(seconds: number) {
      for (let i = 0; i < seconds * 30; i++) {
        eng().paused = false;
        eng().frame(1 / 30);
        if (i % 6 === 0) await tick();
      }
    },
    set(fn: (d: Game['store']['state']) => void) {
      w.game.store.act((d) => fn(d));
    },
  };
  w.T = T;
}
