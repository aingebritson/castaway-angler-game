# Castaway Island research dossier

Passes on 17 November 2026 (spec section 12): first the 24 species records, then the 34 occurrence records (time of day, months, methods, baits) at the Beach, Rocky Point and Lagoon Flats. Every island source is now read and dated; none is `pending-review`.

## Overview

The island is a fictional caye off Belize (17.3°N 87.6°W; sun maths in `America/Belize`, DECISIONS 13). It has the habitats of the Belize Barrier Reef lagoon: a sandy beach, rocky shore with tide pools, turtle-grass and sand flats, a lagoon channel, and a reef edge dropping into deeper water. All 24 species are real and occur in this region.

The content was first written from memory (DECISIONS 2). This pass fetched FishBase, SeaLifeBase, the FishBase and SeaLifeBase length-weight tables, NOAA Fisheries, Belize government notices and IGFA record data. It then corrected the records. Every changed value cites the page it came from, and those sources now carry `accessed: "2026-11-17"`.

## Habitats and zones

| Location | Zone | Real habitat |
| --- | --- | --- |
| Beach | sand, swash | Sand beach; ghost crabs above the tide line, mole crabs in the swash |
| Rocky Point | tide pools, shallows, reef edge, drop-off | Ironshore and rubble, then patch reef sloping to the fore-reef |
| Lagoon Flats | flats, channel | Turtle grass and sand flats; a tidal channel through the lagoon |

## What changed

### Conservation and law

| Species | Before | After | Source |
| --- | --- | --- | --- |
| Queen conch | IUCN `NE` | **`NT`** (assessed 2 June 2025) | SeaLifeBase, Red List version 2025-2 |
| Queen conch | ESA note unsourced | Confirmed: listed as threatened, final rule 14 February 2024 | NOAA Fisheries bulletin |
| Green turtle | LC (2025), unsourced | Confirmed from news coverage of the 2025 Congress. The Red List page itself was not read. | Mongabay and others |
| All other fish and invertebrates | `pending-review` | Status confirmed as shown on FishBase or SeaLifeBase | FishBase, SeaLifeBase |

**Deliberate departure:** Belize law makes bonefish and permit catch-and-release only, as well as tarpon (Statutory Instrument 114 of 2009, Fisheries Act Chapter 210). The game keeps bonefish and permit sellable by choice and says so in the field guide (open question 1).

### Sizes and length-weight parameters

The spec says to check weight at maximum length against the record weight, and to choose another parameter set if they differ by more than 30%. The record used is the IGFA all-tackle record where known; otherwise it is FishBase's largest published weight. "Weight at max" below is computed with the new parameters.

