import { useEffect, useState } from 'preact/hooks';
import { formatLength, formatWeight } from '../sim/catch';
import { type Reveal, fishToBait, has, keepFish, releaseFish, creelLimit } from '../state/actions';
import { FishArt, GRADE_LABEL, ItemIcon } from './bits';
import { useGame, useGameState } from './hooks';

/** The reveal: what came up, how big, and what to do with it. */
export function RevealCard({ reveal, onDone }: { reveal: Reveal; onDone(): void }) {
  const { store } = useGame();
  const s = useGameState();
  const sp = store.content.species[reveal.speciesId];
  const leg = reveal.legendaryId ? store.content.legendaries[reveal.legendaryId] : null;
  const knife = has(s, 'stone-knife') || has(s, 'fillet-knife');
  const full = s.creel.length >= creelLimit(s, store.content);
  const sized = !!sp.lengthWeight;
  const act = (fn: typeof keepFish) => {
    store.run(fn, reveal);
    onDone();
  };
  return (
    <div class="card-wrap">
      <div class="card">
        <div>
          {leg && <span class="banner leg">Legendary</span>}
          {reveal.isNew && <span class="banner new">New species</span>}
          {reveal.isPB && <span class="banner pb">Personal best</span>}
          {reveal.releaseOnly && <span class="banner prot">Protected</span>}
        </div>
        <div class="art"><FishArt speciesId={sp.id} width={280} /></div>
        <h2>{leg ? leg.name : sp.commonName}</h2>
        <div class="sci">{leg ? sp.commonName + ' · ' : ''}{sp.scientificName}</div>
        {sized && (
          <div class="measure">
            <div>{formatLength(reveal.lengthCm)}<small>Length ({sp.lengthCm.measure})</small></div>
            <div>{formatWeight(reveal.weightG)}<small>Weight</small></div>
          </div>
        )}
        {sized && <span class={`pill ${reveal.grade}`}>{GRADE_LABEL[reveal.grade]}</span>}
        {reveal.isNew && <p class="quote" style={{ fontSize: '15px', textAlign: 'left' }}>{sp.description}</p>}
        {reveal.bagged ? (
          <>
            <p class="muted">Into the bait bag.</p>
            <div class="actions"><button class="btn" onClick={onDone}>Good</button></div>
          </>
        ) : reveal.releaseOnly ? (
          <>
            <p class="muted">{sp.conservation.note ?? 'A protected species.'} It goes back; the field guide keeps the record.</p>
            <div class="actions"><button class="btn" onClick={() => act(releaseFish)}>Release</button></div>
          </>
        ) : (
          <>
            {full && <p class="muted">The catch basket is full.</p>}
            <div class="actions">
              <button class="btn" disabled={full} onClick={() => act(keepFish)}>Keep</button>
              <button class="btn alt" onClick={() => act(releaseFish)}>Release</button>
              {sp.kind === 'fish' && <button class="btn alt" disabled={!knife} onClick={() => act(fishToBait)}>Cut bait</button>}
            </div>
            {sp.kind === 'fish' && !knife && <p class="muted" style={{ marginBottom: 0 }}>Cutting bait needs a knife.</p>}
          </>
        )}
      </div>
    </div>
  );
}

/** A page from the earlier castaway's journal. */
export function PageCard({ pageId, onDone }: { pageId: string; onDone(): void }) {
  const { store } = useGame();
  const page = store.content.pages.find((p) => p.id === pageId)!;
  const learned = [
    ...page.recipes.map((r) => store.content.items[store.content.recipes[r].output.item].name),
  ];
  return (
    <div class="card-wrap">
      <div class="card pagecard">
        <span class="banner new">A page in a bottle</span>
        <h2>{page.title}</h2>
        <div class="body">{page.text}</div>
        {(learned.length > 0 || page.rumours.length > 0 || page.bearing) && (
          <div class="learned">
            {learned.length > 0 && <div><b>Now I know how to make:</b> {learned.join(', ').toLowerCase()}.</div>}
            {page.rumours.length > 0 && <div style={{ marginTop: '4px' }}><b>Field guide:</b> {page.rumours.length} rumour{page.rumours.length > 1 ? 's' : ''} noted.</div>}
            {page.bearing && <div style={{ marginTop: '4px' }}><b>A bearing off the island.</b></div>}
          </div>
        )}
        <div class="actions"><button class="btn" onClick={onDone}>Keep the page</button></div>
      </div>
    </div>
  );
}

