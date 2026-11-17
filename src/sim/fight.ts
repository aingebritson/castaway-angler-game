/**
 * The fight model (spec section 4). One control: hold to reel, release to give
 * line. Pure and steppable, so the simulator can fight ten thousand fish.
 */
import type { Balance, Species } from '../content/schema';
import { type Rng, clamp, range } from './rng';

export type Archetype = Species['fight']['archetype'];

export interface FightState {
  archetype: Archetype;
  /** Fish pull over rig power at full energy. */
  ratio: number;
  /** Seconds of fight the species has in it. */
  stamina: number;
  /** 1 fresh, 0 exhausted. */
  energy: number;
  /** Line out: 0 at the angler's feet, 1 is the end of the spool. */
  dist: number;
  /** 0 slack, 1 breaking strain. */
  tension: number;
  redTime: number;
  slackTime: number;
  elapsed: number;
  /** Current surge multiplier on the fish's pull. */
  surge: number;
  surgeLeft: number;
  nextSurge: number;
  /** A jumper in the air: the line goes slack unless the angler keeps reeling. */
  jumping: boolean;
  /** Bonus to the green band from the reel. */
  greenBonus: number;
  /** Line on the spool, in the same units as `dist`. A bigger reel lets a strong fish run further before it is gone. */
  capacity: number;
  outcome: 'fighting' | 'landed' | 'snapped' | 'pulled' | 'spooled';
  /** For the renderer: the fish's lateral position, -1..1. */
  side: number;
  sideVel: number;
}

export interface FightSetup {
  species: Species;
  ratio: number;
  /** Where the fish was hooked, 0..1 of cast range. */
  startDist: number;
  greenBonus?: number;
  /** Spool size; 1 without a reel. */
  capacity?: number;
  /** Legendary fish fight on far longer than their kind. */
  staminaMult?: number;
}

const SURGE: Record<Archetype, { every: [number, number]; length: [number, number]; mult: number }> = {
  runner: { every: [3.5, 6.5], length: [1.6, 2.6], mult: 1.75 },
  diver: { every: [3, 5], length: [1.0, 1.5], mult: 1.55 },
  jumper: { every: [3, 5.5], length: [0.55, 0.8], mult: 1.5 },
  bulldog: { every: [6, 9], length: [1.2, 1.8], mult: 1.25 },
  thrasher: { every: [0.7, 1.5], length: [0.3, 0.45], mult: 1.5 },
  none: { every: [99, 99], length: [0, 0], mult: 1 },
};

export function startFight(setup: FightSetup, rng: Rng): FightState {
  const a = setup.species.fight.archetype;
  return {
    archetype: a,
    ratio: setup.ratio,
    stamina: Math.max(1, setup.species.fight.stamina * (setup.staminaMult ?? 1)),
    energy: 1,
    dist: clamp(0.3 + 0.45 * setup.startDist, 0.2, 0.8),
    tension: 0.3,
    redTime: 0,
    slackTime: 0,
    elapsed: 0,
    surge: 1,
    surgeLeft: 0,
    nextSurge: range(rng, 0.8, SURGE[a].every[0]),
    jumping: false,
    greenBonus: setup.greenBonus ?? 0,
    capacity: setup.capacity ?? 1,
    outcome: 'fighting',
    side: range(rng, -0.3, 0.3),
    sideVel: 0,
  };
}

/** The fish's pull right now, relative to rig power. */
export function currentForce(s: FightState, b: Balance): number {
  const f = b.fight;
  const base = s.ratio * (f.tiredFloor + (1 - f.tiredFloor) * s.energy);
  const bulldog = s.archetype === 'bulldog' ? 1.15 : 1;
  return base * s.surge * bulldog;
}