| Species | Max length (cm) | a, b (new) | Weight at max | Record | Difference | Parameter source |
| --- | --- | --- | --- | --- | --- | --- |
| Sergeant major | 22.9 TL | 0.0246, 2.85 | 0.18 kg | 0.20 kg (FB) | −8% | Brazil TL set (FB Bayesian was +37%) |
| Bluehead wrasse | 25 TL | 0.00912, 3.02 | 0.15 kg | none | – | FB Bayesian |
| French grunt | 30 TL | 0.01349, 3.00 | 0.36 kg | none | – | FB Bayesian |
| Yellowfin mojarra | 41 TL | 0.0282, 2.74 | 0.74 kg | 0.53 kg (FB) | **+40%** | Mexico TL set, the only one covering adults. See open question 6. |
| Yellowtail snapper | 86 → **86.3** TL | 0.0235, 2.74 | 4.7 kg | 4.1 kg (FB) | +16% | Brazil TL set (Bayesian was +90%) |
| Schoolmaster | 67 TL → **79.1 FL** | 0.0194, 2.978 | 8.7 kg | 10.8 kg (FB) | −19% | Southern Florida FL set, the same study as the max length |
| Squirrelfish | 61 TL | 0.01585, 2.95 | 2.9 kg | none | – | FB Bayesian |
| Spotted moray | 120 TL (capped; 200 reported) | 0.00102, 3.07 | 2.5 kg | 2.5 kg (FB) | −1% | Brazil TL set |
| Bar jack | 69 → **73** FL | 0.0192, 2.954 | 6.1 kg | 8.2 kg (FB) | −25% | US Virgin Islands FL set (20–73 cm) |
| Houndfish | 150 TL | 0.00112, 3.10 | 6.2 kg | 6.4 kg (FB) | −3% | FB Bayesian |
| Bonefish | 90 → **80** FL | 0.00729, 3.187 | 8.5 kg | 7.3 kg (IGFA) | +17% | Florida Keys FL set (n=518). At 90 cm every set was 35–70% over the record. |
| Mutton snapper | 94 TL | 0.0113, 3.05 | 11.8 kg | 15.6 kg (FB) | −24% | Florida east coast TL set (Bayesian was −37%) |
| Permit | 110 → **122** FL | 0.02884, 2.86 | 26.7 kg | 27.2 kg (IGFA) | −2% | FB Bayesian. FishBase gives 122 cm FL as the maximum. |
| Great barracuda | 200 TL | 0.00851, 2.93 | 47 kg | 47 kg (record cited by FB) | +1% | FB Bayesian |
| Tarpon | 250 TL | 0.0074, 3.0 (kept) | 116 kg | 130 kg (IGFA) | −11% | Geometric mean of the USVI TL set and FB Bayesian. Either alone misses by 36–37%. |
| Spiny lobster | 20 → **18.1** CL | 1.41125, 2.764 | 4.2 kg | 2.2 kg at 14.2 cm CL (SLB) | −2% at 14.2 cm | Cuba CL set. 18.1 cm CL is the largest recorded on SeaLifeBase. |
| Reef octopus | 12 ML | 2.0, 2.6 (derived) | 1.3 kg | 1.5 kg (SLB) | −15% | No published set. Derived to fit the maximum weight. |
| Queen conch | 35 → **30** SH | 0.514, 2.63 | 3.9 kg | 3.3 kg (SLB) | +19% | Belize female shell-length set (r² 0.53, weak) |
| Sally Lightfoot crab | 8 → **8.7** CW | unchanged | – | – | – | SeaLifeBase maximum carapace width |

### Record notes (flavour text)

| Species | Before | After |
| --- | --- | --- |
| Bonefish | IGFA "a little over 8.5 kg" | IGFA all-tackle 16 lb (7.3 kg), Bimini, 1971 |
| Yellowtail snapper | IGFA "roughly 5 kg" (unsourced) | FishBase's largest published weight, 4.1 kg |
| Mutton snapper | IGFA "about 15 kg" (unsourced) | FishBase's largest published weight, 15.6 kg |
| Permit | IGFA about 27 kg | Confirmed: 60 lb, Brazil, 2002 |
| Great barracuda | IGFA about 46 kg | Confirmed: the hook-and-line record cited by FishBase is 103 lb, Bahamas |
| Tarpon | IGFA about 130 kg, West Africa | Confirmed: 286 lb 9 oz, Guinea-Bissau, 2003 |

The IGFA figures come from a secondary table of the IGFA database (data as of June 2022), because the IGFA site cannot be read without a browser. Treat them as medium confidence.

### Behaviour

- **Spotted moray, time of day.** The record gave 0 by day. FishBase says it is active during the day. A telemetry study in Belize (Young and Winn 2003) found tagged spotted morays moved mostly at night. Changed Rocky Point to dawn 0.6 and day 0.3 (were 0.3 and 0). It is still mainly a night fish.
- **Confirmed as written:** squirrelfish nocturnal (FishBase); great barracuda diurnal (FishBase); yellowtail snapper feeds mainly at night (FishBase); Caribbean spiny lobster autumn mass migrations (SeaLifeBase), matching the October–November peak.
- **Sally Lightfoot crab is correct for the Caribbean.** I suspected *Grapsus grapsus* was Pacific only, but SeaLifeBase gives its range as including the West Indies. *G. adscensionis* is the eastern Atlantic species.

### Simulator effect

The simulator was run at Rocky Point (angler and toolmaker rigs) and Lagoon Flats (angler and angler-lure rigs), at dawn, dusk and night, with 20,000 casts each, before and after the changes. The only visible changes:

- Schoolmaster now reaches 79 cm. Landing rate on the toolmaker rig falls from about 80% to 73% in the shallows.
- Spotted moray share at dawn in the shallows rises from 6% to 11%.
- Zone rarity shares move by less than 2 points. All tests pass (60/60).

## Occurrence pass

