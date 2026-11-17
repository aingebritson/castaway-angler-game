# Decisions and departures from the spec

Each entry records where the build departs from `docs/SPEC.md`, and why.

## Process

1. **Built past the M0 gate in one go.** The spec says to stop after M0 for a play test. Andy asked for continuous building instead ("don't just stop at M0"), so M0 and M1 landed together, with M2 following. The M0 play test on a real iPhone has **not** happened; casting and fight feel are tuned by simulator and by a scripted bot, not by a thumb. Expect to retune `balance.json` after the first real session.
2. **Research ran from model knowledge, not live sources.** Species lengths, length-weight parameters, behaviour and conservation status were written from memory of FishBase, SeaLifeBase, IUCN and agency pages. Every `SourceRef` therefore carries `accessed: "pending-review"`, and the validator reports the count. The research workstream's review step (spec section 12, step 7) still has to verify them against the live pages. Treat every number as plausible, not checked.

## Technology

3. **Plain Canvas 2D instead of Phaser 4.** The spec allows this fallback. All scene art is either a static background image or drawn in code, the fishing interaction is custom, and the game has no physics, tilemaps or sprite sheets for an engine to help with. Canvas keeps the bundle at about 110 kB gzipped and removes the risk of building on a months-old major version. `scenes/` is the only layer that would change if this is reversed.
4. **Audio is synthesised with WebAudio** and arrived in M1 rather than "after M1". It ships no files. It is a placeholder for the CC0 asset sheet in spec section 13.
5. **Item icons fall back to emoji glyphs**, not generated silhouettes with labels. Specimens and scenes fall back to art drawn in code (`scenes/silhouettes.ts`, `scenes/painters.ts`). Everything still resolves through the manifest in `public/art/manifest.json`.
6. **The service worker is a 30-line Vite plugin** in `vite.config.ts` rather than a PWA library: it precaches every built file and serves cache-first.

## Design

7. **Night without a torch limits you to the shallows; it does not stop fishing.** The spec's stage 0 wall is "night is too dark". Because the island runs on the phone's clock, a player who only plays in the evening would otherwise be unable to fish until the torch, which needs fish bones. Without a light you can fish the first zone only, the hook window is 30% shorter, hand-gathering in tide pools is blocked and no silhouettes are visible. The torch lifts all of that.
8. **The observed grid is four strips** (time of day, month, water, bait) rather than a four-dimensional grid. Each cell is filled when caught under that condition, dashed when a rumour names it. Water and bait columns show only zones the player has fished and bait types they have held, so the columns themselves do not leak where a fish lives.
9. **Recipes are worked out by handling materials.** A recipe is a silhouette once one ingredient has been held, and known once every ingredient and tool has been held. Journal pages reveal recipes early. This replaces "pages reveal others" as the only route and guarantees nothing is locked behind a random bottle.
10. **Bottles have a pity timer for every page**, not only the bearing: if a page is available, a bottle is guaranteed within 12 casts (6 for the bearing), and the first wrack-line pick each day is a bottle. Pages arrive in order.
11. **The catch basket holds 12.** This makes "sorting the catch" a real choice, as the spec asks, without survival pressure.
12. **Small fish redraw before they steal.** A fish below the hook's window is re-drawn; the bait is stolen only if every draw was too small. A literal reading (any small fish steals) lost the bait on half of all casts with a bone hook.
13. **The island sits off Belize** (17.3°N 87.6°W, sun maths in `America/Belize`), which makes bonefish, permit and tarpon in one lagoon honest.

## Content

14. **Island species list changed from the seed list.** Caribbean reef octopus (*Octopus briareus*) replaces common octopus: it is the nocturnal reef species of the region. Added yellowfin mojarra (a common flats fish for sight casting), spotted moray (a night fish), Sally Lightfoot crab and the Puerto Rican sand crab (so the bait itself is a field guide entry). Total: 15 fish, 6 other creatures, 3 sightings.
15. **Bar jack is lure-only and permit is sight-only** in the game; both will take a blind bait in reality. Recorded in each occurrence's `designNotes`.
16. **Spotted moray maximum is capped at 120 cm** (larger lengths are reported) so the length-weight curve stays near the record weight.

## First port (M2)

17. **The port region is "The Cayes"**, a lightly fictional Belize fishing town (Port Esperanza) with four spots: the Town Pier (no boat needed, so coins can be earned on arrival), Mangrove Creek, Patch Reef and the Cut (all need the skiff). Fourteen new species; the island's species reappear where they really would.
18. **Prices are set from simulator output with a human factor of about 0.35.** The bot lands a fish every 15 seconds; a person also walks to the market, re-baits and misses bites. The pier simulates at 1,500 to 2,000 coins an hour, taken as about 650 for a player, which puts the first shop rod (420) at roughly 40 minutes. This is the least certain number in the game and needs real play to check.
19. **The cast net reuses the gathering system.** Throwing it on the sardine school is a tool-gated hand-gather; the field guide records the method as "by hand". A true net method is reserved in the schema for crab pots and nets in M3.
20. **Two people sell as well as talk.** Marisol runs the tackle shop and Mr Alvarez the boatyard; their errands appear at the top of their shop. Old Tobias is the old salt. Delphine at the fish market buys the catch and has no chain yet. The biologist and tag-and-release wait for M4.
21. **The wreck is reachable after the island** by skiff, as a daily salvage node on Wreck Beach. It is a hook for a later quest, not yet a scene.
22. **Legendaries are wired but none is placed.** The schema, spawn check and catch-once rule exist and are tested through the reducers' code path; Tobias's last errand gives the first clue ("the Bishop"). Placing it is M4 content.
23. **The orders board names species the player may not have caught**, shown as silhouettes. This is a deliberate small leak: an order is a rumour that a fish exists.

## Opening (after Andy's first play, 2026-11-17)

24. **A guided opening replaces being dropped on the beach.** Three short story cards, then coach marks walk the player through one action at a time: the rod, three sand fleas, the map, Rocky Point, a cast (with an animated drag demo), the wait, the strike, keeping the fish and the field guide. The beach shows only the hotspot being taught and the bottom bar appears when there is somewhere to go. The step is derived from state, so wandering off just points the player back; "Skip tutorial" is always there.
25. **The first catch is rigged to succeed.** Until the first fish is landed the wait is three seconds, there is always a nibble first, the bite is always a landable fish, and the strike window is at least 2.2 seconds. This bends the catch model for one cast, on purpose.
26. **The "Thinking" note now rings the relevant hotspot in gold** when you are at the right place, so later goals ("loose stones at Rocky Point") point at the exact thing to tap.

## Schema additions (spec section 11)

- `Species`: `tint` (placeholder colours), `gathersAs` (hand-caught bait creatures go into the bag as an item); `lengthCm.measure` gains `CL`, `ML`, `SH`.
- `SourceRef.accessed` may be `"pending-review"`.
- `Zone`: `cast` (false for hand and trap-only zones), `blurb`.
- `Location`: `blurb`, `solarTz` (real zone for sun maths when `tz` is `"device"`), `sightZones`, `map`, `scene.painter`; `kind` gains `camp` and `gather`.
- `Hotspot`, `GatherNode`, `Item`, `Recipe`, `Page`, `Rumour`, `JunkTable`, `RigPreset`, `Region`, `Person`, `Quest`, `Shop`: defined in `src/content/schema.ts`, which is the reference.
