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
22. *(Superseded by 27.)* Legendaries were wired but unplaced at the end of M2.
23. **The orders board names species the player may not have caught**, shown as silhouettes. This is a deliberate small leak: an order is a rumour that a fish exists.

## Opening (after Andy's first play, 2026-11-17)

24. **A guided opening replaces being dropped on the beach.** Three short story cards, then coach marks walk the player through one action at a time: the rod, three sand fleas, the map, Rocky Point, a cast (with an animated drag demo), the wait, the strike, keeping the fish and the field guide. The beach shows only the hotspot being taught and the bottom bar appears when there is somewhere to go. The step is derived from state, so wandering off just points the player back; "Skip tutorial" is always there.
25. **The first catch is rigged to succeed.** Until the first fish is landed the wait is three seconds, there is always a nibble first, the bite is always a landable fish, and the strike window is at least 2.2 seconds. This bends the catch model for one cast, on purpose.
26. **The "Thinking" note now rings the relevant hotspot in gold** when you are at the right place, so later goals ("loose stones at Rocky Point") point at the exact thing to tap.

## Depth and collection (M4, M5)

27. **Two legendaries, one per region so far.** *Old Ironjaw*, a 160 cm great barracuda off the Rocky Point drop-off (day, November to March, a spoon), and *the Bishop*, a 236 cm tarpon in the mouth of the Cut (dusk, June to August, big tides, live sardine or plug). Every condition is a clue earned from a person or a museum wing and shown as a checklist on the log's Legends page; nothing reveals a condition the player has not been told. A legendary can be caught once; losing the fight writes the story and leaves him in the water. Both are protected or kept by the existing rules (the Bishop is a tarpon, so he is released).
28. **Reels now have line capacity**, which the spec listed but the fight model ignored: a fish that out-pulls the rig strips line until the spool is empty, and a bigger reel buys time. Without it, any fish stronger than the rig was lost in seconds, so no fight could last the 60 to 120 seconds the spec asks of a legendary.
29. **Legendaries carry a stamina multiplier** (`fight.staminaMult`). Tuned with the bot: the Bishop takes about 78 seconds on the top rig and is unwinnable below it; Ironjaw is roughly a coin flip in about a minute on the graphite rig and easy on the offshore rod. The bot plays a perfect, steady game, so a person will lose more of these.
30. **Big-game gear** (a 30-strength rod and line and a lever-drag reel) appears at Marisol's only after Tobias's last errand. Prices are first guesses.
31. **Tag and release.** Dr Imani Reyes appears once the skiff is bought and runs four errands. Her tagging kit pays for every protected animal released (25 coins × (1 + length in metres)). Releasing ordinary fish still pays nothing, as before.
32. **Moon and tide are computed, weather is not.** The moon phase is real; tides are simply "spring" near new and full moon and "neap" otherwise. Weather from the spec's M4 is not built.
33. **The museum** has a wing per region of every kept species (protected animals, sightings and bait creatures are excluded because they cannot be kept). Donating takes the biggest one in the basket. A finished wing pays 40 coins per specimen and reveals any legendary clue sourced from it. The aquarium and livewell are not built.
34. **Badges** are fourteen, derived from state except "grand slam", which is latched when bonefish, permit and tarpon are caught on the same local day.

## Research (spec section 12)

35. **The island species records were checked against live sources on 17 November 2026.** Details are in `research/castaway-island/dossier.md`. Several length-weight sets were replaced so that weight at maximum length lands within 30% of the record. Maximums changed for schoolmaster (now 79.1 cm FL), bar jack, bonefish (down to 80 cm FL), permit (up to 122 cm FL), spiny lobster, queen conch and Sally Lightfoot crab. Queen conch is now IUCN Near Threatened. The spotted moray is no longer absent by day. Occurrence records are still unchecked. 
36. **Bonefish and permit stay sellable**, Andy's call on 17 November 2026, although Belize law (SI 114 of 2009) makes them catch-and-release only. Selling them keeps both in the museum wing and on the orders board. The departure is recorded in each occurrence's `designNotes`, and the field guide carries the real rule as a fact. Tarpon stays release-only.
37. **The island occurrence records were checked on 17 November 2026**, and every island source is now dated (details in the dossier).
    - Bonefish, great barracuda and houndfish are now the same in every month. Belize guides report no season for the first two, and nothing was found for the third.
    - Permit, tarpon and mutton snapper keep their seasons, reshaped to Belize guide reports and the Gladden Spit spawning months.
    - Yellowtail now leans harder to night, mutton snapper bites through the day, and tarpon bite more by day.
    - Bonefish take cut bait more often.
    - Two rumours were rewritten so that they are true of real fish.
    - Old Ironjaw's November to March window no longer matches any barracuda season, and is kept as a design choice.
