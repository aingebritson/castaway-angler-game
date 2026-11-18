/**
 * Content schemas. Every JSON file under /content is parsed through these at
 * build time (scripts/validate-content.ts) and again at load.
 */
import { z } from 'zod';

export const PHASES = ['dawn', 'day', 'dusk', 'night'] as const;
export const METHODS = ['bait', 'lure', 'sight', 'trap', 'net', 'hand'] as const;
export const RARITIES = ['common', 'uncommon', 'rare', 'epic'] as const;

const id = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'ids are lower-case kebab');
const mod = z.number().min(0).max(2);

export const SourceRef = z.object({
  title: z.string().min(1),
  url: z.url(),
  /** ISO date the source was checked, or "pending-review" until the research pass verifies it. */
  accessed: z.string().min(1),
  supports: z.string().min(1),
});

export const Species = z.object({
  id,
  commonName: z.string().min(1),
  scientificName: z.string().min(1),
  kind: z.enum(['fish', 'crustacean', 'cephalopod', 'mollusc', 'echinoderm', 'sighting']),
  family: z.string().min(1),
  lengthCm: z.object({
    min: z.number().positive(),
    common: z.number().positive(),
    max: z.number().positive(),
    measure: z.enum(['TL', 'FL', 'SL', 'CW', 'CL', 'ML', 'SH']),
  }).refine((l) => l.min < l.common && l.common < l.max, 'need min < common < max'),
  lengthWeight: z.object({ a: z.number().positive(), b: z.number().positive() }).nullable(),
  recordNote: z.string().optional(),
  fight: z.object({
    archetype: z.enum(['runner', 'diver', 'jumper', 'bulldog', 'thrasher', 'none']),
    strengthFactor: z.number().min(0),
    stamina: z.number().min(0),
  }),
  silhouette: z.string().min(1),
  /** Placeholder colours until specimen art arrives. */
  tint: z.object({ body: z.string(), accent: z.string().optional() }).optional(),
  conservation: z.object({ iucn: z.string(), releaseOnly: z.boolean(), note: z.string().optional() }),
  baseValue: z.number().min(0),
  /** Creatures picked up by hand that go into the bag as an item (bait) rather than the creel. */
  gathersAs: z.object({ item: id, qty: z.number().int().positive() }).optional(),
  description: z.string().min(40),
  facts: z.array(z.string().min(10)).min(2).max(4),
  visualNotes: z.string().min(10),
  sources: z.array(SourceRef).min(1, 'every species needs a source'),
});

export const Occurrence = z.object({
  speciesId: id,
  locationId: id,
  zones: z.array(id).min(1),
  rarity: z.enum(RARITIES),
  phaseMod: z.object({ dawn: mod, day: mod, dusk: mod, night: mod }),
  monthMod: z.array(mod).length(12),
  methods: z.array(z.enum(METHODS)).min(1),
  affinity: z.record(z.string(), mod),
  minGear: z.object({ rodTier: z.number().optional(), requiresFinder: z.boolean().optional() }).optional(),
  conditions: z.object({
    moon: z.array(z.number()).optional(),
    tide: z.array(z.number()).optional(),
    weather: z.record(z.string(), z.number()).optional(),
  }).optional(),
  confidence: z.enum(['high', 'medium', 'low']),
  sources: z.array(SourceRef).min(1, 'every occurrence needs a source'),
  designNotes: z.string().optional(),
});

export const Condition = z.discriminatedUnion('type', [
  z.object({ type: z.literal('flag'), flag: z.string() }),
  z.object({ type: z.literal('lesson'), lesson: id }),
  z.object({ type: z.literal('boat'), tier: z.number() }),
  z.object({ type: z.literal('chart'), chart: id }),
]);

