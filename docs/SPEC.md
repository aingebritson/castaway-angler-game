# Castaway Angler — Game Spec

Nov 12, 2026 · @Andy

## 1. How to use this spec

This spec defines a fishing and crafting game that runs as a web app installed to the iPhone Home Screen. It is built in milestones, starting with a one-scene fishing prototype. "Castaway Angler" is a working title.

**Handoff.** Export this doc as Markdown and save it as `docs/SPEC.md` in a new repo. Ask Claude Code to build milestone M0 only (section 14), then stop for a play test on the phone. Run one milestone per session after that.

**How the sections bind.** Sections 10, 11 and 14 are instructions for the build. Sections 2 to 9 are design intent the build must serve. Sections 12 (research) and 13 (art) are separate workstreams that run in their own sessions, in parallel with the build.

**Decisions already made**

| Topic | Decision | Source |
| --- | --- | --- |
| World view | Illustrated 2D scenes with tap hotspots; travel by map | Andy |
| Art | AI-generated images supplied by Andy; placeholders until they arrive | Andy |
| Clock | Each location runs on its own real local time and season | Andy |
| Landing a fish | Light tension fight; small fish land automatically | Andy |
| Platform | Static site on GitHub Pages, added to the Home Screen as a web app | Assumed |
| Layout | Portrait, playable with one thumb | Assumed |
| Players | Single player, no accounts, no backend, no analytics | Assumed |
| Save | On the device, with export and import of a save code | Assumed |
| Survival | No hunger, health or death | Assumed |
| Start region | The island sits in the Caribbean, so its species are real | Assumed |

Rows marked Assumed are my defaults. Change any of them before M0 and tell Claude Code which changed.

**When goals conflict**, the pillars in section 2 win in the order listed.

## 2. Vision and design pillars

You wake up shipwrecked with an old fishing pole. You fish, gather and craft your way off the island, then sail a world of real places and real species, filling a field guide and chasing your own records.

The pillars, in priority order:

1. **Chill.** No countdown timers, no hunger, no death. The worst outcome is a lost fish and a story about it.
2. **Discovery is the reward.** The game never shows a full table of where and when a fish appears. Players earn that knowledge by catching, sighting and listening, and the game records it for them.
3. **Real.** Real species, real places, real behaviour. Where gameplay bends reality, the field guide states the real fact.
4. **Earned access.** Every scene shows something not yet reachable: a silhouette too big for the line, a zone beyond casting range, a blank field guide slot.
5. **Compete against yourself.** Personal bests per species. No leaderboards.

**Non-goals for now:** 3D, multiplayer, monetisation, combat, a native App Store build.

**The test for any feature:** does it give the player something new to find out, or a new way to act on what they found out? If neither, cut it.

## 3. Core loops

Three nested loops carry the game. Fishing is the moment loop; crafting and buying are how the session loop feeds the long arc.

| Loop | Length | Steps | Reward |
| --- | --- | --- | --- |
| Moment | 30 to 90 seconds | Pick a zone and rig, cast, wait or retrieve or stalk, bite, set the hook, fight, reveal | Species, size, personal-best flag, new field guide data |
| Session | 5 to 15 minutes | Check the clock and the log, choose a place and rig, fish, sort the catch, craft or buy, check traps | A better rig, a quest step, a filled-in field guide cell |
| Long arc | Weeks | New gear tier, new zone or location, new species pool, rumours of rarer fish, trophies, legendaries, museum | New places and the next wall to climb |

**The role of crafting.** On the island, crafting is the only upgrade path. After the island, markets become the main upgrade path. Crafting stays as the specialist path: bait, lures, traps, repairs and region-specific rigs made from local materials.

**Sorting the catch** is a real choice each time: keep to sell, keep as bait for a bigger fish, keep for a recipe or quest, or release. The field guide records the catch either way, so selling never costs collection progress.

## 4. Fishing system

Fishing is one continuous touch interaction in a portrait scene: drag to cast, wait or reel, tap to hook, hold and release to fight.

**Scene anatomy.** Each fishing spot is one illustrated scene. The lower 55 to 60 percent is castable water, split into named zones such as shallows, mid-water, deep and structure. Each zone has its own species pool. The rod's cast range decides which zones can be reached.

**Casting.** Touch, drag back and release, like a slingshot. Drag length sets distance and drag angle sets direction. A landing marker previews the spot. Better rods reach further and wobble less.

**Three active methods**