/** What was in the trap. */
export function HaulCard({ reveals, soakH, onDone }: { reveals: Reveal[]; soakH: number; onDone(): void }) {
  const { store } = useGame();
  return (
    <div class="card-wrap">
      <div class="card">
        <span class="banner new">Trap hauled</span>
        <h2>{reveals.length ? `${reveals.length} in the trap` : 'Empty'}</h2>
        <p class="muted">Soaked for {soakH < 1.5 ? 'about an hour' : `${Math.round(soakH)} hours`}.</p>
        {reveals.map((r, i) => {
          const sp = store.content.species[r.speciesId];
          return (
            <div class="item" key={i} style={{ textAlign: 'left' }}>
              <div class="ic" style={{ width: '70px' }}><FishArt speciesId={sp.id} width={64} /></div>
              <div class="grow">
                <div class="t">{sp.commonName} {r.isNew && <span class="pill large">New</span>}</div>
                <div class="d">{formatLength(r.lengthCm)} · {formatWeight(r.weightG)}{r.releaseOnly ? ' · released' : ''}</div>
              </div>
            </div>
          );
        })}
        {!reveals.length && <p class="quote">Nothing but a scrap of bait and a cross-looking hermit crab.</p>}
        <div class="actions"><button class="btn" onClick={onDone}>Good</button></div>
      </div>
    </div>
  );
}

export interface ToastMsg {
  id: number;
  text: string;
  glyph?: string;
  tone?: string;
}

export function Toasts({ toasts, gains }: { toasts: ToastMsg[]; gains: { id: number; itemId: string; qty: number }[] }) {
  const { store } = useGame();
  return (
    <>
      <div class="toasts">
        {toasts.map((t) => (
          <div key={t.id} class={`toast ${t.tone ?? ''}`}>
            {t.glyph && <span style={{ fontSize: '18px' }}>{t.glyph}</span>}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
      <div class="gains">
        {gains.map((g) => (
          <div key={g.id} class="gainchip">
            +{g.qty} <ItemIcon id={g.itemId} size={16} /> {store.content.items[g.itemId]?.name}
          </div>
        ))}
      </div>
    </>
  );
}

/** Leaving the island. */
export function EndingCard({ onDone, hasPort }: { onDone(): void; hasPort: boolean }) {
  const s = useGameState();
  const { store } = useGame();
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setStep(1), 600);
    return () => clearTimeout(id);
  }, []);
  const species = Object.entries(s.guide).filter(([id, e]) => e.state === 'caught' && store.content.species[id]?.kind !== 'sighting').length;
  const days = Math.max(1, Math.round((s.lastSeen - s.createdAt) / 86_400_000));
  return (
    <div class="card-wrap" style={{ background: 'rgba(4,12,18,.86)' }}>
      <div class="card" style={{ opacity: step ? 1 : 0, transition: 'opacity .8s' }}>
        <div style={{ fontSize: '54px' }}>⛵</div>
        <h2>The island falls astern</h2>
        <p class="quote" style={{ fontSize: '16px' }}>
          The sail fills. The raft creaks, and holds. Behind you a line of palms sinks into the sea, and with it the wreck, the tide pools,
          and a great silver fish you never turned.
        </p>
        <p class="quote" style={{ fontSize: '16px' }}>West-south-west. Two days, if the wind holds.</p>
        <hr />
        <div class="measure">
          <div>{days}<small>{days === 1 ? 'Day' : 'Days'} cast away</small></div>
          <div>{species}<small>Species caught</small></div>
          <div>{s.stats.catches}<small>Catches</small></div>
        </div>
        <div class="actions">
          <button class="btn" onClick={onDone}>{hasPort ? 'Sail on' : 'Keep fishing'}</button>
        </div>
      </div>
    </div>
  );
}
