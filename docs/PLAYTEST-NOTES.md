# Playtest notes

Things noticed while playing, to explore and maybe fix later. These are not yet decisions; when one is acted on, it moves to `DECISIONS.md` and comes off this list.

## To explore

### Bugs
- **A sighted fish is filed under "Place not yet known".** At Rocky Point, an eel bit but was too big to land. The field guide put it under "Place not yet known", even though the place is known; only the animal is not. A fish that is hooked and lost (or glimpsed on the line) should be noted at the place where it happened, as sightings are (`seen:<location>` in the guide cells).
- **Losing your last feather lure strands you on lure fishing.** With no lure left, you can't switch back to a hook; the only way out was crafting a new feather lure. Running out of a lure should drop the rig back to a hook, or at least allow it.
- **Tapping the same dolphin, turtle or stingray counts as a new sighting each time.** Only a separate appearance should count: a new animal, or the same kind after it has gone and come back.

### Feel and tuning
- **Trophy and record fish may come too easily.** Got a record sergeant major on the old rusty rod, which seems implausible. Check the size distribution and how records are judged.
- **Rocks run out after gathering 4.** Sand fleas and seashells never run out, which makes sense, and rocks should be the same. Some things should still have limits, but not stones on a rocky shore.
- **Sightings come far too often.** At the Port Esperanza reef, four nurse sharks were on screen nearly all the time, which is very distracting. Stingrays on the island are nearly as bad, and turtles a little less. All of them should be rarer, so each one is a moment.

### Purpose
- **The catch basket at camp has no job.** Fish can be cleaned from the Catch tab in the bag, so there is no reason to visit the basket. Either give it a role or fold it away.
- **The eye-roll emoji when a fish refuses the bait is off-tone.** It doesn't fit the quiet, observant voice of the rest of the game. Replace it with something that suits that voice, or drop the emoji.
- **Green dots on some items in the bag, for no clear reason.** It is not "not yet examined", so either make the meaning clear or remove the dots.
- **Places you can't reach yet show on the map as gated.** Undiscovered resources stay hidden until found, which works well. Places should behave the same way; showing them locked looks like gating for no reason you can see.

### Story and pacing
- **Port Esperanza throws too much at you too quickly,** the same complaint as the early island had. Introduce the people slowly, one leading to the next, and give the port more of a story, the way the island now runs on lessons, pages and thoughts that follow from what happens.

### Art
- **Moving sighting silhouettes look janky.** The dolphin is the worst. Underwater sightings are less bad but still not great. It's not clear there is a good 2D answer; options might be painted art, simpler motion, or showing only a splash or wake.
- **More hand-made art.** The map and the fishing rod drawn during fishing are still generated in code and look rough next to the painted art.

## Working well (keep)
- **The economy at the port.** No real complaints after playtesting; leave prices and earnings alone when reworking the port's pacing.
- **Fish tire.** At first you can only hold them on the line, but keep at it and they tire until you can reel them in. It's a neat trick; don't lose it in any fight tuning.
