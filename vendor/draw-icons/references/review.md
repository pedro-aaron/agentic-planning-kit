# Reviewing icons

APK adaptation for offline use. [Source and changes](../UPSTREAM.md)

Lint catches what can be measured. The renders catch the rest, but only if you actually look at them and compare against a checklist. You can read PNGs with your file-reading tool; do it for every render. They go to a temp folder outside the project; each command prints the path.

The PNGs (`render`, `sheet`) are for you. What the user looks at is the preview page: their own UI with the icons in it.

## The construction sheet (`render <names>`)

One image for the whole batch (two columns from 4 icons on), one block per icon:
- **Big view** (left): the icon's strokes over the 24-unit grid. Pink frame = padding, dashed blue = keylines, red = centrelines and nodes, orange = details (cut out of the fill), blue fill = silhouette.
- **As built**: the icon in the set's style.
- **Real pixels**: the built icon rasterised at the product's `sizes` (16 and 24 if none), enlarged ×4 so you see the actual pixels.

Go through this checklist every time:

1. **Recognisable at the smallest size?** Look at the 16px tile. Name the object without the label. If you can't, simplify (or draw an `@16` variant).
2. **Right size?** The main shape should meet its keyline (circle, square or rectangle), not float inside it or poke past the padding.
3. **Centred?** Visually, not just mathematically.
4. **Clean nodes?** In the big view, red nodes should sit on grid intersections or obvious places (tangent points). Stray nodes in the middle of straight lines mean extra points to remove.
5. **Gaps open?** In the pixel tiles, every gap must stay visible. Clogged = move elements apart or remove one.
6. **Filled reads well?** (filled icons) Details must cut through cleanly with solid material around them; no slivers, no details touching the outside edge by accident. Cover the outline with your hand, mentally: does the solid shape on its own still say what the icon is? (Medals turn into keyholes, flames into drops.)
7. **Duotone sits right?** (duotone sets) The tint fills the body only, with no bits sticking out past the strokes.
8. **Crisp at real size?** Horizontal and vertical edges in the pixel tiles should be sharp, not two half-grey pixel rows. If they're blurry, shift those coordinates onto the grid (craft.md §7).
9. **Consistent with the DNA?** Same corner look, cap style and detail level as the rest of the set.

## The consistency sheet (`sheet …`)

Top half: every icon at real pixel size (×2 or ×3), after the keylines (blue labels). Bottom half: the same, blurred.

- **Blur test**: in the blurred half, each blob should be about as dark and as big as its neighbours. A darker blob has too much detail or too-close strokes; a bigger blob is drawn past its keyline.
- **Spot the odd one out**: if one icon stands out, something is off: corner radius, stroke, size, or detail level. Find it and fix it.
- **Same parts, same look**: documents, people, lenses and badges should match across icons exactly.

Always put the icons that sit next to the new one in the product (the rest of the sidebar, the same toolbar) on the same sheet.

## The preview page (`preview`)

The user judges icons where they'll live, not on a grid. Use it in setup (candidate looks), before drawing the rest of a big request, when the user picks between metaphors, and when they pick a size.

**Which piece of UI.** The part of the product the icons are going into (the sidebar, the tab bar, the settings list). If that part doesn't exist yet, the closest screen that does. Never a generic mock-up: copy the product's markup and classes, real labels, spacing, fonts and colours from its source.

**Which icons.** Only the ones that tell the user most: the 3–6 that differ most from each other (round, square, tall or wide, the most detailed, the product-specific ones), placed in their real rows with their real labels. Leave out the rest of the set; a row without an icon yet can stay out too.

**States.** Show the states the UI has: the active or selected row (with its `-filled` twin if it has one), hover if it changes the icon, light and dark if the product has both (copy the app's root or body classes so the scheme matches). Use only sizes from `sizes`.

**Building it.**
1. Write a static HTML template outside the project (the `preview` usage message suggests a path in the temp folder). Link the project's local built stylesheet if available (Vite: `dist/assets/*.css`) or write the few CSS rules the preview needs. Inline any needed `@import` rules beforehand and use local or embedded assets. `preview` inlines local CSS, fonts and images so the page works offline.
2. Each icon is a placeholder: `<i data-icon="house" class="size-6" aria-hidden="true"></i>`. Other attributes are carried over to the `<svg>`.
3. `preview ui.html --open` (or `--candidates <tmp>/candidate-a.yaml,<tmp>/candidate-b.yaml` during setup: each candidate's sources are the folder next to its yaml file with the same name). With candidates, the UI is repeated once per candidate, side by side and labelled.
4. If you have a browser tool, open the page and look at it yourself before showing it. Then tell the user the path, and ask a question with options (which candidate, which metaphor, which size; recommendation first).

Re-run `preview` after changes; the template stays as it is.

## Lint rules

| Rule | Level | Meaning / usual fix |
|---|---|---|
| `viewbox`, `element`, `attribute`, `role`, `path`, `name`, `parse` | error | File format problems: see source-format.md |
| `silhouette-open` | error | A silhouette shape isn't closed |
| `silhouette-missing` | warn | Duotone or filled icon without a silhouette; fine only for line glyphs (chevrons, arrows, plus) |
| `clipped` | error | Ink crosses the canvas edge; move inward |
| `gap` | error/warn | Separate elements too close (centreline distance shown). Error = looks fused; warn = the gap between the ink is under `minGap`. Also warns when two touching elements run close together away from where they touch (a narrow wedge that clogs) |
| `padding` | warn | Ink closer to the edge than `padding` |
| `reversal` | error | The path turns back on itself (draws over its own stroke); split it or remove the back-track |
| `kink` | warn | Two curve segments meet at an angle; align handles |
| `radius` | warn | Corner radius isn't the set's small/large value, or wrong corner family |
| `angle` | warn | Straight line at an angle the DNA doesn't allow |
| `pixel` | error | Pixel sets only: a curve, circle, diagonal, rounded rect, or a point off the pixel grid. Redraw it as horizontal and vertical runs |
| `off-grid` | warn | Many corners or line ends off the crisp grid (curve tangent points are not counted) |
| `detail-budget` | warn | More stroke pieces than `dna.detail` allows |
| `detail-outside` / `hidden-in-filled` | warn | Filled icons: a detail outside the body cuts nothing; a plain stroke inside the body disappears |
| `heavy` | warn | Much more ink than the keyline circle; will look darker than neighbours |
| `small` | warn | Drawing doesn't fill the keylines |
| `decimals` | warn | More than 3 decimals |
| `ink`, `light`, `centered` | info | Measurements to keep in mind while looking at the sheet |
| `waiver` | error | A waiver without a real reason, or more than 3 on one icon |

A warning can be waived on the source's `<svg>` (`data-waive-angle="roof pitch matches the house icon's roof"`) when the drawing is right and the rule is wrong for it. The reason must be specific. More than 3 waivers on one icon means the drawing needs work instead.

## When to stop

Stop when lint has no errors, every warning is fixed or waived with a reason, and you've gone through both checklists without finding anything. Usually 1–3 rounds per icon. If you've done 3 rounds and it still looks off, step back: the metaphor or keyline is probably wrong, not the coordinates.
