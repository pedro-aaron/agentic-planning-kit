# Source format

Everything lives in the folder named by `dir` in `icons.yaml`:

```
<dir>/
  source/
    house.svg          one source per icon (kebab-case name = file name)
    house@16.svg       optional simplified variant for small sizes
    parts/document.svg shared geometry copied into icons
  house.svg            built by `build`. Never edit
```

## Geometry only

A source is a flat SVG with only geometry. No stroke, fill, colour, class, transform, groups or `<use>`; `build` adds those from `dna` (`style`, `stroke`, caps, joins). Allowed elements: `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, `rect`.

In an **outline** set that's all: every element is a stroke.

In a **duotone** or **filled** set, some elements also get a **role**:

| Attribute | Meaning | duotone | filled |
|---|---|---|---|
| *(none)* | normal stroke | stroke | stroke (merges into the fill) |
| `data-role="silhouette"` | closed shape of the body's outside | fill at `duotoneOpacity`, under the strokes | filled + stroked |
| `data-role="detail"` | stroke that sits *inside* the body | stroke | **cut out** of the fill |

How it compiles:
- **duotone** = silhouette at low opacity underneath + strokes. The silhouette's edge runs along the strokes' centrelines, so it hides under the stroke.
- **filled** = silhouette filled *and* stroked (so its outside matches an outline drawing exactly), normal strokes on top, details cut out through a mask.

## Writing the silhouette

- Trace the **outer centreline** of the body: usually the same path as the main outline stroke, closed with `Z`. For a circle container, the same circle.
- Only the body. Handles, antennae, badges and anything sticking out stay normal strokes; they just draw on top.
- One silhouette per separate body. Two overlapping bodies (a stack of cards) → two silhouette shapes.
- Filled: every stroke that sits inside the silhouette should be a `detail`, or it disappears. `lint` warns about this (`hidden-in-filled`).
- Filled: details need room: their centreline ≥ stroke + gap from the silhouette's edge (same rule as any gap), or the cut-out merges with the outside.
- Tiny inner dots and short marks are fine as details; they turn into round holes.
- Line glyphs (chevrons, arrows, plus) have no body and no silhouette.

## Filled twins

An outline or duotone set can still need a solid icon for an active state (the selected tab). Draw it as its own source, `<name>-filled.svg`, with `data-style="filled"` on the `<svg>`: a silhouette plus details, as above. It's linted and built like any icon.

## Example

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
  <path d="M14 2v4a2 2 0 0 0 2 2h4" data-role="detail"/>
  <path d="M8 13h8" data-role="detail"/>
  <path d="M8 17h5" data-role="detail"/>
  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" data-role="silhouette"/>
</svg>
```

## Aliases and waivers

The only extra attributes allowed, and only on the root `<svg>`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" data-aliases="settings preferences" data-waive-heavy="8 teeth need a long outline; lighter stops reading as a gear">
```

- `data-style="filled"`: a filled twin (above).
- `data-aliases`: the product's own words for the icon, space-separated (`streak` for `flame`). They only help you find an existing icon before drawing a new one; nothing is exported under them.
- `data-waive-<rule>`: a lint warning you accept, with the reason (12+ characters). Only warnings can be waived; at most 3 per icon.

## Small variants

When `sizes` includes 16px or smaller and an icon gets muddy there, draw `<name>@16.svg`: same concept, fewer details, more space. Lint holds it to the `minimal` detail budget. `build` writes it next to the full one (`<name>@16.svg`); use it where the icon is shown at ≤16px.

## Built output

`build` removes the SVGs at the top of `<dir>/` and writes one plain SVG per icon there, in `currentColor`. Filled icons with cut-outs use a `<mask>` whose id is derived from the icon name; inlining the same file twice on a page repeats an identical id, which renders fine.

Never edit built files; edit the sources and rebuild.
