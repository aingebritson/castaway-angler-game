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
45. **Real scene art sets its own horizon**, 18 November 2026. Image models ignore exact heights, so the scene prompt asks for a horizon about a third of the way down, and the scene data is fitted to the image afterwards. When a scene has real art, the engine takes the horizon from the top of its `waterPolygon`; placeholder scenes keep the painter's horizon. The cast zones are measured from that line, so they move with it.
    - Rocky Point uses the third version, generated from these prompts with the references uploaded (852 × 1846, not upscaled yet). It was picked from three candidates. Its horizon is at 0.23, measured from the image, and it is the scene reference in `art/style.md`.
    - Each scene in the prompt sheet also gets a Midjourney prompt of about 50 words, because Midjourney weights the first words and misreads "do not".
    - **Scene data is in art coordinates on every screen shape** (`src/scenes/fit.ts`). The art is cover-fitted and centred, so a wider screen crops its top and bottom and a narrower one its sides. The engine maps the horizon through the same fit, and publishes it as `--fit-*` CSS variables that place the hotspot buttons. Buttons are clamped clear of the top bar and the nav, which matters on an iPhone SE, where the bottom of the art sits behind the nav. Checked at 375 × 812 (no crop), 375 × 667 (horizon 0.29), the 520 × 1024 iPad frame (0.31) and a wide 520 × 768 window (0.25). Placeholder scenes are unchanged.
46. **Every scene has real art**, 18 November 2026: the nine remaining scenes from Andy's ChatGPT batch, all 852 × 1846, so no phone crops them. Each scene's data was fitted to its image.
    - Horizons were measured from the images: 0.23 for the beach, lagoon, town pier, patch reef and the Cut. Mangrove Creek is 0.31, where the open water meets the far bank.
    - Tap spots were moved onto the things they name where the art put them elsewhere. Port Esperanza's market, orders board, tackle shop, museum and boatyard are painted about 20% higher than the old spots, and Old Tobias's spot was in the water; all six moved. The grove's coconuts and vines moved, the camp's fire moved onto the painted stone ring, and the pier's sardines moved onto the painted school.
    - The first Cut had a sport-fishing boat on its horizon and the first Mangrove Creek a splash by the roots. Both were redone as edits of the same images with only that detail removed, so their horizons and tap spots stand.

## Learning to fish (after Andy's second play, 18 November 2026)

47. **Lessons replace "hold the ingredients, know the recipe".** Andy found the island a firehose: the knife in five minutes, the bamboo rod in fifteen, everything craftable at once, and no explanation of what a hook size, float, sinker or lure is for. Fifteen island lessons now carry the progression (`content/lessons.json`). Each waits for something that happens while fishing (the rusty hook wearing out, missed bites, a cast that falls short, line parting at the reef edge, a fish ignoring bait to chase a flash), then shows a card in three parts: what just happened, in the castaway's voice; how it works, in plain words for someone who has never fished; and what it now lets you make, with where to find the parts. Learned lessons are kept under Know-how in the journal. This departs from spec section 6 ("a recipe appears as a silhouette once the player holds one of its ingredients"); recipes are now only known once a lesson, a page or a person teaches them.
48. *(Superseded by 59.)* **Lessons come one at a time.** Each has a fallback that needs only time spent fishing, so a player who never misses a strike still learns about floats; and at least ten casts separate one lesson from the next, except cut bait, which follows the knife at once.
49. **The island opens up with the lessons.** Camp appears with the first lesson, the palm grove with the knife, and the lagoon once you have caught six kinds. Gather spots appear when you have a use for them (stones and vines with the knife, coconuts with cord, bamboo with the rod, feathers with the lure). The shell hook is no longer known from the first second, but losing the rusty hook teaches it at once, so the "never stuck" rule holds.
50. *(Superseded by 59.)* **Pages arrive alongside the player.** Each journal page waits for a number of lessons and now carries story and rumours only; the bone needle and the raft are still learned from the last two pages. The bottle pity timer went from 12 to 25 casts.
51. **The "Thinking" note follows the lessons**: make what you have just learned, naming the missing part and where it is (ringed in gold when you are there), and otherwise the hint for the next lesson. The Rig menu says what each slot is for, and the first lesson walks the player to the workbench.
52. **Pacing is measured by a bot that plays at human speed** (`npm run pace`, and the playthrough test). It is charged eight seconds of overhead per cast, two and a half seconds per tap, six per walk and twenty to read each card. It plays forty-minute sessions with nine-hour breaks, so daily restocks happen as they would for a person. Median over five runs: knife at 11 minutes of play, bamboo rod at 63, raft launch at about 3 hours 20 minutes. A person who explores and reads will be slower. The test fails if the knife comes before 8 minutes, the bamboo rod before 40, or the launch outside 110 to 240 minutes.
53. **Coconuts were the bottleneck** that held up the bamboo rod: the grove now holds four, regrowing every 12 minutes rather than three every 20.

