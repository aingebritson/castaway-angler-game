import { useEffect, useRef, useState } from 'preact/hooks';
import type { Hotspot } from '../content/schema';
import { isIOS, isStandalone } from '../platform/install';
import { Engine } from '../scenes/engine';
import type { FishPhase } from '../scenes/fishing';
import { nodeEta } from '../sim/world';
import { formatClock } from '../sim/time';
import { type GameEvent, type Reveal, gather, hotspotVisible, nodeStatus, pickup, rigOf, sunAt, travel } from '../state/actions';
import { nextGoal } from '../state/goals';
import { coachStep, focusHotspots, navHidden } from '../state/tutorial';
import { badges } from '../state/museum';
import { moonIndex } from '../sim/time';
import { Coach, Intro } from './coach';
import { Icon } from './bits';
import { EndingCard, HaulCard, LessonCard, PageCard, RevealCard, type ToastMsg, Toasts } from './cards';
import { GuidePanel, JournalPanel } from './guide';
import { useGame, useGameState, useTick } from './hooks';
import { BagPanel, CraftPanel, DebugPanel, FirePanel, MapPanel, RaftPanel, RigPanel, SettingsPanel, TrapPanel } from './panels';
import { PortPanels, type PortPanel, portHotspot } from './port';

type Panel = 'map' | 'bag' | 'catch' | 'rig' | 'guide' | 'journal' | 'craft' | 'fire' | 'raft' | 'trap' | 'settings' | 'debug';

const PHASE_GLYPH: Record<string, string> = { dawn: '🌅', day: '☀️', dusk: '🌇', night: '🌙' };
const MOON_GLYPH = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
let nextId = 1;

/**
 * Hotspot position on screen. Scene data is in art coordinates; the engine
 * publishes how the art is fitted to this screen as --fit-* variables. The
 * clamp keeps buttons clear of the top bar and the nav when a wide screen
 * crops the top and bottom of the art.
 */
const hotspotPos = (x: number, y: number) => ({
  left: `clamp(9%, calc((var(--fit-ox, 0) + ${x} * var(--fit-sx, 1)) * 100%), 91%)`,
  top: `clamp(15%, calc((var(--fit-oy, 0) + ${y} * var(--fit-sy, 1)) * 100%), calc(100% - var(--nav-h) - 48px))`,
});