/** Advance the fight by dt seconds. Mutates and returns `s`. */
export function stepFight(s: FightState, reeling: boolean, dt: number, rng: Rng, b: Balance): FightState {
  if (s.outcome !== 'fighting') return s;
  const f = b.fight;
  const shape = SURGE[s.archetype];
  s.elapsed += dt;

  // Surges: each archetype has its own rhythm, which is what makes fish feel different.
  if (s.surgeLeft > 0) {
    s.surgeLeft -= dt;
    if (s.surgeLeft <= 0) {
      s.surge = 1;
      s.jumping = false;
      s.nextSurge = range(rng, shape.every[0], shape.every[1]) * (0.7 + 0.6 * (1 - s.energy));
    }
  } else if (s.energy > 0.08) {
    s.nextSurge -= dt;
    // Divers make one last dive when they see the angler.
    const lastDive = s.archetype === 'diver' && s.dist < 0.22 && s.nextSurge > 0.4 && s.energy > 0.2;
    if (s.nextSurge <= 0 || lastDive) {
      s.surgeLeft = range(rng, shape.length[0], shape.length[1]);
      s.surge = shape.mult * (0.55 + 0.45 * s.energy) + (lastDive ? 0.2 : 0);
      s.surge = Math.max(1, s.surge);
      s.jumping = s.archetype === 'jumper';
      if (lastDive) s.nextSurge = 99;
      s.sideVel += range(rng, -1.6, 1.6);
    }
  }

  const force = currentForce(s, b);
  const drag = 1 - 0.35 * s.greenBonus; // a smoother reel takes the edge off

  // Tension chases a target set by what the angler and the fish are doing.
  let target: number;
  if (reeling) target = (f.reelBase + f.reelForce * force) * drag;
  else target = f.idleForce * force;
  if (s.jumping && !reeling) target = 0; // a jump throws slack
  s.tension += (target - s.tension) * clamp(f.tensionRate * dt, 0, 1);
  if (s.jumping && !reeling) s.tension *= 1 - clamp(6 * dt, 0, 1);
  s.tension = clamp(s.tension, 0, 1.25);

  // Line: reeling gains it unless the fish is stronger; a free fish takes it back.
  if (reeling) {
    const gain = f.reelSpeed * Math.max(0, 1 - 0.9 * force);
    const loss = f.runSpeed * Math.max(0, force - 1) * 1.6;
    s.dist += (loss - gain) * dt;
  } else {
    s.dist += f.runSpeed * force * (s.surge > 1 ? 1.5 : 1) * dt;
  }

  // The fish tires faster under tension.
  const tireScale = s.archetype === 'bulldog' ? 0.8 : 1;
  s.energy = clamp(s.energy - ((f.drainBase + f.drainTension * Math.min(1, s.tension)) / s.stamina) * tireScale * dt, 0, 1);

  if (s.tension > f.redAt) s.redTime += dt;
  else s.redTime = Math.max(0, s.redTime - dt * 1.5);
  if (s.tension < f.slackAt) s.slackTime += dt * (s.jumping ? 2.2 : 1);
  else s.slackTime = Math.max(0, s.slackTime - dt * 2);

  // Lateral wander, for the renderer.
  s.sideVel += (range(rng, -1, 1) * (0.6 + 2 * s.energy) - s.side * 1.2 - s.sideVel * 1.5) * dt;
  s.side = clamp(s.side + s.sideVel * dt, -1, 1);

  if (s.dist <= 0) {
    s.dist = 0;
    s.outcome = 'landed';
  } else if (s.redTime >= f.snapS) s.outcome = 'snapped';
  else if (s.slackTime >= f.slackS) s.outcome = 'pulled';
  else if (s.dist >= s.capacity) {
    s.dist = s.capacity;
    s.outcome = 'spooled';
  }
  return s;
}

/** A competent, not perfect, angler: reel until the gauge runs yellow, then ease off. */
export function botReels(s: FightState, b: Balance): boolean {
  if (s.jumping) return true;
  const yellow = b.fight.yellowAt + 0.1 * s.greenBonus;
  if (s.tension > yellow + 0.1) return false;
  if (s.redTime > 0.5) return false;
  return true;
}

export interface FightResult {
  outcome: FightState['outcome'];
  seconds: number;
}

/** Run a whole fight with the bot at the reel. */
export function simulateFight(setup: FightSetup, rng: Rng, b: Balance, maxS = 240): FightResult {
  const s = startFight(setup, rng);
  const dt = 1 / 30;
  while (s.outcome === 'fighting' && s.elapsed < maxS) stepFight(s, botReels(s, b), dt, rng, b);
  return { outcome: s.outcome === 'fighting' ? 'pulled' : s.outcome, seconds: s.elapsed };
}
