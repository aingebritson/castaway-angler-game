/**
 * The castaway's next thought. Derived from state every time, never stored, so
 * the player can never be left without a way forward.
 */
import type { Content } from '../content/assemble';
import { has, raftStatus, speciesCaught } from './actions';
import { nextLesson } from './lessons';
import { sourceOf } from './sources';
import { recipeView, craftCheck } from '../sim/world';
import type { GameState } from './state';

export interface Goal {
  text: string;
  /** Location the goal points at, for the map. */
  where?: string;
  /** Hotspot at that location to ring in gold. */
  hs?: string;
}

export function stage(s: GameState): number {
  if (s.flags.launched) return has(s, 'skiff') || has(s, 'sloop') ? (has(s, 'sloop') ? 5 : 4) : 3;
  if (has(s, 'bamboo-rod') && has(s, 'braided-line')) return 2;
  if (has(s, 'stone-knife')) return 1;
  return 0;
}

export const STAGE_NAMES = ['Washed up', 'Toolmaker', 'Angler', 'Raft', 'Deckhand', 'Skipper', 'Voyager', 'Master'];

/** After the island, the next thought comes from whoever you owe a visit. */
function portGoal(s: GameState, content: Content): Goal | null {
  const port = Object.values(content.locations).find((l) => l.kind === 'port' && l.regionId === content.locations[s.locationId]?.regionId)
    ?? Object.values(content.locations).find((l) => l.kind === 'port');
  if (!port) return null;
  const entries = Object.entries(s.quests);
  const ready = entries.find(([id, q]) => q.state === 'ready' && content.quests[id]);
  if (ready) return { text: `${content.people[content.quests[ready[0]].personId].name} will want to hear about it.`, where: port.id };
  const active = entries.find(([id, q]) => q.state === 'active' && content.quests[id]);
  if (active) {
    const q = content.quests[active[0]];
    const g = q.goal;
    const n = 'count' in g ? g.count : 1;
    return { text: `${content.people[q.personId].name}: ${q.progressText.toLowerCase()}${n > 1 ? ` (${Math.min(active[1].progress, n)} of ${n})` : ''}.`, where: 'locationId' in g ? g.locationId : undefined };
  }
  if (!entries.length) return { text: 'A town, and people. Somebody at the boatyard must know about boats; the pier is free to fish.', where: port.id };
  const open = Object.values(content.questsByPerson).some((list) => list.some((q) => !s.quests[q.id]));
  return open ? { text: 'Someone in town may have another errand.', where: port.id } : null;
}

export function nextGoal(s: GameState, content: Content): Goal | null {
  if (s.flags.launched) return portGoal(s, content);
  const held = (id: string) => !!s.everHeld[id];
  const caught = speciesCaught(s, content);
  if (!s.flags.hasRod) return { text: 'Something long and thin is tangled in the wrack on the beach.', where: 'beach', hs: 'old-rod' };
  if (!held('sand-flea') && !held('small-crab') && !held('cut-bait')) return { text: 'Bait first. The wet sand at the water’s edge is alive with sand fleas.', where: 'beach', hs: 'swash' };
  if (s.stats.catches === 0) return { text: 'The rocks at the point look fishy. Drag back and let go to cast.', where: 'rocky-point' };
  const made = madeNext(s, content);
  if (made) return made;
  const lesson = nextLesson(s, content);
  if (lesson?.hint) return { text: lesson.hint };
  const raft = raftStatus(s);
  if (!raft.bearing && caught < content.balance.bearing.speciesNeeded) {
    return { text: `I should know these waters before I trust them. ${caught} of ${content.balance.bearing.speciesNeeded} kinds caught.` };
  }
  if (!raft.bearing && !content.pages[s.pagesFound]?.bearing) return { text: 'Keep fishing and keep learning. The last castaway’s pages wash up as I am ready for them.' };
  if (!raft.bearing) return { text: 'Bottles keep washing in with pages from the last castaway. One of them must say which way to sail.', where: 'beach', hs: 'wrack' };
  const missing = raft.parts.filter((p) => !p.done);
  if (missing.length) return { text: `The raft still needs: ${missing.map((p) => content.items[p.id].name.toLowerCase()).join(', ')}.`, where: 'camp', hs: 'raft' };
  return { text: 'The raft is ready. The wind is fair.', where: 'camp', hs: 'raft' };
}

const ONE_OFF = ['tool', 'station', 'utility', 'rod', 'line', 'float', 'sinker', 'lure', 'trap', 'hook'];

/**
 * Something the castaway has learned how to make but has not made yet: say
 * what is still missing and where it is, oldest idea first so tools come
 * before the things they make.
 */
function madeNext(s: GameState, content: Content): Goal | null {
  for (const id of s.recipesKnown) {
    const r = content.recipes[id];
    if (!r || r.tier >= 3 || recipeView(r, s.recipesKnown) !== 'known') continue;
    const out = content.items[r.output.item];
    if (!ONE_OFF.includes(out.kind) || s.everHeld[out.id]) continue;
    const name = out.name.toLowerCase();
    const missingTool = [...r.tools, ...(r.station ? [r.station] : [])].find((t) => !has(s, t));
    if (missingTool && !s.recipesKnown.includes(content.recipes[missingTool]?.id ?? '')) continue;
    if (missingTool) continue; // the tool's own recipe comes first in the list
    const check = craftCheck(r, s.inventory);
    if (check.ok) return { text: `I have everything for a ${name}. To the workbench at camp.`, where: 'camp', hs: 'workbench' };
    const m = check.missing[0];
    const item = content.items[m.item];
    const need = m.need - m.have;
    if (m.item === 'fish-bone' || m.item === 'cut-bait') {
      return { text: `A ${name} needs ${m.item === 'fish-bone' ? 'a fish bone' : 'cut bait'}. Keep a fish, then clean it at the catch basket in camp.`, where: 'camp', hs: 'basket' };
    }
    // A missing part that is itself made (cord): point at its ingredients instead.
    const sub = Object.values(content.recipes).find((x) => x.output.item === m.item && recipeView(x, s.recipesKnown) === 'known');
    if (sub) {
      const subCheck = craftCheck(sub, s.inventory);
      if (subCheck.ok) return { text: `A ${name} needs ${item.name.toLowerCase()}. I can make that at the workbench.`, where: 'camp', hs: 'workbench' };
      const sm = subCheck.missing[0];
      const ssrc = sourceOf(content, sm.item, s);
      return {
        text: `A ${name} needs ${item.name.toLowerCase()}, and for that I need ${content.items[sm.item].name.toLowerCase()}: ${ssrc ? content.locations[ssrc.locationId].name : 'somewhere'}.`,
        where: ssrc?.locationId, hs: ssrc?.hotspotId,
      };
    }
    const src = sourceOf(content, m.item, s);
    const place = src ? content.locations[src.locationId].name : 'somewhere on the island';
    return { text: `I know how to make a ${name} now. Still need ${need} ${need > 1 ? plural(item.name) : item.name.toLowerCase()}: ${place}.`, where: src?.locationId, hs: src?.hotspotId };
  }
  return null;
}

const plural = (name: string) => {
  const n = name.toLowerCase();
  return n.endsWith('s') ? n : n.endsWith('y') ? n.slice(0, -1) + 'ies' : n.endsWith('sh') ? n + 'es' : n + 's';
};