export const GatherNode = z.object({
  /** One item, or a weighted table to draw from on each pick. */
  item: id.optional(),
  table: z.array(z.object({ item: id, weight: z.number().positive() })).optional(),
  max: z.number().int().positive(),
  regrowMin: z.number().positive(),
  /** Never drops below one, so the player cannot be stuck. */
  infinite: z.boolean().optional(),
  requiresTool: id.optional(),
  phases: z.array(z.enum(PHASES)).optional(),
  /** Restocks from a seeded daily draw instead of a timer (beach wash-up). */
  daily: z.boolean().optional(),
  /** Creatures caught by hand: each pick draws from this zone's hand-method pool. */
  handZone: id.optional(),
}).refine((n) => !!n.item || !!n.table || !!n.handZone, 'node needs item, table or handZone');

export const Hotspot = z.object({
  id,
  kind: z.enum(['gather', 'station', 'pickup', 'npc', 'shop', 'board', 'market', 'museum']),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  label: z.string(),
  glyph: z.string(),
  node: GatherNode.optional(),
  station: z.string().optional(),
  ref: z.string().optional(),
  /** Hidden until this flag is set / hidden once it is set. */
  showIf: z.string().optional(),
  hideIf: z.string().optional(),
});

export const Zone = z.object({
  id,
  name: z.string(),
  minCastRange: z.number().min(0).max(1),
  junkRate: z.number().min(0).max(1),
  junkTable: id,
  /** False for hand-gathering and trap-only zones that a cast cannot land in. */
  cast: z.boolean().default(true),
  blurb: z.string().optional(),
});

export const Location = z.object({
  id,
  regionId: id,
  name: z.string(),
  kind: z.enum(['port', 'spot', 'camp', 'gather']),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  /** IANA zone, or "device" for the island, which runs on the phone's clock. */
  tz: z.string(),
  /** Real zone used for sun maths when tz is "device". */
  solarTz: z.string().optional(),
  habitat: z.string(),
  blurb: z.string(),
  zones: z.array(Zone),
  /** Zone ids where silhouettes cruise and sight casting works. */
  sightZones: z.array(id).default([]),
  unlock: z.array(Condition),
  map: z.object({ x: z.number(), y: z.number() }),
  scene: z.object({
    background: z.string(),
    painter: z.string(),
    waterPolygon: z.array(z.array(z.number()).length(2)),
    hotspots: z.array(Hotspot),
  }),
});

export const Region = z.object({
  id,
  name: z.string(),
  order: z.number(),
  blurb: z.string(),
  map: z.object({ x: z.number(), y: z.number() }),
  unlock: z.array(Condition),
  /** Cost of a passage, once the unlock conditions hold. */
  passage: z.number().optional(),
});

export const Item = z.object({
  id,
  name: z.string(),
  kind: z.enum(['material', 'bait', 'hook', 'line', 'rod', 'reel', 'lure', 'float', 'sinker', 'tool', 'utility', 'trap', 'station', 'raft', 'boat', 'goods', 'chart']),
  glyph: z.string(),
  desc: z.string(),
  /** Coins when sold at a market. */
  value: z.number().optional(),
  rod: z.object({ tier: z.number(), range: z.number(), power: z.number(), accuracy: z.number() }).optional(),
  line: z.object({ strength: z.number() }).optional(),
  reel: z.object({ greenBonus: z.number(), capacity: z.number() }).optional(),
  hook: z.object({ minCm: z.number(), maxCm: z.number(), sizeShift: z.number() }).optional(),
  bait: z.object({ tags: z.array(z.string()).min(1), sizeShift: z.number().default(0) }).optional(),
  lure: z.object({ type: z.string(), speedBand: z.array(z.number()).length(2), sizeShift: z.number().default(0) }).optional(),
  float: z.object({ windowBonus: z.number() }).optional(),
  sinker: z.object({ rangeBonus: z.number() }).optional(),
  trap: z.object({ capacity: z.number(), minSoakH: z.number(), maxSoakH: z.number(), method: z.enum(['trap', 'net']).default('trap') }).optional(),
  boat: z.object({ tier: z.number() }).optional(),
  finder: z.object({ tier: z.number() }).optional(),
});

