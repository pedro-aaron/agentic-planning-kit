---
name: draw-icons
description: Design and generate custom SVG icons that fit the product they live in — consistent across the whole set — and wire them into the product's UI. Use this skill whenever the user wants icons for their app or a part of it (sidebar, tab bar, toolbar, settings), a custom icon set (outline, duotone or filled), an icon for a product-specific concept, or to change, replace or redraw existing icons (a better metaphor, a fix, the whole set) — even if they just say "make an icon for X", "we need icons for the sidebar", or "draw a ___ icon". Also use it to set up or edit a project's icons.yaml.
---

# Draw Icons

APK adaptation for offline use. [Source and changes](./UPSTREAM.md)

Great icon sets aren't great drawings. They are **a few strict rules applied without exceptions**, **a shared library of parts**, and **lots of looking at real-size renders**. You are good at the first two (rules and coordinate math) and blind at the third unless you render, so this skill gives you a CLI that renders, measures and checks. Your job is to follow the rules, reuse parts, and actually look at every render.

Each project has a `icons.yaml` at its root: a line about the product plus the **DNA** (corners, caps, grid, gaps, detail level…). Every icon is a function of that file and the icon's concept. All icon files live in one folder, `dir`, that the user picks:

```
<dir>/                 e.g. src/components/icons
  source/              the truth: one SVG per icon (+ parts/), geometry only. Edit these.
  <name>.svg           written by build: one plain SVG per icon. Never edit.
```

Style (outline, duotone or filled) and stroke width are part of the DNA, like the corners: the user picks them on the preview before anything is drawn, and every icon is drawn for them.

## The CLI

Run from the project root, where `icons.yaml` lives or will live. Resolve `<skill-dir>` to the
APK's `vendor/draw-icons` directory and quote the script path when it contains spaces.

```bash
node "<skill-dir>/scripts/icons.js" <command>
```

The CLI runs with the project's Node.js runtime and reads its bundled dependencies from disk.

| Command | What it does |
|---|---|
| `check` | Validates `icons.yaml`; lists what is missing, imports of icons that don't exist, and files showing icons at a size not in `sizes` |
| `shape rect X Y W H [R]` / `shape poly "x,y x,y …" [--r R\|R1,R2,…] [--closed] [--family …]` | Path data with corners rounded in the project's corner family. Use it instead of doing fillet math by hand. Without `--r` it also applies the diagonal-corner rule |
| `lint [names]` | Hard rules and measurements (gaps, padding, kinks, radii, angles, ink weight…) |
| `render <names>` | One construction-sheet PNG for all the named icons (a block per icon: construction view, the built icon, real pixels), in a temp folder outside the project (the path is printed) |
| `sheet [names\|all]` | Consistency sheet: icons side by side at real pixel size next to the keylines, plus a blurred copy (`--size 16` for another size; name it with `--out`) |
| `preview <template.html> [--candidates a.yaml,b.yaml] [--open]` | Fills a static copy of a piece of the product's UI with icons (`<i data-icon="house" class="…"></i>`), once per candidate DNA side by side, and writes a self-contained page (local CSS, fonts and images inlined) to the temp folder. This is what the user looks at |
| `build` | Lints and checks the project's imports, then writes `<dir>/<name>.svg` for every source. Stops if an import would point at an icon that no longer exists |

Names can be space- or comma-separated. Every command takes `--config <file>` and `--source <dir>` (handy for candidate DNAs during setup).

For geometry the CLI doesn't cover (gear teeth joined by arcs, repeated elements around a circle), write a small Node script that imports `roundPolyline(points, radius, family, closed)` and `rect(x, y, w, h, r, dna)` from `<skill-dir>/scripts/lib/shape.js` and prints path data. Keep such scripts out of the project.

## Asking the user

Whenever you need a decision from the user (during setup, for a metaphor, for where an icon goes), give them options to pick from instead of an open question:
- 2–4 concrete options that fit *this* project, your recommendation first and marked as such, plus "decide for me".
- If you have a tool for structured questions (multiple-choice cards), use it. Otherwise write the options as a short numbered list so they can answer with a number.
- For anything visual, the options are pictures: put them in the product's own UI with `preview` and let the user point at one. The PNG renders and sheets are for your own checking.
- Only ask what blocks the work. For everything else, state what you decided in one line and move on.

## Step 1 — Is the project set up?

Run `check`.

- **No `icons.yaml`** → set it up first. Read `references/setup.md` and follow it: look at the project, ask the gaps (including where the icons go), show candidate looks in a preview of the product's UI, write the file. The file only gets written once everything is decided, so don't draw real icons before it exists.
- **It exists** → go to step 2. `check` also lists problems in the code: imports of icons that don't exist, and files showing icons at a size they weren't drawn for. Fix the ones in what you're touching and mention the rest. Treat `dna` as law. If the user asks for something that would change it (rounder corners, different caps), say it means redrawing every icon and confirm before doing it. The exception is `stroke`: change it, `lint all`, fix what lint flags, `build`.

## Step 2 — Draw or change icons

Before the first icon in a session, read `references/craft.md` (the drawing rules) and `references/source-format.md` (the file format). Skipping them shows in the output.

A new icon and a change to an existing one go through the same steps. Work in batches: the icons from one request, up to about 6 at a time. Draw each icon (1–4), then look at the batch as a whole (5–6), not icon by icon.

1. **Start from what exists.** Look at the file names in `<dir>/source/` and their `data-aliases` (`grep -l 'data-aliases="[^"]*settings' <dir>/source/*.svg`); search the code for `<name>.svg` to see where an icon is on screen.
   - The concept has an icon and the user didn't ask to change it → use it.
   - The user wants it changed but it still shows the same object (bigger gear teeth, a cleaner roof) → edit that source in place. The name and every import stay.
   - The user wants a different object for it ("issues" from a circle-dot to a ticket) → draw a new source named after the new object, and move the product's words from the old source's `data-aliases` to the new one. Leave the old source alone for now; step 3 decides whether it goes.
