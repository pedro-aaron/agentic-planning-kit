# Drawing rules

These rules come from how Lucide, Tabler, Heroicons, Phosphor, Hugeicons and Material actually build their sets. The numbers below assume the common DNA (24 grid, padding 1, stroke 2); read your project's `icons.yaml` and scale accordingly.

## Contents
1. Think in centrelines
2. Canvas, keylines and optical size
3. Corners
4. Strokes, ends and dots
5. Gaps
6. Curves
7. Angles and the pixel grid
8. Detail and metaphor
9. Modifiers: badges and slashes
10. Parts and recipes
11. A worked example

## 1. Think in centrelines

Every coordinate you write is the **middle** of a stroke. The ink spreads `stroke/2` to both sides. So with stroke 2, a line at x=3 has ink from 2 to 4. Keep this picture in your head for every measurement: padding, gaps and touching all follow from it.

Build icons from **primitives**: straight lines, circular arcs, circles, rounded rectangles. Freehand Béziers are where generated icons go wrong. Use curves only where an object really is organic, and even then prefer arcs.

## 2. Canvas, keylines and optical size

- Canvas: `viewBox="0 0 24 24"`. Ink stays at least `padding` (1) from the edge, so centrelines usually sit between 2 and 22.
- **Keylines** are reference shapes that look equally big even though they measure differently:
  - circle: 20 across (`cx=12 cy=12 r=10`)
  - square: 18×18 (3→21)
  - portrait rectangle: 16×20 (x 4→20, y 2→22)
  - landscape rectangle: 20×16 (x 2→22, y 4→20)
- Fit the icon's main shape to the keyline that matches it. A round thing is a circle-keyline icon and gets to be bigger than a square thing. That's on purpose: circles look smaller than squares of the same width.
- **Pointy shapes overshoot.** Triangles, diamonds and arrows look small at keyline size; push their tips slightly past it.
- **Optical centre.** Symmetric icons sit exactly in the middle. Asymmetric ones (a play triangle, a speech bubble with a tail) are nudged so their *mass* looks centred, usually 0.5–1 unit.
- **Fill the space.** A finished icon is usually 16–20 units across. Under ~12 looks lost next to its neighbours.

## 3. Corners

Corner style is the biggest part of a set's character, so it's locked in `dna.corners`.

- **circular**: a real arc. Radius `large` (2) on shapes ≥ `largeThreshold` (8) units, `small` (1) on smaller shapes. Where two diagonals meet at 90°, use `large × 1.207` (≈2.41) so it looks the same.
- **squircle**: a smooth "continuous" corner that eases in gradually (iOS / Hugeicons look). Never `<rect rx>`; always `icons shape rect …` or `shape poly …`.
- **sharp**: no rounding; joins are usually `miter`. Keep acute angles above ~40° or they spike.

Rules:
- Round joins (`stroke-linejoin`) are **not** corner rounding. A 90° corner still needs a radius in circular/squircle sets.
- Don't round corners where three or more lines meet; it renders as a blob.
- Outer and inner corners of the same shape use the same radius; the stroke makes the outside look rounder automatically.
- Use the `shape` helper for anything but plain `rect` with circular corners. It does the tangent math and switches family for you:
  - `shape rect 4 2 16 20` → rounded rectangle path
  - `shape poly "4,2 15,2 20,7 20,22 4,22" --closed` → document with a cut corner, every corner rounded
  - `shape poly "6,9 12,15 18,9" --r 1` → open chevron with a rounded tip (ends stay square-cut by the cap style)

## 4. Strokes, ends and dots

- One stroke width for everything (`dna.stroke`); it's applied when building, so never write stroke attributes in sources.
- Open ends get the project's cap. An end that approaches another element must either **touch** it (centrelines meet, overlap ≤ half a stroke) or **stop** a full gap away. Never "almost touch".
- A dot is a zero-length line: `M12 17h.01`. The round cap makes it a perfect dot of the stroke's diameter.
- Prefer one continuous path over several pieces that meet; overlapping strokes look darker when the icon colour is semi-transparent.
- Don't draw a line on top of another line.

## 5. Gaps

**Separate elements: centrelines ≥ stroke + minGap apart.** With stroke 2 and gap 2, that's 4 units. With stroke 2.5, that's 4.5.

- Parallel lines inside a document: 4 apart (y=13 and y=17), not 3.
- A detail inside a container: its centreline ≥ 4 from the container's centreline.
- Inner holes (the inside of a "U", the loop of a ribbon): at least the same distance across.
- `lint` measures all of this and reports the closest spot. When it complains, move things or remove detail; don't squeeze.

## 6. Curves

- Circular things are arcs (`A`) or `<circle>`. Don't approximate a circle with Béziers.
- Where two curve segments meet, their handles must line up (same direction) or you get a visible kink. `lint` flags kinks between 1.5° and 25°.
- Use the fewest nodes that make the shape. Every extra node is a chance for a wobble.
- Organic shapes are built from circles: a cloud is 2–3 arcs on a flat base, a heart is two arcs meeting a point, a leaf is two arcs. Sketch the circles first, then trace along them.

## 7. Angles and the pixel grid

- Straight lines use the allowed angles (`dna.angles`, usually 0/45/90). A 45° line from one whole-number point to another stays crisp.
- Put endpoints and arc centres on whole numbers when the stroke is even (2), on .5 when it's odd (1, 3), and on .25/.75 when it's 1.5. That makes edges land on pixel boundaries at real size.
- Visual quality beats the grid. If a shape needs 10.5 to look centred, use 10.5.
- **Pixel sets (`dna.pixel`)** have no in-between: each grid unit is one icon pixel, and lint rejects anything else. Only horizontal and vertical runs, every point on the stroke grid (n.5 at stroke 1). A diagonal or curve is a stair of short runs, a circle is a stepped octagon. A silhouette may close along the outer edge of the ink (a whole number) where the body has no stroke, like the open bottom of a bust.
- Keep at most 3 decimals.