export const Recipe = z.object({
  id,
  tier: z.number().int().min(1).max(4),
  inputs: z.array(z.object({ item: id, qty: z.number().int().positive() })),
  tools: z.array(id).default([]),
  station: id.optional(),
  output: z.object({ item: id, qty: z.number().int().positive() }),
  /** "start" recipes are known from the first minute; the rest are discovered. */
  known: z.enum(['start', 'discover', 'taught']).default('discover'),
  /** Smoked-fish provisions and other inputs that are not plain items. */
  special: z.enum(['provisions']).optional(),
  blurb: z.string(),
});

export const Rumour = z.object({
  id,
  speciesId: id,
  dimension: z.enum(['where', 'when', 'bait', 'method']),
  text: z.string().min(10),
  /** Cells of the observed grid this rumour marks, e.g. "phase:night", "bait:crab", "zone:lagoon/flats". */
  fillsCells: z.array(z.string()),
  source: z.string(),
});

export const Page = z.object({
  id,
  order: z.number().int(),
  title: z.string(),
  text: z.string(),
  recipes: z.array(id).default([]),
  rumours: z.array(id).default([]),
  /** The last page carries the bearing off the island; it needs eight species first. */
  bearing: z.boolean().optional(),
  /** Pages only wash up once this many lessons have been learned, so they arrive alongside the player. */
  minLessons: z.number().int().min(0).default(0),
});

/** A condition a lesson waits for: something that has happened while playing. */
export const LessonCond = z.discriminatedUnion('type', [
  z.object({ type: z.literal('stat'), stat: z.enum(['casts', 'catches', 'lost']), min: z.number() }),
  /** Event counters: stolen, missed, snapped, longCast, creelFull, cast:<location>/<zone>. */
  z.object({ type: z.literal('count'), key: z.string(), min: z.number() }),
  z.object({ type: z.literal('held'), item: id }),
  z.object({ type: z.literal('kinds'), min: z.number() }),
  z.object({ type: z.literal('phase'), phases: z.array(z.enum(PHASES)).min(1) }),
  z.object({ type: z.literal('at'), location: id }),
  /** No hook left to fish with: the player must never be stuck. */
  z.object({ type: z.literal('hookless') }),
  /** Island days lived: 1 on the first day, counted from the device clock. */
  z.object({ type: z.literal('day'), min: z.number() }),
  /** Journal pages found from the earlier castaway. */
  z.object({ type: z.literal('pages'), min: z.number() }),
  z.object({ type: z.literal('know'), lesson: id }),
  z.object({ type: z.literal('flag'), flag: z.string() }),
]);

/**
 * A lesson: something the castaway works out by fishing. It explains one idea
 * in plain words and unlocks what that idea lets you make or reach.
 */
export const Lesson = z.object({
  id,
  order: z.number().int(),
  regionId: id,
  title: z.string(),
  glyph: z.string(),
  /** What just happened, in the castaway's voice. */
  seen: z.string().min(10),
  /** The fishing idea, plainly, for someone who has never fished. */
  lesson: z.string().min(20),
  /** What it means in the game: what you can now make, and where to find what it needs. */
  effect: z.string().min(10),
  /** What is on the castaway's mind while this is the next thing to work out. */
  hint: z.string(),
  requires: z.array(id).default([]),
  /** Any one group of conditions, all holding, teaches the lesson. */
  when: z.array(z.array(LessonCond).min(1)).min(1),
  unlocks: z.object({ recipes: z.array(id).default([]), flags: z.array(z.string()).default([]) }).default({ recipes: [], flags: [] }),
  /** False for a lesson that follows straight on from the last (cut bait, the moment you hold a knife). */
  gap: z.boolean().default(true),
});

/**
 * A thought: the castaway's own voice, popping up when something in their
 * days has changed. This is the story: a person with nothing to do but fish,
 * fishing their way off an island.
 */