export function App() {
  const game = useGame();
  const { store, audio } = game;
  const s = useGameState();
  useTick(5000);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [port, setPort] = useState<PortPanel | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [lessons, setLessons] = useState<string[]>([]);
  const [haul, setHaul] = useState<{ reveals: Reveal[]; soakH: number } | null>(null);
  const [ending, setEnding] = useState(false);
  const [phase, setPhase] = useState<FishPhase>('idle');
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [gains, setGains] = useState<{ id: number; itemId: string; qty: number }[]>([]);
  const [title, setTitle] = useState(true);
  const [goalOpen, setGoalOpen] = useState(true);

  const toast = (text: string, glyph?: string, tone?: string) => {
    const id = nextId++;
    setToasts((t) => [...t.slice(-2), { id, text, glyph, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  };

  useEffect(() => {
    const engine = new Engine(canvasRef.current!, store, audio, {
      onPhase: setPhase,
      showReveal: setReveal,
      toast,
    });
    engineRef.current = engine;
    (window as unknown as { engine: Engine }).engine = engine;
    engine.setLocation(store.state.locationId);
    engine.start();
    const off = store.onEvent((e: GameEvent) => {
      switch (e.type) {
        case 'toast':
          toast(e.text, e.glyph, e.tone);
          if (e.tone === 'warn') audio.play('warn');
          break;
        case 'gain': {
          const id = nextId++;
          setGains((g) => [...g.slice(-3), { id, itemId: e.itemId, qty: e.qty }]);
          setTimeout(() => setGains((g) => g.filter((x) => x.id !== id)), 1700);
          audio.play('gain');
          break;
        }
        case 'lesson':
          setLessons((l) => [...l, e.lessonId]);
          break;
        case 'page':
          setPages((p) => [...p, e.pageId]);
          audio.play('page');
          break;
        case 'reveal':
          setReveal(e.reveal);
          audio.play(e.reveal.isNew ? 'new' : 'catch');
          break;
        case 'haul':
          setHaul(e);
          audio.play('catch');
          break;
        case 'sfx':
          audio.play(e.id as never);
          break;
        case 'ending':
          setEnding(true);
          audio.play('trophy');
          break;
      }
    });
    const vis = () => {
      if (document.hidden) {
        game.flushSave();
        audio.suspend();
      } else audio.resume();
    };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pagehide', game.flushSave);
    return () => {
      off();
      engine.destroy();
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pagehide', game.flushSave);
    };
  }, [store]);

  useEffect(() => {
    engineRef.current?.setLocation(s.locationId);
  }, [s.locationId]);

  // Announce badges as they are earned (not the ones a returning save already had).
  const earned = badges(s, store.content).filter((b) => b.got).map((b) => b.id);
  const seenBadges = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (!seenBadges.current) {
      seenBadges.current = new Set(earned);
      return;
    }
    for (const id of earned) {
      if (seenBadges.current.has(id)) continue;
      seenBadges.current.add(id);
      const b = badges(store.state, store.content).find((x) => x.id === id)!;
      toast(`Badge: ${b.name}. ${b.desc}`, b.glyph, 'good');
      audio.play('discover');
    }
  }, [earned.join(',')]);

  const card = !!(reveal || pages.length || haul || ending || lessons.length);
  const step = title ? null : coachStep(s, { phase, panel: panel ?? (port ? 'port' : null), card });
  const overlay = !!(panel || port || card || title || step === 'intro');
  useEffect(() => {
    if (engineRef.current) engineRef.current.paused = overlay;
  }, [overlay]);

  const c = store.content;
  const loc = c.locations[s.locationId];
  const ctx = store.ctx();
  const sun = sunAt(ctx, loc.id);
  const goal = nextGoal(s, c);
  const focus = focusHotspots(step);
  const coaching = !!step && step !== 'intro';
  const fishingScene = loc.zones.some((z) => z.cast);
  const busy = phase !== 'idle' && phase !== 'aiming';
  const tense = phase === 'fight' || phase === 'bite' || phase === 'landing' || phase === 'retrieve';

  const open = (p: Panel) => {
    if (p === 'craft' && !s.flags.tutBench) store.act((d) => { d.flags.tutBench = true; });
    audio.unlock();
    audio.play('tap');
    engineRef.current?.fishing?.reset();
    if (p === 'guide' && !s.flags.tutGuide && s.stats.catches > 0) store.act((d) => { d.flags.tutGuide = true; });
    setPanel(p);
  };

  const tapHotspot = (h: Hotspot) => {
    audio.unlock();
    if (h.kind === 'gather') store.run(gather, h.id);
    else if (h.kind === 'pickup') store.run(pickup, h.ref ?? '');
    else if (h.kind === 'station') {
      if (h.station === 'craft') open('craft');
      else if (h.station === 'fire') open('fire');
      else if (h.station === 'creel') open('catch');
      else if (h.station === 'raft') open('raft');
      else if (h.station === 'trap') open('trap');
      else if (h.station === 'wreck') toast('The wreck, hard on the reef. Too far to swim, and the current is wrong. With a real boat…', '⚓');
    } else {
      const p = portHotspot(h);
      if (p) {
        audio.play('tap');
        setPort(p);
      }
    }
  };

  const cue =
    phase === 'waiting' ? 'Tap to reel in'
      : phase === 'idle' && fishingScene && rigOf(s, c) && s.stats.casts < 4 ? 'Drag back and release to cast'
        : phase === 'idle' && loc.sightZones.length && s.stats.casts >= 4 && s.stats.casts < 40 && !Object.values(s.guide).some((e) => e.cells[`zone:${loc.id}/${loc.sightZones[0]}`] === 'c') ? 'Cast ahead of a shape, not on it. Tap a shape to sketch it.'
          : null;

  return (
    <div class="frame">
      <canvas class="scene" ref={canvasRef} />

      <div class="top" style={{ opacity: step === 'intro' ? 0 : tense ? 0.25 : 1, transition: 'opacity .6s' }}>
        <div class="top-row">
          <div class="place">{loc.name}</div>
          <button class="clock" onClick={() => open('settings')}>
            {s.flags.launched && <span class="coins">◉ {s.coins}</span>}
            <span>{sun.phase === 'night' ? MOON_GLYPH[moonIndex(ctx.now)] : PHASE_GLYPH[sun.phase]} {formatClock(sun.local)}</span>
            {!s.flags.launched && <span class="ph">{sun.phase}</span>}
            <span style={{ width: '16px', height: '16px', display: 'inline-grid' }}><Icon name="gear" /></span>
          </button>
        </div>
        {goal && !busy && !title && !coaching && step !== 'intro' && (
          <button class={`goal ${goalOpen ? '' : 'min'}`} onClick={() => setGoalOpen(!goalOpen)}>
            {goalOpen ? <span><b>Thinking</b>{goal.text}</span> : <span>✎ …</span>}
          </button>
        )}
      </div>

      <div class={`hotspots ${busy || phase === 'aiming' || title || step === 'intro' ? 'off' : ''}`}>
        {loc.scene.hotspots.filter((h) => hotspotVisible(s, h) && (!focus || focus.includes(h.id))).map((h) => {
          let cls = '';
          let count: string | null = null;
          let sub = h.label;
          if (h.kind === 'gather' && h.node) {
            const st = nodeStatus(s, ctx, loc, h);
            if (st.needsTool) {
              cls = 'locked';
              sub = `${h.label} · needs ${c.items[st.def.requiresTool!].name.toLowerCase()}`;
            } else if (!st.open) {
              cls = 'empty';
              sub = `${h.label} · ${st.def.phases?.join(' / ')}`;
            } else if (st.save.stock <= 0) {
              cls = 'empty';
              const eta = nodeEta(st.def, st.save, ctx.now);
              sub = st.def.daily ? `${h.label} · tomorrow` : `${h.label} · ${Math.max(1, Math.ceil(eta / 60_000))} min`;
            } else count = String(st.save.stock);
          }
          if (h.station === 'trap') {
            const t = s.traps.find((x) => x.locationId === loc.id);
            sub = t ? `Trap · ${Math.floor((ctx.now - t.setAt) / 3_600_000)} h` : 'Set a trap';
          }
          if (!coaching && goal?.where === loc.id && goal.hs === h.id) cls += ' goal';
          return (
            <button key={h.id} data-hs={h.id} class={`hs ${cls}`} style={hotspotPos(h.x, h.y)} onClick={() => tapHotspot(h)}>
              <span class="dot">{h.glyph}{count && <span class="cnt">{count}</span>}</span>
              <span class="lbl">{sub}</span>
            </button>
          );
        })}
      </div>

      {cue && !overlay && !coaching && <div class="cue"><span>{cue}</span></div>}

      <div class={`nav ${tense || navHidden(step) || title ? 'off' : ''}`}>
        <button data-nav="map" class={panel === 'map' ? 'on' : ''} onClick={() => open('map')}><Icon name="map" />Map{goal?.where && goal.where !== loc.id && <span class="pip" />}</button>
        <button data-nav="bag" class={panel === 'bag' ? 'on' : ''} onClick={() => open('bag')}><Icon name="bag" />Bag</button>
        <button data-nav="rig" class={panel === 'rig' ? 'on' : ''} onClick={() => open('rig')}><Icon name="rig" />Rig</button>
        <button data-nav="guide" class={panel === 'guide' ? 'on' : ''} onClick={() => open('guide')}><Icon name="guide" />Guide</button>
        <button data-nav="journal" class={panel === 'journal' ? 'on' : ''} onClick={() => open('journal')}><Icon name="journal" />{s.flags.launched ? 'Log' : 'Journal'}</button>
      </div>

      {panel === 'map' && <MapPanel onClose={() => setPanel(null)} />}
      {panel === 'bag' && <BagPanel onClose={() => setPanel(null)} />}
      {panel === 'catch' && <BagPanel initial="catch" onClose={() => setPanel(null)} />}
      {panel === 'rig' && <RigPanel onClose={() => setPanel(null)} />}
      {panel === 'guide' && <GuidePanel onClose={() => setPanel(null)} />}
      {panel === 'journal' && <JournalPanel onClose={() => setPanel(null)} />}
      {panel === 'craft' && <CraftPanel onClose={() => setPanel(null)} />}
      {panel === 'fire' && <FirePanel onClose={() => setPanel(null)} />}
      {panel === 'raft' && <RaftPanel onClose={() => setPanel(null)} />}
      {panel === 'trap' && <TrapPanel onClose={() => setPanel(null)} />}
      {panel === 'settings' && <SettingsPanel onClose={() => setPanel(null)} onDebug={() => setPanel('debug')} />}
      {panel === 'debug' && <DebugPanel onClose={() => setPanel(null)} />}
      {port && <PortPanels panel={port} onClose={() => setPort(null)} />}

      {reveal && !pages.length && (
        <RevealCard reveal={reveal} onDone={() => { setReveal(null); engineRef.current?.fishing?.afterReveal(); }} />
      )}
      {haul && !reveal && <HaulCard reveals={haul.reveals} soakH={haul.soakH} onDone={() => setHaul(null)} />}
      {pages.length > 0 && <PageCard pageId={pages[0]} onDone={() => setPages((p) => p.slice(1))} />}
      {lessons.length > 0 && !reveal && !pages.length && !haul && <LessonCard lessonId={lessons[0]} onDone={() => setLessons((l) => l.slice(1))} />}
      {ending && (
        <EndingCard
          hasPort={!!c.locations['port-esperanza']}
          onDone={() => {
            setEnding(false);
            if (c.locations['port-esperanza']) store.run(travel, 'port-esperanza');
          }}
        />
      )}

      {coaching && step && <Coach step={step} />}
      {step === 'intro' && <Intro onDone={() => store.act((d) => { d.flags.introSeen = true; })} />}

      <Toasts toasts={toasts} gains={gains} />

      {title && (
        <div class="title-screen">
          <h1>Castaway<br />Angler</h1>
          <p>{s.stats.casts ? 'The tide has turned while you were away.' : 'You wake on a beach with salt in your mouth.'}</p>
          <button class="btn" onClick={() => { audio.unlock(); audio.setEnabled(s.settings.sound); audio.play('page'); setTitle(false); }}>
            {s.stats.casts || s.flags.hasRod ? 'Back to the water' : 'Open your eyes'}
          </button>
          {isIOS() && !isStandalone() && (
            <div class="install">To keep your save and play full screen, tap <b>Share</b>, then <b>Add to Home Screen</b>.</div>
          )}
        </div>
      )}
    </div>
  );
}