## Thoughts and the other castaway (after Andy's third play, 18 November 2026)

54. **The castaway's own thoughts carry the story.** Andy wanted the island to feel like a light, mostly plotless story about someone with nothing to do but fish, and the persistent "Thinking" box at the top of the screen felt odd. The box is gone. In its place, thought cards drift up from the bottom of the screen at quiet moments, in the castaway's voice (`content/thoughts.json`, 28 thoughts). They mark what changes in their days: finding the rod ("Not a boat. Not a radio. A fishing rod."), the first fish, the first night, the second morning, ten, fifty and a hundred fish, the knife, the fire, the bamboo rod, the first page from the other castaway, the bearing, and the finished raft. The refrain is "When in doubt, cast it out." No talking-animal guide: the reason to keep fishing is the castaway's own.
55. *(Superseded by 61.)* **The next goal is only said out loud when it matters.** Goals now have a stable key and a nudge: "I have everything for a shell hook" comes up at once; a recipe still missing a part comes up after six casts spent fishing instead of gathering; a lesson's hint after twenty. Each comes back at most three more times, thirty casts apart. A lesson card counts as having said it. The gold ring on the hotspot and the dot on the map stay. The current goal is always at the top of the journal as "On my mind".
56. *(Superseded by 60.)* **Thoughts are spaced six casts apart**, never in the same moment as a lesson card, and wait until nothing is on the line and no other card or menu is open. Thoughts that belong straight after their cause (the rod, the first fish, the first page, the bearing, the finished raft) skip the gap. They are logged in the journal under Thoughts. Saves from before this get every thought they would already have had marked as had, so a returning player is not flooded.
57. **The pages say who wrote them.** Andy's first page, titled "Day 3", read as if it were his own day 3. The page card now says it is a message in a bottle and labels the page "From the other castaway's journal". The first page opens with "The handwriting is not mine. Somebody else was stranded here, before me." A thought follows it, and later thoughts come back to the other castaway, who never signs a name. The journal labels pages "Their journal".
58. **The castaway counts days by the calendar** (`days.n`, from the local day at the island), so thoughts can say "Still here" on the second morning and compare the player's time with the other castaway's seventy-one days.

## One thing leads to another (after Andy's fourth play, 25 November 2026)

59. **Every lesson has a cause, and is taught the moment it happens.** Andy found the story random: a page would mention knives, a similar thought would come minutes later, and the knife recipe later still. There are no more timers or cast gaps.
    - A lesson opens once its prerequisites are learned and what they taught has been made (`after`). From then on it waits for a trigger, and its counts start from the moment it opened, so it follows from what the player does with what they just made.
    - Each trigger has its own words for what happened, so the card always describes the real cause. Two examples: keeping four fish with nothing to cut them, or two missed bites with no float.
    - Every lesson also has a fallback trigger that only needs fishing, with honest words of its own, so the "never stuck" rule holds.
    - The rusty hook now gives out on the fifth fish, which teaches hooks. Making the knife teaches cut bait, and making the bone hook frays the old line, which teaches cord. Dusk, night and torch lessons follow casting in the dark rather than the clock.
60. **The other castaway's pages teach.** Ten of the sixteen island lessons come on a page: the knife, float, sinker, lagoon, bamboo rod, lure, torch, traps, smoking, and the bearing.
    - When such a lesson's trigger happens, the very next cast reels in a bottle. Its card tells what had just happened, then shows the page, then explains the idea and what it unlocks. Each page's text was rewritten to say exactly what it teaches.
    - Pages come in order, each lesson requiring the one before. They no longer wash up in the wrack or on a pity timer; a bottle that comes up when no page is due is empty.
    - The bone needle moved to the smoking page and the raft to a new "A way off" lesson on the last page. The last page waits until the drying rack is made and a new kind of fish is caught, with seven kinds of fish in all.
