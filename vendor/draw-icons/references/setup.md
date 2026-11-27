# Setting up `icons.yaml`

APK adaptation for offline use. [Source and changes](../UPSTREAM.md)

The file is a line about the product plus the style DNA. Like `biome.json` tells Biome how to behave, this tells you how to draw for *this* product. Fill it with as few questions as possible: find what you can, ask only what blocks the work, and show pictures instead of asking about design terms.

There is no draft state: the file is written once everything is decided. If it exists, the project is set up.

## Contents
1. Flow
2. The fields
3. Questions that work (plain language → field)
4. The candidate preview
5. Changing things later

## 1. Flow

1. **Look at the project.** Find out, from `package.json` and a few searches:
   - the framework and bundler, and whether it can import an SVG as a component yet
   - the icon library in use (lucide, heroicons, tabler…), which icons it shows, and at what px sizes (`size={20}`, Tailwind `size-4`/`w-4` = 16px, no size = the library's default, usually 24)
   - fonts and font weights, and the border radii of buttons and cards
   - where components live, for the icon folder (`src/components/icons` if there's a `src/components`)

   Also look at the UI itself if you can (screenshots, the CSS): how heavy the body text is, whether the product feels soft or technical.
2. **One message: what you found + the gaps.** State the findings as a short list ("React + Vite + Tailwind, lucide-react in the sidebar at 16px, square UI, pixel font"), then ask the open questions from section 3, at most ~6, each with options to pick from: 2–4 that fit this project, your recommendation first, plus "decide for me". Include where the icons go and how the React UI will use inline SVGs (SKILL.md step 3). When the user says "decide for me", decide and say what you picked in one line.
3. **Show the candidate preview** (section 4) and let the user pick.
4. **Write the file.** Copy the winning candidate to `icons.yaml` at the project root, then fill in the answers. Put the winning test icons in `<dir>/source/`.
5. **`check`** must report `✓ complete`.

If a tool for asking structured questions is available (multiple-choice cards), use it; it's faster for the user than typing. Without one, write each question with a short numbered list of options so the user can answer "1, 3, 2".

## 2. The fields

```yaml
product: Invoicing app for freelance designers
personality: [calm, friendly, precise]
sizes: [16, 20]                # px sizes icons are shown at
dir: src/components/icons
avoid: [letters or numbers inside icons, dollar sign for money (use a banknote)]

# Baked into every drawing: changing it means redrawing every icon (stroke: re-lint and fix instead).
dna:
  style: outline
  stroke: 2
  grid: 24
  padding: 1
  keylines: { circle: 20, square: 18, portrait: [16, 20], landscape: [20, 16] }
  corners: { family: circular, radius: { large: 2, small: 1 }, largeThreshold: 8 }
  caps: round
  joins: round
  angles: [0, 45, 90]
  detail: low
  minGap: 2
  badge: { position: bottom-right, size: 8, gap: 2 }
```

| Field | What it holds | How you get it |
|---|---|---|
| `product` | One line: what it is and who it's for | ask (offer your best reading) |
| `personality` | 3 words for how it should feel; guides metaphors and the DNA | ask |
| `sizes` | Pixel sizes icons are shown at; the render shows these | found (the sizes the code shows icons at) |
| `dir` | The icon folder: `source/` plus the built SVGs | ask (offer a folder next to the components first) |
| `avoid` | Hard nos, incl. banned metaphors | ask once |
| `dna.style` | `outline`, `duotone` or `filled`: one per set | asked, or taken from the request ("duotone, sharp") |
| `dna.stroke` | Stroke width in grid units; gaps are drawn for it | preset, tuned on the candidate preview |
| `dna.duotoneOpacity` | Optional, duotone only: 0.2 (Phosphor, the default) – 0.4 (Hugeicons) | decide |
| `dna.grid`, `dna.padding` | Canvas (24) and empty margin | preset |
| `dna.keylines` | circle / square / portrait / landscape sizes that look equally big | preset |
| `dna.corners` | `family` circular / squircle / sharp; `radius.large` for shapes ≥ `largeThreshold`, `radius.small` below | candidate preview |
| `dna.caps`, `dna.joins` | round / butt / square; round / miter / bevel | candidate preview |
| `dna.angles` | Allowed line angles, e.g. `[0, 45, 90]` | preset |
| `dna.detail` | minimal / low / medium / high: how many strokes an icon may have | from sizes (≤16px → minimal or low) |
| `dna.minGap` | Smallest visible gap between the ink of separate elements | preset |
| `dna.badge` | Where modifier badges (+, ✓, ×) go and how big | preset |
| `dna.pixel` | Optional, `true` for pixel art: every grid unit is one icon pixel. Requires a whole-number `stroke`, `sharp` corners, `miter` joins, square or butt caps, angles `[0, 90]`, and `sizes` that are whole multiples of `grid`. Lint then allows only horizontal and vertical runs on the pixel grid, and the built SVGs render with crisp edges | the product has a pixel or retro look, or the user asks for it |
| `dna.signature` | Optional. At most one distinctive trait (e.g. "one corner of every container is cut at 45°"); restraint matters more than novelty | ask only when the user wants character |

When a value isn't the obvious one, leave the reason as a short comment on its line (`minGap: 0.4  # pixel art: diagonal contact counts as a join`). Nothing else goes in the file; `check` rejects unknown keys.

### Matching DNA to the product
- **Stroke ≈ the text next to it.** Icons beside 14px regular text want a thinner stroke (1.5 at 24 grid) than icons beside bold UI (2+).
- **Corners echo the UI.** Pill buttons and big card radii → squircle or larger circular radii; sharp-cornered UI → small radii, maybe miter joins.
- **Personality → caps/joins.** Friendly, calm, playful → round caps and joins. Precise, technical, serious → square/butt caps, miter joins, small radii.
- **Pixel look** (pixel font, retro UI): start from `pixel`: `pixel: true`, a small grid (12 or 16 icon pixels), stroke fixed at 1, sharp corners, square caps, miter joins, angles `[0, 90]`, and `sizes` at whole multiples of the grid (a 12 grid at 24px makes every icon pixel 2×2 screen pixels). Pick the grid so one multiple matches the size the UI needs.
- **Small sizes → less detail.** If icons are mostly 16px, set `detail` to `minimal`/`low`, and keep `minGap` ≥ 2.
- **Heavy strokes** (kids, games, bold consumer apps): raise the stroke on `plain` or `soft` and shrink the keylines by the extra half-stroke to keep the padding. A heavy stroke leaves little room inside shapes, so keep icons to a few bold pieces.
- **Stroke costs detail.** Every gap is sized for it (`stroke + minGap` between centrelines), so a heavier stroke leaves less room inside every icon.
- **Style.** Outline is the safe default. Duotone suits friendly, illustrative products. Filled suits bold, small, high-contrast UI, and needs silhouettes that read on their own.

## 3. Questions that work

Ask about feel and use, not design terms. The options below are examples: write ones that fit what you found, recommendation first.

| Ask | Example options | Sets |
|---|---|---|
| "What is the product, and who is it for?" | Your best reading from the README / package.json as option 1 ("A reading tracker for book clubs?"), then "something else" | `product` |
| "How should the icons feel?" | calm & precise / friendly & soft / bold & playful / serious & technical (the one that matches the UI first) | `personality` → caps, joins, corners |
| "Where should the icon files live?" | a folder next to the components (`src/components/icons`) / one or two other folders that fit the layout (`src/icons`, `src/assets/icons`) | `dir` |
| "Which look?" (skip if the request already says) | outline / duotone (outline + soft tint) / filled (solid shapes) | `dna.style` |
| "Anything icons should never show?" | nothing special / no text or letters inside icons / no hands or people / no money symbols (multi-select) | `avoid` |

Every question gets a "decide for me" option. Don't ask about grid, padding, keylines, angles, gaps or badges; those come from the preset or your judgement.

## 4. The candidate preview

The user picks a look by seeing the icons in their own UI, not on a grid.

**Which icons.** 4–6 from the icons this request is for (the sidebar's items, the tab bar's), chosen to differ as much as possible: a round one, a square one, a tall or wide one, the most detailed one, and the product-specific concept. If the request doesn't name icons yet, use house, search, settings, user, file and one product-specific concept.

**Candidates.** Make 2–3 candidate DNAs that differ in one or two things the user will feel (stroke weight and corner family are the big ones; caps/joins next). All share the chosen `style`. Start from the presets in `assets/presets.json`: `pixel` (retro bitmap), `plain` (neutral, even weight), `soft` (light stroke, wide smooth corners), `crisp` (thin, hard corners, square ends). Only use a preset whose `styles` list has the chosen `style`, and read its `notes`. Keep candidates outside the project (a temp folder): write `<tmp>/candidate-a.yaml` per candidate with the fields from section 2, `dna` copied from the preset plus the chosen `style`, and its sources in `<tmp>/candidate-a/`. Draw the icons **once**, with gaps sized for the heaviest candidate stroke, and only re-run the `shape` helper with each candidate's `--family`/radius. Check each candidate yourself with `render`/`sheet --config <tmp>/candidate-a.yaml --source <tmp>/candidate-a` before the user sees anything.

**The page.** Build a template of the UI the icons go into and run `preview <template> --candidates <tmp>/candidate-a.yaml,<tmp>/candidate-b.yaml --open`; see "The preview page" in `review.md`. Ask which one (recommendation first; "A's corners with B's weight" is a fine answer), and adjust and re-run until they're happy. The winner's sources become the first icons in `<dir>/source/`.

## 5. Changing things later

- **`dna.stroke`**: edit, `lint all`, fix what it flags (a heavier stroke closes gaps), `build`.
- **The rest of `dna`**, `style` included: it changes every drawing. Tell the user, get a yes, update it, redraw all icons.
- **`sizes`** (the user wants icons bigger or smaller): offer the nearest sizes that work, side by side in a `preview`; add the pick. In a `pixel` set only whole multiples of `grid` work. A size in between means shrinking the drawings, which is a DNA change.
- **`dir`**: move the folder, update `dir`, `build`, and fix the imports.
- **New icons** don't touch the config.