38. **Independent review of the island data (spec step 7), 17 November 2026.** Three reviewer agents checked every rare and epic record and a 30% sample of the rest. Confirmed errors were fixed:
    - Permit's length-weight parameters now fit its fork-length measure, and its maximum is back to 110 cm.
    - Bar jack, ghost crab and sand crab facts and rumours were corrected.
    - The sand crab was resized.
    - Ironjaw's season clue no longer claims a barracuda migration.
    - Doubtful claims were reworded and source notes trimmed to what each page says.
    Details are in the dossier.
39. **Island rumours checked against the data and the real animals.** All pass. The spiny lobster gains a second rumour and the bottlenose dolphin gets two, carried by journal pages 7 and 4, so every rare and epic island species has two. The permit's "only crab" lines are softened, both in the Cut rumour and on journal page 8.
40. **The Cayes species records were checked against live sources on 17 November 2026** (details in `research/belize-cayes/dossier.md`).
    - Several length-weight sets were replaced so that weight at maximum length lands within 30% of the record. White grunt still misses, against an implausible 4.4 kg FishBase weight.
    - Maximums changed for gray snapper (89 cm), Nassau grouper (122 cm), cero (90 cm FL) and blue crab. Crevalle jack moves to a total-length measure (124 cm TL).
    - Fourteen unsourced or contradicted facts were corrected.
    - Nassau grouper stays release-only, which is stricter than Belize's April to November slot fishery.
    - The Cayes occurrence records were checked separately (entry 41).
41. **The Cayes occurrence records were checked on 17 November 2026**, and every source in the game's content is now dated.
    - King mackerel now peaks in spring (April to June), as Belize sources report; the winter peak was Florida's.
    - Nassau and black grouper are the same in every month: a lagoon patch reef is not a spawning site, and no Belize source gives a season.
    - Island species carry the island's corrected values.
    - Two rumours changed to match: the king mackerel rumour now names spring, and the Nassau grouper rumour keeps its story but no longer marks winter months.
    - The lobster occurrence now states that Belize's 1 March to 30 June closed season is not modelled.
42. **Independent review of the Cayes data (spec step 7), 17 November 2026.** Three reviewer agents checked every rare and epic Cayes record and a 30% sample of the rest. Details are in the Cayes dossier.
    - One error was fixed: the sardine's "loose scales" fact.
    - Doubtful values were corrected: snook level all year; Nassau grouper and mutton snapper scarcer on the patch reef while adults are at spawning sites; grunts and schoolmaster mostly by day on reefs and roots; crevalle jack neutral by day; lobster level all year; blue crab up in the rainy season.
    - Where the same species and habitat are on the island, the island data was changed to match.
43. **Cayes rumours checked against the data and the real fish.** All 31 rumours that touch the Cayes pass the data check, and every rare or epic species at the port has two obtainable rumours.
    - Seven were rewritten because they overstated reality: jacks against the sea wall, cero at dawn, black grouper at dusk, hogfish and crab, the snook and blue crab hyperbole, and Nassau grouper going back "by law" (Belize allows them in season, so it now says there are too few left).
44. **Art style: field-guide watercolour**, after the bake-off on 17 November 2026 (Andy's scores: watercolour 35, cartoon 34, gouache 28, out of 40). The style bible is `art/style.md`; three reference images are in `art/reference/`, and three more are listed there to make. The bake-off images stay out of git.
    - **ChatGPT for every asset type.** Its cut-outs came out with clean transparency, which settles most of the image-tool question. Midjourney's watercolour drifted toward realism; it stays an option only for scenes ChatGPT can't get right.
    - **Every bake-off scene had the wrong layout for casting**: deep water at the sides or the bottom, and the horizon too high. `art:prompts` now writes each scene's layout from its data: where the water starts, its cast zones from near to far, where its tap spots go and which spots to keep clear.
    - `art:prompts` builds every prompt from text blocks in `art/style.md`, so the bible is the one place to edit the style. `art:ingest` also accepts `scene_beach.png` as well as `scene__beach.png`.

## Schema additions (spec section 11)

- `Species`: `tint` (placeholder colours), `gathersAs` (hand-caught bait creatures go into the bag as an item); `lengthCm.measure` gains `CL`, `ML`, `SH`.
- `SourceRef.accessed` may be `"pending-review"`.
- `Legendary`: `fight.staminaMult`; clue `dimension` is one of where, when, season, bait, moon; `sourceQuestId` may be `museum:<region id>`.
- Quest `reward.clues` lists `"<legendary id>:<dimension>"`; hotspot conditions accept `quest:<id>` (done).
- `Zone`: `cast` (false for hand and trap-only zones), `blurb`.
- `Location`: `blurb`, `solarTz` (real zone for sun maths when `tz` is `"device"`), `sightZones`, `map`, `scene.painter`; `kind` gains `camp` and `gather`.
- `Hotspot`, `GatherNode`, `Item`, `Recipe`, `Page`, `Rumour`, `JunkTable`, `RigPreset`, `Region`, `Person`, `Quest`, `Shop`: defined in `src/content/schema.ts`, which is the reference.