export const Thought = z.object({
  id,
  order: z.number().int(),
  /** Only thought in this region. */
  regionId: id,
  /** Shown one under the other. {days} becomes "a day" or "N days"; {catches} and {kinds} are counts. */
  lines: z.array(z.string().min(2)).min(1),
  /** Any one group of conditions, all holding, brings the thought. */
  when: z.array(z.array(LessonCond).min(1)).min(1),
  /** False for a thought that belongs straight after whatever caused it. */
  gap: z.boolean().default(true),
});

export const JunkTable = z.object({
  id,
  entries: z.array(z.object({ item: id, weight: z.number().positive() })).min(1),
});

export const RigPreset = z.object({
  id,
  label: z.string(),
  rod: id,
  line: id,
  reel: id.optional(),
  hook: id.optional(),
  bait: id.optional(),
  lure: id.optional(),
  float: id.optional(),
  sinker: id.optional(),
  method: z.enum(['bait', 'lure', 'sight']),
});

export const Legendary = z.object({
  id,
  speciesId: id,
  name: z.string(),
  lore: z.string(),
  lengthCm: z.number(),
  spawn: z.object({
    locationId: id,
    zone: id,
    phases: z.array(z.enum(PHASES)),
    months: z.array(z.number().int().min(0).max(11)),
    rig: z.array(z.string()),
    moon: z.array(z.number()).optional(),
    chancePerCast: z.number(),
  }),
  clues: z.array(z.object({ dimension: z.enum(['where', 'when', 'season', 'bait', 'moon']), text: z.string(), sourceQuestId: z.string() })),
  /** Legendaries fight on far longer than their kind. */
  fight: z.object({ staminaMult: z.number().positive() }).optional(),
});

const QuestGoal = z.discriminatedUnion('type', [
  z.object({ type: z.literal('catch'), speciesId: id, count: z.number().int().positive().default(1), minCm: z.number().optional(), phase: z.enum(PHASES).optional(), locationId: id.optional() }),
  z.object({ type: z.literal('catchAny'), count: z.number().int().positive(), distinct: z.boolean().default(false), locationId: id.optional(), phase: z.enum(PHASES).optional(), grade: z.string().optional() }),
  z.object({ type: z.literal('deliver'), item: id, qty: z.number().int().positive() }),
  z.object({ type: z.literal('deliverFish'), speciesId: id.optional(), count: z.number().int().positive(), minCm: z.number().optional() }),
  z.object({ type: z.literal('release'), speciesId: id, count: z.number().int().positive() }),
  z.object({ type: z.literal('have'), item: id }),
  z.object({ type: z.literal('visit'), locationId: id }),
]);

const Reward = z.object({
  coins: z.number().optional(),
  items: z.array(z.object({ item: id, qty: z.number().int().positive() })).optional(),
  rumours: z.array(id).optional(),
  recipes: z.array(id).optional(),
  flags: z.array(z.string()).optional(),
  /** Legendary clues, as "<legendary id>:<dimension>". */
  clues: z.array(z.string()).optional(),
});

export const Quest = z.object({
  id,
  personId: id,
  order: z.number().int(),
  title: z.string(),
  offer: z.string(),
  goal: QuestGoal,
  progressText: z.string(),
  done: z.string(),
  reward: Reward,
});

export const Person = z.object({
  id,
  locationId: id,
  name: z.string(),
  role: z.string(),
  glyph: z.string(),
  greeting: z.string(),
  idle: z.array(z.string()).min(1),
});

export const Shop = z.object({
  id,
  locationId: id,
  name: z.string(),
  keeper: id.optional(),
  stock: z.array(z.object({ item: id, price: z.number().positive(), requiresFlag: z.string().optional(), once: z.boolean().optional() })),
});

