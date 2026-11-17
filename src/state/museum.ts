/**
 * The museum (spec section 9, M5): one specimen per species, a wing per region,
 * a trophy wall of personal bests, and badges. Completing a wing yields any
 * legendary clue whose source is that wing.
 */
import type { Content } from '../content/assemble';
import { type Grade, gradeFor, sizePercentile } from '../sim/catch';
import { type Ctx, type GameEvent, grantClue, log, speciesCaught } from './actions';
import type { GameState } from './state';

/** Species that can be donated for a region's wing: kept animals, not protected ones or bait. */
export function wingSpecies(content: Content, regionId: string): string[] {
  const out = new Set<string>();
  for (const o of content.occurrences) {
    if (content.locations[o.locationId]?.regionId !== regionId) continue;
    const sp = content.species[o.speciesId];
    if (!sp || sp.kind === 'sighting' || sp.conservation.releaseOnly || sp.gathersAs) continue;
    out.add(sp.id);
  }
  return [...out].sort((a, b) => content.species[a].family.localeCompare(content.species[b].family) || a.localeCompare(b));
}

export interface WingStatus {
  regionId: string;
  species: string[];
  donated: number;
  complete: boolean;
}

export function wings(s: GameState, content: Content): WingStatus[] {
  return Object.values(content.regions)
    .sort((a, b) => a.order - b.order)
    .map((r) => {
      const species = wingSpecies(content, r.id);
      const donated = species.filter((id) => s.guide[id]?.donated).length;
      return { regionId: r.id, species, donated, complete: species.length > 0 && donated === species.length };
    });
}

/** The specimen that would be donated: the biggest fresh one in the basket. */
export function donatable(s: GameState, speciesId: string) {
  return s.creel.filter((f) => f.speciesId === speciesId).sort((a, b) => b.lengthCm - a.lengthCm)[0];
}

export function donate(s: GameState, ctx: Ctx, speciesId: string): GameEvent[] {
  const f = donatable(s, speciesId);
  const e = s.guide[speciesId];
  if (!f || !e || e.donated) return [];
  s.creel = s.creel.filter((x) => x.uid !== f.uid);
  e.donated = true;
  const sp = ctx.content.species[speciesId];
  const events: GameEvent[] = [{ type: 'sfx', id: 'discover' }, { type: 'toast', text: `${sp.commonName} donated to the museum.`, glyph: '🏛️', tone: 'good' }];
  for (const w of wings(s, ctx.content)) {
    if (!w.complete || !w.species.includes(speciesId) || s.flags[`wing:${w.regionId}`]) continue;
    s.flags[`wing:${w.regionId}`] = true;
    const region = ctx.content.regions[w.regionId];
    const pay = 40 * w.species.length;
    s.coins += pay;
    s.stats.coinsEarned += pay;
    log(s, ctx, 'quest', `The ${region.name} wing of the museum is complete: ${w.species.length} specimens. Abena Castillo pays ${pay} coins and throws a small party.`);
    events.push({ type: 'toast', text: `${region.name} wing complete! +${pay} coins.`, glyph: '🏛️', tone: 'good' });
    for (const leg of Object.values(ctx.content.legendaries)) {
      for (const c of leg.clues) {
        if (c.sourceQuestId === `museum:${w.regionId}` && grantClue(s, ctx, `${leg.id}:${c.dimension}`)) {
          events.push({ type: 'toast', text: `At the party, someone tells you about ${leg.name}.`, glyph: '✨', tone: 'good' });
        }
      }
    }
  }
  return events;
}

export interface Trophy {
  speciesId: string;
  lengthCm: number;
  weightG: number;
  grade: Grade;
  percentile: number;
  at: number;
  locationId: string;
  rig: string;
}

/** Personal bests, best first by how exceptional they are for their kind. */
export function trophyWall(s: GameState, content: Content): Trophy[] {
  const out: Trophy[] = [];
  for (const [id, e] of Object.entries(s.guide)) {
    const sp = content.species[id];
    if (!e.pb || !sp?.lengthWeight || sp.gathersAs) continue;
    const percentile = sizePercentile(sp, e.pb.lengthCm, content.balance);
    out.push({ speciesId: id, ...e.pb, percentile, grade: gradeFor(percentile, content.balance) });
  }
  return out.sort((a, b) => b.percentile - a.percentile);
}

export interface Badge {
  id: string;
  name: string;
  glyph: string;
  desc: string;
  got: boolean;
}

const SLAM = ['albula-vulpes', 'trachinotus-falcatus', 'megalops-atlanticus'];

export function badges(s: GameState, content: Content): Badge[] {
  const caught = speciesCaught(s, content);
  const nightKinds = Object.values(s.guide).filter((e) => e.state === 'caught' && e.cells['phase:night'] === 'c').length;
  const trophies = trophyWall(s, content);
  const island = new Set(content.occurrences.filter((o) => content.locations[o.locationId]?.regionId === 'castaway-island').map((o) => o.speciesId));
  const islandAll = island.size > 0 && [...island].every((id) => s.guide[id]?.state === 'caught');
  const awayCount = s.journal.filter((j) => j.kind === 'away').length;
  const b = (id: string, glyph: string, name: string, desc: string, got: boolean): Badge => ({ id, glyph, name, desc, got });
  return [
    b('first', '🐟', 'First fish', 'Land a fish.', s.stats.catches > 0),
    b('toolmaker', '🔪', 'Toolmaker', 'Knap a stone knife.', !!s.everHeld['stone-knife']),
    b('night', '🌙', 'Night shift', 'Catch five different kinds after dark.', nightKinds >= 5),
    b('ten', '📖', 'Naturalist', 'Catch ten different kinds.', caught >= 10),
    b('castaway', '⛵', 'Castaway no more', 'Sail off the island.', !!s.flags.launched),
    b('stories', '💥', 'Stories to tell', 'Lose ten fish worth telling about.', awayCount >= 10 || s.stats.lost >= 10),
    b('trophy', '🏆', 'One for the wall', 'Catch a trophy-grade fish.', trophies.some((t) => t.grade === 'trophy' || t.grade === 'record')),
    b('record', '📏', 'Record book', 'Catch a record-grade fish: bigger than 99.5% of its kind.', trophies.some((t) => t.grade === 'record')),
    b('slam', '🎰', 'Grand slam', 'Bonefish, permit and tarpon on the same day.', !!s.flags['badge:slam'] || SLAM.every((id) => s.today.ids.includes(id))),
    b('tagger', '🏷️', 'Citizen scientist', 'Tag and release five protected animals.', s.stats.tagged >= 5),
    b('island', '🏝️', 'Know your island', 'Record every animal on Castaway Island.', islandAll),
    b('thirty', '🧭', 'Field guide', 'Catch thirty different kinds.', caught >= 30),
    b('curator', '🏛️', 'Curator', 'Complete a museum wing.', Object.keys(s.flags).some((k) => k.startsWith('wing:') && s.flags[k])),
    b('legend', '✨', 'Legend', 'Land a legendary fish.', s.legendariesCaught.length > 0),
  ];
}
