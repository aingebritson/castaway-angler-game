# Rio Negro research dossier (region 2, M3)

Started 25 November 2026. Steps 1 and 2 (region and long list) are done, the anchor at Barcelos is confirmed (Andy, 25 November 2026), and step 4's **species records** are written: `content/species/rio-negro.json`, 38 species, all validated. Occurrence records, the legendary, rumours, the review and the simulator runs come next. Occurrences need the region's locations and zones, which are part of the M3 build.

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

**Proposed game seasons** (for the build to confirm):

| Months | Phase | Zones |
| --- | --- | --- |
| Sep–Dec | Low water | Beaches exposed; lagoons cut off and fish crowded; no flooded forest |
| Jan–Mar | Rising water | Beaches go under; the forest starts to flood |
| Apr–Aug | High water | Flooded forest open; fish spread out into it |
| (late Jul–Aug) | Falling water | Fish leave the forest back into channels and lagoons |

Anglers report the best peacock bass fishing as the water drops and in the low-water months, when fish concentrate (MidCurrent, January 2026; lodge pages). High water disperses them into the forest. That is the gameplay trade the mechanic offers: fruit-eaters and forest fish at high water, predators at low water.

## Long list

Each entry gives the checklist's habitat codes: A main channel, B lake pelagic, C lake bottom, D tributaries, E streams, F beaches, G rapids, H literature only. **Every fish below is confirmed in the Rio Negro basin by that checklist**, except where noted. Other creatures and sightings are from separate sources.

### Fish: proposed to keep (34)

| Species | Common names | Codes | Role and reason |
| --- | --- | --- | --- |
| *Cichla temensis* | Speckled peacock bass, tucunaré-açu | BDF | The region's signature fish; Barcelos is famous for its world records. Legendary candidate. |
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
| Speckled peacock bass | 99 TL | 15.7 kg | 12.2 kg (FishBase) | +29% | Bayesian |
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
3. **How the flood pulse maps to the calendar.** The proposed seasons use Manaus timing, adjusted for Barcelos lodge reports. Each location runs on its own real local calendar, so the game will flood the forest from about April to August every year.
4. **Net method content.** Cardinal tetra (and possibly *Potamotrygon wallacei*) would be the first true net catches. The schema reserves the method.

## Still to do

- **Step 3:** confirm the selection and set rarity per spot and season.
- **Step 4, occurrences:** draft per spot and water level once the build defines the locations. Spawning runs (jaraqui, matrinxã) and peacock bass by water level need specific sources.
- **Other creatures quota:** the spec asks for 5–8. Blackwater supports few. The region has a prawn and the cardinal tetra (a fish, by net); a second prawn or crab needs a Barcelos source.
- **Step 5:** legendary proposal. The lead candidate is a giant speckled peacock bass, built on Barcelos's world-record fame. A 14 kg fish from the Marié River in an Indigenous sport-fishing area was submitted as a world record.
- **Steps 6–8:** rumours, independent review, validator and simulator.
- **Hydrology:** read the SGB station table for Barcelos.