## 8. Detail and metaphor

- **Show the object, not the action.** "Save" is a floppy disk or a tray with an arrow; name the file after what it shows.
- **Use conventions** users already know: gear = settings, magnifier = search, bell = notifications, trash can = delete, pencil = edit, house = home. Inventing a new metaphor for a solved concept makes the product harder to use.
- **Product-specific concepts**: a known base + a modifier (invoice = document + 2 text lines; client = person; workspace = 2×2 rounded squares).
- **Platform conventions**: iOS share = box with an arrow up; Android share = three connected dots.
- **Detail budget** (`dna.detail`): minimal ≈ 4 strokes, low ≈ 6, medium ≈ 9, high ≈ 13. Most good icons are 1–4 elements. Ask: would it still read at 16px? If not, remove things until it does.
- Flat, front or side view only. No 3D, no perspective, no shading.
- No letters or numbers unless the concept *is* the letter (bold "B"). They break in other languages and at small sizes.
- **Filled: the silhouette alone must still be the object.** The outline disappears into the fill and the silhouette is all that's left; a medal on two straight ribbon legs turns into a keyhole, a teardrop flame into a water drop. Check the built tile, not just the construction view.
- **Names: what it shows vs what it means.** File names describe the picture (`flame`, `gear`, `floppy-disk`) so the set stays reusable. The product's word for it (`streak`, `settings`, `save`) goes in `data-aliases` on the source's `<svg>`, so the next agent finds it.
- Check `avoid` in `icons.yaml` before choosing.

## 9. Modifiers: badges and slashes

Modifiers must look the same on every icon, so their geometry is fixed by `dna.badge`.

- **Badge slot** (bottom-right, size 8): the badge's ink fits in the 8×8 box in the corner (x and y 15→23 with padding 1). At stroke 2, a plus badge is `M19 16v6M16 19h6`, a check is `m16 19 2 2 4-4`.
- **The main shape gets out of the way.** Trim the base shape so its strokes end ≥ stroke + gap from the badge's ink. Don't overlap and don't use masks: end the path early or redraw that corner.
- **Off / disabled**: a slash `M2 2l20 20`, with the base shape cut a full gap away on both sides of the slash.
- Small base icons that get badges often shrink slightly toward the top-left to make room. Keep that shrink identical across all badged icons.

### Large overlays (clock, status dot, sync arrows on top of a base)

Bigger than a badge: the overlay is a second object. Lucide's pattern (`file-clock`, `calendar-clock`):
- The overlay is a circle of r≈6 placed over one corner of the base (e.g. centre 16,16 for bottom-right, 8,16 for bottom-left on a document whose fold is top-right).
- The base is **cut back along a circle of radius r + stroke + gap** around the overlay's centre (r 10 for a r6 overlay at stroke 2 + gap 2): end the base's paths where they meet that circle.
- Keep the overlay's inside simple (two clock hands, one arrow). At r6 with the gap rule, there is room for one or two inner strokes, no more.
- Pick the corner that doesn't collide with the base's own features (a document's fold).
- **Silhouettes** (duotone, filled): the base's silhouette follows the same cut (it ends on the r + stroke + gap circle, closed with an arc along it), and the overlay gets its own silhouette. Filled, that leaves a clean moat between two solid shapes.

## 10. Parts and recipes

Store anything used in two or more icons as a part: `source/parts/<part>.svg` (same format as icons). Copy its elements into icons exactly (no `<use>`). Same thing = same coordinates, always.

Starting geometry for the common DNA (24 grid, stroke 2, circular corners r2; geometry from Lucide, ISC). Adapt to your DNA with `shape`:

| Part | Elements |
|---|---|
| circle container | `<circle cx="12" cy="12" r="10"/>` |
| square container | `<rect x="3" y="3" width="18" height="18" rx="2"/>` |
| document | `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>` + fold `<path d="M14 2v4a2 2 0 0 0 2 2h4"/>` |
| magnifier | `<circle cx="11" cy="11" r="8"/>` + `<path d="m21 21-4.3-4.3"/>` (the handle touches the lens) |
| person | `<circle cx="12" cy="7" r="4"/>` + `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>` |
| chevron right | `<path d="m9 18 6-6-6-6"/>` |
| arrow right | `<path d="M5 12h14"/>` + `<path d="m12 5 7 7-7 7"/>` |
| plus / x / check | `M5 12h14M12 5v14` · `M18 6 6 18M6 6l12 12` · `M20 6 9 17l-5-5` |
| dot | `M12 17h.01` |

## 11. A worked example: "invoice" with the common DNA

1. Concept: invoice → a document with 2 text lines (look in `source/` first: if `document` already exists, start from it).
2. Keyline: portrait (document part: x 4→20, y 2→22, folded corner).
3. Details: two lines. Inside width is 4→20, keep ≥4 from the sides → x from 8. Lines 4 apart: `M8 13h8`, `M8 17h5` (shorter second line reads as text).
4. Duotone or filled set: body = stroke; fold and lines = `data-role="detail"` (cut out of the fill); silhouette = the body path again. Outline: just the strokes.
5. Lint, render, look: are the lines centred in the space below the fold? Does it weigh about the same as its neighbours on the sheet?