61. **Thoughts follow events, straight away.** No thought waits for a gap.
    - Each story thought has one cause: picking up the rod, the first fish, the first hook you made, nightfall, a new morning, a page, the tenth, fiftieth and hundredth fish, a fish that throws the hook, the campfire, the bamboo rod, the hull, the finished raft.
    - Thoughts about a page come with that page.
    - Thoughts that repeated a lesson card (the knife, the torch at night, the pulped bottle) were cut.
    - The next goal is said out loud only when something prompts it, and only once each:
      - the last part for a recipe comes to hand ("I have everything for…");
      - you walk into the place where a missing part is;
      - a raft part is finished.
62. **Pace without timers** (bot, median of five): knife at 9 minutes of play, bamboo rod at 53, raft launch at about 2 hours 40. That is faster than before at the end, because nothing waits on a cast count any more. Each lesson asks for a little more of its event instead: four kept fish, two missed bites, three long casts, six casts at the reef edge.
63. **Kinds means kinds of fish; the guide lists a fish only where it has turned up.**
    - "Kinds" (the three-kinds thought, the lagoon and last-page lessons, the bearing count) counts fish only. Crabs gathered for bait, lobster, octopus, conch and animals only seen no longer count. The bearing asks for seven, which is what eight with the sand crab used to mean.
    - In the field guide, each place shows an animal only if it was caught, seen or told of there. A French grunt caught at Rocky Point stays blank at the lagoon until it turns up there. Sightings now note the place. Anything known with no place on record yet goes under "Place not yet known".
    - Empty cells say "nothing on record", not "not yet": no one can prove a fish is not somewhere.

## Rio Negro research (region 2, 25 November 2026)