| Method | Rig | How it plays | Available |
| --- | --- | --- | --- |
| Bait and wait | Hook, bait, float | The float sits. After 5 to 45 seconds it twitches (nibbles), then dips (bite). Tap inside the hook window, 0.6 to 1.5 seconds, wider for small fish. | From the start |
| Lure retrieve | Lure | Hold to reel the lure back. Each lure has a speed band that attracts strikes. Strikes come mid-retrieve. | After the first crafted lure |
| Sight casting | Either | Silhouettes cruise visible paths in shallow zones. Land the cast one to three body lengths ahead of the fish. Landing on top of it spooks it for a while. | From the start, in the lagoon |

Silhouettes are true to each species in shape and relative size, so players learn to read them. Passive methods (traps and nets) are in section 8.

**The fight.** One control: hold to reel, release to give line.

- A tension gauge has green, yellow and red bands. Reeling and fish surges raise tension. Releasing lowers it, and the fish regains distance.
- Each species has a strength factor, a stamina value and a behaviour archetype: runner, diver, jumper, bulldog or thrasher. Archetypes differ in surge timing, so fish feel different.
- Red for more than about 1.5 seconds snaps the line and loses the hook or lure. Zero tension for more than about 2 seconds pulls the hook and loses only the bait.
- A fish below 25 percent of the rig's power lands automatically with a short reel-in.

| Rarity | Target fight length |
| --- | --- |
| Common | 0 to 5 seconds |
| Uncommon | 5 to 15 seconds |
| Rare | 15 to 30 seconds |
| Epic | 30 to 60 seconds |
| Legendary | 60 to 120 seconds |

**Overmatched bites are a feature.** A fish above the rig's limit can still bite at a reduced rate. The fight is close to unwinnable. Losing it writes a "one that got away" entry in the log with the zone, the time and the size class of the silhouette. This advertises the next gear tier better than any shop screen.

**The reveal card** shows the art, common and scientific name, length, weight, size grade, and banners for a new species or a personal best. Actions: Keep, Release, Use as bait.

**Feel.** The water, the float and the background always move. Nibbles and bites have distinct sounds. Do not depend on phone vibration; treat it as an optional extra where the browser supports it.

## 5. Catch model

Every bite is resolved by one weighted draw over the species that could plausibly be at that spot, in that zone, at that real time, for that rig.

**Bite resolution, in order**

1. Build the candidate pool: every occurrence at this location and zone whose method and gear requirements match the rig.
2. Weight each candidate.
3. Roll against the zone's junk rate for flotsam instead of a creature.
4. Draw a species, then roll its size.
5. Compare the fish to the rig: automatic landing, a fight, or an overmatched bite.

```latex
w = w_{\text{rarity}} \times m_{\text{phase}} \times m_{\text{month}} \times a_{\text{bait}} \times m_{\text{conditions}}
```

**Rarity** is set per species per location. A fish can be common in one place and rare in another.

| Tier | Base weight | Target share of bites in a full pool no |
| --- | --- | --- |
| Common | 100 | About 70% |
| Uncommon | 30 | About 22% |
| Rare | 8 | About 7% |
| Epic | 1.5 | About 1% |
| Legendary | Not in the table | Scripted, see below |

Base weights are starting values in `balance.json`. Tune them with the simulator until a full pool hits the target shares.

**Real time.** Each location has a latitude, longitude and time zone. The game computes four phases from the real sun at that place: dawn, day, dusk and night. Each occurrence carries a modifier from 0 to 2 for each phase; 0 means the species is absent.

**Real season.** Each occurrence carries 12 monthly modifiers from 0 to 2, read against the calendar month at the location. Southern hemisphere seasons need no special handling because the data is per location. Year-round species are 1.0 in every month.

**Later conditions (M4).** Moon phase is computed. Tide is a stylised approximation from the lunar cycle. Weather is generated from the location and date, not fetched. The schema reserves these fields from the start.

**Guard rail.** No species needed for main progression may depend on a narrow real-time window. Time-gated catches belong to side quests, the field guide and trophies.

**Size.** Each species has a minimum, common and maximum length and a length-weight relationship. The game rolls a length from a right-skewed distribution with its median near the common length, then derives weight.

```latex
W = a \times L^{b}
```

- With baseline gear, under 1 percent of catches exceed 90 percent of maximum length.
- Hooks have a length window. Fish below it do not bite. Fish above it bite as overmatched.
- Larger hooks and baits shift the roll toward larger fish. Better gear therefore means bigger trophies, not only new species.
- Size grades by percentile of the species' range: Small (under 25th), Average, Large (over 75th), Trophy (over 95th), Record (over 99.5th).
- The personal best per species stores length, weight, date, place and rig.

