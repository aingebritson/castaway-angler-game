/**
 * The store: holds the current GameState, applies reducers to a clone, and
 * tells listeners. Platform concerns (clock, persistence) are injected.
 */
import type { Content } from '../content/assemble';
import type { Ctx, GameEvent } from './actions';
import { checkLessons } from './lessons';
import { checkThoughts } from './thoughts';
import type { GameState } from './state';

export interface StoreDeps {
  content: Content;
  now: () => number;
  deviceTz: string;
  onChange?: (s: GameState) => void;
}

type Reducer<A extends unknown[], R> = (s: GameState, ctx: Ctx, ...args: A) => R;

export class Store {
  state: GameState;
  private listeners = new Set<() => void>();
  private eventListeners = new Set<(e: GameEvent) => void>();

  constructor(initial: GameState, private deps: StoreDeps) {
    this.state = initial;
  }

  get content(): Content {
    return this.deps.content;
  }

  ctx(): Ctx {
    return { content: this.deps.content, now: this.deps.now() + this.state.debug.timeOffsetMs, deviceTz: this.deps.deviceTz };
  }

  /** Run a reducer against a clone of the state and commit it. Returns the reducer's result. */
  act<A extends unknown[], R>(fn: Reducer<A, R>, ...args: A): R {
    const draft = structuredClone(this.state);
    const ctx = this.ctx();
    const out = fn(draft, ctx, ...args);
    // Whatever just happened may have taught the castaway something.
    const learned = checkLessons(draft, ctx);
    // …or given them something to think about. A lesson just learned (on a card or a page) already says what to do next.
    learned.push(...checkThoughts(draft, ctx, draft.lessons.length > this.state.lessons.length));
    draft.lastSeen = ctx.now;
    this.state = draft;
    this.deps.onChange?.(draft);
    for (const l of this.listeners) l();
    if (learned.length) this.emit(learned);
    return out;
  }

  /** Like `act`, for reducers that return events: the events are also broadcast to the UI. */
  run<A extends unknown[]>(fn: Reducer<A, GameEvent[]>, ...args: A): GameEvent[] {
    const events = this.act(fn, ...args);
    this.emit(events);
    return events;
  }

  emit(events: GameEvent[]): void {
    for (const e of events) for (const l of this.eventListeners) l(e);
  }

  replace(next: GameState): void {
    this.state = next;
    this.deps.onChange?.(next);
    for (const l of this.listeners) l();
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  onEvent(fn: (e: GameEvent) => void): () => void {
    this.eventListeners.add(fn);
    return () => this.eventListeners.delete(fn);
  }
}
