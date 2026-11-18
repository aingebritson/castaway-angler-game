/**
 * One serialisable game state. Everything the save file holds is here;
 * nothing else persists. Versioned, with migrations.
 */
import type { Grade } from '../sim/catch';
import type { NodeSave, TrapSave } from '../sim/world';

export const SAVE_VERSION = 3;

export interface KeptFish {
  uid: number;
  speciesId: string;
  lengthCm: number;
  weightG: number;
  grade: Grade;
  at: number;
  locationId: string;
  smoked?: boolean;
}

export interface PersonalBest {
  lengthCm: number;
  weightG: number;
  at: number;
  locationId: string;
  rig: string;
}

export interface GuideEntry {
  state: 'rumoured' | 'sighted' | 'caught';
  count: number;
  released: number;
  firstAt?: number;
  pb?: PersonalBest;
  /** Observed grid: "phase:night" -> 'c' caught under that condition, 'r' told by a rumour. */
  cells: Record<string, 'c' | 'r'>;
  rumours: string[];
  donated?: boolean;
}

export type JournalKind = 'story' | 'catch' | 'pb' | 'away' | 'rumour' | 'page' | 'craft' | 'trap' | 'quest' | 'sighting' | 'travel' | 'clue' | 'lesson';

export interface JournalEntry {
  id: number;
  at: number;
  kind: JournalKind;
  text: string;
  locationId?: string;
  speciesId?: string;
  pinned?: boolean;
}

export interface RigSave {
  rod: string | null;
  line: string | null;
  reel: string | null;
  hook: string | null;
  bait: string | null;
  lure: string | null;
  float: string | null;
  sinker: string | null;
  method: 'bait' | 'lure';
}

export interface RackSlot {
  fish: KeptFish;
  startedAt: number;
}

export interface QuestSave {
  state: 'active' | 'ready' | 'done';
  progress: number;
  /** Species already counted toward a "distinct" goal. */
  seen?: string[];
}

export interface OrderSave {
  id: string;
  speciesId: string;
  minCm: number;
  pay: number;
  filled: boolean;
}

export interface GameState {
  v: number;
  seed: number;
  /** Current state of the simulation's random stream. */
  rng: number;
  createdAt: number;
  lastSeen: number;
  locationId: string;
  inventory: Record<string, number>;
  everHeld: Record<string, true>;
  creel: KeptFish[];
  larder: KeptFish[];
  nextUid: number;
  rig: RigSave;
  nodes: Record<string, NodeSave>;
  guide: Record<string, GuideEntry>;
  journal: JournalEntry[];
  nextJournalId: number;
  notes: Record<string, string>;
  recipesKnown: string[];
  /** Lessons learned, in the order they were learned. */
  lessons: string[];
  /** Event counters that lessons wait on: stolen, missed, snapped, longCast, creelFull, cast:<loc>/<zone>. */
  counts: Record<string, number>;
  pagesFound: number;
  traps: TrapSave[];
  rack: RackSlot[];
  flags: Record<string, boolean>;
  visited: Record<string, true>;
  zonesSeen: Record<string, true>;
  stats: {
    casts: number;
    catches: number;
    lost: number;
    castsSinceBottle: number;
    coinsEarned: number;
    playMs: number;
    tagged: number;
  };
  coins: number;
  quests: Record<string, QuestSave>;
  orders: { day: string; portId: string; list: OrderSave[] } | null;
  legendariesCaught: string[];
  clues: string[];
  /** Species caught today (local day at the place), for same-day badges. */
  today: { day: string; ids: string[] };
  settings: { sound: boolean; haptics: boolean };
  debug: { timeOffsetMs: number };
}

export function newGame(seed: number, now: number): GameState {
  return {
    v: SAVE_VERSION,
    seed,
    rng: seed,
    createdAt: now,
    lastSeen: now,
    locationId: 'beach',
    inventory: {},
    everHeld: {},
    creel: [],
    larder: [],
    nextUid: 1,
    rig: { rod: null, line: null, reel: null, hook: null, bait: null, lure: null, float: null, sinker: null, method: 'bait' },
    nodes: {},
    guide: {},
    journal: [
      {
        id: 1, at: now, kind: 'story', locationId: 'beach',
        text: 'Salt in my mouth, sand in everything. The ship is gone; a few of her timbers are still coming ashore. I am alive, and I am alone, and I am hungry.',
      },
    ],
    nextJournalId: 2,
    notes: {},
    recipesKnown: [],
    lessons: [],
    counts: {},
    pagesFound: 0,
    traps: [],
    rack: [],
    flags: {},
    visited: { beach: true },
    zonesSeen: {},
    stats: { casts: 0, catches: 0, lost: 0, castsSinceBottle: 0, coinsEarned: 0, playMs: 0, tagged: 0 },
    coins: 0,
    quests: {},
    orders: null,
    legendariesCaught: [],
    clues: [],
    today: { day: '', ids: [] },
    settings: { sound: true, haptics: true },
    debug: { timeOffsetMs: 0 },
  };
}

type Migration = (s: Record<string, unknown>) => void;

/** Each entry upgrades a save from version N to N + 1. */
const MIGRATIONS: Record<number, Migration> = {
  1: (s) => {
    s.larder ??= [];
    s.legendariesCaught ??= [];
    s.clues ??= [];
    s.orders ??= null;
    s.quests ??= {};
    s.coins ??= 0;
  },
};

/** Bring any older save up to the current shape. Throws on a save from the future. */
export function migrate(raw: unknown, now: number): GameState {
  if (!raw || typeof raw !== 'object') throw new Error('Save is not an object');
  const s = raw as Record<string, unknown>;
  let v = typeof s.v === 'number' ? s.v : 1;
  if (v > SAVE_VERSION) throw new Error(`Save is from a newer version (${v}) of the game`);
  while (v < SAVE_VERSION) {
    MIGRATIONS[v]?.(s);
    v++;
  }
  s.v = SAVE_VERSION;
  // Fill any field a newer build added, without touching what the save holds.
  const fresh = newGame(typeof s.seed === 'number' ? s.seed : 1, now) as unknown as Record<string, unknown>;
  for (const k of Object.keys(fresh)) {
    if (s[k] === undefined) s[k] = fresh[k];
    else if (fresh[k] && typeof fresh[k] === 'object' && !Array.isArray(fresh[k]) && s[k] && typeof s[k] === 'object') {
      s[k] = { ...(fresh[k] as object), ...(s[k] as object) };
    }
  }
  return s as unknown as GameState;
}

/** Save code: base64 of the JSON, with a short prefix so a wrong paste is caught early. */
const PREFIX = 'CA1.';

export function encodeSave(s: GameState): string {
  const json = JSON.stringify(s);
  const bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return PREFIX + btoa(bin);
}

export function decodeSave(code: string, now: number): GameState {
  const trimmed = code.trim();
  if (!trimmed.startsWith(PREFIX)) throw new Error('That does not look like a Castaway Angler save code');
  const bin = atob(trimmed.slice(PREFIX.length));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return migrate(JSON.parse(new TextDecoder().decode(bytes)), now);
}
