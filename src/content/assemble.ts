/**
 * Turns raw JSON files into one validated, cross-checked Content object.
 * Shared by the browser loader, the Node loader, the validator and the tests.
 */
import { z } from 'zod';
import * as S from './schema';

export interface Content {
  balance: S.Balance;
  regions: Record<string, S.Region>;
  locations: Record<string, S.Location>;
  species: Record<string, S.Species>;
  occurrences: S.Occurrence[];
  occByLocation: Record<string, S.Occurrence[]>;
  items: Record<string, S.Item>;
  recipes: Record<string, S.Recipe>;
  rumours: Record<string, S.Rumour>;
  pages: S.Page[];
  lessons: S.Lesson[];
  thoughts: S.Thought[];
  junk: Record<string, S.JunkTable>;
  rigs: Record<string, S.RigPreset>;
  legendaries: Record<string, S.Legendary>;
  people: Record<string, S.Person>;
  quests: Record<string, S.Quest>;
  questsByPerson: Record<string, S.Quest[]>;
  shops: Record<string, S.Shop>;
  /** Bait tags and lure types that appear anywhere, for the field guide grid. */
  baitTypes: string[];
}

export interface Issues {
  errors: string[];
  warnings: string[];
}

export type RawFiles = Record<string, unknown>;

function parseList<T>(schema: z.ZodType<T>, raw: unknown, file: string, issues: Issues): T[] {
  const list = Array.isArray(raw) ? raw : raw == null ? [] : [raw];
  const out: T[] = [];
  list.forEach((entry, i) => {
    const res = schema.safeParse(entry);
    if (res.success) out.push(res.data);
    else {
      const name = (entry as { id?: string; speciesId?: string })?.id ?? (entry as { speciesId?: string })?.speciesId ?? `#${i}`;
      for (const issue of res.error.issues) issues.errors.push(`${file} [${name}] ${issue.path.join('.')}: ${issue.message}`);
    }
  });
  return out;
}

function index<T extends { id: string }>(list: T[], what: string, issues: Issues): Record<string, T> {
  const out: Record<string, T> = {};
  for (const it of list) {
    if (out[it.id]) issues.errors.push(`duplicate ${what} id "${it.id}"`);
    out[it.id] = it;
  }
  return out;
}