The 34 island occurrences were checked against guide and lodge month-by-month pages, Florida Museum profiles, FishBase and SeaLifeBase behaviour notes, Animal Diversity Web, and published studies. Seasonal values follow what anglers in Belize report. Studies from Florida were used only for time of day and diet, because seasons there differ.

### Months

| Species | Before | After | Why |
| --- | --- | --- | --- |
| Bonefish | Winter peak (1.2), summer low (0.8) | **Flat 1.0** | Belize guides call bonefish a daily option in every month. The spec says year-round species are 1.0. |
| Great barracuda | Winter peak (1.3) | **Flat 1.0** | The winter peak is a Florida Keys pattern. A Belize charter listing says barracuda fishing does not vary through the year. |
| Houndfish | Summer peak (1.4) | **Flat 1.0**, confidence low | No source found for any season |
| Permit | Peak April to July, low from August | Peak **March to August** (1.3–1.5), 1.1 in September, lowest in January (0.7) | Lodge guides: best from mid-February through August, still good in September and October; cold fronts spoil December and January |
| Tarpon | Peak June to July, 1.2 in September | Peak May to August; September **0.9**, March 0.9 | Migratory tarpon build from March, peak May to August, mostly gone by mid-September. Residents stay all year, so it never drops below 0.5. |
| Mutton snapper | Peak May | March raised to 1.2, April to 1.5 | Belize spawning aggregations run March to June around the full moon (Gladden Spit) |
| Yellowtail snapper | Small summer rise | Same rise, with winter months at 0.9 | Spawns year-round with a winter decline (Florida Museum) |
| Spiny lobster, green turtle, all others | – | Unchanged | Lobster's autumn peak matches its mass migrations. Turtle sightings peak with the May to November nesting season. |

**iNaturalist does not help here.** Research-grade Belize observations for all 24 species (place 6953) follow the tourist calendar: every species peaks in December to March, with a spike in March. After dividing by the shape of common reef-fish observations, the only signal left is mutton snapper at about twice the expected rate in April. That is consistent with the spawning season, but rests on 67 records.

### Time of day

| Species | Change | Why |
| --- | --- | --- |
| Yellowtail snapper | Night 1.2 → **1.5**, dusk 1.5 → 1.4 | Florida Museum calls adults nocturnal predators, and US Caribbean fishers target them at night (SEDAR 84) |
| Mutton snapper | Day 0.6 → **1.0**, dusk 1.6 → 1.4, night 1.2 → 1.0 | Feeds day and night (FishBase); picks food all day with strikes morning and evening (Florida Museum) |
| Tarpon | Day 0.5 → **0.8** | Feeds by day and by night (Florida Museum). Dawn and dusk stay highest because rolling tarpon are easiest to find then. |
| Bonefish | Dawn 1.5 → 1.2, dusk 1.4 → 1.2 | No source ties bonefish to light. They follow the tide (Florida Museum). Tide is not yet modelled for the island. |
| Spotted moray | (first pass) Day 0 → 0.3 | See above |

**Confirmed as written:** French grunt and schoolmaster feed over seagrass and sand at night (Florida Museum; a 2018 telemetry study in *Ecosphere*); squirrelfish is nocturnal; barracuda is diurnal; Caribbean reef octopus hunts only at night; ghost crabs shelter by day and forage at night; spiny lobsters leave their dens to forage at night; bluehead wrasse spawns at midday.

**Southern stingray** buries in sand by day and forages at night (FishBase). The game keeps it most visible by day because it is a sighting, and this is now stated in `designNotes`.

### Baits and methods

- **Bonefish** cut-bait affinity rises from 0.2 to 0.5. Bahamas guides use cut conch and freshly dead shrimp, though live shrimp and crab work best.
- **Two rumours rewritten** (open question 3, now resolved). Bonefish: "They are after crabs and sand fleas, and they like them alive." Permit: "The round silver fish with sickle fins wants a crab above anything else."
- The bar-jack lure-only and permit sight-only rules stay as disclosed design choices (DECISIONS 15).
- Every method and every cast zone still has at least three species.

### Simulator effect

The same 12 runs as the first pass:
- Lagoon bait fishing shifts toward uncommon fish (from about 10% to 17% of bites), because bonefish now take cut bait more often.
- Lure fishing in the lagoon sees fewer barracuda in January.
- Rocky Point moves by less than 2 points.
- Sight casting on the flats lands a tarpon bite in 0.6% of fish bites in January and 2.4% in June.

