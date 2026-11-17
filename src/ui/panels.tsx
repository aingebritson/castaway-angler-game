import { useState } from 'preact/hooks';
import type { Item, Recipe } from '../content/schema';
import { castRange, fishValue, formatLength, formatWeight, rigPower } from '../sim/catch';
import { craftCheck, pickProvisions, recipeView } from '../sim/world';
import {
  RAFT_PARTS, addItem, cleanFish, craft, creelLimit, equip, has, launchRaft, rackAdd, rackCollect, rackReady, raftStatus, releaseKept, rigOf,
  setMethod, speciesCaught, sunAt, trapHaul, trapPeek, trapSet, travel,
} from '../state/actions';
import { STAGE_NAMES, nextGoal, stage } from '../state/goals';
import { type GameState, decodeSave, encodeSave } from '../state/state';
import { FishArt, GRADE_LABEL, ItemIcon, Sheet, Switch, Tab } from './bits';
import { useGame, useGameState, useTick } from './hooks';

const KIND_ORDER: Item['kind'][] = ['bait', 'hook', 'lure', 'rod', 'line', 'reel', 'float', 'sinker', 'trap', 'tool', 'utility', 'station', 'material', 'goods', 'raft', 'boat', 'chart'];

// ---------- bag ----------

export function BagPanel({ onClose, initial = 'items' }: { onClose(): void; initial?: 'items' | 'catch' | 'larder' }) {
  const { store } = useGame();
  const s = useGameState();
  const [tab, setTab] = useState(initial);
  const [sel, setSel] = useState<string | null>(null);
  const items = Object.keys(s.inventory)
    .filter((id) => s.inventory[id] > 0 && store.content.items[id])
    .sort((a, b) => KIND_ORDER.indexOf(store.content.items[a].kind) - KIND_ORDER.indexOf(store.content.items[b].kind));
  const selItem = sel ? store.content.items[sel] : null;
  const knife = has(s, 'stone-knife') || has(s, 'fillet-knife');
  return (
    <Sheet
      title="Bag" onClose={onClose} tall
      tabs={<>
        <Tab on={tab === 'items'} onClick={() => setTab('items')}>Things</Tab>
        <Tab on={tab === 'catch'} onClick={() => setTab('catch')}>Catch {s.creel.length}/{creelLimit(s, store.content)}</Tab>
        <Tab on={tab === 'larder'} onClick={() => setTab('larder')}>Larder {s.larder.length}</Tab>
      </>}
    >
      {tab === 'items' && (
        <>
          {!items.length && <p class="quote muted">Empty pockets. The beach is a good place to start filling them.</p>}
          <div class="grid">
            {items.map((id) => (
              <button key={id} class={`cell ${sel === id ? 'sel' : ''}`} onClick={() => setSel(sel === id ? null : id)}>
                <ItemIcon id={id} size={30} />
                {s.inventory[id] > 1 && <span class="q">{s.inventory[id]}</span>}
                {Object.values(s.rig).includes(id) && <span class="tagdot" />}
              </button>
            ))}
          </div>
          {selItem && (
            <div class="detail">
              <b>{selItem.name}</b> <span class="muted">×{s.inventory[selItem.id]}</span>
              <div>{selItem.desc}</div>
              {selItem.value != null && s.flags.launched && <div class="muted">Sells for about {selItem.value} coins.</div>}
            </div>
          )}
        </>
      )}
      {tab === 'catch' && (
        <>
          {!s.creel.length && <p class="quote muted">Nothing in the basket. Keep a fish and it lands here.</p>}
          {s.creel.map((f) => {
            const sp = store.content.species[f.speciesId];
            return (
              <div class="item" key={f.uid}>
                <div class="ic" style={{ width: '66px' }}><FishArt speciesId={sp.id} width={60} /></div>
                <div class="grow">
                  <div class="t">{sp.commonName}</div>
                  <div class="d">{formatLength(f.lengthCm)} · {formatWeight(f.weightG)} · <span class={`pill ${f.grade}`}>{GRADE_LABEL[f.grade]}</span></div>
                </div>
                {sp.kind === 'fish' && <button class="btn small alt" disabled={!knife} onClick={() => store.run(cleanFish, f.uid)}>Clean</button>}
                <button class="btn small alt" onClick={() => store.run(releaseKept, f.uid)}>Release</button>
              </div>
            );
          })}
          {s.creel.length > 0 && <p class="muted">Cleaning a fish gives cut bait and a bone. {knife ? '' : 'It needs a knife. '}Smoke fish on the rack at camp.</p>}
        </>
      )}
      {tab === 'larder' && (
        <>
          {!s.larder.length && <p class="quote muted">No smoked fish yet. A drying rack over the campfire will fix that.</p>}
          {s.larder.map((f) => {
            const sp = store.content.species[f.speciesId];
            return (
              <div class="item" key={f.uid}>
                <div class="ic" style={{ width: '66px' }}><FishArt speciesId={sp.id} width={60} /></div>
                <div class="grow">
                  <div class="t">Smoked {sp.commonName.toLowerCase()}</div>
                  <div class="d">{formatLength(f.lengthCm)}{s.flags.launched ? ` · worth ${fishValue(sp, f.grade, store.content.balance, true)}` : ''}</div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </Sheet>
  );
}

// ---------- rig ----------

const SLOTS: { slot: 'rod' | 'line' | 'reel' | 'hook' | 'bait' | 'lure' | 'float' | 'sinker'; label: string; optional?: boolean }[] = [
  { slot: 'rod', label: 'Rod' }, { slot: 'line', label: 'Line' }, { slot: 'reel', label: 'Reel', optional: true },
  { slot: 'hook', label: 'Hook' }, { slot: 'bait', label: 'Bait' }, { slot: 'float', label: 'Float', optional: true },
  { slot: 'sinker', label: 'Sinker', optional: true }, { slot: 'lure', label: 'Lure' },
];

export function RigPanel({ onClose }: { onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const rig = rigOf(s, store.content);
  const loc = store.content.locations[s.locationId];
  const owned = (kind: string) => Object.keys(s.inventory).filter((id) => s.inventory[id] > 0 && store.content.items[id]?.kind === kind);
  const hasLure = owned('lure').length > 0;
  if (!rig) {
    return (
      <Sheet title="Rig" onClose={onClose}>
        <p class="quote">Nothing to fish with yet. There was something long and thin in the wrack on the beach.</p>
      </Sheet>
    );
  }
  const range = castRange(rig);
  const zones = loc.zones.filter((z) => z.cast);
  const visible = SLOTS.filter((x) => {
    if (x.slot === 'lure') return s.rig.method === 'lure';
    if (['hook', 'bait', 'float', 'sinker'].includes(x.slot)) return s.rig.method === 'bait';
    if (x.slot === 'reel') return owned('reel').length > 0;
    return true;
  });
  return (
    <Sheet title="Rig" sub="What is on the end of the line decides what bites." onClose={onClose} tall>
      {hasLure && (
        <div class="row" style={{ marginBottom: '10px' }}>
          <button class={`btn small ${s.rig.method === 'bait' ? '' : 'alt'} grow`} onClick={() => store.run(setMethod, 'bait')}>Bait and float</button>
          <button class={`btn small ${s.rig.method === 'lure' ? '' : 'alt'} grow`} onClick={() => store.run(setMethod, 'lure')}>Lure</button>
        </div>
      )}
      {visible.map(({ slot, label, optional }) => {
        const options = owned(slot);
        const cur = s.rig[slot];
        return (
          <div class="slot" key={slot}>
            <div class="name">{label}</div>
            <div class="opts">
              {options.map((id) => (
                <button key={id} class={`opt ${cur === id ? 'on' : ''}`} onClick={() => store.run(equip, slot, id)}>
                  <ItemIcon id={id} size={18} /> {store.content.items[id].name}
                  {s.inventory[id] > 1 && <span class="n">×{s.inventory[id]}</span>}
                </button>
              ))}
              {optional && options.length > 0 && <button class={`opt ${!cur ? 'on' : ''}`} onClick={() => store.run(equip, slot, null)}>None</button>}
              {!options.length && <span class="muted">{slot === 'bait' ? 'No bait. Dig sand fleas on the beach.' : slot === 'hook' ? 'No hooks. Two shells make one at the workbench.' : 'Nothing yet.'}</span>}
            </div>
            {cur && store.content.items[cur] && <div class="muted" style={{ marginTop: '6px' }}>{store.content.items[cur].desc}</div>}
          </div>
        );
      })}
      <h3>What this rig can do</h3>
      <div class="stat"><span>Cast range</span><div class="bar"><i style={{ width: `${Math.min(100, range * 100)}%` }} /></div><span>{Math.round(range * 100)}</span></div>
      <div class="stat"><span>Strength</span><div class="bar"><i style={{ width: `${Math.min(100, (rigPower(rig) / 14) * 100)}%`, background: 'var(--coral)' }} /></div><span>{rigPower(rig).toFixed(1)}</span></div>
      {s.rig.method === 'bait' && rig.hook?.hook && (
        <p class="muted">This hook holds fish from about {rig.hook.hook.minCm} to {rig.hook.hook.maxCm} cm. Smaller ones strip the bait; bigger ones straighten it.</p>
      )}
      {zones.length > 0 && (
        <div class="need" style={{ marginTop: '8px' }}>
          {zones.map((z) => (
            <span key={z.id} class={`chip ${range >= z.minCastRange ? 'ok' : 'no'}`}>{range >= z.minCastRange ? '✓' : '✕'} {z.name}</span>
          ))}
        </div>
      )}
      <p class="muted">Strength is the weaker of rod and line. A fish that pulls harder than that cannot be stopped.</p>
    </Sheet>
  );
}

// ---------- crafting ----------

function RecipeRow({ r, s }: { r: Recipe; s: GameState }) {
  const { store } = useGame();
  const c = store.content;
  const out = c.items[r.output.item];
  const view = recipeView(r, s.everHeld, s.recipesKnown);
  if (view === 'hidden') return null;
  if (view === 'silhouette') {
    return (
      <div class="item dim">
        <div class="ic">❔</div>
        <div class="grow">
          <div class="t">Something I could make…</div>
          <div class="need">
            {[...r.inputs.map((i) => i.item), ...r.tools, ...(r.station ? [r.station] : [])].map((id) => (
              <span class="chip" key={id}>{s.everHeld[id] ? <><ItemIcon id={id} size={14} /> {c.items[id].name}</> : '?'}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }
  let ok: boolean;
  if (r.special === 'provisions') ok = !!pickProvisions(s.larder, c.balance.provisions.fish, c.balance.provisions.species);
  else ok = craftCheck(r, s.inventory).ok;
  const single = ['tool', 'station', 'utility', 'raft', 'rod', 'line'].includes(out.kind);
  const owned = single && has(s, out.id);
  return (
    <div class={`item ${owned ? 'dim' : ''}`}>
      <div class="ic"><ItemIcon id={out.id} size={26} /></div>
      <div class="grow">
        <div class="t">{out.name}{r.output.qty > 1 ? ` ×${r.output.qty}` : ''} {owned && <span class="pill large">Made</span>}</div>
        <div class="d">{r.blurb}</div>
        {!owned && (
          <div class="need">
            {r.special === 'provisions' && (
              <span class={`chip ${ok ? 'ok' : 'no'}`}>🍱 {s.larder.length}/{c.balance.provisions.fish} smoked fish, {new Set(s.larder.map((f) => f.speciesId)).size}/{c.balance.provisions.species} kinds</span>
            )}
            {r.inputs.map((i) => (
              <span key={i.item} class={`chip ${(s.inventory[i.item] ?? 0) >= i.qty ? 'ok' : 'no'}`}>
                <ItemIcon id={i.item} size={14} /> {s.inventory[i.item] ?? 0}/{i.qty} {c.items[i.item].name}
              </span>
            ))}
            {[...r.tools, ...(r.station ? [r.station] : [])].map((t) => (
              <span key={t} class={`chip tool ${has(s, t) ? 'ok' : 'no'}`}><ItemIcon id={t} size={14} /> {c.items[t].name}</span>
            ))}
          </div>
        )}
      </div>
      {!owned && <button class="btn small" disabled={!ok} onClick={() => store.run(craft, r.id)}>Make</button>}
    </div>
  );
}

const TIER_NAMES = ['', 'Toolmaker', 'Angler', 'Raft', 'Tackle bench'];

export function CraftPanel({ onClose }: { onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const all = Object.values(store.content.recipes);
  const hidden = all.filter((r) => recipeView(r, s.everHeld, s.recipesKnown) === 'hidden' && r.known !== 'taught').length;
  return (
    <Sheet title="Workbench" sub={`${STAGE_NAMES[stage(s)]} · pages found: ${s.pagesFound}/${store.content.pages.length}`} onClose={onClose} tall>
      {[1, 2, 3, 4].map((tier) => {
        const rows = all.filter((r) => r.tier === tier && recipeView(r, s.everHeld, s.recipesKnown) !== 'hidden');
        if (!rows.length) return null;
        return (
          <div key={tier}>
            <h3>{TIER_NAMES[tier]}</h3>
            {rows.map((r) => <RecipeRow key={r.id} r={r} s={s} />)}
          </div>
        );
      })}
      {hidden > 0 && <p class="quote muted">…and {hidden} more thing{hidden > 1 ? 's' : ''} I have not thought of yet. New materials give new ideas.</p>}
    </Sheet>
  );
}

// ---------- fire and rack ----------

export function FirePanel({ onClose }: { onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  useTick(5000);
  const ctx = store.ctx();
  const c = store.content;
  const smokeMs = c.balance.camp.smokeMin * 60_000;
  if (!has(s, 'campfire')) {
    return (
      <Sheet title="Fire pit" onClose={onClose}>
        <p class="quote">A ring of blackened stones, long cold. Driftwood, more stones and something to strike them with would bring it back.</p>
        {c.recipes.campfire && <RecipeRow r={c.recipes.campfire} s={s} />}
      </Sheet>
    );
  }
  const fishOnly = s.creel.filter((f) => c.species[f.speciesId].kind !== 'mollusc');
  return (
    <Sheet title="Fire and rack" sub="Smoked fish keeps for a voyage." onClose={onClose} tall>
      {!has(s, 'drying-rack') ? (
        <>
          <p class="quote">The fire is lit and will not go out now. Rails over the smoke would cure fish.</p>
          {c.recipes['drying-rack'] && <RecipeRow r={c.recipes['drying-rack']} s={s} />}
          {c.recipes.torch && <RecipeRow r={c.recipes.torch} s={s} />}
        </>
      ) : (
        <>
          <h3>On the rack <small>{s.rack.length}/{c.balance.camp.rackSlots}</small></h3>
          {!s.rack.length && <p class="muted">Empty. Hang a fish from the basket below.</p>}
          {s.rack.map((slot) => {
            const sp = c.species[slot.fish.speciesId];
            const k = Math.min(1, (ctx.now - slot.startedAt) / smokeMs);
            const left = Math.ceil((smokeMs - (ctx.now - slot.startedAt)) / 60_000);
            return (
              <div class="item" key={slot.fish.uid}>
                <div class="ic" style={{ width: '66px' }}><FishArt speciesId={sp.id} width={60} /></div>
                <div class="grow">
                  <div class="t">{sp.commonName}</div>
                  <div class="bar" style={{ margin: '5px 0 3px' }}><i style={{ width: `${k * 100}%`, background: 'var(--gold)' }} /></div>
                  <div class="d">{k >= 1 ? 'Smoked through.' : `About ${left} min to go.`}</div>
                </div>
              </div>
            );
          })}
          {s.rack.some((r) => rackReady(r, ctx)) && <button class="btn gold" style={{ width: '100%' }} onClick={() => store.run(rackCollect)}>Take down the smoked fish</button>}
          <h3>Catch basket</h3>
          {!fishOnly.length && <p class="muted">Nothing to smoke. Keep some fish.</p>}
          {fishOnly.map((f) => {
            const sp = c.species[f.speciesId];
            return (
              <div class="item" key={f.uid}>
                <div class="ic" style={{ width: '66px' }}><FishArt speciesId={sp.id} width={60} /></div>
                <div class="grow">
                  <div class="t">{sp.commonName}</div>
                  <div class="d">{formatLength(f.lengthCm)} · {formatWeight(f.weightG)}</div>
                </div>
                <button class="btn small" disabled={s.rack.length >= c.balance.camp.rackSlots} onClick={() => store.run(rackAdd, f.uid)}>Smoke</button>
              </div>
            );
          })}
          <p class="muted">Larder: {s.larder.length} smoked fish of {new Set(s.larder.map((f) => f.speciesId)).size} kinds. Provisions for the raft need {c.balance.provisions.fish} of at least {c.balance.provisions.species} kinds.</p>
        </>
      )}
    </Sheet>
  );
}

// ---------- raft ----------

export function RaftPanel({ onClose }: { onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  const st = raftStatus(s);
  const caught = speciesCaught(s, c);
  const anyKnown = RAFT_PARTS.some((id) => recipeView(c.recipes[id], s.everHeld, s.recipesKnown) !== 'hidden');
  return (
    <Sheet title="The raft" sub="A way off the island." onClose={onClose} tall>
      {!anyKnown && !st.bearing && (
        <p class="quote">A flat place above the tide line where someone once dragged logs together. Whoever it was is long gone. I do not yet know how to build a thing that floats, or which way I would point it.</p>
      )}
      {RAFT_PARTS.map((id) => {
        const r = c.recipes[id];
        if (recipeView(r, s.everHeld, s.recipesKnown) === 'hidden') {
          return (
            <div class="item dim" key={id}>
              <div class="ic">❔</div>
              <div class="grow"><div class="t">A part I have not worked out</div><div class="d">The earlier castaway built one. Their pages may say how.</div></div>
            </div>
          );
        }
        return <RecipeRow key={id} r={r} s={s} />;
      })}
      <div class={`item ${st.bearing ? 'dim' : ''}`}>
        <div class="ic">🧭</div>
        <div class="grow">
          <div class="t">A bearing {st.bearing && <span class="pill large">Found</span>}</div>
          <div class="d">
            {st.bearing
              ? 'West-south-west, two days. A port.'
              : caught < c.balance.bearing.speciesNeeded
                ? `No use leaving before I know these waters. ${caught} of ${c.balance.bearing.speciesNeeded} kinds caught.`
                : 'One of the bottles washing in must carry it. Keep fishing; check the wrack line each day.'}
          </div>
        </div>
      </div>
      <button class="btn warm" style={{ width: '100%', marginTop: '8px' }} disabled={!st.ready} onClick={() => { onClose(); store.run(launchRaft); }}>
        {st.ready ? 'Launch the raft' : 'Not ready to launch'}
      </button>
    </Sheet>
  );
}

// ---------- trap ----------

export function TrapPanel({ onClose }: { onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  useTick(10_000);
  const c = store.content;
  const peek = trapPeek(s, store.ctx());
  const traps = Object.keys(s.inventory).filter((id) => s.inventory[id] > 0 && c.items[id]?.trap);
  const baits = Object.keys(s.inventory).filter((id) => s.inventory[id] > 0 && c.items[id]?.kind === 'bait');
  const [bait, setBait] = useState<string | null>(baits.includes('cut-bait') ? 'cut-bait' : baits[0] ?? null);
  if (peek) {
    const h = Math.floor(peek.soakH);
    const m = Math.round((peek.soakH - h) * 60);
    return (
      <Sheet title="Trap" onClose={onClose}>
        <p class="quote">
          The {c.items[peek.trap.itemId].name.toLowerCase()} has been down {h ? `${h} h ` : ''}{m} min
          {peek.trap.baitId ? `, baited with ${c.items[peek.trap.baitId].name.toLowerCase()}` : ', unbaited'}.
        </p>
        <p class="muted">{peek.ready ? `It fills slowly and stops at ${peek.def.capacity}. Past ${peek.def.maxSoakH} hours there is nothing more to gain.` : `It wants at least ${peek.def.minSoakH} hour${peek.def.minSoakH > 1 ? 's' : ''} before it holds anything.`}</p>
        <button class="btn" style={{ width: '100%' }} onClick={() => { onClose(); store.run(trapHaul); }}>{peek.ready ? 'Haul it up' : 'Pull it early'}</button>
      </Sheet>
    );
  }
  return (
    <Sheet title="Trap" sub="Bait it, sink it, come back later." onClose={onClose}>
      {!traps.length ? (
        <p class="quote">A good place to sink a trap, if I had one.</p>
      ) : (
        <>
          <div class="slot">
            <div class="name">Bait</div>
            <div class="opts">
              {baits.map((id) => (
                <button key={id} class={`opt ${bait === id ? 'on' : ''}`} onClick={() => setBait(id)}><ItemIcon id={id} size={18} /> {c.items[id].name} <span class="n">×{s.inventory[id]}</span></button>
              ))}
              <button class={`opt ${!bait ? 'on' : ''}`} onClick={() => setBait(null)}>None</button>
            </div>
          </div>
          <p class="muted">What walks in depends on the bait and on the hours it soaks through. Night is busiest.</p>
          <button class="btn" style={{ width: '100%' }} onClick={() => { onClose(); store.run(trapSet, traps[0], bait); }}>Set the {c.items[traps[0]].name.toLowerCase()}</button>
        </>
      )}
    </Sheet>
  );
}

// ---------- map ----------

export function MapPanel({ onClose }: { onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  const here = c.locations[s.locationId];
  const regions = Object.values(c.regions).filter((r) => regionOpen(s, r.id, c)).sort((a, b) => a.order - b.order);
  const [regionId, setRegion] = useState(here.regionId);
  const region = c.regions[regionId];
  const locs = Object.values(c.locations).filter((l) => l.regionId === regionId);
  const goal = nextGoal(s, c);
  const go = (id: string) => {
    store.run(travel, id);
    onClose();
  };
  return (
    <Sheet
      title={region.name} sub={region.blurb} onClose={onClose} tall
      tabs={regions.length > 1 ? regions.map((r) => <Tab key={r.id} on={r.id === regionId} onClick={() => setRegion(r.id)}>{r.name}</Tab>) : undefined}
    >
      <div class="map">
        <MapArt regionId={regionId} />
        {locs.map((l) => {
          const locked = !locationOpen(s, l.id, c);
          return (
            <button key={l.id} class={`pin-btn ${l.id === s.locationId ? 'here' : ''} ${goal?.where === l.id ? 'goal' : ''} ${locked ? 'locked' : ''}`}
              style={{ left: `${l.map.x * 100}%`, top: `${l.map.y * 100}%` }} onClick={() => (locked ? undefined : go(l.id))}>
              <span class="d">{locked ? '🔒' : PLACE_GLYPH[l.kind] ?? '📍'}</span>
              <span class="l">{l.name}</span>
            </button>
          );
        })}
      </div>
      <p class="quote">{here.regionId === regionId ? `${here.name}. ${here.blurb}` : region.blurb}</p>
      {here.regionId !== regionId && <p class="muted">Tap a place to sail there.</p>}
    </Sheet>
  );
}

const PLACE_GLYPH: Record<string, string> = { port: '⚓', spot: '🎣', camp: '⛺', gather: '🌴' };

export function regionOpen(s: GameState, regionId: string, c: import('../content/assemble').Content): boolean {
  const r = c.regions[regionId];
  return r.unlock.every((u) => (u.type === 'flag' ? !!s.flags[u.flag] : u.type === 'boat' ? boatTier(s, c) >= u.tier : has(s, u.chart)));
}

export function locationOpen(s: GameState, locationId: string, c: import('../content/assemble').Content): boolean {
  const l = c.locations[locationId];
  return l.unlock.every((u) => (u.type === 'flag' ? !!s.flags[u.flag] : u.type === 'boat' ? boatTier(s, c) >= u.tier : has(s, u.chart)));
}

export function boatTier(s: GameState, c: import('../content/assemble').Content): number {
  let t = -1;
  for (const id of Object.keys(s.inventory)) if (s.inventory[id] > 0 && c.items[id]?.boat) t = Math.max(t, c.items[id].boat!.tier);
  return t;
}

function MapArt({ regionId }: { regionId: string }) {
  if (regionId === 'castaway-island') {
    return (
      <svg viewBox="0 0 100 105" preserveAspectRatio="none">
        <rect width="100" height="105" fill="#2f8fa8" />
        <path d="M8 40 C4 18 30 6 52 10 C80 8 98 28 94 52 C98 78 76 98 50 96 C22 100 2 74 8 40Z" fill="none" stroke="#bfeee4" stroke-width="1.2" stroke-dasharray="2 2.5" opacity=".8" />
        <path d="M16 44 C12 26 30 16 50 20 C72 16 88 32 84 54 C88 74 70 88 50 86 C28 90 12 70 16 44Z" fill="#7fd8cf" />
        <path d="M26 48 C24 36 36 28 50 30 C66 28 78 38 74 54 C78 68 64 78 50 76 C36 80 24 64 26 48Z" fill="#f0deb0" />
        <path d="M32 50 C31 41 40 36 50 37 C61 36 69 43 66 54 C69 63 59 69 50 68 C40 70 31 60 32 50Z" fill="#5f9d55" />
        <path d="M38 50 C38 45 44 42 50 43 C56 42 61 46 59 53 C61 58 55 62 50 61 C44 62 38 56 38 50Z" fill="#4c8748" />
        <path d="M10 26 C16 20 26 22 30 30 C24 34 14 34 10 26Z" fill="#bff0e2" opacity=".9" />
        <g fill="#3b3a40"><path d="M84 52 l6 -2 3 4 -4 5 -6 -1z" /><path d="M88 60 l4 1 1 4 -4 1z" /></g>
        <g stroke="#3a2f2a" stroke-width=".8" fill="none"><path d="M70 92 l8 -3 M73 91 v-6 M77 90 v-5" /></g>
        <text x="50" y="102" text-anchor="middle" font-size="4" fill="#dff" font-family="Georgia, serif" font-style="italic">Position unknown</text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 105" preserveAspectRatio="none">
      <rect width="100" height="105" fill="#2a84a2" />
      <path d="M0 0 H38 C44 14 36 26 40 40 C44 58 30 70 34 86 C36 96 30 102 28 105 H0Z" fill="#e9d9aa" />
      <path d="M0 0 H30 C36 14 28 26 32 40 C36 58 22 70 26 86 C28 96 22 102 20 105 H0Z" fill="#5f9d55" />
      <path d="M52 8 C56 30 50 50 56 70 C60 84 54 96 56 105" fill="none" stroke="#bfeee4" stroke-width="1.4" stroke-dasharray="2 2.5" />
      <path d="M40 58 C46 54 50 60 48 66 C44 70 38 66 40 58Z" fill="#3f7d48" />
      <path d="M36 76 C42 72 48 78 44 84 C40 86 34 82 36 76Z" fill="#3f7d48" />
      <text x="78" y="100" text-anchor="middle" font-size="4" fill="#dff" font-family="Georgia, serif" font-style="italic">Open sea</text>
    </svg>
  );
}

// ---------- settings and debug ----------

export function SettingsPanel({ onClose, onDebug }: { onClose(): void; onDebug(): void }) {
  const game = useGame();
  const { store, audio } = game;
  const s = useGameState();
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const set = (k: 'sound' | 'haptics', v: boolean) => {
    store.act((d) => {
      d.settings[k] = v;
    });
    if (k === 'sound') audio.setEnabled(v);
  };
  const exportCode = async () => {
    const text = encodeSave(store.state);
    setCode(text);
    try {
      await navigator.clipboard.writeText(text);
      setMsg('Save code copied. Keep it somewhere safe.');
    } catch {
      setMsg('Select the code below and copy it.');
    }
  };
  const importCode = () => {
    try {
      const next = decodeSave(code, Date.now());
      store.replace(next);
      game.flushSave();
      setMsg('Save loaded.');
      setTimeout(onClose, 600);
    } catch (e) {
      setMsg((e as Error).message || 'That code did not work.');
    }
  };
  return (
    <Sheet title="Settings" onClose={onClose} tall>
      <Switch label="Sound" on={s.settings.sound} onChange={(v) => set('sound', v)} />
      <Switch label="Vibration (where the phone allows)" on={s.settings.haptics} onChange={(v) => set('haptics', v)} />
      <hr />
      <h3>Save</h3>
      <p class="muted">The game saves to this device after every change. A save code moves it to another phone, or keeps it safe.</p>
      <div class="row">
        <button class="btn small grow" onClick={exportCode}>Copy save code</button>
        <button class="btn small alt grow" disabled={!code.trim()} onClick={importCode}>Load from code</button>
      </div>
      <textarea class="code" style={{ marginTop: '8px' }} placeholder="Paste a save code here to load it" value={code} onInput={(e) => setCode((e.target as HTMLTextAreaElement).value)} />
      {msg && <p class="muted">{msg}</p>}
      <hr />
      <div class="row">
        <button class="btn small alt grow" onClick={onDebug}>Debug panel</button>
        {!confirmReset ? (
          <button class="btn small alt grow" onClick={() => setConfirmReset(true)}>Start over…</button>
        ) : (
          <button class="btn small warm grow" onClick={() => { game.resetGame(); onClose(); }}>Erase everything</button>
        )}
      </div>
      <p class="muted" style={{ marginTop: '14px' }}>
        Castaway Angler v{__APP_VERSION__} · {STAGE_NAMES[stage(s)]} · {s.stats.casts} casts, {s.stats.catches} catches, {s.stats.lost} that got away.
        Species facts draw on FishBase and SeaLifeBase (CC BY-NC) and the IUCN Red List; see the field guide.
      </p>
    </Sheet>
  );
}

const HOUR = 3_600_000;

export function DebugPanel({ onClose }: { onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  useTick(1000);
  const c = store.content;
  const sun = sunAt(store.ctx(), s.locationId);
  const shift = (ms: number) => store.act((d) => { d.debug.timeOffsetMs += ms; });
  const toPhase = (phase: string) => {
    // step forward a few minutes at a time until the location is in that phase
    store.act((d, ctx) => {
      for (let i = 0; i < 24 * 12; i++) {
        if (sunAt({ ...ctx, now: ctx.now + i * 5 * 60_000 }, d.locationId).phase === phase) {
          d.debug.timeOffsetMs += i * 5 * 60_000;
          return;
        }
      }
    });
  };
  const give = (ids: string[], qty: number) => store.act((d) => { for (const id of ids) if (c.items[id]) addItem(d, id, qty); });
  const kinds = (ks: string[]) => Object.values(c.items).filter((i) => ks.includes(i.kind)).map((i) => i.id);
  return (
    <Sheet title="Debug" sub="Overrides for testing. None of this is saved as cheating; it is just saved." onClose={onClose} tall>
      <h3>Clock <small>{sun.local.dayKey} {String(sun.local.hour).padStart(2, '0')}:{String(sun.local.minute).padStart(2, '0')} · {sun.phase}</small></h3>
      <div class="row wrap">
        {['dawn', 'day', 'dusk', 'night'].map((p) => <button key={p} class="btn small alt" onClick={() => toPhase(p)}>→ {p}</button>)}
      </div>
      <div class="row wrap" style={{ marginTop: '8px' }}>
        <button class="btn small alt" onClick={() => shift(10 * 60_000)}>+10 min</button>
        <button class="btn small alt" onClick={() => shift(HOUR)}>+1 h</button>
        <button class="btn small alt" onClick={() => shift(8 * HOUR)}>+8 h</button>
        <button class="btn small alt" onClick={() => shift(24 * HOUR)}>+1 day</button>
        <button class="btn small alt" onClick={() => shift(30 * 24 * HOUR)}>+30 days</button>
        <button class="btn small warm" onClick={() => store.act((d) => { d.debug.timeOffsetMs = 0; })}>Real time</button>
      </div>
      <p class="muted">Offset: {(s.debug.timeOffsetMs / HOUR).toFixed(1)} h. Sunrise {Math.floor(sun.sunriseMin / 60)}:{String(sun.sunriseMin % 60).padStart(2, '0')}, sunset {Math.floor(sun.sunsetMin / 60)}:{String(sun.sunsetMin % 60).padStart(2, '0')}.</p>
      <h3>Inventory</h3>
      <div class="row wrap">
        <button class="btn small alt" onClick={() => give(kinds(['material']), 12)}>Materials ×12</button>
        <button class="btn small alt" onClick={() => give(kinds(['bait']), 15)}>Bait ×15</button>
        <button class="btn small alt" onClick={() => give(kinds(['hook', 'lure']), 5)}>Hooks and lures ×5</button>
        <button class="btn small alt" onClick={() => give(kinds(['tool', 'station', 'utility', 'rod', 'line', 'float', 'sinker', 'trap', 'reel']), 1)}>All gear</button>
        <button class="btn small alt" onClick={() => store.act((d) => { d.coins += 500; })}>+500 coins</button>
        <button class="btn small alt" onClick={() => store.act((d) => { d.flags.hasRod = true; d.flags.bearing = true; })}>Bearing</button>
        <button class="btn small alt" onClick={() => give(RAFT_PARTS, 1)}>Raft parts</button>
      </div>
      <h3>Go to</h3>
      <div class="row wrap">
        {Object.values(c.locations).map((l) => <button key={l.id} class={`btn small ${l.id === s.locationId ? '' : 'alt'}`} onClick={() => store.run(travel, l.id)}>{l.name}</button>)}
      </div>
      <h3>Random seed <small>{s.seed} · stream {s.rng}</small></h3>
      <div class="row wrap">
        <button class="btn small alt" onClick={() => store.act((d) => { d.rng = d.seed; })}>Rewind stream to seed</button>
        <button class="btn small alt" onClick={() => store.act((d) => { d.seed = (Math.random() * 2 ** 32) >>> 0; d.rng = d.seed; })}>New seed</button>
        <button class="btn small alt" onClick={() => store.act((d) => { d.nodes = {}; })}>Regrow everything</button>
        <button class="btn small alt" onClick={() => store.act((d) => { d.stats.castsSinceBottle = 99; })}>Next bite: bottle</button>
      </div>
    </Sheet>
  );
}

declare const __APP_VERSION__: string;
