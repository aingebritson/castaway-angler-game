import { useState } from 'preact/hooks';
import type { Species } from '../content/schema';
import { formatLength, formatWeight } from '../sim/catch';
import { MONTH_NAMES, MOON_NAMES, displayTz, formatClock, formatDate, localTime, moonIndex } from '../sim/time';
import { setNote, togglePin } from '../state/actions';
import type { GameState, GuideEntry, JournalKind } from '../state/state';
import { BAIT_LABEL, FishArt, Sheet, Tab } from './bits';
import { useGame, useGameState } from './hooks';

const PHASES = ['dawn', 'day', 'dusk', 'night'];

/** Species that occur at a location, in a stable order, so blank slots keep their numbers. */
function speciesAt(content: import('../content/assemble').Content, locationId: string): Species[] {
  const seen = new Set<string>();
  const out: Species[] = [];
  for (const o of content.occByLocation[locationId] ?? []) {
    if (seen.has(o.speciesId)) continue;
    seen.add(o.speciesId);
    out.push(content.species[o.speciesId]);
  }
  return out.sort((a, b) => a.family.localeCompare(b.family) || a.id.localeCompare(b.id));
}

export function GuidePanel({ onClose }: { onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  const [open, setOpen] = useState<string | null>(null);
  const here = c.locations[s.locationId];
  const visitedRegions = [...new Set(Object.keys(s.visited).map((id) => c.locations[id]?.regionId).filter(Boolean))];
  const [regionId, setRegion] = useState(here.regionId);
  const locs = Object.values(c.locations).filter((l) => l.regionId === regionId && (c.occByLocation[l.id]?.length ?? 0) > 0);
  const regionSpecies = new Set(locs.flatMap((l) => speciesAt(c, l.id).map((sp) => sp.id)));
  const got = [...regionSpecies].filter((id) => s.guide[id]?.state === 'caught').length;

  if (open) return <EntryView speciesId={open} onBack={() => setOpen(null)} onClose={onClose} />;
  return (
    <Sheet
      title="Field guide" sub={`${c.regions[regionId].name}: ${got} of ${regionSpecies.size} recorded`} onClose={onClose} tall
      tabs={visitedRegions.length > 1 ? visitedRegions.map((r) => <Tab key={r} on={r === regionId} onClick={() => setRegion(r)}>{c.regions[r].name}</Tab>) : undefined}
    >
      {locs.map((l) => {
        const list = speciesAt(c, l.id);
        const n = list.filter((sp) => s.guide[sp.id]?.state === 'caught').length;
        const known = !!s.visited[l.id];
        return (
          <div key={l.id}>
            <h3>{known ? l.name : 'Somewhere not yet visited'} <small>{n} / {list.length}</small></h3>
            <div class="guide-grid">
              {list.map((sp, i) => {
                const e = s.guide[sp.id];
                if (!e) return <div key={sp.id} class="gcell unknown"><span class="no">{i + 1}</span>?</div>;
                return (
                  <button key={sp.id} class={`gcell ${e.state}`} onClick={() => setOpen(sp.id)}>
                    <span class="no">{i + 1}</span>
                    {e.state === 'caught' && <FishArt speciesId={sp.id} width={84} />}
                    {e.state === 'sighted' && <FishArt speciesId={sp.id} width={84} ink />}
                    {e.state === 'rumoured' && <span style={{ fontSize: '26px' }}>💬</span>}
                    <span class="nm">{e.state === 'caught' ? sp.commonName : e.state === 'sighted' ? 'Seen, not caught' : 'Rumoured'}</span>
                    {e.rumours.length > 0 && e.state !== 'rumoured' && <span class="badge">💬</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <p class="muted" style={{ marginTop: '14px' }}>Blank slots are animals you have not met. Catch one, spot its shape in the water, or hear about it, and its page begins to fill.</p>
    </Sheet>
  );
}

function cellClass(e: GuideEntry, key: string): string {
  return e.cells[key] === 'c' ? 'oc c' : e.cells[key] === 'r' ? 'oc r' : 'oc';
}

function EntryView({ speciesId, onBack, onClose }: { speciesId: string; onBack(): void; onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  const sp = c.species[speciesId];
  const e = s.guide[speciesId];
  const caught = e.state === 'caught';
  const zoneKeys = [...new Set([...Object.keys(s.zonesSeen), ...Object.keys(e.cells).filter((k) => k.startsWith('zone:')).map((k) => k.slice(5))])]
    .filter((k) => c.locations[k.split('/')[0]]?.regionId && c.locations[k.split('/')[0]].zones.some((z) => z.id === k.split('/')[1]));
  const heldTypes = new Set<string>();
  for (const id of Object.keys(s.everHeld)) {
    const it = c.items[id];
    if (it?.bait) heldTypes.add(it.bait.tags[0]);
    if (it?.lure) heldTypes.add(it.lure.type);
    if (it?.trap) heldTypes.add(it.trap.method);
  }
  heldTypes.add('hand');
  for (const k of Object.keys(e.cells)) if (k.startsWith('bait:')) heldTypes.add(k.slice(5));
  const zoneName = (k: string) => {
    const [l, z] = k.split('/');
    return `${c.locations[l].zones.find((x) => x.id === z)?.name} · ${c.locations[l].name}`;
  };
  const tz = displayTz(c.locations[e.pb?.locationId ?? s.locationId], store.ctx().deviceTz);
  const isSighting = sp.kind === 'sighting';
  return (
    <Sheet title={caught ? sp.commonName : e.state === 'sighted' ? 'Unknown animal' : 'A rumour'} sub={caught ? sp.scientificName : undefined} onClose={onClose} tall
      tabs={<Tab on={false} onClick={onBack}>‹ All entries</Tab>}>
      <div class={`entry-art ${caught ? '' : 'ink'}`}>
        {e.state === 'rumoured' ? <span style={{ fontSize: '60px', padding: '20px' }}>💬</span> : <FishArt speciesId={sp.id} width={270} ink={!caught} />}
      </div>
      {caught ? (
        <>
          <div class="row wrap">
            <span class="pill">{sp.family}</span>
            <span class={`pill ${['VU', 'EN', 'CR', 'NT'].includes(sp.conservation.iucn) ? 'warn' : ''}`}>IUCN {sp.conservation.iucn}</span>
            {sp.conservation.releaseOnly && !isSighting && <span class="pill warn">Release only</span>}
          </div>
          <p class="quote" style={{ fontSize: '16px' }}>{sp.description}</p>
          <ul class="facts">{sp.facts.map((f, i) => <li key={i}>{f}</li>)}</ul>
          {sp.conservation.note && <p class="muted">{sp.conservation.note}</p>}
          <dl class="kv">
            <dt>{isSighting ? 'Seen' : 'Caught'}</dt><dd>{e.count}{e.released ? ` (${e.released} released)` : ''}</dd>
            {e.firstAt && <><dt>First</dt><dd>{formatDate(e.firstAt, tz)}</dd></>}
            {e.pb && sp.lengthWeight && <><dt>Personal best</dt><dd>{formatLength(e.pb.lengthCm)}, {formatWeight(e.pb.weightG)}<br /><span class="muted">{c.locations[e.pb.locationId]?.name}, {formatDate(e.pb.at, tz)} · {e.pb.rig}</span></dd></>}
            <dt>Grows to</dt><dd>{formatLength(sp.lengthCm.max)} ({sp.lengthCm.measure}){sp.recordNote ? <><br /><span class="muted">{sp.recordNote}</span></> : null}</dd>
          </dl>
        </>
      ) : e.state === 'sighted' ? (
        <p class="quote" style={{ fontSize: '16px' }}>A shape in the water, sketched from memory. No name for it until one is in hand.</p>
      ) : (
        <p class="quote" style={{ fontSize: '16px' }}>Something I have only been told about.</p>
      )}

      {e.rumours.length > 0 && (
        <>
          <h3>What I have been told</h3>
          {e.rumours.map((id) => (
            <p key={id} class="quote" style={{ borderLeft: '3px solid var(--gold)', paddingLeft: '10px' }}>
              “{c.rumours[id].text}”<br /><span class="muted" style={{ fontStyle: 'normal' }}>{c.rumours[id].source}</span>
            </p>
          ))}
        </>
      )}

      {!isSighting && (
        <>
          <h3>Observed <small>filled = caught · dashed = told</small></h3>
          <div class="strip">
            <div class="lab">Time of day</div>
            <div class="cells">{PHASES.map((p) => <span key={p} class={cellClass(e, `phase:${p}`)}>{p}</span>)}</div>
          </div>
          <div class="strip">
            <div class="lab">Month</div>
            <div class="cells">{MONTH_NAMES.map((m, i) => <span key={m} class={cellClass(e, `month:${i}`)} style={{ minWidth: 0 }}>{m}</span>)}</div>
          </div>
          <div class="strip">
            <div class="lab">Water</div>
            <div class="cells">{zoneKeys.length ? zoneKeys.map((k) => <span key={k} class={cellClass(e, `zone:${k}`)}>{zoneName(k)}</span>) : <span class="muted">No water fished yet.</span>}</div>
          </div>
          <div class="strip">
            <div class="lab">Taken on</div>
            <div class="cells">{[...heldTypes].map((t) => <span key={t} class={cellClass(e, `bait:${t}`)}>{BAIT_LABEL[t] ?? t}</span>)}</div>
          </div>
          <p class="muted">The guide only records what you have seen or been told. Empty cells are not a “no”; they are a “not yet”.</p>
        </>
      )}
      {caught && (
        <p class="muted" style={{ fontSize: '11px' }}>
          Sources: {sp.sources.map((x, i) => <span key={i}>{i ? '; ' : ''}{x.title}</span>)}.
        </p>
      )}
    </Sheet>
  );
}

const KIND_LABEL: Record<JournalKind, string> = {
  story: 'Journal', catch: 'First catch', pb: 'Personal best', away: 'One that got away', rumour: 'Rumour', page: 'Found page', craft: 'Made',
  trap: 'Trap', quest: 'Errand', sighting: 'Sighting', travel: 'New place', clue: 'Legend',
};

const FILTERS: { id: string; label: string; test(k: JournalKind, pinned: boolean): boolean }[] = [
  { id: 'all', label: 'Everything', test: () => true },
  { id: 'pinned', label: '📌 Pinned', test: (_k, p) => p },
  { id: 'catch', label: 'Catches', test: (k) => k === 'catch' || k === 'pb' || k === 'trap' },
  { id: 'away', label: 'Got away', test: (k) => k === 'away' },
  { id: 'rumour', label: 'Rumours', test: (k) => k === 'rumour' || k === 'clue' || k === 'sighting' },
  { id: 'page', label: 'Pages', test: (k) => k === 'page' },
  { id: 'quest', label: 'Errands', test: (k) => k === 'quest' },
  { id: 'legends', label: '✨ Legends', test: () => false },
];

export function JournalPanel({ onClose }: { onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  const [filter, setFilter] = useState('all');
  const [hereOnly, setHereOnly] = useState(false);
  const f = FILTERS.find((x) => x.id === filter)!;
  const loc = c.locations[s.locationId];
  const deviceTz = store.ctx().deviceTz;
  const entries = filter === 'legends' ? [] : [...s.journal].reverse().filter((e) => f.test(e.kind, !!e.pinned) && (!hereOnly || e.locationId === s.locationId));
  const shown = FILTERS.filter((x) => (x.id !== 'quest' || s.flags.launched) && (x.id !== 'legends' || s.clues.length > 0));
  return (
    <Sheet title={s.flags.launched ? 'Captain’s log' : 'Journal'} sub="It writes itself. Pin what matters." onClose={onClose} tall
      tabs={<>{shown.map((x) => <Tab key={x.id} on={x.id === filter} onClick={() => setFilter(x.id)}>{x.label}</Tab>)}</>}>
      {filter === 'legends' && <Legends />}
      {filter !== 'legends' && <>
      <div class="row" style={{ justifyContent: 'space-between' }}>
        <h3 style={{ margin: '4px 0' }}>Notes on {loc.name}</h3>
        <button class={`tab ${hereOnly ? 'on' : ''}`} onClick={() => setHereOnly(!hereOnly)}>Only here</button>
      </div>
      <textarea class="note" placeholder="Your own notes for this place…" value={s.notes[loc.id] ?? ''} onChange={(e) => store.run(setNote, loc.id, (e.target as HTMLTextAreaElement).value)} />
      {!entries.length && <p class="quote muted">Nothing written here yet.</p>}
      </>}
      {entries.map((e) => {
        const tz = displayTz(c.locations[e.locationId ?? s.locationId] ?? loc, deviceTz);
        return (
          <div key={e.id} class={`jr ${e.kind}`}>
            <div class="when">{formatDate(e.at, tz)}<br />{formatClock(localTime(e.at, tz))}</div>
            <div class="tx"><span class="k">{KIND_LABEL[e.kind]}</span>{e.text}</div>
            <button class={`pin ${e.pinned ? 'on' : ''}`} onClick={() => store.run(togglePin, e.id)} aria-label="Pin">📌</button>
          </div>
        );
      })}
    </Sheet>
  );
}

const DIMENSIONS: { id: string; label: string }[] = [
  { id: 'where', label: 'Where' }, { id: 'when', label: 'Time of day' }, { id: 'season', label: 'Season' }, { id: 'moon', label: 'Moon and tide' }, { id: 'bait', label: 'Bait' },
];

function Legends() {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  const moon = moonIndex(store.ctx().now);
  const spring = [7, 0, 1, 3, 4, 5].includes(moon);
  const known = Object.values(c.legendaries).filter((l) => s.clues.some((x) => x.startsWith(l.id + ':')));
  return (
    <>
      <p class="muted">Tonight: {MOON_NAMES[moon].toLowerCase()}, {spring ? 'big spring tides' : 'small neap tides'}.</p>
      {known.map((l) => {
        const caught = s.legendariesCaught.includes(l.id);
        const dims = DIMENSIONS.filter((d) => l.clues.some((x) => x.dimension === d.id));
        const got = dims.filter((d) => s.clues.includes(`${l.id}:${d.id}`)).length;
        return (
          <div key={l.id} class="detail" style={{ marginBottom: '12px' }}>
            <b>{l.name}</b> {caught ? <span class="pill record">Landed</span> : <span class="muted">· {got} of {dims.length} known</span>}
            <p class="quote" style={{ fontSize: '14.5px' }}>{l.lore}</p>
            {dims.map((d) => {
              const clue = l.clues.find((x) => x.dimension === d.id)!;
              const has = s.clues.includes(`${l.id}:${d.id}`);
              return (
                <div key={d.id} class="row" style={{ alignItems: 'flex-start', margin: '6px 0' }}>
                  <span style={{ width: '18px', flex: 'none' }}>{has ? '✔︎' : '◻︎'}</span>
                  <div class="grow">
                    <div class="muted" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>{d.label}</div>
                    <div class={has ? 'quote' : 'muted'} style={{ fontSize: '14px' }}>{has ? clue.text : 'Unknown. Somebody, somewhere, knows.'}</div>
                  </div>
                </div>
              );
            })}
            {got === dims.length && !caught && <p class="muted">You know everything there is to know. When it all holds at once, each cast has a chance. You will need gear that can hold him.</p>}
          </div>
        );
      })}
    </>
  );
}

export function unreadCount(_s: GameState): number {
  return 0;
}
