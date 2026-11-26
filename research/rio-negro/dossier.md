# Rio Negro research dossier (region 2, M3)

**Build status (M3, 25 November 2026):** the region is built (`docs/DECISIONS.md` entries 66 to 76). The locations are Porto Mariuá, the Town Waterfront, the Main River, the Island Lagoon, the Flooded Forest and the Upriver Rapids. The occurrence records are in `content/occurrences/` for those five spots, and the rumours come from Porto Mariuá's errands. Old Gold is in `content/legendaries.json` at `rio-lagoon` / `lagoon-mouth`. The occurrence pass (step 4) checked all 100 records on 25 November 2026 and moved the flood calendar to the Barcelos gauge; see "Occurrence pass" below. Still outstanding: step 7, an independent review, and open questions 2 (peacock bass sellable) and 6 (Old Gold released).

Started 25 November 2026. Steps 1 and 2 (region and long list) are done, the anchor at Barcelos is confirmed (Andy, 25 November 2026), and step 4's **species records** are written: `content/species/rio-negro.json`, 38 species, all validated. Step 5's **legendary is drafted** (Old Gold, a 95 cm speckled peacock bass) and waits on one decision (whether he is released). Occurrence records, rumours, the review and the simulator runs come next. Occurrences need the region's locations and zones, which are part of the M3 build.

## Region

**Anchor: Barcelos, middle Rio Negro, Amazonas, Brazil.** 0.975°S 62.924°W (Wikipedia); time zone `America/Manaus` (UTC−4, no daylight saving). Population 27,638 (2020).

Why Barcelos:
- It is the base of the Rio Negro sport fishery. A 2023 study calls it the "international capital of freshwater sport fishing", and in the 2013/14 season 3,219 sport anglers fished from it.
- It sits on the Mariuá archipelago, more than 1,000 islands with lagoons, beaches and flooded forest.
- Sport anglers fish the Negro channel and the tributaries around it (Aracá, Demeni, Cuiuni, Caurés, Jurubaxi, Padauari, Unini).
- Arapaima are managed in the Unini extractive reserve, inside the Barcelos municipality.
- Barcelos is also the centre of the cardinal tetra trade, Brazil's ornamental fishery, which fits the net method the spec reserves for M3.

The port town can be lightly fictional, as Port Esperanza is, while the river, habitats and species stay real.

## Habitats and proposed spots

The Rio Negro is a blackwater river: acid (pH under 5), poor in nutrients, and dark with tannins. The 2019 basin checklist (Beltrão, Zuanon and Ferreira, ZooKeys 881) records 1,165 species across six sampled habitats. Its habitat codes are used in the long list below.

| Spot (proposed) | Real habitat | Checklist code | Water level |
| --- | --- | --- | --- |
| **The town** (port) | Barcelos waterfront, market, boats | – | Always |
| **Main river and beaches** | Negro channel; sand beaches and bars at low water | A main channel, F beaches | Beaches appear only at low water |
| **Lagoon** | Archipelago lake, joined to the river at high water | B lake pelagic, C lake bottom | Present all year; shrinks and isolates at low water |
| **Flooded forest (igapó)** | Forest standing in water | (not sampled as a code; fish recorded under B, D) | **Exists only at high water** |
| **Tributary rapids** | A rocky stretch of an upstream tributary | D tributaries, G rapids | Present all year; strongest at low water |

### The flood pulse

This is the region's signature mechanic in the spec: "high and low water change which zones exist".

- **Amplitude:** at Manaus the river averages about 28 m at the annual peak and 17.5 m at the minimum, a mean rise of 10.5 m, according to an SGB technical note. Records from 1903 to 1999 range from 13.65 m (1963) to 29.69 m (1953).
- **Timing at Manaus:** peak from May to July, low in October and November (SGB). A long-term average chart (1987–2007) shows about 22 m in January, about 28 m in June and July, and a minimum of about 19 m in November.
- **Barcelos** is about 500 km upstream. Lodges there fish the low water from about September to February or March, and describe the water starting to rise in December. Barcelos set a flood record of 10.33 m on its own gauge, beating 1976's 10.32 m. I could not read SGB's Barcelos station table: the bulletin links have moved. So the timing for Barcelos is medium confidence: highest about June and July, lowest about October to December.

**Barcelos gauge (found in the occurrence pass).** Chao (2001), reviewing Project Piaba, plots the Barcelos gauge from 1967 to 1998: high water "between June and August", low water "usually from December to March", a range of about 7 m in the channel. His monthly readings are lowest from October to December in both years he tabulates (1995/96: 216–239 cm; 1998/99: 313–315 cm in November and December, against 905 cm in July), and rise from January. So Barcelos runs about a month behind Manaus at the top of the year.

**Game seasons** (`Region.water`, changed in the occurrence pass from the Manaus reading the build first used):

