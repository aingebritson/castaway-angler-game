# Style bake-off

**Result, 17 November 2026: field-guide watercolour (35 of 40), ahead of bold-outline cartoon (34) and gouache storybook (28).** The style bible is `art/style.md`; the winning images are in `art/reference/`. The bake-off images themselves are kept locally and are not committed.

Andy's scores (1 to 5, in the order cartoon, gouache, watercolour): reads small 5/4/4, species accuracy 3/4/5, one look 5/3/4, survives tinting 5/4/4, water area 3/3/3, clean cut-out 5/5/5, repeatable 5/2/5, likes looking at it 3/3/5.

Spec §13, step 0. Three test assets in three candidate styles, then pick one and write `art/style.md` (the style bible). Once `art/style.md` exists, `npm run art:prompts` uses it for every asset.

## How to run it

1. **One ChatGPT conversation per style.** Paste that style's scene prompt first. When you like the scene, ask for the bonefish and the knife in the same conversation, so all three share one look. Consistency across asset types is half of what we are testing.
2. **Up to three tries per asset.** Keep the best one. If the fish anatomy is wrong after three tries, keep the best wrong one and note what was wrong; that tells us something about the style too.
3. **Save files here** as `art/bakeoff/<style>-<tool>/<asset>.png`, for example:
   - `art/bakeoff/cartoon-chatgpt/scene__rocky-point.png`
   - `art/bakeoff/gouache-chatgpt/specimen__albula-vulpes.png`
   - `art/bakeoff/watercolour-mj/scene__rocky-point.png`
4. Tell Claude when they are in. Claude builds a comparison page that shows each style at game size, tinted for dawn, dusk and night, with the icons shrunk to inventory size.

## Which tool for what

| Asset | ChatGPT | Midjourney |
| --- | --- | --- |
| Rocky Point scene | Yes. Ask for tall portrait (1024 × 1536). It is wider than the game's 9:19.5, so keep the important parts in the middle third. | **Worth a try**, at `--ar 6:13`, which matches the game. Often the better painter for landscapes. |
| Bonefish | Yes. Ask for a transparent background. | Skip. No transparency, and it tends to invent fins. |
| Stone knife | Yes. Ask for a transparent background. | Skip. |

So the core run is 9 ChatGPT images, plus 3 optional Midjourney scenes (one per style) to see whether the scenes should come from a different tool than the specimens and icons.

## Shared rules (already inside every prompt below)

One outline weight. Light from the upper left. No text, borders, frames, signatures or drop shadows. Species identifiable: simplify line and detail, never anatomy.

---

## Style A: bold-outline cartoon

Flat colour, thick lines, reads well small.

**Style block:**
> Bold-outline cartoon illustration for a cozy mobile fishing game. Flat colour fills with at most one soft shade step, a single thick dark outline of even weight on every shape, simple confident shapes, saturated but not neon Caribbean palette. Light from the upper left. No text, no lettering, no border, no frame, no signature, no drop shadow.

### A1. Rocky Point scene

```text
Bold-outline cartoon illustration for a cozy mobile fishing game. Flat colour fills with at most one soft shade step, a single thick dark outline of even weight on every shape, simple confident shapes, saturated but not neon Caribbean palette. Light from the upper left. No text, no lettering, no border, no frame, no signature, no drop shadow.

Scene: Rocky Point on a small Caribbean island. A rocky shore of dark black volcanic rock with white water breaking over it, sitting above a fringing coral reef. In the shallows the reef is busy: coral heads, sea fans, patches of sand. Beyond the reef the bottom drops away into deep blue. Neutral midday light, clear sky.

Composition: tall portrait phone background. The sea fills the lower 55 to 60 percent of the image, seen from slightly above so the shallows read clearly. Rocks and sky in the upper part. Keep the key elements in the central third. No people, no animals, no boats, no fish.
```

Midjourney version: paste the same text, then add ` --ar 6:13 --no text, border, people, fish, boat`

### A2. Bonefish (after the scene, same conversation)

```text
Same style as the scene. Now a single fish specimen: a bonefish (Albula vulpes), full body side profile facing left, all fins extended and clearly visible, centred with margin around it, on a transparent background. Landscape 1536 x 1024.

Anatomy must be correct: slender torpedo-shaped silver body; conical snout that overhangs a small underslung mouth; one single dorsal fin near the middle of the back; pelvic fins on the belly below the dorsal; small anal fin set far back; deeply forked tail. Faint dusky bars across the back; bluish-green tint above, bright silver sides, pale belly. No other fish, no water, no background, no shadow.
```

### A3. Stone knife (same conversation)

```text
Same style. Now a single item icon: a primitive stone knife. A sharp flaked stone blade bound to a short wooden handle with wrapped plant-fibre cord. Three-quarter view, centred, filling about 75 percent of the frame, on a transparent background. Square 1024 x 1024. Must read clearly when shrunk to a small inventory icon. No background, no shadow.
```

---

## Style B: gouache storybook

Painterly, warm, soft edges.

**Style block:**
> Gouache storybook illustration for a cozy mobile fishing game. Opaque painted gouache with visible soft brush texture, warm sunlit palette, soft edges, gentle simplified shapes, a thin warm-brown outline of even weight used sparingly. Light from the upper left. No text, no lettering, no border, no frame, no signature, no drop shadow.

### B1. Rocky Point scene

