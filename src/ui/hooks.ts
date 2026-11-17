import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import type { GameAudio } from '../platform/audio';
import type { GameState } from '../state/state';
import type { Store } from '../state/store';

export interface Game {
  store: Store;
  audio: GameAudio;
  flushSave(): void;
  resetGame(): void;
}

export const GameCtx = createContext<Game>(null as never);

export const useGame = (): Game => useContext(GameCtx);

/** Re-render whenever the game state changes. */
export function useGameState(): GameState {
  const { store } = useGame();
  const [, bump] = useState(0);
  useEffect(() => store.subscribe(() => bump((n) => n + 1)), [store]);
  return store.state;
}

/** Re-render on an interval, for clocks and regrow timers. */
export function useTick(ms: number): void {
  const [, bump] = useState(0);
  useEffect(() => {
    const id = setInterval(() => bump((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