**Legendary fish.** One named individual per region at first. Each has a spawn rule of three to five conditions: location, zone, phase, month window, bait or lure, and optionally moon. Players collect the conditions as rumour fragments. When every condition holds, each cast has a fixed chance (start at 10 percent) to hook it. Its size is fixed just above the normal in-game range for the species and plausible against real records. It can be caught once per save. Losing the fight does not remove it.

**Beyond fish.** Crustaceans, cephalopods, molluscs and echinoderms use the same model with their own methods (trap, net, hand). Sighting-only animals, such as turtles, rays and dolphins, appear in scenes and count as field guide sightings. Each zone has a junk table: driftwood, rope, bottles, crates, sea glass, and rarely a message in a bottle that carries a rumour.

**Protected species** carry a release-only flag. They can be caught and recorded but not kept or sold.

## 6. Crafting and gathering

On the island, crafting turns gathered materials and kept fish into better rigs, then into a raft. It has about 16 recipes in three tiers and no survival pressure.

**Rules**

- Gather by tapping hotspots in a scene. Each node holds a small stock that regrows on a real-time timer of minutes to hours.
- A recipe appears as a silhouette once the player holds one of its ingredients. Pages from an earlier castaway's journal, found in bottles and flotsam, reveal others.
- The player can never be stuck. The shell hook recipe is known from the start and shells never run out.

**Island materials**

| Material | Where | Used for |
| --- | --- | --- |
| Palm fronds | Grove | Weaving: baskets, traps, sail |
| Coconuts | Grove | Husk fibre for cordage, shell for floats and bowls, meat for bait |
| Driftwood | Beach | Fire, raft, drying rack |
| Stones | Rocky Point | Hammerstone, knife, sinkers |
| Vines | Grove | Lashings |
| Bamboo | Grove interior, needs a knife | Better rod, raft deck, trap frame |
| Shells | Beach, tide pools | Hooks, lure flash |
| Fish bones | Kept fish | Hooks, needle |
| Feathers | Beach | Feather lure |
| Flotsam: rope, canvas, bottles, planks | Beach wash-up each day, and the junk table | Line, sail, raft parts, journal pages |
| Bait: sand fleas, small crabs, cut fish | Swash line, beach at dusk, the catch | Bait |

**Recipe ladder**

| Tier | Recipes | What it opens |
| --- | --- | --- |
| Start | Old rod, one rusty hook | Shallows at Rocky Point, small common fish |
| 1. Toolmaker | Hammerstone, stone knife, cordage, shell hook, bone hook, coconut float, stone sinker, campfire | Spare hooks, bait variety, bamboo, uncommon reef fish |
| 2. Angler | Bamboo rod, braided line, feather lure, woven trap, torch, bait basket, drying rack | Mid-water zone, the lure method, night fishing, crabs and lobster, smoked fish |
| 3. Raft | Hull, lashings, mast, woven sail, steering oar, provisions, and a bearing from a message in a bottle | Leaving the island |

**Fishing feeds the raft.** Provisions are five smoked fish of at least three species. The sail needs a bone needle. The bearing arrives through the junk table, with a pity timer once the player has caught eight species. These keep both loops in play until launch.

**Target length.** Waking up to launching the raft takes 2 to 4 hours of play, spread over several days.

**After the island.** Recipes come from shops, quests and finds. Crafting covers bait and lure making from local materials, traps, repairs and trade goods.

## 7. World, travel and gating

The world is a tree: regions hold locations, locations hold zones. A location is either a port (market and people) or a fishing spot.

**Castaway Island.** Five scenes: Beach (hub, flotsam, bait), Palm Grove (gathering), Rocky Point (bait fishing, tide pools), Lagoon Flats (sight casting) and Camp (crafting, storage, journal). A wreck sits offshore, visible and unreachable until the player returns with a boat.

The island is the one exception to the location clock. It runs on the phone's own time, because the castaway does not know where they are and the first hours should match the player's real day. The chart reveals its position on leaving.

**Region roadmap.** Species named here are a seed list for the research workstream to verify, not final content.