```text
Gouache storybook illustration for a cozy mobile fishing game. Opaque painted gouache with visible soft brush texture, warm sunlit palette, soft edges, gentle simplified shapes, a thin warm-brown outline of even weight used sparingly. Light from the upper left. No text, no lettering, no border, no frame, no signature, no drop shadow.

Scene: Rocky Point on a small Caribbean island. A rocky shore of dark black volcanic rock with white water breaking over it, sitting above a fringing coral reef. In the shallows the reef is busy: coral heads, sea fans, patches of sand. Beyond the reef the bottom drops away into deep blue. Neutral midday light, clear sky.

Composition: tall portrait phone background. The sea fills the lower 55 to 60 percent of the image, seen from slightly above so the shallows read clearly. Rocks and sky in the upper part. Keep the key elements in the central third. No people, no animals, no boats, no fish.
```

Midjourney version: paste the same text, then add ` --ar 6:13 --no text, border, people, fish, boat`

### B2. Bonefish (same conversation)

```text
Same style as the scene. Now a single fish specimen: a bonefish (Albula vulpes), full body side profile facing left, all fins extended and clearly visible, centred with margin around it, on a transparent background. Landscape 1536 x 1024.

Anatomy must be correct: slender torpedo-shaped silver body; conical snout that overhangs a small underslung mouth; one single dorsal fin near the middle of the back; pelvic fins on the belly below the dorsal; small anal fin set far back; deeply forked tail. Faint dusky bars across the back; bluish-green tint above, bright silver sides, pale belly. No other fish, no water, no background, no shadow.
```

### B3. Stone knife (same conversation)

```text
Same style. Now a single item icon: a primitive stone knife. A sharp flaked stone blade bound to a short wooden handle with wrapped plant-fibre cord. Three-quarter view, centred, filling about 75 percent of the frame, on a transparent background. Square 1024 x 1024. Must read clearly when shrunk to a small inventory icon. No background, no shadow.
```

---

## Style C: simplified field-guide watercolour

Naturalist plate feel with cartoon economy of detail.

**Style block:**
> Simplified field-guide watercolour illustration for a cozy mobile fishing game, in the spirit of a naturalist's plate but with cartoon economy of detail. Transparent watercolour washes on white paper with a fine ink outline of even weight, restrained natural palette, clean readable shapes, no fussy texture. Light from the upper left. No text, no lettering, no labels, no border, no frame, no signature, no drop shadow.

### C1. Rocky Point scene

```text
Simplified field-guide watercolour illustration for a cozy mobile fishing game, in the spirit of a naturalist's plate but with cartoon economy of detail. Transparent watercolour washes on white paper with a fine ink outline of even weight, restrained natural palette, clean readable shapes, no fussy texture. Light from the upper left. No text, no lettering, no labels, no border, no frame, no signature, no drop shadow.

Scene: Rocky Point on a small Caribbean island. A rocky shore of dark black volcanic rock with white water breaking over it, sitting above a fringing coral reef. In the shallows the reef is busy: coral heads, sea fans, patches of sand. Beyond the reef the bottom drops away into deep blue. Neutral midday light, clear sky. Paint edge to edge, no white paper margin.

Composition: tall portrait phone background. The sea fills the lower 55 to 60 percent of the image, seen from slightly above so the shallows read clearly. Rocks and sky in the upper part. Keep the key elements in the central third. No people, no animals, no boats, no fish.
```

Midjourney version: paste the same text, then add ` --ar 6:13 --no text, border, people, fish, boat, labels`

### C2. Bonefish (same conversation)

```text
Same style as the scene. Now a single fish specimen: a bonefish (Albula vulpes), full body side profile facing left, all fins extended and clearly visible, centred with margin around it, on a transparent background (no paper texture behind the fish). Landscape 1536 x 1024.

Anatomy must be correct: slender torpedo-shaped silver body; conical snout that overhangs a small underslung mouth; one single dorsal fin near the middle of the back; pelvic fins on the belly below the dorsal; small anal fin set far back; deeply forked tail. Faint dusky bars across the back; bluish-green tint above, bright silver sides, pale belly. No other fish, no water, no labels, no background, no shadow.
```

### C3. Stone knife (same conversation)

```text
Same style. Now a single item icon: a primitive stone knife. A sharp flaked stone blade bound to a short wooden handle with wrapped plant-fibre cord. Three-quarter view, centred, filling about 75 percent of the frame, on a transparent background (no paper texture). Square 1024 x 1024. Must read clearly when shrunk to a small inventory icon. No background, no shadow, no labels.
```

---

## Judging

Score each style 1 to 5 on each line. The comparison page will make most of these easy to see.

| Test | What to look for |
| --- | --- |
| Reads small | Knife and bonefish still clear at 48 to 64 px |
| Species accuracy | Bonefish: one dorsal fin, overhanging snout, forked tail, mouth underneath |
| One look | Scene, fish and knife feel like the same game |
| Survives tinting | Scene still looks good tinted for dawn, dusk and night |
| Water area | Code draws ripples, float and line over the lower water; the art leaves room for that |
| Clean cut-out | Transparent edges are clean, no halo, no stray paper texture |
| Repeatable | Would the 70-odd remaining assets come out this consistent? (Try one extra fish if unsure.) |
| You like looking at it | It is your game |

Then: pick a winner, pick six reference images (from the bake-off, plus a couple more of the winner if needed), and Claude drafts `art/style.md` from the winning style block.