export const Balance = z.object({
  rarityWeights: z.object({ common: z.number(), uncommon: z.number(), rare: z.number(), epic: z.number() }),
  phases: z.object({ dawnBeforeMin: z.number(), dawnAfterMin: z.number(), duskBeforeMin: z.number(), duskAfterMin: z.number() }),
  bite: z.object({
    waitMinS: z.number(), waitMaxS: z.number(), referenceWeight: z.number(),
    nibblesMin: z.number(), nibblesMax: z.number(),
    hookWindowMinS: z.number(), hookWindowMaxS: z.number(),
    overmatchedBiteMult: z.number(), missKeepBaitChance: z.number(),
    lureStrikePerS: z.number(), darkWindowMult: z.number(),
  }),
  power: z.object({ autoLandRatio: z.number(), pullExp: z.number() }),
  size: z.object({
    sigmaZ: z.number(), sigmaMin: z.number(), sigmaMax: z.number(),
    grades: z.object({ small: z.number(), large: z.number(), trophy: z.number(), record: z.number() }),
  }),
  fight: z.object({
    greenAt: z.number(), yellowAt: z.number(), redAt: z.number(),
    snapS: z.number(), slackAt: z.number(), slackS: z.number(),
    reelSpeed: z.number(), runSpeed: z.number(), tensionRate: z.number(),
    reelBase: z.number(), reelForce: z.number(), idleForce: z.number(),
    drainBase: z.number(), drainTension: z.number(), tiredFloor: z.number(),
    autoLandS: z.number(),
  }),
  economy: z.object({
    gradeMult: z.object({ small: z.number(), average: z.number(), large: z.number(), trophy: z.number(), record: z.number() }),
    smokedMult: z.number(), orderMult: z.array(z.number()).length(2), ordersPerDay: z.number(),
    tagPayment: z.number(),
  }),
  camp: z.object({ smokeMin: z.number(), rackSlots: z.number(), cleanBones: z.number(), cleanBait: z.number() }),
  bearing: z.object({ speciesNeeded: z.number(), pityCasts: z.number(), pagePityCasts: z.number() }),
  provisions: z.object({ fish: z.number(), species: z.number() }),
  trap: z.object({ catchesPerHour: z.number() }),
  legendaryChance: z.number(),
  /** Casts between one lesson and the next, so ideas arrive one at a time. */
  lessons: z.object({ gapCasts: z.number() }).default({ gapCasts: 10 }),
  /** Casts between thought cards; casts before a stuck thought comes back, and how often it may. */
  thoughts: z.object({ gapCasts: z.number(), repeatCasts: z.number(), repeats: z.number() }).default({ gapCasts: 6, repeatCasts: 30, repeats: 3 }),
  creelLimit: z.number(),
});

export type SourceRef = z.infer<typeof SourceRef>;
export type Species = z.infer<typeof Species>;
export type Occurrence = z.infer<typeof Occurrence>;
export type Condition = z.infer<typeof Condition>;
export type GatherNode = z.infer<typeof GatherNode>;
export type Hotspot = z.infer<typeof Hotspot>;
export type Zone = z.infer<typeof Zone>;
export type Location = z.infer<typeof Location>;
export type Region = z.infer<typeof Region>;
export type Item = z.infer<typeof Item>;
export type Recipe = z.infer<typeof Recipe>;
export type Rumour = z.infer<typeof Rumour>;
export type Page = z.infer<typeof Page>;
export type Lesson = z.infer<typeof Lesson>;
export type LessonCond = z.infer<typeof LessonCond>;
export type Thought = z.infer<typeof Thought>;
export type JunkTable = z.infer<typeof JunkTable>;
export type RigPreset = z.infer<typeof RigPreset>;
export type Legendary = z.infer<typeof Legendary>;
export type Quest = z.infer<typeof Quest>;
export type QuestGoal = z.infer<typeof QuestGoal>;
export type Reward = z.infer<typeof Reward>;
export type Person = z.infer<typeof Person>;
export type Shop = z.infer<typeof Shop>;
export type Balance = z.infer<typeof Balance>;
export type Phase = (typeof PHASES)[number];
export type Method = (typeof METHODS)[number];
export type Rarity = (typeof RARITIES)[number];