| Order | Region | Signature catches | Signature mechanic |
| --- | --- | --- | --- |
| 0 | Castaway Island (Caribbean) | Snappers, grunts, bonefish, barracuda, spiny lobster | Crafting, the three methods, torch-lit nights |
| 1 | Caribbean port and waters | Permit, tarpon, groupers, mahi-mahi | Markets, people, first real boat, traps |
| 2 | Amazon, Rio Negro | Peacock bass, piranha, arapaima, redtail catfish, payara | Flood pulse: high and low water change which zones exist |
| 3 | Alaska, Kenai and the coast | Five Pacific salmon, halibut, rainbow trout, king crab | Salmon runs, the sharpest month-by-month seasonality; crab pots |
| 4 | Great Barrier Reef | Coral trout, giant trevally, red emperor, black marlin, Maori wrasse (release only) | Southern seasons, offshore big game, no-take zones |
| Later | Great Lakes and northern rivers, Norwegian fjords, Mekong, Japan, East African lakes, Patagonia | To be researched | One new mechanic each |

Use real regions and habitats. Port towns and their people are lightly fictional.

**Travel.** A world map lists known destinations. Near spots unlock by boat tier. Far regions unlock by buying a passage or a chart. Travel is instant after a short voyage card.

**Gating ladder.** Each stage must show at least two walls the player can see and not yet pass.

| Stage | The player has | Opens up | Visible walls |
| --- | --- | --- | --- |
| 0. Washed up | Old rod, one hook | Rocky Point shallows, small common fish | Deep water out of range; big lagoon shapes ignore the bait; night is too dark |
| 1. Toolmaker | Knife, cordage, shell hooks, float | Bait variety, uncommon reef fish, bamboo | Line snaps on anything large; lure-only fish follow and turn away |
| 2. Angler | Bamboo rod, braided line, lure, torch, trap | Mid-water, night species, crustaceans | Epic fish snap the line; the wreck; open sea |
| 3. Raft | Raft and a bearing | The Caribbean port | Shop gear priced out of reach; offshore water |
| 4. Deckhand | Coins, shop rod and tackle, skiff | Reef, mangrove and channel spots; quests | Blue water; far regions on the map |
| 5. Skipper | Larger boat, traps, cast net | Offshore spots, crab and lobster grounds, passage to region 2 | Deep zones with no visible fish; legend rumours |
| 6. Voyager | Regions 2 to 4, fish finder | Deep zones, regional specialities | Legendaries; museum wings |
| 7. Master | Top-tier rig | Legendaries, full collection | Personal records |

## 8. Economy and equipment

One currency, coins, starts when the player reaches the first port. Coins come from the catch and go into gear that opens new water.

**Sources of coins**

- Selling fish: species base value times a size multiplier. Trophy grade pays three times.
- Selling crafted and smoked goods.
- The orders board at each port: a few rotating requests a day that pay two to three times market price.
- Quest rewards, and research payments for tagging and releasing protected species.

**Sinks:** gear, bait, boats, charts and passages, recipes, storage, museum tanks.

**Equipment**

| Slot | Stats | What it gates | Tiers |
| --- | --- | --- | --- |
| Rod | Cast range, power, accuracy | Reachable zones, fish strength | 6: old rod, bamboo, four shop tiers |
| Reel | Line capacity, drag smoothness | Long-running fish; width of the green band | 4, from the first port |
| Line | Strength | Snap threshold | 6 |
| Hook | Length window | Which sizes bite | Small to extra large |
| Bait | Affinity tags: worm, crustacean, cut fish, live fish, squid, fruit or dough | Which species bite and how often | By region |
| Lure | Type, depth, speed band | Predators that ignore bait | Spoon, jig, popper, plug, fly |
| Traps and nets | Capacity, soak time | Crabs, lobster, shrimp, bait fish | Woven trap, crab pot, cast net, dip net |
| Boat | Range, seaworthiness | Spots and regions | Raft, skiff, sloop, trawler |
| Fish finder | Depth reach | Shows silhouettes in deep zones and how many undiscovered species are active there now | 2, late game |
| Utility | Varies | Torch and lantern (night), tackle box (rig slots), cooler and livewell (carry limit, live specimens) | Varies |

**Traps** are baited, set at a spot and soak in real time for 1 to 8 hours. They are computed from timestamps when the player returns. Capacity is capped, so there is no reason to grind them.

**Pacing targets.** The first shop rod takes 30 to 45 minutes of fishing after arriving at port. Each later tier costs about twice the play time of the one before. All prices and stats live in `balance.json`.

## 9. Field guide, captain's log, people and quests

These four systems are the discovery engine. The content files hold the full truth about every species; the player rebuilds it piece by piece.

**Field guide entry states**

| State | What the player sees | How it is reached |
| --- | --- | --- |
| Unknown | A numbered blank slot. The total per location is visible. | Default |
| Rumoured | Name and a hint | A person, a bottle or a journal page |
| Sighted | Silhouette | Seen in the water, or it got away |
| Caught | Art, description, real-world facts, stats | First catch |