2. **Pick the metaphor.** Show the object, not the action. Prefer the convention users already know (gear = settings). For product-specific concepts, combine a known base with a modifier. Check `avoid` in the config.
3. **Plan in coordinates, then write the source.** Choose the keyline (circle, square, portrait or landscape), reuse parts from `source/parts/` (copy their elements exactly), use `shape` for rounded corners, and write `<dir>/source/<name>.svg`; in a duotone or filled set, add the silhouette and mark inner details (`references/source-format.md`). Name the file after what it shows (`flame`, `gear`); put the product's name for it in `data-aliases` (`streak`, `settings`).
4. **`lint <name>`** — fix every error. Treat warnings as real unless you have a reason; a waiver is a `data-waive-<rule>="reason"` attribute on the source's `<svg>` (see `references/review.md`).
5. **`render <batch>` and look at the PNG** (use your file-reading tool on it): one image, one block per icon. Go through the checklist in `references/review.md` for each block. Fix, then re-render only the icons you changed; up to about 3 rounds. Never report an icon you haven't looked at.
6. **`sheet <batch> <neighbours>`** and look at it, once per batch. Neighbours are the icons from the set that sit next to these in the product. In the blurred half, every blob should look about as dark and as big as its neighbours.
7. **`build`**.

**Many new icons in one request** (about 7 or more: a new set, a new screen's worth, or redrawing all of them after a DNA change): don't draw them all and then ask. First draw the 3–6 that differ most from each other (a round one, a square one, a tall or wide one, the most detailed, the product-specific concepts), take them through steps 1–6, and show them in the product's UI with `preview` (see "The preview page" in `references/review.md`). Ask whether the direction is right and adjust from the answer. Then build the shared parts (document, person, lens, badges…) and draw the rest in batches. During setup, the candidate preview already did this, so the first batch after it doesn't need another one. A redraw keeps every name, so imports don't change.

**Choosing a metaphor** (the user wants a different one, or the concept has no obvious one): draw 2–3 options as sources, show them in the spot they'll sit with `preview`, let the user pick, and delete the sources that weren't picked.

## Step 3 — Put them to use

Wire the icons into the product where the user wanted them:

- **Use inline SVGs.** Reuse the project's SVG import convention when it produces inline `<svg>` that inherits `currentColor`. Otherwise derive JSX or TSX components from the generated SVGs using the project's component conventions. Update the derived components when the SVGs change.
- **Replace what they stand in for.** If the user asked for sidebar icons, edit the sidebar: swap the old icons or placeholders for the new ones, in the project's own import style (path alias, naming).
- **When a new icon takes over from one of yours,** search the code for imports of `<old>.svg` (and `<old>@…`) to find every place the old one is shown. Switch the places the user meant. If it's shown anywhere else, list those places (file, and what the icon labels there) and ask whether to switch them too; don't decide alone. Delete the old source once nothing imports it; if something still does, keep it, minus the aliases you moved. `build` stops if an import would point at an icon that no longer exists.
- **Show icons only at sizes in `sizes`.** The icons are drawn and checked for those sizes; anywhere in between, edges fall between pixels and blur (in a `pixel` set, some icon pixels come out a screen pixel wider than others). Carry over the old icon's size (`size-4` → 16px) when it's in `sizes`. If the user wants the icons bigger or smaller, don't nudge the CSS: offer the nearest sizes that work, shown side by side in a `preview` of the spot they sit in, then add the pick to `sizes` and use it. In a `pixel` set those are whole multiples of `grid` (a 12 grid: 12, 24, 36). If none fits ("a bit smaller than 24"), the drawings themselves have to shrink (smaller keylines, or a smaller grid): that's a DNA change, so say so and confirm first.
- **Keep the existing states.** Carry over colour classes and `className`. Where the UI swaps to a solid icon for an active or selected state (a tab bar), draw a `<name>-filled` twin (`data-style="filled"`, see `references/source-format.md`) and use it for that state. Don't override the stroke width in CSS or props: the gaps are drawn for `dna.stroke`.
- **Keep accessibility.** An icon-only button needs an accessible name (`aria-label` on the button). Decorative icons next to text get `aria-hidden="true"`.
- **Check it.** `check` must list no ✗ or ! lines for what you touched. Run the project's typecheck or build if it's quick, and fix what you broke.
- Don't swap icons outside what the user asked for. If you see other places that would benefit, mention them and ask.

## Step 4 — Report

Tell the user, briefly:
- which icons were made, and the metaphor for each new concept
- where they're now used (files you changed); for a replaced icon, whether the old one was deleted or is still shown somewhere, and where
- where the files are: sources in `<dir>/source/`, built SVGs in `<dir>/`, and the preview page if you made one
- any rule you knowingly bent and why (waivers)
- how to use more of them, e.g. `import GearIcon from "@/components/icons/gear.svg?react"`

## Why the rules matter (short version)

- **Sources are centrelines.** Stroke width, caps, joins and style are applied by `build`, the same way for every icon.
- **Gaps are measured centreline to centreline**: `≥ stroke + minGap`. Anything closer clogs at real size.
- **Filled isn't "fill on".** The silhouette is filled and inner details are cut out of it; that's why a filled source carries both.
- **Same thing, same geometry, every time.** That is most of what "consistent" means, so reuse parts instead of redrawing.
- **Looks right beats measures right.** Circles are drawn bigger than squares, pointy shapes overshoot. The sheet is the judge, not the numbers.
