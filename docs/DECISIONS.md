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

## Schema additions (spec section 11)

- `Species`: `tint` (placeholder colours), `gathersAs` (hand-caught bait creatures go into the bag as an item); `lengthCm.measure` gains `CL`, `ML`, `SH`.
- `SourceRef.accessed` may be `"pending-review"`.
- `Zone`: `cast` (false for hand and trap-only zones), `blurb`.
- `Location`: `blurb`, `solarTz` (real zone for sun maths when `tz` is `"device"`), `sightZones`, `map`, `scene.painter`; `kind` gains `camp` and `gather`.
- `Hotspot`, `GatherNode`, `Item`, `Recipe`, `Page`, `Rumour`, `JunkTable`, `RigPreset`, `Region`, `Person`, `Quest`, `Shop`: defined in `src/content/schema.ts`, which is the reference.