**The observed grid.** Each caught entry has a grid of phase, month, zone and bait. A cell fills when the player catches the species under that condition. Rumours fill cells with a different mark and name the source. The game never fills a cell the player has not seen or been told. This grid is the main discovery mechanic.

**Entry stats:** count, first catch date, personal best with place and rig, and the real-world record for comparison. Completion shows per location and per region.

**Captain's log.** On the island it is the castaway's journal. It writes itself:

- First catches, personal bests and ones that got away
- Rumours, with source
- Quest steps
- Legendary clues, as a checklist of known and unknown conditions
- Trap hauls

Players can pin entries, filter by place or species, and keep a free-text note per location.

**People.** Each port has three to five people, each with a role and a quest chain of four to eight steps: harbourmaster (travel, boats), fishmonger (market, orders), tackle seller (gear, bait tips), old salt (legend rumours), biologist (tag and release, protected species) and later a curator (museum). Dialogue is short text cards with a portrait.

**Quest types:** catch a species; catch a size; catch under a condition such as night; complete a set; craft and deliver; tag and release; recover a flotsam item.

**Rewards.** Information comes first. A rumour reveals one dimension of one undiscovered species: where, when, what bait or which method. Recipes, charts, gear and coins come second. Rumours may be vague. They are never false.

**Museum and aquarium (M5).** Donate one specimen per species. A trophy wall shows personal bests. Aquarium tanks need a livewell. Completing a region's wing yields a legendary clue.

## 10. Technical architecture

The game is a static TypeScript web app on GitHub Pages, installed to the Home Screen, with all game rules in a pure simulation layer that runs and tests without a browser.

**Stack (defaults; propose changes with reasons before M0)**