### Sources fixed

- The Florida Museum links used scientific-name slugs, which do not exist. They now use the real common-name pages for seven species, including the copies of those links at the Cayes.
- The schoolmaster profile returns 404, so it was replaced on the island by the telemetry study.
- "Guide fishing reports (general angler knowledge)" entries were replaced with named pages.
- The southern stingray's maximum disc width is corrected from 150 to 200 cm (FishBase). Green turtle and bottlenose dolphin sizes match NOAA.

## Review (spec step 7)

On 17 November 2026, three independent agents reviewed the records. They had no access to this dossier's reasoning and could not edit files.
- Two of them checked all 7 species that have a rare or epic occurrence on the island (tarpon, permit, great barracuda, mutton snapper, spiny lobster, reef octopus, bottlenose dolphin), their 12 occurrences, rumours and both legendaries.
- The third checked a seeded random 30% of the rest: 6 of 17 species (sergeant major, bar jack, yellowtail snapper, green turtle, ghost crab, sand crab) and 7 of 22 occurrences.

Every conflict they raised was checked against its source before anything changed.

### Errors found and fixed

| Record | Problem | Fix |
| --- | --- | --- |
| Permit | Total-length weight parameters were applied to a fork-length maximum. At 122 cm FL (about 148 cm TL) the true weight is 43–49 kg, far over the 27 kg IGFA record. My first pass missed this. | Use FishBase's only fork-length set (Florida, n=488, a=0.0531, b=2.803). Maximum back to 110 cm FL: 28 kg, +3% against IGFA. FishBase's own 122 cm and 36 kg figures exceed the rod record and are noted in the source. |
| Bar jack rumour | "Ignore bait but hit a moving feather" is false of the real fish | "Come hard at a moving feather" |
| Bar jack fact | "Many authorities now place it in Carangoides" overstates a split: FishBase, WoRMS and GBIF use *Caranx* | "Some references place it in *Carangoides*; FishBase keeps it in *Caranx*" |
| Bar jack description | "Chase moving prey and little else" | They also eat shrimp; reworded |
| Ghost crab fact | "Over three metres a second": field trials measured about 2.2 m/s | "More than two metres a second" |
| Sand crab size | Maximum 3 cm CL. Females average about 19 mm and the largest egg-bearing females are about 25 mm. | Min, common and max now 0.8, 1.6 and 2.6 cm. Placeholder weight reduced (16 g → 5 g at maximum). |
| Sand crab fact | "Only ever moves backward" | "Digs, swims and crawls backward" |
| Ghost crab, sand crab | SeaLifeBase sources claimed to support a maximum length the pages do not give | Supports text corrected; size now cites Wikipedia and a Trinidad study |

### Doubtful claims corrected

- **Barracuda record:** now the IGFA all-tackle record, 85 lb, Christmas Island, 1992, which the rule prefers. It was FishBase's 103 lb. Weight at maximum is +22% against it.
- **Old Ironjaw's season clue:** said "when the barracuda come inshore". That is a Florida pattern with no Belize source. The clue now speaks only of him: "In the cool months, November to March, and never in the heat."
- **Permit:**
  - Fact changed from "eat mostly crabs" to "crush crabs, clams and snails".
  - visualNotes: "orange-yellow patch" became "sometimes a yellow wash on the belly".
- **Tarpon:**
  - Scale fact changed from "wider than a palm" to "about 7 cm across".
  - The length-weight note gave the wrong reason the two published sets fail. It is corrected.
- **Mutton snapper:**
  - "Several Caribbean countries close the fishery": only the US Caribbean does (1 April to 30 June). Belize protects the spawning sites instead. Fact rewritten.
  - The spawning months are now Belize's March to June.
  - The reef-edge and drop-off records now give sand fleas the same weak pull.
- **Reef octopus:**
  - Maximum mantle length now cites Animal Diversity Web (120 mm). SeaLifeBase does not give it.
  - Common length changed from 8 to 6 cm (average about 54 mm).
  - "Iridescent" and "dark ring around each eye" have no source; replaced with "bright blue-green flecked with red-brown" and "dark red-brown eyes".
- **Spiny lobster:**
  - The record note now says "reported to about 4.5 kg". The length-weight set gives 4.2 kg at maximum.
  - "In autumn storms" changed to "In autumn": the storm trigger is a hypothesis.
  - The study link now uses its DOI.
