# Castaway Angler

A fishing and crafting game for the iPhone Home Screen. You wake up shipwrecked with an old fishing pole; you fish, gather and craft your way off the island, then sail on to real places and real species.

No timers, no hunger, no death. The island runs on your phone's clock: fish at dusk and the dusk fish are there.

The full design is in [docs/SPEC.md](docs/SPEC.md). Where the build departs from it: [docs/DECISIONS.md](docs/DECISIONS.md).

## Play

```bash
npm install
```

```bash
npm run dev
```

Open the address it prints on your phone (same Wi-Fi), or in a desktop browser at phone width. On iPhone, use Share → Add to Home Screen to play full screen and keep the save.

- **Cast:** drag back and let go, like a slingshot.
- **Bait:** wait for the float to go under, then tap.
- **Fight:** hold to reel, let go when the gauge runs red.
- **Lure:** hold to retrieve, pulse to keep the speed in the green band.
- **Sight cast:** land the bait ahead of a silhouette, not on it. Tap a silhouette to sketch it in the field guide.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Validate content, typecheck, build to `dist/` |
| `npm test` | Simulation tests and a scripted playthrough from waking up to launching the raft |
| `npm run validate` | Check every content file against its schema and cross-references |
| `npm run sim -- --location rocky-point --rig starter --casts 10000 --at 2027-01-15T16:00Z` | Balance simulator: catch distribution, fight time, coins per hour |
| `npm run art:prompts` | Write a prompt sheet for every asset still on a placeholder |
| `npm run art:ingest` | Check, trim and convert images from `art/inbox/` and update the manifest |
| `npm run icons` | Re-render the app icon |

## Layout

| Folder | Holds |
| --- | --- |
| `content/` | Species, occurrences, locations, items, recipes, pages, `balance.json`. Data only. |
| `src/sim/` | Catch model, fight model, sun and time, traps, crafting checks. Pure TypeScript: no DOM, no `Math.random`, no `Date.now`. |
| `src/state/` | One serialisable game state, its reducers, save codes and migrations |
| `src/scenes/` | Canvas scenes: painters, silhouettes, the fishing interaction |
| `src/ui/` | Preact menus over the canvas |
| `src/platform/` | Storage, clock, audio, install: the only code that touches browser APIs |
| `scripts/` | Simulator, validator, art pipeline |
| `tests/` | Vitest |

## Debug panel

Settings (the clock, top right) → Debug panel: move the clock, jump to a phase, grant items, change the random seed, travel anywhere.

## Sources and licences

Species facts draw on FishBase and SeaLifeBase (CC BY-NC 4.0: facts cited, no text or photos copied), the IUCN Red List, NOAA Fisheries and the Florida Museum. All descriptions are original. Source references in the content files are marked `pending-review` until the research pass verifies them; see DECISIONS.md.
