/**
 * The castaway's next thought. Derived from state every time, never stored, so
 * the player can never be left without a way forward.
 */
import type { Content } from '../content/assemble';
import { has, raftStatus, speciesCaught } from './actions';
import type { GameState } from './state';

export interface Goal {
  text: string;
  /** Location the goal points at, for the map. */
  where?: string;
}

export function stage(s: GameState): number {
  if (s.flags.launched) return has(s, 'skiff') || has(s, 'sloop') ? (has(s, 'sloop') ? 5 : 4) : 3;
  if (has(s, 'bamboo-rod') && has(s, 'braided-line')) return 2;
  if (has(s, 'stone-knife')) return 1;
  return 0;
}

export const STAGE_NAMES = ['Washed up', 'Toolmaker', 'Angler', 'Raft', 'Deckhand', 'Skipper', 'Voyager', 'Master'];

export function nextGoal(s: GameState, content: Content): Goal | null {
  if (s.flags.launched) return null;
  const held = (id: string) => !!s.everHeld[id];
  const caught = speciesCaught(s, content);
  if (!s.flags.hasRod) return { text: 'Something long and thin is tangled in the wrack on the beach.', where: 'beach' };
  if (!held('sand-flea') && !held('small-crab') && !held('cut-bait')) return { text: 'Bait first. The wet sand at the water’s edge is alive with sand fleas.', where: 'beach' };
  if (s.stats.catches === 0) return { text: 'The rocks at the point look fishy. Drag back and let go to cast.', where: 'rocky-point' };
  if (!held('hammerstone')) return { text: 'Loose stones at Rocky Point. Two struck together would make a tool.', where: 'rocky-point' };
  if (!held('stone-knife')) return { text: 'A hammerstone, two more stones and a vine from the grove: a knife.', where: 'camp' };
  if (!held('cordage')) return { text: 'Coconut husk twists into cord. The grove has coconuts and fronds.', where: 'grove' };
  if (!held('bone-hook')) return { text: 'Keep a fish and clean it at camp. Its backbone will carve into a bigger hook.', where: 'camp' };
  if (!held('campfire')) return { text: 'Driftwood and a ring of stones would make a fire at camp.', where: 'camp' };
  if (!held('bamboo-rod')) return { text: 'Bamboo grows in the wet ground behind the grove. A long cane would cast to the reef edge.', where: 'grove' };
  if (!held('braided-line')) return { text: 'This old line parts on anything strong. Braid cordage into a new one.', where: 'camp' };
  if (!held('feather-lure')) return { text: 'Some fish follow the bait and turn away. Feathers, shell and a bone hook make a lure.', where: 'camp' };
  if (!held('torch')) return { text: 'The night water is another country. A torch would let me fish it.', where: 'camp' };
  if (!held('woven-trap')) return { text: 'Fronds, vines and bamboo weave into a trap for whatever walks the rocks at night.', where: 'camp' };
  if (!held('drying-rack')) return { text: 'A drying rack over the fire would smoke fish for a voyage.', where: 'camp' };
  const raft = raftStatus(s);
  if (!raft.bearing && caught < content.balance.bearing.speciesNeeded) {
    return { text: `I should know these waters before I trust them. ${caught} of ${content.balance.bearing.speciesNeeded} kinds caught.` };
  }
  if (!raft.bearing) return { text: 'Bottles keep washing in with pages from the last castaway. One of them must say which way to sail.', where: 'beach' };
  const missing = raft.parts.filter((p) => !p.done);
  if (missing.length) return { text: `The raft still needs: ${missing.map((p) => content.items[p.id].name.toLowerCase()).join(', ')}.`, where: 'camp' };
  return { text: 'The raft is ready. The wind is fair.', where: 'camp' };
}