- **Bottlenose dolphin:** the description no longer states the dawn and dusk bias as fact. That bias is a disclosed design choice in `designNotes`.
- **Yellowtail snapper:**
  - Caribbean spawning peaks in March and April, not Florida's May to July. The Rocky Point months now peak March to May.
  - The shallows record notes that adults live deeper (10 to 70 m).
- **Source wording:** the San Pedro Sun turtle page (April to November), the schoolmaster telemetry abstract (night movement when barracuda are scarce), the Belize tarpon months, the barracuda calendar and the permit law article now say only what the pages say.

### Left as they are, with reasons

- **Permit common length** (55 cm FL, about 4 kg) is low for Belize flats permit, but no source gives a typical catch size.
- **Lobster legal size and closed season** (7.6 cm CL minimum; closed 1 March to 30 June) are not modelled. The island has no market. See open question 7.
- **Sergeant major** common length: FishBase gives 15 cm SL, and the game uses 15 cm TL as the typical catch. The length-weight set comes from juveniles (1.5–7 cm) extrapolated to 22.9 cm. It still passes the weight check.
- **Ghost crab and sand crab** length-weight values have no published basis. They are marked as placeholders in their sources.
- **Unchecked IGFA figures:** the IGFA records for mutton snapper (30 lb 4 oz) and yellowtail snapper (11 lb, Bermuda 2004) were seen only in search excerpts. The record notes keep FishBase's weights, and both species pass the weight check either way.

## Selection against the quotas

The island is a small, early region (15 fish), so the 30-fish quotas apply at about half scale.

| Quota | Target at half scale | Island | Note |
| --- | --- | --- | --- |
| Night-biased fish | 2+ | 4 (squirrelfish, French grunt, spotted moray, schoolmaster) | Met |
| Dawn or dusk-biased | 2+ | 8 | Met |
| Real month-to-month change | 3+ | 3 (tarpon, mutton snapper, permit) | Met exactly. Barracuda and houndfish went flat in the occurrence pass. |
| Every method and zone has 3+ species | – | Beach sand and swash have 1 each; tide pools have 3 | Beach zones are hand-gather nodes, so this is acceptable |
| Release-only fish | 1+ | 1 (tarpon) | Bonefish and permit kept sellable on purpose (open question 1) |

## Long list

These are the species anglers and beachcombers really meet on Belize lagoon cayes, with the reason each was kept or cut. Cut species were chosen from knowledge of the regional fauna and have **not** each been checked against a Belize checklist. Many are good candidates for the Cayes region.

**Kept (24):** sergeant major, bluehead wrasse, French grunt, yellowfin mojarra, yellowtail snapper, schoolmaster, squirrelfish, spotted moray, bar jack, houndfish, bonefish, mutton snapper, permit, great barracuda, tarpon; Caribbean spiny lobster, Caribbean reef octopus, Atlantic ghost crab, Sally Lightfoot crab, Puerto Rican sand crab, queen conch; green turtle, southern stingray and bottlenose dolphin as sightings.

