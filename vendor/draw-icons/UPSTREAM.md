# Bundled draw-icons

Rony Kati created `draw-icons` and released it under Apache-2.0. This copy uses upstream
commit [`4b64f8f`](https://github.com/ronykax/skills/tree/4b64f8f38b381441d3cb3eb437efebcffff52f80/skills/draw-icons).
The [LICENSE](./LICENSE) and [NOTICE](./NOTICE) come from that revision.

APK adapted `SKILL.md`, `references/setup.md` and `references/review.md` to use local tools
and assets. `scripts/lib/config.js` reads the bundled YAML parser. `scripts/lib/render.js`
loads the WebAssembly renderer and review-sheet font from disk. The CLI package manifest
reflects the bundled layout and the upstream npm lockfile is omitted.

| Runtime files | Release or source | License |
|---|---|---|
| `scripts/deps/yaml/` | [yaml 2.9.1 Node runtime](https://www.npmjs.com/package/yaml/v/2.9.1) by Eemeli Aro | [ISC](./scripts/deps/yaml/LICENSE) |
| `scripts/deps/resvg/` | [resvg-wasm 2.6.2](https://www.npmjs.com/package/@resvg/resvg-wasm/v/2.6.2), copyright 2021–present yisibl, [corresponding source](https://github.com/thx/resvg-js/tree/v2.6.2) | [MPL-2.0](./scripts/deps/resvg/LICENSE) |
| `scripts/deps/abeezee/` | [ABeeZee Regular](https://github.com/google/fonts/tree/main/ofl/abeezee) by the ABeeZee Project Authors | [OFL-1.1](./scripts/deps/abeezee/OFL.txt) |