| Months | Phase | Zones |
| --- | --- | --- |
| Oct–Dec | Low water | Beaches exposed; lagoons cut off and fish crowded; no flooded forest |
| Jan–May | Rising water | Beaches go under; the forest floods |
| Jun–Aug | High water | The canopy zone opens; fish spread out into the forest |
| Sep | Falling water | Fish leave the forest back into channels and lagoons; the beaches come back |

The beach (low and falling), the drowned bank (rising and high) and the Flooded Forest (open January to August) keep the months they had. Only the canopy zone moves, from April–July to June–August.

Anglers report the best peacock bass fishing as the water drops and in the low-water months, when fish concentrate (MidCurrent, January 2026; lodge pages). High water disperses them into the forest. That is the gameplay trade the mechanic offers: fruit-eaters and forest fish at high water, predators at low water.

## Long list

Each entry gives the checklist's habitat codes: A main channel, B lake pelagic, C lake bottom, D tributaries, E streams, F beaches, G rapids, H literature only. **Every fish below is confirmed in the Rio Negro basin by that checklist**, except where noted. Other creatures and sightings are from separate sources.

### Fish: proposed to keep (34)

| Species | Common names | Codes | Role and reason |
| --- | --- | --- | --- |
| *Cichla temensis* | Speckled peacock bass, tucunaré-açu | BDF | The region's signature fish; the weight and length records come from the Negro upstream of Barcelos (Santa Isabel, the Marié). The legendary. |
| *Cichla orinocensis* | Butterfly (Orinoco) peacock bass | BDF | Common lagoon peacock |
| *Cichla monoculus* | Butterfly peacock bass | BD | Smaller lake peacock |
| *Astronotus ocellatus* | Oscar, acará-açu | BD | Common lake cichlid |
| *Heros severus* | Severum | BDF | Small cichlid, bait-taker |
| *Geophagus altifrons* | Eartheater, acará-tinga | ABCDF | Beach and lake bottom-feeder |
| *Crenicichla lugubris* | Pike cichlid, jacundá | BDE | Small predator, lure-taker |
| *Hoplias malabaricus* | Trahira, traíra | BDEF | Night ambusher of lagoon edges |
| *Hoplias aimara* | Giant trahira, trairão | D | Tributary predator; rare and big |
| *Hydrolycus armatus* | Payara | D | Big rapids predator (the spec's payara) |
| *Hydrolycus scomberoides* | Smaller payara, cachorra | ABDF | Main-channel and beach payara |
| *Raphiodon vulpinus* | Dogfish, peixe-cachorro | BDF | Lure predator |
| *Boulengerella cuvieri* | Bicuda | BDFH | Fast surface predator; jumps |
| *Acestrorhynchus falcirostris* | Freshwater barracuda, peixe-cachorro | BDF | Lagoon lure fish |
| *Serrasalmus rhombeus* | Black (redeye) piranha | BCDF | The blackwater piranha; big and common |
| *Serrasalmus manueli* | Manuel's piranha | ABDF | A second piranha, of the main channel |
| *Colossoma macropomum* | Tambaqui | D | Fruit-eater of the flooded forest; rare in blackwater |
| *Myloplus rubripinnis* | Redhook pacu | BCDG | Pacu of rapids and lakes; fruit and seeds |
| *Brycon amazonicus* | Matrinxã, jatuarana | BD | Fruit-eating fighter of the forest and rapids |
| *Semaprochilodus insignis* | Jaraqui | BDF | Schooling detritivore; the town's staple food fish |
| *Leporinus fasciatus* | Banded leporinus, aracu-pinima | ABDFH | Bait fish of beaches and rapids |
| *Triportheus albus* | Sardinha | BDF | Surface schooling fish; live bait |
| *Plagioscion squamosissimus* | Silver croaker, pescada | ABCDF | Main-channel bait fish |
| *Pellona castelnaeana* | Apapá | ABD | Silvery surface fish |
| *Osteoglossum ferreirai* | Black arowana, aruanã-preta | BDF | **Endemic to the Rio Negro.** Surface fish that jumps for insects. |
| *Osteoglossum bicirrhosum* | Silver arowana | BDF | Its widespread cousin |
| *Arapaima gigas* | Arapaima, pirarucu | BD | Giant air-breather; managed and protected |
| *Phractocephalus hemioliopterus* | Redtail catfish, pirarara | BD | The spec's redtail catfish |
| *Brachyplatystoma filamentosum* | Piraíba | ABC | The giant catfish; main channel |
| *Pseudoplatystoma punctifer* | Barred sorubim, caparari | ABDH | Night catfish |
| *Pinirampus pirinampu* | Flatwhiskered catfish, barba-chata | ABCD | Main-channel catfish |
| *Zungaro zungaro* | Gilded catfish, jaú | D | Heavy tributary catfish of deep holes |
| *Potamotrygon motoro* | Ocellate river stingray | ABDF | Beach and shallows stingray; a sting hazard |
| *Electrophorus electricus* | Electric eel, poraquê | BDE | Night fish of lagoon edges |

### Fish: cut, with reasons

| Species | Reason cut |
| --- | --- |
| *Cichla nigromaculata* (H) | Literature-only record; too hard to tell from the other butterflies |
| *Cichla ocellaris* (BDF) | A third butterfly peacock would duplicate *orinocensis* and *monoculus* |
| *Astronotus crassipinnis*, *Hoplarchus psittacus*, *Uaru amphiacanthoides*, *Mesonauta festivus*, *Acarichthys heckelii*, *Satanoperca jurupari*, *Geophagus proximus* | Cichlid variety; would crowd the lagoon pool |
| *Symphysodon discus* (H), *Pterophyllum altum* (H), *P. scalare* | Aquarium fish, not angled; possible net catches later |
| *Hydrolycus tatauaia*, *H. wallacei* | Two more payara would confuse the guide |
| *Cynodon gibbus* (ABCDF) | A small payara relative; the payaras cover the shape |
| *Boulengerella lucius*, *B. maculata* | One bicuda is enough |
| *Acestrorhynchus falcatus* | Duplicates *falcirostris* |
| *Serrasalmus elongatus*, *S. gouldingi*, *Pygocentrus nattereri* | Two piranhas are enough. The red-bellied piranha is mainly a whitewater fish. |
| *Piaractus brachypomus* (H), *Myloplus asterias*, *Myleus setiger*, *Mylossoma aureum* | Pacu variety; one pacu plus tambaqui covers the role |
| *Brycon melanopterus*, *B. falcatus* | Duplicate *amazonicus* |
| *Semaprochilodus taeniurus*, *Prochilodus nigricans* | Duplicate the jaraqui |
| *Leporinus friderici*, *Anodus elongatus*, *Hemiodus immaculatus* | Small characins; little angling interest |
| *Triportheus angulatus* | Duplicates *albus* |
| *Plagioscion montei*, *Pellona flavipinnis* | Duplicates |
| *Potamorrhaphis guianensis* | Freshwater needlefish; small |
| *Brachyplatystoma rousseauxii* (CDF), *B. platynemum*, *B. capapretum*, *B. vaillantii* | Migratory giants of whitewater rivers; rare in the Negro. Piraíba covers the role. |
| *Pseudoplatystoma tigrinum* | Duplicates *punctifer* |
| *Sorubim lima*, *Hemisorubim platyrhynchos*, *Platynematichthys notatus*, *Leiarius marmoratus*, *Ageneiosus inermis*, *Hypophthalmus edentatus*, *Oxydoras niger* | Catfish variety beyond what one main-channel zone can hold |
| *Calophysus macropterus* (piracatinga) | Brazil has banned fishing it since 2015 (renewed 2023), because river dolphins were killed for bait. A good fact for the dolphin's field guide entry rather than a catch. |
| *Pterygoplichthys pardalis* (E) | Armoured catfish of streams; not angled |
| *Potamotrygon wallacei* (BDH, endemic), *P. orbignyi*, *Paratrygon aiereba* | One stingray is enough; *wallacei* is a small ornamental ray, a possible net catch |
| *Lepidosiren paradoxa* (B) | South American lungfish; a single record type, rarely met by anglers. A possible curio for later. |
| *Paracheirodon axelrodi* (cardinal tetra) | **Not a rod fish**, but the obvious net catch: Barcelos is the cardinal tetra capital. See "Other creatures". |

### Other creatures (proposed 6)

| Species | Method | Source and note |
| --- | --- | --- |
| Cardinal tetra, *Paracheirodon axelrodi* | net | Checklist codes DE. The Barcelos ornamental fishery (Project Piaba). Good for the M3 net method. |
| Amazon river prawn, *Macrobrachium* sp. (*M. brasiliense*, *M. nattereri* or *M. ferreirai*) | trap, hand | Lower Rio Negro prawn records. Species still to pick against a Barcelos source. Bait creature. |
| Freshwater crab, Trichodactylidae (*Sylviocarcinus pictus* or *Valdivia serrata*) | trap, hand | Recorded in the Branco, a Negro tributary near Barcelos. Species to confirm. |
| Apple snail, *Pomacea* sp. | hand | Common in flooded margins. **Not yet sourced for the Negro.** |
| Red-headed river turtle, *Podocnemis erythrocephala* (irapuca) | hand, release-only | The Rio Negro is its centre of distribution, in blackwater streams and flooded forest. IUCN VU (1996), Brazil NT. |
| Ocellate river stingray (also listed above) | – | Counted as a fish |

### Sightings (proposed 3, plus 1 alternate)

| Species | Status | Note |
| --- | --- | --- |
| Amazon river dolphin (boto), *Inia geoffrensis* | IUCN EN | Widely reported on the Negro. Ties to the piracatinga ban. |
| Giant otter, *Pteronura brasiliensis* | IUCN EN | Listed for the Rio Negro Ramsar site; uncommon near Barcelos |
| Tucuxi, *Sotalia fluviatilis* | IUCN EN | Recorded in Rio Negro fishery studies |
| *(alternate)* Amazonian manatee, *Trichechus inunguis* | IUCN VU | Best known from the lower Negro (Anavilhanas); uncommon but recorded near Barcelos |

IUCN statuses for the sightings are from general knowledge and still need checking.

## Species records (step 4, first part)

`content/species/rio-negro.json` holds 33 fish, 1 crustacean and 4 sightings. Every record cites FishBase (or another named source) plus the 2019 basin checklist for presence. The weight check uses the same rule as the Caribbean: weight at maximum length must be within 30% of the record.

### Changes from the long list

- **Cut: giant trahira (*Hoplias aimara*).** The checklist lists it in tributaries, but FishBase's range (Trombetas, Jari, Tapajós, Xingu, Tocantins, the Guianas, the lower Orinoco) does not include the Negro.
- **One payara, not two.** FishBase's two *Hydrolycus* pages look swapped. The 117 cm, 17.8 kg payara is listed under *H. scomberoides*, the smaller species, while *H. armatus* gets 89 cm and 8.5 kg. The game has a single payara, *H. armatus*, the rapids payara of the tributaries, sized to the 117 cm, 17.8 kg fish. This needs a better source.
- **Electric eel is *Electrophorus varii*.** The 2019 split made it three species. A Smithsonian photo record puts *E. varii* in the Rio Negro, and FishBase now restricts *E. electricus* to the Guiana Shield.
- **The pike cichlid is *Lugubria lugubris*** (formerly *Crenicichla*; 2023 revision).
- **Red-headed river turtle** is a sighting, because the content schema has no reptile kind for a hand catch.
- **Apple snail and freshwater crab dropped.** No Rio Negro source was found, and SeaLifeBase has no data on them. Blackwater is notoriously poor in snails and crustaceans.

### Weight check

| Species | Max (cm) | Weight at max | Record | Difference | Set |
| --- | --- | --- | --- | --- | --- |
| Speckled peacock bass | 90 TL | 11.7 kg | 13.19 kg (IGFA, 2010) | −11% | Bayesian. Capped below FishBase's 99 cm so Old Gold (95 cm) is the biggest; at 99 cm it was +19%. |
| Butterfly peacock bass | 74 TL* | 6.4 kg | 6.2 kg | +4% | Bayesian |
| Monoculus peacock bass | 80 TL | 8.0 kg | 9.0 kg | −11% | Bayesian |
| Oscar | 33 SL (≈40 TL) | 1.7 kg | 1.6 kg | +5% | Catalão Lake SL. The Bayesian set gives twice the record at 45.7 cm. |
| Trahira | 65 TL | 3.1 kg | 3.8 kg | −18% | Xingu TL |
| Payara | 117 TL | 18.7 kg | 17.8 kg | +5% | Xingu TL (*H. armatus*) |
| Dogfish characin | 64 SL | 1.9 kg | 2.1 kg | −11% | Madeira SL. FishBase's 80 cm field maximum gives +79%, so its text's 64 cm is used. |
| Bicuda | 88 FL | 5.4 kg | 6.0 kg | −9% | FL set (n=2, weak) |
| Black piranha | 41.5 SL | 3.2 kg | 3.8 kg | −16% | Madeira SL |
| Manuel's piranha | 43 TL | 1.9 kg | 2.5 kg | −23% | Xingu TL |
| Tambaqui | 108 TL | 32.6 kg | 40 kg | −19% | Amazonas State TL |
| Redhook pacu | 41.5 TL | 1.9 kg | 2.5 kg | −25% | Xingu TL |
| Jaraqui | 29.5 SL | 0.60 kg | 0.56 kg | +7% | Amazon females SL |
| Sardinha | 25.7 TL | 0.18 kg | 0.20 kg | −12% | Xingu TL |
| Silver croaker | 70 TL | 4.2 kg | 4.5 kg | −7% | Bayesian. At FishBase's 80 cm every set is 41–49% over. |
| Apapá | 70 SL (≈80 FL) | 5.9 kg | 7.1 kg | −17% | Madeira SL. The Bayesian set is fitted to total length, so it could not be used on fork length. |
| Silver arowana | 119 TL | 11.3 kg | 11.5 kg (reported IGFA) | −1% | Bayesian |
| Arapaima | 280 TL | 187 kg | 154 kg (IGFA) | +21% | Lower Amazon TL. FishBase's 450 cm is historical; at 300 cm the set is +47%. |
| Redtail catfish | 141 TL | 42.7 kg | 56 kg (IGFA) | −24% | Xingu TL |
| Piraíba | 230 SL | 165 kg | 155 kg (IGFA) | +7% | Madeira SL. The Bayesian TL set gives 394 kg at 280 cm. |
| Flatwhiskered catfish | 90 TL | 9.3 kg | 7.7 kg | +21% | Bayesian. At FishBase's 120 cm every set is more than twice the record. |
| Gilded catfish (jaú) | 140 SL | 52.6 kg | ~49 kg (FishBase text: 50 kg fish "not rare") | +7% | Serra da Mesa SL |
| Ocellate stingray | 50 CW | 10 kg | 10 kg | 0% | Derived (no disc-width set published) |

\* converted from FishBase's 61.7 cm SL; the conversion is an estimate.

No record weight was found for severum, eartheater, freshwater barracuda, matrinxã, banded leporinus, black arowana, caparari, electric eel or cardinal tetra. Their sets come from FishBase (Bayesian or the closest Amazon study), and their weights at maximum look plausible.

### Placeholders for the art track

The game has no silhouette shapes yet for cichlids, serrasalmids (piranha, pacu, tambaqui), catfish, arowanas, the arapaima or the payara. The records borrow the nearest existing shape (snapper, permit, shark, barracuda, snook, tarpon). Specimen art for all 38 is still to come.

### Values and fights

Base values and fight settings are first guesses on the Caribbean scale. Small cichlids and sardinha are worth 2–6 coins. Peacock bass, payara and redtail are worth 18–65. Piraíba is 120. Arapaima is release-only, at 0. The build should tune these with the simulator.

## Legendary (step 5, draft)

**Old Gold** (*Velho Ouro* in town), a 95 cm speckled peacock bass (*Cichla temensis*) in his breeding colours, at the mouth of the lagoon. He is drafted on 25 November 2026 and is not in `content/legendaries.json` yet, because his location, zone and clue sources need the M3 build.

### The real fish behind him

- **Weight:** the heaviest peacock bass the IGFA has recorded is 13.19 kg (29 lb 1 oz). Andrea Zaccherini caught it at Santa Isabel do Rio Negro, upstream of Barcelos, on 3 November 2010, on a prop topwater plug (Game and Fish, 2015). A 14 kg, 87 cm fish from the Marié River, a Negro tributary in Indigenous land, was submitted as a record in 2017; I found nothing saying it was ratified. FishBase's 12.2 kg is Gerald Lawson's 27 lb Rio Negro fish of December 1994, an older record.
- **Length:** the all-tackle length record has been raised three times on the Rio Marié: 91 cm (Rodrigo Salles, 4 September 2021, 25.5 lb), 92 cm (Salles, 25 August 2022, 25.3 lb) and 94 cm (Brent Van Niekerk, 7 September 2023; search excerpt only). FishBase's maximum is 99 cm TL.
- **Every one of these fish was caught between late August and late November, at low water.**
- **Behaviour** (IGFA, Harris and Salles, 2023; Wikipedia):
  - Peacock bass are diurnal predators, feeding hardest "between 9 am and 3 pm" on warm, sunny days.
  - In the low-water middle of the season the lagoons are packed with big fish preparing to spawn.
  - They hold close to fallen trees, and deep water at the mouths of lagoons.
  - Topwater flies are "unbeatable in the structure", and big ones move the big fish.
  - Breeding adults lose their speckles and turn golden-olive with three dark bars; some males grow a hump on the head.
  - Spawning begins at the end of the dry season, and the parents fast while they guard the brood.

### Spawn rule

| Condition | Value | Basis |
| --- | --- | --- |
| Location | The lagoon | Big fish crowd the lagoons at low water (IGFA) |
| Zone | The lagoon mouth (new zone, deep, with fallen timber) | Deep pools and lagoon mouths; fallen trees (IGFA) |
| Phase | Day | Diurnal; peak 9 am to 3 pm (IGFA) |
| Months | September, October, November (`[8, 9, 10]`) | The game's low water (Sep–Dec), and the months of every record fish above |
| Rig | Popper | The game's surface lure. The 2010 weight record took a prop topwater; IGFA advises big poppers in structure. The game's `plug` is a diving minnow, so it does not fit. |
| Moon | None | No source links peacock bass to the moon |

Four conditions, inside the spec's three to five. `chancePerCast` 0.1, the spec's default.

### Size

**95 cm TL, 13.9 kg** by the species' length-weight set. That is 1 cm over the 94 cm length record and about 5% over the 13.19 kg weight record, so he is bigger than anything ratified but not implausible. Three record fish check the set: it gives 11.3 kg at 89 cm (Florian Kaiser's fly fish, reported at 12.9 kg), 12.1 kg at 91 cm (reported 11.6 kg) and 12.5 kg at 92 cm (reported 11.5 kg).

