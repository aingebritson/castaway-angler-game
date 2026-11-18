# Style bible: field-guide watercolour

Chosen on 17 November 2026 from the Rocky Point bake-off (`art/bakeoff/README.md`). Scores out of 40: field-guide watercolour 35, bold-outline cartoon 34, gouache storybook 28. Watercolour won on species accuracy, on repeatability and on being the one Andy likes looking at. It tied with cartoon on clean cut-outs and lost to it on reading small, consistency and tinting.

`npm run art:prompts` reads the text blocks under **Prompt blocks** below and builds every asset's prompt from them. Edit the blocks here, never in `art/prompts.md`.

## The look in one paragraph

A naturalist's plate drawn with cartoon economy. Transparent washes, a fine dark ink line of one weight around every shape, and no more detail than the shape needs to read. The anatomy is exact; the brushwork is not. Shapes are clean enough to read at 32 px, and the colours are light enough to keep their detail under the game's night tint.

## Reference images

Upload two or three of these at the start of every batch conversation and say "match this style".

| File | Shows | Status |
| --- | --- | --- |
| `art/reference/specimen__albula-vulpes.png` | Specimen: a slender silver fish, faint markings, exact fins | From the bake-off |
| `art/reference/item__stone-knife.png` | Item: a three-quarter view of a small hand-made object | From the bake-off |
| `art/reference/scene__rocky-point.png` | Scene: line, washes and palette only. **Not the layout**: its deep water runs down the right side, and the game needs it at the horizon | From the bake-off |
| `art/reference/specimen__abudefduf-saxatilis.png` | Specimen: a deep-bodied fish with bold bars, to show strong markings in this style | To make |
| `art/reference/specimen__panulirus-argus.png` | Specimen: an invertebrate (spiny lobster), to fix how shells and legs are drawn | To make |
| `art/reference/scene__rocky-point-v2.png` | Scene: the re-prompted Rocky Point, now in the game. The layout reference: shallow near, deep far, horizon a third of the way down. Its finish is a little cleaner and more digital than the bible, so use the bonefish and knife for line and wash | Done, 18 November 2026 |

## Rules from the bake-off

- **ChatGPT for everything.** Midjourney's watercolour drifted toward realism and lost the ink line. Each scene still gets a short Midjourney prompt for a second try. Midjourney gives the most weight to its first words, ignores long instructions and misreads "do not", so its prompt is about 50 words with the reference images added as style references.
- **Scene layout follows the casting model.** Looking out to sea from the shore: the shallowest water is at the bottom of the frame, and it deepens with distance to the deepest blue at the horizon. Every bake-off scene got this wrong, so each scene prompt now spells it out.
- **Fit the data to the image, not the image to the data.** Image models ignore exact heights, so the prompt asks for a horizon about a third of the way down. Once a scene is ingested, set the top of its `waterPolygon` to the horizon's real height (Rocky Point is 0.33). The game measures its cast zones from that line, and moves tap spots in the same file if they miss.
- **Scenes come out too small.** ChatGPT's tallest frame is about 941 × 1672; the target is 1290 × 2796. Upscale 2× before `art:ingest`, and keep anything important in the middle 80% of the width, because the phone crops the sides.
- **Markings stay as faint as the real fish's.** Image models darken and regularise bars. Reject a specimen whose markings would mislead.
- **No paper texture on cut-outs.** Specimens and items need a fully transparent background. The bake-off cut-outs came out clean, with no halo.

## Island palette (Castaway Island)

Glass-green and turquoise shallows, ultramarine deep water, black volcanic rock, pale coral sand, palm and sea-grape greens. Accents: coral pink, orange and sea-fan purple, used sparingly. Set the Cayes palette at the first Cayes batch and add it here.

## Workflow

1. `npm run art:prompts` writes `art/prompts.md` with a ready-to-paste prompt for every asset still on a placeholder.
2. Work in batches by region and asset type, one ChatGPT conversation per batch, with the reference images uploaded first.
3. Specimens: compare each with two or three photos of the species. Check fin count and position, tail shape, mouth position and markings. Allow three to five attempts.
4. Save to `art/inbox/` under the name the prompt sheet gives, then run `npm run art:ingest`.
5. Scenes only: set the top of the scene's `waterPolygon` to the horizon height in the image, and check the tap spots sit on the things they name.
6. When a batch turns out especially well, swap its best image into the reference table above.

## Prompt blocks

### Style

```text
Simplified field-guide watercolour illustration for a cozy mobile fishing game, in the spirit of a naturalist's plate but with cartoon economy of detail. Transparent watercolour washes with a fine dark ink outline of one even weight around every shape, restrained natural palette, clean readable shapes, no fussy texture. Light from the upper left. No text, no lettering, no labels, no border, no frame, no signature, no drop shadow.
```

### Scene

```text
Tall portrait phone background, as tall and narrow as possible (the game shows it at 9:19.5). Paint edge to edge with no white paper margin. Keep anything important in the middle 80 percent of the width. No people, no animals, no boats, no fish. Neutral midday light with a clear sky; the game tints it for dawn, dusk and night.
```

### Midjourney scene

```text
Field-guide watercolour illustration with a fine dark ink line, naturalist's plate, clean simple shapes, bright Caribbean colours, clear blue midday sky. {subject}. {layout} --ar 6:13 --no text, people, boats, fish, border, white paper margin
```

### Specimen

```text
A single specimen, full body, side profile facing left, all fins extended and clearly visible, centred with margin around it. Landscape 1536 x 1024 on a fully transparent background, with no paper texture, water, shadow or other animals. Anatomy must be exact: fin count and position, body shape, tail shape, mouth position and key markings. Keep markings as faint or bold as they are on the real animal; do not invent bars or spots.
```

### Item

```text
A single item icon, three-quarter view, centred, filling about 75 percent of the frame. Square 1024 x 1024 on a fully transparent background, with no paper texture and no shadow. A simple, clear silhouette that still reads when shrunk to a 32 pixel inventory icon.
```

### Portrait

```text
A head-and-shoulders portrait, facing slightly left, friendly and natural, on a soft plain watercolour wash background. Square 1024 x 1024.
```
