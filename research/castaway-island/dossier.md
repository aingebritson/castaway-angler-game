# Castaway Island research dossier

First pass: 17 November 2026. Scope: the 24 species records on the island, checked against live sources (spec section 12). The occurrence records (time of day, months, methods, baits) have **not** been checked yet, apart from one change to the spotted moray; see "Still to do".

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

## Selection against the quotas

The island is a small, early region (15 fish), so the 30-fish quotas apply at about half scale.

| Quota | Target at half scale | Island | Note |
| --- | --- | --- | --- |
| Night-biased fish | 2+ | 4 (squirrelfish, French grunt, spotted moray, schoolmaster) | Met |
| Dawn or dusk-biased | 2+ | 8 | Met |
| Real month-to-month change | 3+ | 5 (tarpon, houndfish, mutton snapper, barracuda, permit) | Met |
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

Already built (DECISIONS 27): **Old Ironjaw**, a 160 cm great barracuda off the Rocky Point drop-off, by day from November to March, on a spoon. The species and behaviour fit: barracuda are diurnal (FishBase), hold off reef edges, and take flashy lures. The size does not fit (open question 2).

## Open questions

1. **Resolved: bonefish and permit stay sellable** (Andy, 17 November 2026). This is a deliberate departure from Belize SI 114 of 2009, which makes them catch-and-release only. It is recorded in `designNotes` and disclosed as a field guide fact (DECISIONS 36).
2. **Both legendaries are smaller than their species' maximum.** Ironjaw is 160 cm against a 200 cm barracuda maximum. The Bishop is 236 cm against a 250 cm tarpon maximum. The spec says a legendary is "just above the normal in-game range". Options: raise them (Ironjaw about 190 cm and 40 kg, still under the 47 kg record), or cap the species' in-game maximum below the legendary.
3. **Two rumours overstate reality.** "They are after crabs and sand fleas, and nothing dead" (bonefish): anglers commonly use dead shrimp and conch. "Will look at nothing but a crab" (permit): permit also take shrimp and jigs. The spec asks for rumours that are true statements. These are true of the game data (DECISIONS 15), but not of real fish.
4. **Rarity targets per zone.** No single zone comes near 70/22/7/1. For example, lagoon lure fishing has no common species. Should the target apply per location, per zone, or per rig?
5. **Common length.** For some species FishBase's common length is far above the game's typical catch (permit 94 FL against 55; barracuda 140 TL against 85). I kept the game values because the spec defines common as the typical angler catch. They need guide-report sources in the occurrence pass.
6. **Yellowfin mojarra misses the 30% check whichever set is used.** FishBase's 530 g maximum weight is implausibly light for a 41 cm fish; every published set gives 0.74 to 1.35 kg. I kept the Mexico set and logged the conflict.
7. **Lobster and conch closed seasons.** Belize closes lobster from 1 March to 30 June and conch over the summer. This does not matter on the island, which has no market, but the Cayes market currently buys both all year.

## Still to do

- **Occurrence pass:** check phase and month modifiers, methods and bait affinities for every island occurrence against guide and charter reports and iNaturalist months. Mark confidence. This is most of the remaining work, and 48 of the island's occurrence sources are still `pending-review`.
- Sources not yet read: the Florida Museum profiles, NOAA green turtle and bottlenose dolphin pages, and the IUCN pages for the three sightings. Sighting sizes are unchecked.
- **Review (spec step 7):** a second agent checks every rare and epic record and 30% of the rest against the sources.
- **Rumours (spec step 6):** each rare and epic island species has two rumours. Their truth was checked above (question 3), but not against the occurrence data.