**The species' in-game maximum is now 90 cm (11.7 kg)** (Andy, 25 November 2026), so he is "just above the normal range" as the spec asks. It was FishBase's 99 cm (15.7 kg), which let ordinary fish out-grow him, the same problem Ironjaw and the Bishop still have (castaway-island dossier, open question 2). At 90 cm the weight is −11% against the IGFA record and −4% against FishBase's 12.2 kg, so it passes the weight check. FishBase's 99 cm stays in the source note and the record note.

### Clues

| Dimension | Text | Source (to assign in the M3 build) |
| --- | --- | --- |
| where | "He lies under the fallen tree in the mouth of the lagoon, where the water goes deep." | A guide (quest) |
| when | "In the heat of the day, when the sun is high. He doesn't stir for the dawn." | A town fisher (quest) |
| bait | "He wants noise on the surface. A big popper, chugged hard across the top." | The tackle seller (quest) |
| season | "As the water drops and then lies low, September to November, when the lagoon is cut off and crowded." (Changed in the occurrence pass: September is now falling water.) | `museum:rio-negro` (the region's museum wing) |

"He doesn't stir for the dawn" is a statement about him, not the species. Big peacocks are taken on sandbars early and late in the day (IGFA), so the rumour must not say that of peacock bass in general. When the occurrence records are written, the lagoon-mouth zone must give speckled peacock bass a day phase and September to November months at least as strong as dawn, or the season and phase clues will read as wrong against the field guide.

### Lore

"A speckled peacock bass in his gold: the spots long gone, three bars as dark as charcoal, a hump on his head like a closed fist. Every low water the guides at Barcelos swear he has boiled under the fallen tree at the mouth of the lagoon, and every low water somebody's popper comes back with the hooks straightened."

### Draft record

```json
{
  "id": "old-gold",
  "speciesId": "cichla-temensis",
  "name": "Old Gold",
  "lore": "A speckled peacock bass in his gold: the spots long gone, three bars as dark as charcoal, a hump on his head like a closed fist. Every low water the guides at Barcelos swear he has boiled under the fallen tree at the mouth of the lagoon, and every low water somebody's popper comes back with the hooks straightened.",
  "lengthCm": 95,
  "spawn": {
    "locationId": "lagoon (id from the M3 build)",
    "zone": "lagoon-mouth",
    "phases": ["day"],
    "months": [8, 9, 10],
    "rig": ["popper"],
    "chancePerCast": 0.1
  },
  "clues": [
    { "dimension": "where", "text": "He lies under the fallen tree in the mouth of the lagoon, where the water goes deep.", "sourceQuestId": "(guide quest)" },
    { "dimension": "when", "text": "In the heat of the day, when the sun is high. He doesn't stir for the dawn.", "sourceQuestId": "(town fisher quest)" },
    { "dimension": "bait", "text": "He wants noise on the surface. A big popper, chugged hard across the top.", "sourceQuestId": "(tackle seller quest)" },
    { "dimension": "season", "text": "As the water drops and then lies low, September to November, when the lagoon is cut off and crowded.", "sourceQuestId": "museum:rio-negro" }
  ],
  "fight": { "staminaMult": 2.5 }
}
```

`staminaMult` 2.5 is a starting point between the Bishop (2) and Ironjaw (3.5). The bot must tune it to the spec's 60 to 120 seconds on the region's top rig.

### Kept or released

Real record peacock bass are released: Amazonas sport fishing is catch-and-release by decree, and the Marié fishery is catch-and-release. The draft proposes that Old Gold is released after the photograph whatever the species' sellable flag says. The schema has no release flag on a legendary, so the build would need one (open question 6). The Bishop is released only because tarpon are release-only.

## Occurrence pass (step 4, 25 November 2026)

The M3 build placed all 38 species at the five spots (100 records) by their checklist habitat codes, with generic time-of-day values and, for 75 records, flat months. This pass checked them against species sources. 60 records changed; 31 are now medium confidence (was 17). Every changed record says what changed and why in `designNotes`.

### The calendar

The build used Manaus timing (high April to July). The Barcelos gauge in Chao (2001) peaks June to August and bottoms October to December, so `Region.water` now reads rising January to May, high June to August, falling September, low October to December (see "The flood pulse" above). Every month curve that followed the water (the 25 records with a low-water, high-water or mild low-water curve) moved one month later with it, and every record now cites Chao instead of the SGB Manaus note.

### Months

| Species | Spot | Change | Why |
| --- | --- | --- | --- |
| Jaraqui | Town (cast net) | Flat → peak December to February (1.4–1.6), low at high water (0.6) | Adults run out of black water to spawn as the water starts rising, with a weaker dispersal run in mid-flood (Neotropical Ichthyology; Ribeiro and Petrere) |
| Matrinxã | Rapids, lagoon mouth | Flat → peak December to February (1.3–1.4) | A medium-distance migrant with spawning runs in rising water (Águas Amazônicas). The forest and drowned bank keep the high-water fruit curve. |
| Cardinal tetra | Lagoon stream (net) | Flat → peak October to February (1.3–1.5), low June and July (0.4) | The Barcelos piabeiros' season is low water, October to February (Chao 2001) |
| Redhook pacu | Rapids | Flat → mild low-water peak (1.2–1.3) | Barcelos pacu landings are highest in September, October and December (WIT 2015; search excerpt) |
| Piraíba, redtail, sorubim, barba-chata, jaú | Channel, waterfront edge, lagoon mouth, plunge pool | Flat → mild low-water peak (1.2–1.4 October to December, 0.6–0.7 at high water) | Large catfish fall back to the channels at low water (Madeira diet study); redtail eat fruit in the forest at high water (Águas Amazônicas) |
| Peacock bass (all three) | Flooded forest, drowned bank | Flat → 0.7 while the water rises, 0.9 at high water | Peacocks are "lethargic in rising water" (IGFA) |
| Amazon river dolphin | Waterfront edge, channel edge | Flat → mild low-water peak | Botos follow fish into the forest at high water and leave it for the rivers at low water (Martin and da Silva 2004) |

### Time of day

| Species | Change | Why |
| --- | --- | --- |
| Peacock bass (all three) | Peak moved from dawn (1.5) to day (1.4); dawn 1.2, dusk 1.1 | Feeding is heightened from 9 am to 3 pm on warm sunny days (IGFA). On the main-river sandbars, where big fish come "in the early mornings and late afternoons", dawn and dusk stay high. |
| Black piranha | Dawn and dusk 1.1 → 1.4, day 1.2 → 0.9, night 0.3 → 0.6 | Radio-tracked fish in Peru peaked at dawn; a reservoir study in Amapá found them most active from dusk to early morning. At night 1.0 piranhas stole most live baits after dark in the simulator, so night is held at 0.6, between the two studies. |
| Ocellate stingray | Night 0.6 → 1.3 (1.6 on the beach), day lowered | Mostly nocturnal feeders; big rays move from deep water by day into the shallows at night (Garrone Neto and Uieda 2012, upper Paraná) |
| Giant otter | Flat → day and twilight 1.2, night 0.3 | Mostly diurnal; 11% of den photos at night (PeerJ 2024) |

### Confirmed as written

- **Night feeders:** electric eel (nocturnal predator), redtail catfish (strictly nocturnal feeding in captive juveniles), sorubim (FishBase, for its congener *P. tigrinum*).
- **Tambaqui** in the flooded forest eating fruit through the flood (two tambaqui studies).
- **Arapaima** peaking at low water: pairs form from about September to January (Castello 2008).

### No source found

These keep the build's values, at low confidence: the time of day of trahira (a captive study found it switches between night and day), payara, piraíba, jaú, silver croaker, dogfish characin, bicuda, freshwater barracuda, apapá and Manuel's piranha; any season for the arowanas, payara, oscar, severum, eartheater and the small characins; and seasonal sightings of the turtle (it nests on Rio Negro beaches in October and December, at a spot the game does not have). Payara are fished at low water in the upper Negro's lodge season (mid-August to mid-November, The Fly Shop), but no source is about payara themselves.

### Rumours and clues affected

All 20 Rio Negro rumours were checked against the new values: every cell they mark is still at least 1.0.
- *tambaqui-high* said "April to July" and marked those months. It now says "through the high water, June to August".
- *arapaima-low* said "at low water, September to December". September is now falling water, so it says "as the water drops and the lagoon shrinks, September to December".
- **Old Gold's season clue** said "Only at low water, September to November". It now says "As the water drops and then lies low, September to November". His months are unchanged, and the speckled peacock at the lagoon mouth still peaks in them (1.4 to 1.7) with day above dawn.

### Simulator effect

The same 16 runs (4,000 casts, seed 7), before and after:
- **Coins per hour** move by under 10% in almost every spot and month, so the region's prices (DECISIONS 73) still hold. The waterfront on arrival gear moves 1–4%.
- **Night live bait on the sand beach:** −16%. Piranhas now steal 42% of baits there after dark (26% before).
- **The giant rig in the rapids' eddies at night:** −35 to −41%, from the same bait theft. The plunge pool, where that rig belongs, moves 1–10%.
- **The canopy zone** is gone in May and opens in June.

## Selection against the quotas (draft)

Thirty-four fish is at the top of the 25–35 range. The rarity column is a first draft, to be set per spot when the occurrence records are written.

| Quota | Target | Draft |
| --- | --- | --- |
| Rarity | ~12 common, 9 uncommon, 6 rare, 3 epic | **Common:** butterfly peacocks (2), oscar, severum, eartheater, trahira, black piranha, Manuel's piranha, jaraqui, banded leporinus, sardinha, pescada, apapá. **Uncommon:** speckled peacock bass, pike cichlid, dogfish, bicuda, freshwater barracuda, small payara, redhook pacu, matrinxã, both arowanas, caparari, barba-chata, stingray. **Rare:** payara, giant trahira, tambaqui, redtail catfish, jaú, electric eel. **Epic:** arapaima, piraíba, and a trophy speckled peacock bass where water and spot allow. |
| Night-biased (4+) | 4+ | Trahira, electric eel, caparari, barba-chata, jaú, redtail, piraíba |
| Dawn or dusk (4+) | 4+ | Peacock bass (first light), bicuda, payara, arowana |
| Real month-to-month change (6+) | 6+ | Almost every species, through the flood pulse: lagoon predators peak at low water, forest fruit-eaters at high water. Jaraqui and matrinxã make spawning runs as the water changes (to source). |
| Every method and zone has 3+ | – | To check once zones are fixed |
| Gear spread | – | Panfish (cichlids, piranha, sardinha) up to giants (piraíba, arapaima) |
| Release-only (2+) | 2+ | **Arapaima**: protected and managed under IBAMA rules in the Amazon. **Red-headed river turtle.** Peacock bass is a policy question (open question 2). |

## Law and conservation (first pass)

| Rule | Status | Source |
| --- | --- | --- |
| Sport fishing in Amazonas is catch-and-release | Decree 31.151 of 2011 defines sport fishing as pesque e solte. "Amateur" fishing may keep fish within limits. | Legisweb copy of the decree (search excerpt) |
| Peacock bass sport-fishing law | Bill PL 249/2023 (zoning; bans commercial fishing of tucunaré; personal consumption allowed) was reported as approved. **I could not confirm it was signed.** | Portal Amazônia; UFAM technical note |
| Arapaima | Fishing only under managed quotas in conservation units and fishing-agreement areas. Declared invasive outside the Amazon in 2026 (IBAMA IN 7/2026). Protected inside it. | IBAMA (news coverage, March 2026) |
| Piracatinga | National fishing and trade ban since 1 January 2015 (IN 6/2014), renewed in 2023 (Portaria Interministerial MPA/MMA 4), because river dolphins were killed for bait | ICMBio PDFs; Canal Rural |
| Commercial closed season (defeso) | November to March for several commercial species (pirarucu since 2005). **The Rio Negro species list and dates are still to confirm.** | – |

## Open questions

1. **Is Barcelos the anchor?** It fits every spec seed species, with one caveat: arapaima and tambaqui are scarcer in blackwater than in the whitewater floodplains near Manaus. The checklist records both in the basin (arapaima in lakes and tributaries; tambaqui only in tributaries). The game can keep them as rare and epic.
2. **Peacock bass: sellable or release-only?** The records keep them sellable for now. Amazonas sport fishing is catch-and-release by decree, and a 2023 bill bans selling tucunaré commercially. The game's market buys fish. This is the same kind of choice as bonefish in the Cayes.
3. **Resolved: the flood pulse follows the Barcelos gauge** (occurrence pass, 25 November 2026): rising January to May, high June to August, falling in September, low October to December (Chao 2001). The forest is open from January to August, as before. Real years vary by a month or more (the 1997/98 El Niño kept Barcelos 2 m low until March); the game uses one average year.
4. **Net method content.** Cardinal tetra (and possibly *Potamotrygon wallacei*) would be the first true net catches. The schema reserves the method.
5. **Resolved: the speckled peacock bass in-game maximum is 90 cm** (Andy, 25 November 2026), below Old Gold's 95 cm. FishBase gives 99 cm; the record fish run 89 to 94 cm.
6. **Is Old Gold released?** Real record peacock bass are released, and Amazonas sport fishing is catch-and-release. Releasing him needs a flag on the legendary.

## Still to do

- **Step 3:** confirm the selection and set rarity per spot and season.
- **Step 4, occurrences:** done (occurrence pass). 69 of 100 records are still low confidence; the gaps are listed under "No source found".
- **Other creatures quota:** the spec asks for 5–8. Blackwater supports few. The region has a prawn and the cardinal tetra (a fish, by net); a second prawn or crab needs a Barcelos source.
- **Step 5:** the legendary is drafted. The build must define the lagoon and its lagoon-mouth zone and assign the three quest clue sources; then he goes into `content/legendaries.json` and the bot tunes his fight. Open question 6 decides whether he is released.
- **Step 7:** independent review of every rare and epic record and 30% of the rest.
- **Hydrology:** done; the Barcelos gauge from Chao (2001). The SGB station table is still unread.
