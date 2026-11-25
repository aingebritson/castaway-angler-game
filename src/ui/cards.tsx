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
        {s.stats.catches <= 1 && !s.flags.launched && !reveal.bagged && !reveal.releaseOnly && (
          <p class="tip">Keep it. Kept fish go in your basket, and later, with a knife, a fish gives you bait and a bone for a bigger hook.</p>
        )}
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

/** What a lesson lets you do now: the effect, and chips for what can now be made. */
function LessonNow({ lessonId }: { lessonId: string }) {
  const { store } = useGame();
  const c = store.content;
  const l = c.lessons.find((x) => x.id === lessonId)!;
  return (
    <>
      <div class="lesson-box">
        <b>How it works</b>
        <p>{l.lesson}</p>
      </div>
      <div class="lesson-now">
        <b>Now</b>
        <p>{l.effect}</p>
        {l.unlocks.recipes.length > 0 && (
          <div class="need" style={{ justifyContent: 'center' }}>
            {l.unlocks.recipes.map((r) => {
              const out = c.items[c.recipes[r].output.item];
              return <span key={r} class="chip ok"><ItemIcon id={out.id} size={16} /> {out.name}</span>;
            })}
          </div>
        )}
      </div>
    </>
  );
}

export interface PageMsg {
  pageId: string;
  lessonId?: string;
  seen?: string;
}

/**
 * A page from the earlier castaway's journal, come up on the line just when
 * the castaway needed it: what had happened, the page, and what it teaches.
 */
export function PageCard({ msg, onDone }: { msg: PageMsg; onDone(): void }) {
  const { store } = useGame();
  const page = store.content.pages.find((p) => p.id === msg.pageId)!;
  const first = page.order === store.content.pages[0]?.order;
  return (
    <div class="card-wrap">
      <div class="card pagecard">
        <span class="banner new">A message in a bottle</span>
        <p class="page-pre">
          {msg.seen && <>{msg.seen} </>}
          {first
            ? 'Then the next cast came back heavy: a bottle, corked and sealed with wax. Inside, dry, a page torn from somebody’s notebook. The handwriting is not mine. Somebody else was stranded here, before me.'
            : 'Then the next cast came back heavy: another bottle, and another page in the same hand.'}
        </p>
        <div class="page-sheet">
          <div class="page-kicker">From the other castaway’s journal</div>
          <h2>{page.title}</h2>
          <div class="body">{page.text}</div>
        </div>
        {msg.lessonId && <LessonNow lessonId={msg.lessonId} />}
        {page.rumours.length > 0 && (
          <div class="learned"><b>Field guide:</b> {page.rumours.length} rumour{page.rumours.length > 1 ? 's' : ''} noted.</div>
        )}
        <div class="actions"><button class="btn" onClick={onDone}>Keep the page</button></div>
      </div>
    </div>
  );
}

export interface ThoughtMsg {
  id: number;
  lines: string[];
  /** The next goal said out loud, rather than a story thought. */
  mind?: boolean;
}

/**
 * The castaway thinking: a few lines that drift in over the scene. Tap to
 * carry on. Taps in the first moment are ignored so a cast in progress does
 * not dismiss it unread.
 */
export function ThoughtCard({ msg, onDone }: { msg: ThoughtMsg; onDone(): void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setArmed(true), 500 + msg.lines.length * 250);
    return () => clearTimeout(id);
  }, [msg.id]);
  return (
    <div class={`thought-wrap ${msg.mind ? 'mind' : ''}`} onClick={() => armed && onDone()}>
      <div class="tcard">
        {msg.mind && <b class="thought-k">On my mind</b>}
        {msg.lines.map((l, i) => <p key={i} style={{ animationDelay: `${0.15 + i * 0.55}s` }}>{l}</p>)}
        <div class={`thought-tap ${armed ? 'on' : ''}`}>Tap to carry on</div>
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

export interface LessonMsg {
  lessonId: string;
  seen: string;
}

/** A lesson learned: what just happened, the fishing idea behind it, and what it unlocks. */
export function LessonCard({ msg, onDone }: { msg: LessonMsg; onDone(): void }) {
  const { store } = useGame();
  const l = store.content.lessons.find((x) => x.id === msg.lessonId)!;
  return (
    <div class="card-wrap">
      <div class="card lessoncard">
        <span class="banner new">Learned something</span>
        <div class="lesson-glyph">{l.glyph}</div>
        <h2>{l.title}</h2>
        <p class="quote seen">{msg.seen}</p>
        <LessonNow lessonId={l.id} />
        <div class="actions"><button class="btn" onClick={onDone}>Got it</button></div>
      </div>
    </div>
  );
}
