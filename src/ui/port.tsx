/** Port screens: fish market, shops, the orders board and people. */
import { useState } from 'preact/hooks';
import type { Hotspot } from '../content/schema';
import { formatLength } from '../sim/catch';
import { has } from '../state/actions';
import { badges, donatable, donate, trophyWall, wings } from '../state/museum';
import { acceptQuest, buy, currentQuest, ensureOrders, fillOrder, fishPrice, goalCount, orderMatch, questReady, sellAllFish, sellFish, sellItem, sellable, turnIn } from '../state/port';
import { FishArt, GRADE_LABEL, ItemIcon, Portrait, Sheet, Tab } from './bits';
import { useGame, useGameState } from './hooks';

export type PortPanel = { kind: 'npc' | 'shop' | 'board' | 'market' | 'museum'; ref: string };

export function portHotspot(h: Hotspot): PortPanel | null {
  if (h.kind === 'npc' || h.kind === 'shop' || h.kind === 'board' || h.kind === 'market' || h.kind === 'museum') return { kind: h.kind, ref: h.ref ?? '' };
  return null;
}

/** A person: what they say, and the errand they have for you. */
function PersonBlock({ personId }: { personId: string }) {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  const p = c.people[personId];
  const [said, setSaid] = useState<string | null>(null);
  const cur = currentQuest(s, c, personId);
  const met = !!s.flags[`met:${personId}`];
  const idle = p.idle[(Math.floor(s.lastSeen / 60_000) + personId.length) % p.idle.length];
  let line = said ?? (!met ? p.greeting : idle);
  let box = null;
  if (cur && !said) {
    const { quest, save } = cur;
    const n = goalCount(quest);
    if (!save) {
      line = met ? quest.offer : `${p.greeting} ${quest.offer}`;
      box = (
        <div class="detail">
          <b>{quest.title}</b>
          <div class="muted">{quest.progressText}</div>
          <button class="btn small" style={{ marginTop: '8px' }} onClick={() => { store.act((d) => { d.flags[`met:${personId}`] = true; }); store.run(acceptQuest, quest.id); }}>I will do it</button>
        </div>
      );
    } else {
      const ready = questReady(s, quest);
      line = ready ? 'Well? Tell me.' : idle;
      box = (
        <div class="detail">
          <b>{quest.title}</b>
          <div class="muted">{quest.progressText}{n > 1 && save.state === 'active' ? `: ${Math.min(save.progress, n)} of ${n}` : ''}</div>
          {ready && <button class="btn small gold" style={{ marginTop: '8px' }} onClick={() => { store.run(turnIn, quest.id); setSaid(quest.done); }}>Report back</button>}
        </div>
      );
    }
  }
  return (
    <>
      <div class="item" style={{ alignItems: 'flex-start' }}>
        <Portrait id={personId} />
        <div class="grow">
          <div class="t">{p.name} <span class="muted">· {p.role}</span></div>
          <div class="quote" style={{ fontSize: '15px', lineHeight: 1.4, marginTop: '3px' }}>“{line}”</div>
        </div>
      </div>
      {box}
      {said && <button class="btn small alt" style={{ marginTop: '8px' }} onClick={() => setSaid(null)}>Go on</button>}
    </>
  );
}

