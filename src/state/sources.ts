/** Where an item can be found: the gather spot that yields it, for hints and goals. */
import type { Content } from '../content/assemble';
import { cond } from './actions';
import type { GameState } from './state';

export interface Source {
  locationId: string;
  hotspotId: string;
}

export function sourceOf(content: Content, itemId: string, s?: GameState): Source | null {
  let fallback: Source | null = null;
  for (const loc of Object.values(content.locations)) {
    for (const h of loc.scene.hotspots) {
      const n = h.node;
      if (!n) continue;
      const gives = n.item === itemId || n.table?.some((t) => t.item === itemId)
        || (!!n.handZone && Object.values(content.species).some((sp) => sp.gathersAs?.item === itemId
          && (content.occByLocation[loc.id] ?? []).some((o) => o.speciesId === sp.id && o.zones.includes(n.handZone!))));
      if (!gives) continue;
      const src = { locationId: loc.id, hotspotId: h.id };
      // Prefer a spot the player can actually see right now.
      if (!s || (cond(s, h.showIf) && !(h.hideIf && cond(s, h.hideIf)))) return src;
      fallback ??= src;
    }
  }
  if (itemId === 'fish-bone' || itemId === 'cut-bait') return { locationId: 'camp', hotspotId: 'basket' };
  return fallback;
}