| Candidate | Why cut |
| --- | --- |
| Lane snapper (*Lutjanus synagris*) | Strong candidate; overlaps mutton and yellowtail on island gear |
| Gray (mangrove) snapper (*L. griseus*) | Mangrove fish; belongs in Mangrove Creek |
| Dog snapper, cubera snapper (*L. jocu*, *L. cyanopterus*) | Cubera is a Cut or legendary candidate; too big for island gear |
| White grunt, bluestriped grunt, tomtate, margate, porkfish | Grunt variety would duplicate the French grunt |
| Nassau grouper (*Epinephelus striatus*) | Critically Endangered, closed season in Belize; better as release-only content at the port |
| Red hind, coney, graysby | Patch-reef groupers; deeper water than the island reaches |
| Hogfish (*Lachnolaimus maximus*) | Mostly speared, rarely hooked |
| Stoplight and redband parrotfish | Belize bans taking parrotfish; release-only candidate for the Cayes |
| Blue tang, ocean surgeonfish, doctorfish | Herbivores, rarely take bait |
| Crevalle jack, horse-eye jack, blue runner | Channel and pier fish; in the Cayes |
| Ladyfish (*Elops saurus*) | Good lagoon candidate; a second jumper would overlap tarpon |
| Common snook (*Centropomus undecimalis*) | River mouths and mangroves; Cayes creek |
| Palometa (*Trachinotus goodei*), lookdown | Surf and pier fish; possible Cayes additions |
| Ballyhoo, redfin needlefish | Bait fish; houndfish covers the needlefish shape |
| Southern sennet | Small barracuda; would confuse the guide |
| Slippery dick, yellowhead wrasse, Spanish hogfish | Wrasse variety would duplicate the bluehead |
| Beaugregory, dusky damselfish | Damsel variety would duplicate the sergeant major |
| Glasseye snapper, blackbar soldierfish | Night reef fish; squirrelfish covers the shape |
| Green moray, goldentail moray, sharptail eel | One moray is enough on the island |
| Lionfish (*Pterois volitans*) | Invasive; a "keep every one" mechanic would suit the port |
| Spotted scorpionfish, lizardfish | Possible Rocky Point bycatch; low appeal |
| Checkered puffer, porcupinefish, scrawled cowfish | Possible novelty catches; may suit a later pass |
| Nurse shark (VU), lemon shark, blacktip, bonnethead (EN) | Sharks belong at the Cut and reef; release-only |
| Spotted eagle ray (EN) | Sighting candidate for the Cayes |
| West Indian manatee (VU) | Sighting candidate for Mangrove Creek |
| Hawksbill (CR) and loggerhead turtles | One turtle sighting on the island is enough |
| Great land crab, blue crab, stone crab, fiddler crabs, mangrove tree crab | Mangrove and creek creatures; Cayes |
| West Indian top shell, fighting conch | Possible hand-gathers; conch covers the role |
| Long-spined urchin (*Diadema antillarum*) | No echinoderm on the island yet; candidate for tide pools |
| Caribbean reef squid | Night jig candidate for the pier |

## Legendary

Already built (DECISIONS 27): **Old Ironjaw**, a 160 cm great barracuda off the Rocky Point drop-off, by day from November to March, on a spoon. The species and behaviour fit: barracuda are diurnal (FishBase), hold off reef edges, and take flashy lures. The size does not fit (open question 2). Its November to March window is now a pure design choice, because Belize barracuda show no season.

## Open questions

1. **Resolved: bonefish and permit stay sellable** (Andy, 17 November 2026). This is a deliberate departure from Belize SI 114 of 2009, which makes them catch-and-release only. It is recorded in `designNotes` and disclosed as a field guide fact (DECISIONS 36).
2. **Both legendaries are smaller than their species' maximum.** Ironjaw is 160 cm against a 200 cm barracuda maximum. The Bishop is 236 cm against a 250 cm tarpon maximum. The spec says a legendary is "just above the normal in-game range". Options: raise them (Ironjaw about 190 cm and 40 kg, still under the 47 kg record), or cap the species' in-game maximum below the legendary.
3. **Resolved: two rumours overstated reality** and were rewritten in the occurrence pass. "They are after crabs and sand fleas, and nothing dead" (bonefish): anglers commonly use dead shrimp and conch. "Will look at nothing but a crab" (permit): permit also take shrimp and jigs. The spec asks for rumours that are true statements. These are true of the game data (DECISIONS 15), but not of real fish.
4. **Rarity targets per zone.** No single zone comes near 70/22/7/1. For example, lagoon lure fishing has no common species. Should the target apply per location, per zone, or per rig?
5. **Common length.** For some species FishBase's common length is far above the game's typical catch (permit 94 FL against 55; barracuda 140 TL against 85). I kept the game values because the spec defines common as the typical angler catch. No guide source found in the occurrence pass gives typical sizes, so this stays open.
6. **Yellowfin mojarra misses the 30% check whichever set is used.** FishBase's 530 g maximum weight is implausibly light for a 41 cm fish; every published set gives 0.74 to 1.35 kg. I kept the Mexico set and logged the conflict.
7. **Lobster and conch closed seasons.** Belize closes lobster from 1 March to 30 June and conch over the summer. This does not matter on the island, which has no market, but the Cayes market currently buys both all year.

## Still to do

- **Rumours (spec step 6):** each rare and epic island species has two rumours; check each against the occurrence values as they now stand.
- **Moon and tide:** permit and tarpon in Belize are reported best around new and full moon tides. Mutton snapper aggregate at the full moon. The schema reserves `conditions.moon` and `conditions.tide`, but no island occurrence uses them yet.
