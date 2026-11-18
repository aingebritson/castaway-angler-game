/**
 * The opening walkthrough. Which coach mark to show is derived from state and
 * what is on screen, never stored as a step counter, so it cannot get lost:
 * if the player wanders off, it points them back.
 */
import type { GameState } from './state';

export type CoachStep = 'intro' | 'rod' | 'bait' | 'map' | 'map-pin' | 'cast' | 'wait' | 'bite' | 'guide' | 'to-camp' | 'camp-pin' | 'workbench';

export const FLEAS_NEEDED = 3;

export interface CoachView {
  /** The fishing phase, or 'idle' where there is no water. */
  phase: string;
  /** Which menu is open, if any. */
  panel: string | null;
  /** A card (reveal, page, haul) is covering the scene. */
  card: boolean;
}

export function coachStep(s: GameState, v: CoachView): CoachStep | null {
  if (s.flags.tutDone || s.flags.launched) return null;
  if (!s.flags.introSeen && !s.flags.hasRod && s.stats.casts === 0) return 'intro';
  if (v.card) return null;
  if (!s.flags.hasRod) return v.panel ? null : 'rod';
  if (s.stats.catches === 0) {
    const fleas = s.inventory['sand-flea'] ?? 0;
    if (s.locationId === 'beach' && fleas < FLEAS_NEEDED && s.stats.casts === 0) return v.panel ? null : 'bait';
    if (s.locationId !== 'rocky-point') return v.panel === 'map' ? 'map-pin' : v.panel ? null : 'map';
    if (v.panel) return null;
    if (v.phase === 'idle' || v.phase === 'aiming') return 'cast';
    if (v.phase === 'waiting' || v.phase === 'flying') return 'wait';
    if (v.phase === 'bite') return 'bite';
    return null;
  }
  if (!s.flags.tutGuide) return v.panel ? null : 'guide';
  // The first idea: show where things are made.
  if (s.lessons.includes('hooks') && !s.flags.tutBench && !s.everHeld['shell-hook']) {
    if (s.locationId !== 'camp') return v.panel === 'map' ? 'camp-pin' : v.panel ? null : v.phase === 'idle' ? 'to-camp' : null;
    return v.panel ? null : 'workbench';
  }
  return null;
}

/** Hotspots shown on the beach while the walkthrough is focusing on one thing. */
export function focusHotspots(step: CoachStep | null): string[] | null {
  if (step === 'intro' || step === 'rod') return ['old-rod'];
  if (step === 'bait') return ['swash'];
  return null;
}

/** The bottom bar appears once there is somewhere to go. */
export const navHidden = (step: CoachStep | null): boolean => step === 'intro' || step === 'rod' || step === 'bait';