/** `files` maps a path such as "species/castaway-island.json" to parsed JSON. */
export function assembleContent(files: RawFiles): { content: Content; issues: Issues } {
  const issues: Issues = { errors: [], warnings: [] };
  const inDir = (dir: string) => Object.keys(files).filter((f) => f.startsWith(dir + '/')).sort();
  const many = <T>(schema: z.ZodType<T>, dir: string): T[] => inDir(dir).flatMap((f) => parseList(schema, files[f], f, issues));
  const one = <T>(schema: z.ZodType<T>, file: string): T[] => parseList(schema, files[file], file, issues);

  const balanceRes = S.Balance.safeParse(files['balance.json']);
  if (!balanceRes.success) for (const i of balanceRes.error.issues) issues.errors.push(`balance.json ${i.path.join('.')}: ${i.message}`);
  const balance = (balanceRes.success ? balanceRes.data : files['balance.json']) as S.Balance;

  const species = index(many(S.Species, 'species'), 'species', issues);
  const locations = index(many(S.Location, 'locations'), 'location', issues);
  const occurrences = many(S.Occurrence, 'occurrences');
  const regions = index(one(S.Region, 'regions.json'), 'region', issues);
  const items = index(one(S.Item, 'items.json'), 'item', issues);
  const recipes = index(one(S.Recipe, 'recipes.json'), 'recipe', issues);
  const rumours = index(one(S.Rumour, 'rumours.json'), 'rumour', issues);
  const pages = one(S.Page, 'pages.json').sort((a, b) => a.order - b.order);
  const lessons = one(S.Lesson, 'lessons.json').sort((a, b) => a.order - b.order);
  const thoughts = one(S.Thought, 'thoughts.json').sort((a, b) => a.order - b.order);
  const junk = index(one(S.JunkTable, 'junk.json'), 'junk table', issues);
  const rigs = index(one(S.RigPreset, 'rigs.json'), 'rig', issues);
  const legendaries = index(one(S.Legendary, 'legendaries.json'), 'legendary', issues);
  const people = index(one(S.Person, 'people.json'), 'person', issues);
  const quests = index(one(S.Quest, 'quests.json'), 'quest', issues);
  const shops = index(one(S.Shop, 'shops.json'), 'shop', issues);

  const err = (m: string) => issues.errors.push(m);
  const needItem = (itemId: string | undefined, where: string) => {
    if (itemId && !items[itemId]) err(`${where}: missing item "${itemId}"`);
  };
  const needSpecies = (sid: string | undefined, where: string) => {
    if (sid && !species[sid]) err(`${where}: missing species "${sid}"`);
  };

  const baitTypes = new Set<string>();
  for (const it of Object.values(items)) {
    if (it.bait) baitTypes.add(it.bait.tags[0]);
    if (it.lure) baitTypes.add(it.lure.type);
  }
  const knownAffinity = new Set<string>(['sinker', 'trap', 'net', 'hand']);
  for (const it of Object.values(items)) {
    it.bait?.tags.forEach((t) => knownAffinity.add(t));
    if (it.lure) knownAffinity.add(it.lure.type);
  }

  for (const sp of Object.values(species)) needItem(sp.gathersAs?.item, `species ${sp.id}`);
  const occByLocation: Record<string, S.Occurrence[]> = {};
  const seenOcc = new Set<string>();
  for (const o of occurrences) {
    const where = `occurrence ${o.speciesId}@${o.locationId}`;
    needSpecies(o.speciesId, where);
    const loc = locations[o.locationId];
    if (!loc) err(`${where}: missing location`);
    else for (const z of o.zones) if (!loc.zones.some((lz) => lz.id === z)) err(`${where}: zone "${z}" is not defined at ${loc.id}`);
    for (const k of Object.keys(o.affinity)) if (!knownAffinity.has(k)) issues.warnings.push(`${where}: affinity "${k}" matches no bait tag or lure type yet`);
    const key = `${o.speciesId}@${o.locationId}@${o.zones.join(',')}@${o.methods.join(',')}`;
    if (seenOcc.has(key)) err(`${where}: duplicate occurrence`);
    seenOcc.add(key);
    (occByLocation[o.locationId] ??= []).push(o);
  }

  for (const loc of Object.values(locations)) {
    if (!regions[loc.regionId]) err(`location ${loc.id}: missing region "${loc.regionId}"`);
    for (const z of loc.zones) if (!junk[z.junkTable]) err(`location ${loc.id}: zone ${z.id} missing junk table "${z.junkTable}"`);
    for (const z of loc.sightZones) if (!loc.zones.some((lz) => lz.id === z)) err(`location ${loc.id}: sight zone "${z}" is not a zone`);
    for (const h of loc.scene.hotspots) {
      const where = `location ${loc.id} hotspot ${h.id}`;
      if (h.kind === 'gather' && !h.node) err(`${where}: gather hotspot needs a node`);
      needItem(h.node?.item, where);
      needItem(h.node?.requiresTool, where);
      h.node?.table?.forEach((t) => needItem(t.item, where));
      if (h.node?.handZone && !loc.zones.some((z) => z.id === h.node!.handZone)) err(`${where}: hand zone "${h.node.handZone}" is not a zone`);
      if ((h.kind === 'npc' || h.kind === 'market' || h.kind === 'museum') && !people[h.ref ?? '']) err(`${where}: missing person "${h.ref}"`);
      if (h.kind === 'shop' && !shops[h.ref ?? '']) err(`${where}: missing shop "${h.ref}"`);
    }
  }

  for (const r of Object.values(recipes)) {
    const where = `recipe ${r.id}`;
    r.inputs.forEach((i) => needItem(i.item, where));
    r.tools.forEach((t) => needItem(t, where));
    needItem(r.station, where);
    needItem(r.output.item, where);
  }
  for (const t of Object.values(junk)) t.entries.forEach((e) => needItem(e.item, `junk ${t.id}`));
  for (const r of Object.values(rigs)) for (const slot of ['rod', 'line', 'reel', 'hook', 'bait', 'lure', 'float', 'sinker'] as const) needItem(r[slot], `rig ${r.id}`);
  for (const r of Object.values(rumours)) {
    needSpecies(r.speciesId, `rumour ${r.id}`);
    for (const cell of r.fillsCells) {
      const [dim, val] = cell.split(':');
      if (!['phase', 'month', 'zone', 'bait'].includes(dim) || !val) err(`rumour ${r.id}: bad cell "${cell}"`);
      if (dim === 'zone') {
        const [l, z] = val.split('/');
        if (!locations[l]?.zones.some((lz) => lz.id === z)) err(`rumour ${r.id}: unknown zone "${val}"`);
      }
      if (dim === 'bait' && !baitTypes.has(val) && !['trap', 'hand', 'net'].includes(val)) err(`rumour ${r.id}: unknown bait type "${val}"`);
    }
  }
  const lessonIds = new Set<string>();
  for (const l of lessons) {
    const where = `lesson ${l.id}`;
    if (lessonIds.has(l.id)) err(`${where}: duplicate id`);
    for (const r of l.requires) if (!lessonIds.has(r)) err(`${where}: requires "${r}", which must come earlier`);
    lessonIds.add(l.id);
    if (!regions[l.regionId]) err(`${where}: missing region "${l.regionId}"`);
    l.unlocks.recipes.forEach((r) => !recipes[r] && err(`${where}: missing recipe "${r}"`));
    for (const group of l.when) for (const c of group) {
      if (c.type === 'held') needItem(c.item, where);
      if (c.type === 'at' && !locations[c.location]) err(`${where}: missing location "${c.location}"`);
    }
    // Never stuck: some way to learn it must not depend on luck with a particular event.
    if (!l.when.some((g) => g.every((c) => c.type === 'stat' || c.type === 'held' || c.type === 'kinds' || c.type === 'hookless'))) {
      issues.warnings.push(`${where}: every way to learn it waits on an event; add a fallback`);
    }
  }
  const thoughtIds = new Set<string>();
  for (const th of thoughts) {
    const where = `thought ${th.id}`;
    if (thoughtIds.has(th.id)) err(`${where}: duplicate id`);
    thoughtIds.add(th.id);
    if (!regions[th.regionId]) err(`${where}: missing region "${th.regionId}"`);
    for (const group of th.when) for (const c of group) {
      if (c.type === 'held') needItem(c.item, where);
      if (c.type === 'at' && !locations[c.location]) err(`${where}: missing location "${c.location}"`);
      if (c.type === 'know' && !lessonIds.has(c.lesson)) err(`${where}: unknown lesson "${c.lesson}"`);
    }
  }

  for (const r of Object.values(recipes)) {
    if (r.known === 'discover' && !lessons.some((l) => l.unlocks.recipes.includes(r.id)) && !pages.some((p) => p.recipes.includes(r.id)) && !Object.values(quests).some((q) => q.reward.recipes?.includes(r.id))) {
      err(`recipe ${r.id}: nothing teaches it (no lesson, page or quest)`);
    }
  }
  for (const loc of Object.values(locations)) for (const u of loc.unlock) if (u.type === 'lesson' && !lessonIds.has(u.lesson)) err(`location ${loc.id}: unknown lesson "${u.lesson}"`);
  for (const p of pages) {
    p.recipes.forEach((r) => !recipes[r] && err(`page ${p.id}: missing recipe "${r}"`));
    p.rumours.forEach((r) => !rumours[r] && err(`page ${p.id}: missing rumour "${r}"`));
  }
  for (const l of Object.values(legendaries)) {
    needSpecies(l.speciesId, `legendary ${l.id}`);
    if (!locations[l.spawn.locationId]) err(`legendary ${l.id}: missing location`);
    else if (!locations[l.spawn.locationId].zones.some((z) => z.id === l.spawn.zone)) err(`legendary ${l.id}: missing zone "${l.spawn.zone}"`);
    for (const c of l.clues) {
      const src = c.sourceQuestId;
      const ok = src.startsWith('museum:') ? !!regions[src.slice(7)] : quests[src]?.reward.clues?.includes(`${l.id}:${c.dimension}`);
      if (!ok) err(`legendary ${l.id}: clue "${c.dimension}" is not given by "${src}"`);
    }
  }
  const questsByPerson: Record<string, S.Quest[]> = {};
  for (const q of Object.values(quests)) {
    const where = `quest ${q.id}`;
    if (!people[q.personId]) err(`${where}: missing person "${q.personId}"`);
    (questsByPerson[q.personId] ??= []).push(q);
    const g = q.goal;
    if ('speciesId' in g) needSpecies(g.speciesId, where);
    if ('item' in g) needItem(g.item, where);
    if ('locationId' in g && g.locationId && !locations[g.locationId]) err(`${where}: missing location "${g.locationId}"`);
    q.reward.items?.forEach((i) => needItem(i.item, where));
    q.reward.rumours?.forEach((r) => !rumours[r] && err(`${where}: missing rumour "${r}"`));
    q.reward.recipes?.forEach((r) => !recipes[r] && err(`${where}: missing recipe "${r}"`));
    for (const c of q.reward.clues ?? []) {
      const [lid, dim] = c.split(':');
      if (!legendaries[lid]?.clues.some((x) => x.dimension === dim)) err(`${where}: unknown clue "${c}"`);
    }
  }
  for (const list of Object.values(questsByPerson)) list.sort((a, b) => a.order - b.order);
  for (const p of Object.values(people)) if (!locations[p.locationId]) err(`person ${p.id}: missing location "${p.locationId}"`);
  for (const s of Object.values(shops)) {
    if (!locations[s.locationId]) err(`shop ${s.id}: missing location`);
    s.stock.forEach((e) => needItem(e.item, `shop ${s.id}`));
    if (s.keeper && !people[s.keeper]) err(`shop ${s.id}: missing keeper "${s.keeper}"`);
  }

  // Research bookkeeping: sources that no one has checked yet are allowed, and reported.
  let pending = 0;
  for (const sp of Object.values(species)) pending += sp.sources.filter((s) => s.accessed === 'pending-review').length;
  for (const o of occurrences) pending += o.sources.filter((s) => s.accessed === 'pending-review').length;
  if (pending) issues.warnings.push(`${pending} source references are marked "pending-review" (research pass has not verified them)`);

  const content: Content = {
    balance, regions, locations, species, occurrences, occByLocation, items, recipes, rumours, pages, lessons, thoughts, junk, rigs,
    legendaries, people, quests, questsByPerson, shops, baitTypes: [...baitTypes],
  };
  return { content, issues };
}