function Market({ personId, onClose }: { personId: string; onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  const [tab, setTab] = useState<'fish' | 'goods'>('fish');
  const fish = [...s.creel, ...s.larder];
  const total = fish.reduce((t, f) => t + fishPrice(c, f), 0);
  const goods = sellable(s, c);
  return (
    <Sheet title="Fish market" sub={`◉ ${s.coins} coins`} onClose={onClose} tall
      tabs={<><Tab on={tab === 'fish'} onClick={() => setTab('fish')}>Fish {fish.length}</Tab><Tab on={tab === 'goods'} onClick={() => setTab('goods')}>Goods {goods.length}</Tab></>}>
      <PersonBlock personId={personId} />
      {tab === 'fish' && (
        <>
          {fish.length > 0 && <button class="btn gold" style={{ width: '100%', margin: '10px 0' }} onClick={() => store.run(sellAllFish)}>Sell everything for ◉ {total}</button>}
          {!fish.length && <p class="quote muted">Nothing to sell. The pier is free to fish.</p>}
          {fish.map((f) => {
            const sp = c.species[f.speciesId];
            return (
              <div class="item" key={f.uid}>
                <div class="ic" style={{ width: '66px' }}><FishArt speciesId={sp.id} width={60} /></div>
                <div class="grow">
                  <div class="t">{f.smoked ? 'Smoked ' : ''}{sp.commonName}</div>
                  <div class="d">{formatLength(f.lengthCm)} · <span class={`pill ${f.grade}`}>{GRADE_LABEL[f.grade]}</span></div>
                </div>
                <button class="btn small" onClick={() => store.run(sellFish, f.uid)}>◉ {fishPrice(c, f)}</button>
              </div>
            );
          })}
          <p class="muted">Bigger fish of a kind pay more; a trophy pays three times. Selling never costs field guide progress.</p>
        </>
      )}
      {tab === 'goods' && (
        <>
          {!goods.length && <p class="quote muted">Nothing Delphine wants.</p>}
          {goods.map((id) => {
            const it = c.items[id];
            return (
              <div class="item" key={id}>
                <div class="ic"><ItemIcon id={id} size={26} /></div>
                <div class="grow"><div class="t">{it.name} <span class="muted">×{s.inventory[id]}</span></div><div class="d">◉ {it.value} each</div></div>
                <button class="btn small alt" onClick={() => store.run(sellItem, id, 1)}>Sell 1</button>
                {s.inventory[id] > 1 && <button class="btn small" onClick={() => store.run(sellItem, id, s.inventory[id])}>All</button>}
              </div>
            );
          })}
        </>
      )}
    </Sheet>
  );
}

function Shop({ shopId, onClose }: { shopId: string; onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  const shop = c.shops[shopId];
  return (
    <Sheet title={shop.name} sub={`◉ ${s.coins} coins`} onClose={onClose} tall>
      {shop.keeper && <PersonBlock personId={shop.keeper} />}
      <h3>For sale</h3>
      {shop.stock.filter((e) => !e.requiresFlag || s.flags[e.requiresFlag]).map((e) => {
        const it = c.items[e.item];
        const owned = !!e.once && has(s, e.item);
        const afford = s.coins >= e.price;
        const stat = it.rod ? `Range ${Math.round(it.rod.range * 100)} · strength ${it.rod.power}` : it.line ? `Strength ${it.line.strength}` : it.hook ? `Holds ${it.hook.minCm}–${it.hook.maxCm} cm` : null;
        return (
          <div class={`item ${owned ? 'dim' : ''}`} key={e.item}>
            <div class="ic"><ItemIcon id={e.item} size={26} /></div>
            <div class="grow">
              <div class="t">{it.name} {!e.once && (s.inventory[e.item] ?? 0) > 0 && <span class="muted">· have {s.inventory[e.item]}</span>}</div>
              <div class="d">{it.desc}{stat ? ` ${stat}.` : ''}</div>
            </div>
            {owned ? <span class="pill large">Owned</span> : (
              <div class="row">
                {!e.once && <button class="btn small alt" disabled={s.coins < e.price * 5} onClick={() => store.run(buy, shopId, e.item, 5)}>×5</button>}
                <button class={`btn small ${afford ? '' : 'alt'}`} disabled={!afford} onClick={() => store.run(buy, shopId, e.item, 1)}>◉ {e.price}</button>
              </div>
            )}
          </div>
        );
      })}
    </Sheet>
  );
}

function Board({ onClose }: { onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  // generating today's orders is a state change, so do it once when the board is opened
  useState(() => store.act((d, ctx) => { ensureOrders(d, ctx, d.locationId); }));
  const list = s.orders?.list ?? [];
  return (
    <Sheet title="Orders board" sub="Kitchens along the coast, paying over the odds. New orders each morning." onClose={onClose}>
      {list.map((o) => {
        const sp = c.species[o.speciesId];
        const match = orderMatch(s, o);
        const known = s.guide[sp.id]?.state === 'caught';
        return (
          <div class={`item ${o.filled ? 'dim' : ''}`} key={o.id}>
            <div class="ic" style={{ width: '66px' }}><FishArt speciesId={sp.id} width={60} ink={!known} /></div>
            <div class="grow">
              <div class="t">{sp.commonName}</div>
              <div class="d">At least {o.minCm} cm, fresh.</div>
            </div>
            {o.filled ? <span class="pill large">Filled</span> : <button class={`btn small ${match ? 'gold' : 'alt'}`} disabled={!match} onClick={() => store.run(fillOrder, o.id)}>◉ {o.pay}</button>}
          </div>
        );
      })}
      {!list.length && <p class="quote muted">The board is bare today.</p>}
      <p class="muted">Keep the fish in your basket and bring it here. An order pays two to three times the market.</p>
    </Sheet>
  );
}

function Museum({ personId, onClose }: { personId: string; onClose(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const c = store.content;
  const [tab, setTab] = useState<'wings' | 'trophies' | 'badges'>('wings');
  const ws = wings(s, c).filter((w) => w.species.some((id) => s.guide[id]) || w.regionId === c.locations[s.locationId].regionId);
  const wall = trophyWall(s, c);
  const bs = badges(s, c);
  return (
    <Sheet title="Museum" sub="Natural history of the coast, one specimen at a time." onClose={onClose} tall
      tabs={<>
        <Tab on={tab === 'wings'} onClick={() => setTab('wings')}>Wings</Tab>
        <Tab on={tab === 'trophies'} onClick={() => setTab('trophies')}>Trophy wall</Tab>
        <Tab on={tab === 'badges'} onClick={() => setTab('badges')}>Badges {bs.filter((b) => b.got).length}/{bs.length}</Tab>
      </>}>
      {tab === 'wings' && (
        <>
          <PersonBlock personId={personId} />
          {ws.map((w) => (
            <div key={w.regionId}>
              <h3>{c.regions[w.regionId].name} wing <small>{w.donated} / {w.species.length}{w.complete ? ' · complete' : ''}</small></h3>
              <div class="bar" style={{ marginBottom: '8px' }}><i style={{ width: `${(100 * w.donated) / Math.max(1, w.species.length)}%`, background: 'var(--gold)' }} /></div>
              <div class="guide-grid">
                {w.species.map((id) => {
                  const e = s.guide[id];
                  const sp = c.species[id];
                  const spec = !e?.donated && donatable(s, id);
                  return (
                    <div key={id} class={`gcell ${e?.donated ? 'caught' : e?.state === 'caught' ? 'rumoured' : 'unknown'}`} style={{ cursor: 'default' }}>
                      {e?.donated || e?.state === 'caught' ? <FishArt speciesId={id} width={80} ink={!e?.donated} /> : '?'}
                      {(e?.donated || e?.state === 'caught') && <span class="nm">{sp.commonName}</span>}
                      {e?.donated && <span class="badge">🏛️</span>}
                      {spec && <button class="btn small gold" style={{ marginTop: '4px', minHeight: '28px', padding: '0 10px' }} onClick={() => store.run(donate, id)}>Donate</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <p class="muted">Bring a fresh one in your catch basket to donate it. Protected animals and bait are not collected. A finished wing pays, and people talk.</p>
        </>
      )}
      {tab === 'trophies' && (
        <>
          {!wall.length && <p class="quote muted">An empty wall, waiting.</p>}
          {wall.map((t) => (
            <div class="item" key={t.speciesId}>
              <div class="ic" style={{ width: '66px' }}><FishArt speciesId={t.speciesId} width={60} /></div>
              <div class="grow">
                <div class="t">{c.species[t.speciesId].commonName} <span class={`pill ${t.grade}`}>{GRADE_LABEL[t.grade]}</span></div>
                <div class="d">{formatLength(t.lengthCm)} · bigger than {Math.min(99.9, Math.round(t.percentile * 1000) / 10)}% of its kind · {c.locations[t.locationId]?.name}</div>
              </div>
            </div>
          ))}
        </>
      )}
      {tab === 'badges' && (
        <div class="guide-grid">
          {bs.map((b) => (
            <div key={b.id} class={`gcell ${b.got ? 'caught' : 'unknown'}`} style={{ fontFamily: 'var(--sans)', fontSize: '13px' }}>
              <span style={{ fontSize: '30px', filter: b.got ? 'none' : 'grayscale(1) opacity(.4)' }}>{b.glyph}</span>
              <span class="nm">{b.name}</span>
              <span class="muted" style={{ fontSize: '10.5px', lineHeight: 1.2, marginTop: '2px' }}>{b.desc}</span>
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

export function PortPanels({ panel, onClose }: { panel: PortPanel; onClose(): void }) {
  const { store } = useGame();
  if (panel.kind === 'museum') return <Museum personId={panel.ref} onClose={onClose} />;
  if (panel.kind === 'market') return <Market personId={panel.ref} onClose={onClose} />;
  if (panel.kind === 'shop') return <Shop shopId={panel.ref} onClose={onClose} />;
  if (panel.kind === 'board') return <Board onClose={onClose} />;
  const p = store.content.people[panel.ref];
  return (
    <Sheet title={p.name} sub={p.role} onClose={onClose}>
      <PersonBlock personId={panel.ref} />
    </Sheet>
  );
}