| Concern | Choice | Note |
| --- | --- | --- |
| Language and build | TypeScript, Vite, Vitest |  |
| Scenes and fishing | Phaser 4 | Latest release is 4.2.1, 9 July 2026 ([releases](https://www.phaser.io/download/phaser4)). It is recent, so read the current docs before writing scene code. If it fights back in M0, fall back to PixiJS or plain Canvas. |
| Menus | DOM and CSS over the canvas, with Preact | Inventory, field guide, log, market, crafting |
| Content | JSON files validated by zod schemas at build | Section 11 |
| Sun and time | SunCalc for sun phases; `Intl.DateTimeFormat` with IANA zones for local time |  |
| Hosting | GitHub Pages, deployed by GitHub Actions | Typecheck, tests, content validation, build |

**Layers**

| Folder | Holds | Rule |
| --- | --- | --- |
| `sim/` | Catch model, fight model, crafting, economy, time | Pure TypeScript. No DOM, no engine, no `Math.random`, no `Date.now`. |
| `content/` | Species, occurrences, locations, items, recipes, quests, `balance.json` | Data only |
| `state/` | One serialisable game state and its reducers | Versioned, with migrations |
| `scenes/` | Phaser scenes | Reads state, sends actions |
| `ui/` | DOM screens | Reads state, sends actions |
| `platform/` | Storage, clock, audio, install hint | The only code that touches browser APIs |

**Required from M0**

- **Injectable clock.** All time flows through one `Clock`. A debug panel can override the time, the location, the inventory and the random seed. Without this, time-gated content cannot be tested.
- **Seeded random numbers.** The same seed, clock and inputs give the same catches.
- **Balance simulator.** `npm run sim -- --location rocky-point --rig starter --casts 10000 --at 2027-01-15T06:00Z` prints the catch distribution, mean fight time and coins per hour. Its output is the acceptance evidence for tuning.
- **Content validation.** The build fails if a file breaks its schema, points to a missing id, or lacks a source. Missing art is allowed and reported.
- **Placeholder art.** Every asset id resolves through a manifest. A missing file falls back to a generated flat silhouette with a name label.

**Saving**

- Store the save in IndexedDB. Save on every state change (debounced) and on `visibilitychange`.
- Call `navigator.storage.persist()` at start. WebKit can evict a site's data when it goes unused, and decides persistence requests partly on whether the site runs as a Home Screen web app ([WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/)). Safari's seven-day cap on script-written storage is reported not to apply to Home Screen web apps ([WebKit bug 237350](https://bugs.webkit.org/show_bug.cgi?id=237350)). Confirm both on the phone during M0.
- Show a one-time hint to add the game to the Home Screen when it runs in a Safari tab.
- Offer export and import of the save as a code or a file.
- Trap timers and regrowth are computed from timestamps on resume. Nothing runs in the background. Ignore clock cheating.

**iPhone checklist**

- Web app manifest, icons, standalone display, service worker for offline play
- Portrait layout with safe-area insets; a rotate prompt in landscape
- No text selection, callouts, double-tap zoom or overscroll bounce; `touch-action: none` on the canvas
- Audio unlocked on the first tap; pause on `visibilitychange`
- 60 frames per second on an iPhone 12 or newer; test in standalone mode, not only in Safari
- Art as WebP, loaded per region and cached on first visit; aim for under 15 MB per region

## 11. Content data model

Adding a region must be a content change, not a code change. Two records carry most of the game: what a species is, and how it occurs at one location.

```ts
type Species = {
  id: string;                    // "albula-vulpes"
  commonName: string;
  scientificName: string;
  kind: "fish" | "crustacean" | "cephalopod" | "mollusc" | "echinoderm" | "sighting";
  family: string;
  lengthCm: { min: number; common: number; max: number; measure: "TL" | "FL" | "SL" | "CW" };
  lengthWeight: { a: number; b: number } | null;   // W(g) = a * L(cm)^b
  recordNote?: string;           // real-world record, shown as flavour
  fight: { archetype: "runner" | "diver" | "jumper" | "bulldog" | "thrasher" | "none";
           strengthFactor: number; stamina: number };
  silhouette: string;            // shape class, used for placeholders
  conservation: { iucn: string; releaseOnly: boolean; note?: string };
  baseValue: number;
  description: string;           // original text, 40 to 80 words
  facts: string[];               // 2 to 4 real facts
  visualNotes: string;           // field marks, feeds the art prompt
  sources: SourceRef[];
};

type Occurrence = {
  speciesId: string;
  locationId: string;
  zones: string[];
  rarity: "common" | "uncommon" | "rare" | "epic";
  phaseMod: { dawn: number; day: number; dusk: number; night: number };   // 0 to 2
  monthMod: number[];            // 12 values, 0 to 2, January first, local calendar
  methods: ("bait" | "lure" | "sight" | "trap" | "net" | "hand")[];
  affinity: Record<string, number>;   // bait tag or lure type -> 0 to 2
  minGear?: { rodTier?: number; requiresFinder?: boolean };
  conditions?: { moon?: number[]; tide?: number[]; weather?: Record<string, number> };  // reserved for M4
  confidence: "high" | "medium" | "low";
  sources: SourceRef[];
  designNotes?: string;          // any deliberate departure from reality
};

type Location = {
  id: string; regionId: string; name: string;
  kind: "port" | "spot";
  lat: number; lon: number; tz: string;          // IANA zone; "device" for the island
  habitat: string;
  zones: { id: string; name: string; minCastRange: number; junkRate: number; junkTable: string }[];
  unlock: Condition[];
  scene: { background: string; waterPolygon: number[][]; hotspots: Hotspot[] };
};

type Legendary = {
  id: string; speciesId: string; name: string; lore: string;
  lengthCm: number;
  spawn: { locationId: string; zone: string; phases: string[]; months: number[];
           rig: string[]; moon?: number[]; chancePerCast: number };
  clues: { dimension: string; text: string; sourceQuestId: string }[];
};

type Rumour = { speciesId: string; dimension: "where" | "when" | "bait" | "method";
                text: string; fillsCells: string[]; source: string };

type SourceRef = { title: string; url: string; accessed: string; supports: string };
```

Items, recipes, people and quests follow the same pattern: an id, display text, an asset id, and typed requirements and effects. Claude Code should define those schemas in M1 and M2 and add them to this section.

**One file for tuning.** `balance.json` holds every number a designer would want to turn: rarity weights, fight thresholds, hook windows, regrowth timers, prices, legendary chance.

## 12. Research workstream

Research produces, for each region, one dossier and a set of validated content files. It runs in its own Claude Code sessions with web search, ahead of that region's build.

**Process per region**

1. Define the region: an anchor point with latitude, longitude and time zone, and three to five real habitats that become fishing spots.
2. Build a long list of 50 to 80 species that anglers really catch there.
3. Select 25 to 35 fish, 5 to 8 other creatures and 2 to 4 sighting-only animals against the quotas below.
4. Fill a species record and an occurrence record for each, with a source for every group of fields.
5. Propose one legendary, based on a real record fish or local lore, with its spawn conditions.
6. Write two rumours for each rare and epic species. Each is a true statement drawn from the data.
7. Review: a second agent checks every rare and epic record and 30 percent of the rest against the sources, and lists conflicts.
8. Run the validator and the simulator. Adjust until the pool hits the rarity targets in section 5.

**Selection quotas for a region of 30 fish**

| Dimension | Target |
| --- | --- |
| Rarity | About 12 common, 9 uncommon, 6 rare, 3 epic |
| Time of day | At least 4 night-biased and 4 dawn or dusk-biased |
| Season | At least 6 with real month-to-month change |
| Method | Every method and every zone has at least 3 species |
| Gear | Species spread across all gear tiers available in that region |
| Conservation | At least 2 release-only species |

**Sources, in order of trust when they conflict**

| Source | Use for | Caution |
| --- | --- | --- |
| Government fisheries agencies (NOAA Fisheries, Alaska Department of Fish and Game, Queensland fisheries, the reef marine park authority, Florida FWC) | Run timing, seasons, regulations, protected status | Regional |
| [FishBase](https://fishbase.se/search.php) and SeaLifeBase | Taxonomy, lengths, length-weight parameters, habitat | Licensed CC BY-NC 4.0. Use facts and cite them. Do not copy text or photos. |
| IUCN Red List | Conservation status |  |
| IGFA records | Record sizes | Flavour only |
| iNaturalist and GBIF | Occurrence by month and place | Reflects where observers go, not only where fish are |
| Guide and charter fishing reports | Bait, time of day, seasonality as anglers experience it | Mark confidence as medium or low |

**Turning reality into game values**

- Rarity reflects how often an angler meets the fish at that habitat, not global abundance.
- Phase modifiers start at 1.0. Strictly nocturnal species get 0 by day. Dawn and dusk feeders peak near 1.6.
- Month modifiers follow run timing and migration. Absent months are 0. Peak months are 1.5 to 2.
- Common length is the typical angler catch. Maximum is the largest reliably reported.
- Check length-weight parameters: compute weight at maximum length and compare it with the record weight. If they differ by more than 30 percent, choose another parameter set.
- When reality is plain, keep it. Get variety by choosing species, not by inventing behaviour. Any deliberate departure goes in `designNotes` and is disclosed in the field guide facts.
- Write every description from scratch.

**Deliverables per region**

- `research/<region>/dossier.md`: overview, habitats, the long list with reasons kept or cut, the legendary proposal, open questions
- `content/species/*.json` and `content/occurrences/<location>.json`
- `research/<region>/sources.md`

**First job: Castaway Island.** About 14 fish, 5 other creatures and 3 sightings, needed before M1. Unverified seed list: sergeant major, bluehead wrasse, French grunt, yellowtail snapper, schoolmaster, bar jack, houndfish, squirrelfish (night), bonefish, permit, great barracuda, mutton snapper, tarpon (overmatched on island gear); spiny lobster, common octopus, ghost crab, queen conch (release only); green turtle, southern stingray and bottlenose dolphin as sightings.

## 13. Art workstream

Andy generates all final art with an image model. The game always runs on placeholders, so art never blocks the build. This section is the brief and the pipeline.

**Step 0: style bake-off, during M0.** Generate the same three test assets (the Rocky Point scene, a bonefish, a stone knife icon) in three candidate styles, then pick one and write a one-page style bible with six reference images.

| Candidate | Character |
| --- | --- |
| Bold-outline cartoon | Flat colour, thick lines, reads well small |
| Gouache storybook | Painterly, warm, soft edges |
| Simplified field-guide watercolour | Naturalist plate feel with cartoon economy of detail |

**Style rules for every asset**

- One outline weight, one palette per region, light from the upper left
- No text, borders or drop shadows inside images
- Species must be identifiable. Simplify detail and line, never anatomy: fin count and position, body shape, tail shape, mouth position and key markings stay correct.

**Asset specifications**

| Type | Format | Rules | Count for the island |
| --- | --- | --- | --- |
| Scene background | Portrait, 1290 by 2796, WebP | Water in the lower 55 to 60 percent. No characters. Neutral midday light; the game tints for dawn, dusk and night. | 5 |
| Specimen | 1536 by 1024, transparent, side profile facing left, fins extended | One per species. The game derives the silhouette from the transparency. | About 22 |
| Item or material icon | 512 by 512, transparent | Three-quarter view, centred | About 40 |
| Portrait | 1024 by 1024, bust | From M2 | 0 |
| Interface kit | Paper textures, frames, buttons | For the log and field guide | 1 set |
| App icon | 1024 by 1024 |  | 1 |

The water surface, ripples, float and line are drawn in code over a water polygon defined in the scene data. A separate night image is optional if tinting looks poor.

**Pipeline**

1. `npm run art:prompts` reads the content files and writes a prompt sheet for every missing asset: the shared style block, the subject, the species' `visualNotes`, the format rules and the target file name.
2. Andy generates images and drops them in `art/inbox/`.
3. `npm run art:ingest` checks size and transparency, trims, converts to WebP, renames and updates the manifest.

**Accuracy check for specimens.** Compare each image with two or three reference photos of the species. Check fin count, tail shape, markings and mouth. Reject anything that would mislead someone identifying the real fish. Image models often get fish anatomy wrong, so allow three to five attempts per species.

**Consistency.** Generate in batches per region with the same style block and reference images.

**Audio** follows the same pattern after M1: one ambient loop per habitat and 10 to 15 sound effects from CC0 libraries, listed in an asset sheet.

## 14. Build plan

Six milestones. M0 is a gate: if casting and landing a fish is not fun with placeholder shapes, fix that before building anything else.

| Milestone | Scope | Done when |
| --- | --- | --- |
| M0. Fishing toy | Repo, CI, Pages deploy, installable web app. One scene (Rocky Point), three placeholder fish, bait-and-wait from cast to reveal. Sim layer, seeded random numbers, injectable clock, debug panel, simulator, save. | It is installed on Andy's iPhone and survives a restart. A cast-to-catch cycle takes under 60 seconds at 60 frames per second. The simulator prints a distribution. Andy says casting and fighting feel good. Then stop for the play test. |
| M1. Castaway | The island: five scenes, all three methods, gathering, about 16 recipes, about 14 fish and 5 creatures plus junk, field guide with observed grid, castaway journal, sun phases on the device clock, torch-gated night, woven trap, export and import, raft launch and ending card. | A new player gets from waking up to launching the raft in 2 to 4 hours with no way to get stuck. The simulator shows each gating stage yields the intended pool. All content passes validation. |
| M2. First port | Caribbean port and four spots. Coins, market, orders board, shop gear, three people with quest chains, rumours, location clocks, full captain's log, skiff, world map. | The first shop rod takes 30 to 45 minutes to earn. Every rare and epic species at the port has at least two obtainable rumours. Phases match real sunrise and sunset at the location. |
| M3. Wider world | Amazon, then Alaska. Crab pots and nets, larger boats, passages, fish finder. | Each region is added with content files and art only. Any engine change needed is logged as a defect in the content model. |
| M4. Depth | Great Barrier Reef. Legendaries, moon, tide and weather, tag and release, reels. | One legendary per region can be found from clues alone and caught. |
| M5. Collection | Museum and aquarium, trophy wall, badges, audio polish. New regions on a steady cadence. | A region wing can be completed and displayed. |

**Parallel tracks**

| Track | During M0 | During M1 | During M2 |
| --- | --- | --- | --- |
| Research | Castaway Island species | Caribbean port region | Amazon |
| Art | Style bake-off and style bible | Island scenes, specimens, icons | Port scenes, portraits |

**Working agreement for Claude Code**

- Build one milestone per session and stop at its acceptance criteria.
- Record any departure from this spec in `docs/DECISIONS.md` with the reason.
- Write tests for everything in `sim/`. Use the simulator output as evidence in each milestone summary.
- Keep tuning numbers in `balance.json`. Never block on art.

## 15. Open decisions

None of these block M0. The first four should be settled before M1.

- [ ] **Name.** "Castaway Angler" is a placeholder.
- [ ] **Art style.** Pick one of the three candidates after the bake-off.
- [ ] **Island clock.** The spec uses the phone's time on the island. The alternative is real Caribbean time from the first minute.
- [ ] **Audience.** Just Andy, or public? Public adds onboarding polish and a closer look at source licences; FishBase's licence is non-commercial.
- [ ] **Image tool.** Whichever is used must produce transparent backgrounds or be paired with a background-removal step in `art:ingest`.
- [ ] **Legendaries.** The spec removes a legendary from the water once caught. The alternative is release and re-catch.
- [ ] **Release.** Should releasing a fish give any benefit before the biologist appears in M4?
- [ ] **Place names.** The spec uses real regions with lightly fictional port towns. The alternative is real towns.

## Sources

- [Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/), WebKit blog, 10 August 2023
- [WebKit bug 237350](https://bugs.webkit.org/show_bug.cgi?id=237350), on storage for web apps added to the Home Screen
- [Phaser 4 releases](https://www.phaser.io/download/phaser4), Phaser
- [FishBase](https://fishbase.se/search.php), licence and citation terms
