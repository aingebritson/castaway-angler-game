import { render } from 'preact';
import { loadContent } from './content/loadBrowser';
import { loadManifest } from './platform/assets';
import { GameAudio } from './platform/audio';
import { deviceTimeZone, systemClock } from './platform/clock';
import { registerServiceWorker } from './platform/install';
import { clearSave, loadSave, makeSaver, requestPersist } from './platform/storage';
import { type GameState, migrate, newGame } from './state/state';
import { Store } from './state/store';
import { syncLessons } from './state/lessons';
import { App } from './ui/App';
import { type Game, GameCtx } from './ui/hooks';
import './ui/styles.css';

const freshSeed = () => (crypto.getRandomValues(new Uint32Array(1))[0] || 1) >>> 0;

async function boot() {
  const content = loadContent();
  const audio = new GameAudio();
  const [raw] = await Promise.all([loadSave(), loadManifest()]);
  const now = systemClock.now();
  let state: GameState;
  try {
    state = raw ? migrate(raw, now) : newGame(freshSeed(), now);
  } catch (e) {
    console.error('Could not read the save; starting fresh.', e);
    state = newGame(freshSeed(), now);
  }
  if (!content.locations[state.locationId]) state.locationId = 'beach';
  syncLessons(state, content);
  const saver = makeSaver();
  const store = new Store(state, { content, now: () => systemClock.now(), deviceTz: deviceTimeZone(), onChange: (s) => saver.queue(s) });
  audio.enabled = state.settings.sound;
  const game: Game = {
    store,
    audio,
    flushSave: () => saver.flush(),
    resetGame: () => {
      void clearSave().then(() => store.replace(newGame(freshSeed(), systemClock.now())));
    },
  };
  void requestPersist();
  registerServiceWorker();
  // Handy in the console while testing.
  (window as unknown as { game: Game }).game = game;
  if (import.meta.env.DEV) void import('./dev/harness').then((m) => m.installHarness());
  render(
    <GameCtx.Provider value={game}>
      <App />
    </GameCtx.Provider>,
    document.getElementById('app')!,
  );
}

// iOS: no pinch zoom, no double-tap zoom, no long-press menu.
for (const type of ['gesturestart', 'gesturechange', 'contextmenu', 'dblclick']) {
  document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
}

void boot();
