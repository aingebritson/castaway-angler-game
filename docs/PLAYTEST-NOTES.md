# Playtest notes

Things noticed while playing, to explore and maybe fix later. These are not yet decisions; when one is acted on, it moves to `DECISIONS.md` and comes off this list.

## To explore

### Bugs
- **A sighted fish is filed under "Place not yet known".** At Rocky Point, an eel bit but was too big to land. The field guide put it under "Place not yet known", even though the place is known; only the animal is not. A fish that is hooked and lost (or glimpsed on the line) should be noted at the place where it happened, as sightings are (`seen:<location>` in the guide cells).
- **Tapping the same dolphin, turtle or stingray counts as a new sighting each time.** Only a separate appearance should count: a new animal, or the same kind after it has gone and come back.

### Feel and tuning
- **Trophy and record fish may come too easily.** Got a record sergeant major on the old rusty rod, which seems implausible. Check the size distribution and how records are judged.
- **Rocks run out after gathering 4.** Sand fleas and seashells never run out, which makes sense, and rocks should be the same. Some things should still have limits, but not stones on a rocky shore.

### Purpose
- **The catch basket at camp has no job.** Fish can be cleaned from the Catch tab in the bag, so there is no reason to visit the basket. Either give it a role or fold it away.
- **Green dots on some items in the bag, for no clear reason.** It is not "not yet examined", so either make the meaning clear or remove the dots.
- **Places you can't reach yet show on the map as gated.** Undiscovered resources stay hidden until found, which works well. Places should behave the same way; showing them locked looks like gating for no reason you can see.

### Art
- **Moving sighting silhouettes look janky.** The dolphin is the worst. Underwater sightings are less bad but still not great. It's not clear there is a good 2D answer; options might be painted art, simpler motion, or showing only a splash or wake.
- **More hand-made art.** The map and the fishing rod drawn during fishing are still generated in code and look rough next to the painted art.

## Working well (keep)
- **Fish tire.** At first you can only hold them on the line, but keep at it and they tire until you can reel them in. It's a neat trick; don't lose it in any fight tuning.