64. **The Amazon region is anchored at Barcelos on the middle Rio Negro** (Andy's choice, 25 November 2026). Barcelos is at 0.975°S 62.924°W, time zone `America/Manaus`.
    - The 38 species records in `content/species/rio-negro.json` are researched against FishBase, the 2019 Rio Negro basin checklist, and the record and status sources in `research/rio-negro/`. They have no occurrences yet; those wait for the build to define the locations and the flood-pulse zones.
    - Peacock bass stay sellable for now. Amazonas defines sport fishing as catch-and-release, so this is open question 2 in the dossier.
    - The arapaima is release-only.
65. **The Rio Negro legendary is drafted, not built:** *Old Gold*, a 95 cm speckled peacock bass in breeding colours, at the mouth of the lagoon, by day, September to November, on a popper. The spawn rule, clues and lore are in `research/rio-negro/dossier.md`. He goes into `content/legendaries.json` once the M3 build defines the lagoon and its lagoon-mouth zone and the people who give his clues. The speckled peacock bass's in-game maximum is lowered from FishBase's 99 cm to 90 cm, so he is just above the normal range (Andy, 25 November 2026). Whether he is released is still open.

## Wider world: the Rio Negro (M3, 25 November 2026)

66. **The Rio Negro is playable.** The port is *Porto Mariuá*, a lightly fictional river town at Barcelos, named after Mariuá, the village Barcelos grew from. It has five spots:
    - **Town Waterfront**: no boat needed, so coins can be earned on arrival. A matapi spot, and a sardinha school for the cast net.
    - **Main River**: canoe.
    - **Island Lagoon**: canoe. It has a dip-net stream for cardinal tetras.
    - **Flooded Forest**: canoe, and only while the water is up.
    - **Upriver Rapids**: the river boat.

    All 38 researched species now have occurrence records (100 records). Each is placed by its habitat codes in the 2019 basin checklist, and its `designNotes` say so. Phase and month values are game readings, marked `low` confidence (`medium` for the peacock bass and the sightings). The independent review (spec section 12, step 7) has not been run on these records yet.
    - The rare and epic species are payara, tambaqui, redtail catfish, jaú, electric eel, caparari and speckled peacock bass (rare at some spots), plus arapaima and piraíba (epic). Each has two rumours, all given by Porto Mariuá's errands.
    - Jaraqui come only from the cast net, because they rarely take a hook. Cardinal tetras come only from the dip net, and go into the bag as a bag of live fish to sell.
    - Sardinha and river prawns are bait animals (`gathersAs`). Peacock bass stay sellable; dossier open question 2 is still open.
67. **The flood pulse is a content-model defect, now fixed.** The spec says high and low water change which zones exist, but zones had no way to depend on the calendar. Five additions:
    - `Region.water` gives the level for each month: rising January to March, high April to July, falling in August, low September to December.
    - `Zone.water` lists the levels at which a zone exists. The Main River's sand beach exists at low and falling water, and its drowned bank at rising and high. The forest's "under the canopy" zone exists only at high water.
    - Location unlock `{ type: 'water' }`: the Flooded Forest can only be reached from January to August.
    - `scene.backgrounds` gives one picture per level. The Main River has a low-water view.
    - `Region.waterNotes` is a line for the map about what the water is doing now.

    The validator requires that, at every level, an open place has a castable zone at the bank. The scene rebuilds its zones when the month turns. In late November the forest is closed, and the map says it floods again about January. That is the real river, so the giant tambaqui are a January-to-August catch. No errand needs a forest fish.
68. **Boats belong to their waters (content-model defect).** Boat tier was global, so the Belize skiff would have opened river spots. `Item.boat.waters` now limits a boat to the regions it can be used in. The raft, skiff and sloop are Caribbean boats. Porto Mariuá sells a canoe with a rabeta (tier 1, 600 coins) and a river boat (tier 2, 6,000 coins), which goes two days upriver to the rapids.
69. **The passage is an item, so it needed no engine change.** Mr Alvarez's fifth errand ("Further than the reef": own a spinning reel) puts a *Passage to the Rio Negro* (a `chart` item, 2,500 coins) on the boatyard's list. The region unlocks on holding it, both ways. The unused `Region.passage` price stays unused. `Region.voyage` is new: the crossing's text, shown on the voyage card and written to the log the first time. Rio Negro rumours reach the Cayes only through Alvarez's teaser about a fish that breathes air.
70. **The fish finder works (content-model defect).** `minGear.requiresFinder` was in the schema, but nothing read it. A fish finder (tier 1, 3,200 coins at Casa do Pescador) is now needed to catch the piraíba in the deep channel and the redtail and jaú in the plunge pool. With one aboard, each zone label says how many kinds are below at that hour and month, and how many are not yet in the field guide. The spec's silhouettes in deep zones and the second finder tier are not built. A finder does not make fish bite; the game uses it for knowing where to anchor, and the occurrences' `designNotes` say so.
71. **Nets, traps and bait animals.**
    - `GatherNode.method: 'net'`: the dip net draws on the net pool, and the field guide records the method as "net". The cast net still counts as by hand (entry 19).
    - The matapi is a palm-stem prawn trap. Trap hauls and rod catches of bait animals now go into the bag. Before, a trap ignored `gathersAs`, and a rod-caught bait fish said "Into the bait bag" but added nothing. That never showed in the Cayes, because no bait animal there was caught by rod or trap.
72. **Stages and the sloop.** Stage 5 (Skipper) now also comes from the passage or the river boat. Stage 6 (Voyager) comes from the passage plus a fish finder. The sloop still opens nothing; its description no longer promises passages. An offshore Cayes spot for it is a follow-up.
73. **Prices for region 2, from the simulator.** On arrival gear (glass rod, mono, small hook, earthworms), the waterfront sims at about 2,000 coins an hour, the same as the Cayes pier on deckhand gear. On graphite gear, the lagoon mouth with a prop bait and the rapids with live sardinha sim at 6,000 to 6,600 an hour, against 4,000 to 5,900 at the Cut. The deep holes on big-game gear sim at 8,000 to 10,000 an hour, because big catfish are valuable. The flatwhiskered catfish's value went from 14 to 9 coins, because it is common there. Piranhas take most cut bait, as they do on the real river.
74. **Old Gold is built from the research draft (entry 65).** The 95 cm speckled peacock bass bites at the lagoon mouth by day, September to November, on a popper.
    - His clues come from Seu Raimundo (where), Seu Bené (when), Joelma (bait) and the Rio Negro museum wing (season).
    - The lagoon's speckled peacock occurrence gives day at least as strong as dawn, and peaks in his months, so the field guide agrees with his clues.
    - `staminaMult` 2.5: the bot lands him every time in about 57 seconds on the graphite popper rig, and never on a glass rod with a jig. That is just under the spec's 60 to 120 seconds. Offshore gear overpowers a 14 kg fish.
    - The legendary-size test now allows up to 10% over the species maximum, because the spec says "just above the normal range".
    - Whether he must be released is still open (dossier open question 6). For now the player chooses, as with any sellable fish.
75. **Placeholder art and the map.** `scenes/paintersRio.ts` draws the town and the five spots in blackwater colours, with beaches at low water and trunks in the river at high water. The map has a river placeholder and a line saying what the water is doing. `art:prompts` describes a river scene as blackwater with a far bank of forest, not a blue sea, and writes one prompt per water-level background, each listing only the zones at that level. Art for the six scenes, the low-water Main River, 38 specimens, 12 items and five portraits is still to come.
76. **Errands point at the right town.** With two ports, the "Thinking" note sent a finished Cayes errand to Porto Mariuá. It now prefers the current region's errands, and points a finished one at the town of whoever set it. A player whose rig has no bait off the island is told to buy some in town, not to dig sand fleas.

77. **The Rio Negro occurrence pass moves the flood calendar to the Barcelos gauge** (research, 25 November 2026). The build used Manaus timing. Chao's Project Piaba review (2001) gives the Barcelos gauge for 1967 to 1998: high June to August, lowest October to December. `Region.water` is now rising January to May, high June to August, falling September, low October to December. The beach, the drowned bank and the forest keep their months; only the canopy zone moves, to June to August.
    - Water-following month curves moved one month later with it. New seasons from species sources: the jaraqui run (December to February), the matrinxã run, the cardinal tetra's low-water season, a mild low-water peak for the big catfish and the river dolphin, and peacock bass lethargic in rising water.
    - Time of day: peacock bass peak by day (9 am to 3 pm), except on the sandbars at dawn and dusk; stingrays at night; giant otters by day; black piranha at dawn and dusk, with night 0.6 so piranhas do not steal most live baits after dark.
    - Two rumours and Old Gold's season clue were reworded for the calendar. Coins per hour move under 10% almost everywhere. 69 of 100 records stay low confidence; `research/rio-negro/dossier.md` lists what has no source.

## Schema additions (spec section 11)

- `Species`: `tint` (placeholder colours), `gathersAs` (hand-caught bait creatures go into the bag as an item); `lengthCm.measure` gains `CL`, `ML`, `SH`.
- `SourceRef.accessed` may be `"pending-review"`.
- `Lesson` (new, `content/lessons.json`): title, glyph, lesson, effect, hint, requires, `after` (items made first), `triggers` (each `if` conditions plus its own `seen` words), `via` (the page that brings it), unlocks. `Page.lesson`. Save fields `opened` (counts when each lesson opened) and `stage` (a page due on the next cast). Location unlock condition `{ type: 'lesson' }`; hotspot conditions `know:<lesson>` and `recipe:<recipe>`. `balance.lessons.gapCasts`.
- `Thought` (new, `content/thoughts.json`): lines, `when` (the lesson conditions plus `day`, `pages`, `know` and `flag`). Save v4 adds `thoughts`, `mind` and `days`.
- `Legendary`: `fight.staminaMult`; clue `dimension` is one of where, when, season, bait, moon; `sourceQuestId` may be `museum:<region id>`.
- Quest `reward.clues` lists `"<legendary id>:<dimension>"`; hotspot conditions accept `quest:<id>` (done).
- `Zone`: `cast` (false for hand and trap-only zones), `blurb`.
- `Location`: `blurb`, `solarTz` (real zone for sun maths when `tz` is `"device"`), `sightZones`, `map`, `scene.painter`; `kind` gains `camp` and `gather`.
- `Person.visualNotes` (optional): portrait-prompt detail, never shown in the game; the portrait prompt also names the person's town. Portraits show in the person panel, cropped to a circle around the face; people without one keep their emoji.
- `Item.visualNotes` (optional): art-prompt detail, never shown in the game, as on `Species`. The item prompt also names a crafted item's recipe inputs and blurb.
- Flood pulse: `Region.water` (12 levels: low, rising, high, falling), `Region.waterNotes`, `Zone.water`, `scene.backgrounds` (per level), location unlock `{ type: 'water', levels }`.
- `Region.voyage`; `Item.boat.waters` (regions a boat can be used in); `GatherNode.method` (`hand` or `net`); `CatchCtx.finder` reads `minGear.requiresFinder`.
- `Hotspot`, `GatherNode`, `Item`, `Recipe`, `Page`, `Rumour`, `JunkTable`, `RigPreset`, `Region`, `Person`, `Quest`, `Shop`: defined in `src/content/schema.ts`, which is the reference.
