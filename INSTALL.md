# Installing the kit into a consumer repository

This kit is a control plane, not a library. It is installed into the repository whose work it governs, and CI executes it there.

## Why you cannot just copy the folder

Copying `agentic-planning-kit/` **including its `.git` directory** into another repository produces an *embedded repository*. Git records the directory as a gitlink (mode `160000`) with no `.gitmodules` entry:

```text
warning: adding embedded git repository: agentic-planning-kit
160000 5f74085... 0    agentic-planning-kit
```

Nothing conflicts and nothing errors, which is what makes it dangerous. The kit's files are never tracked by the consumer repository, a fresh `git clone` produces an empty directory, and the CI checkout produces the same — so every `python "$KIT_PATH/tools/agentic_planning_v3.py"` step fails on a machine that is not yours.

The kit itself is location-independent: `tools/agentic_planning_v3.py` resolves its schemas relative to its own path and takes the workspace separately through `--root`. The only hard requirement is that `tools/` and `schemas/` stay together.

## Quick install

From the kit directory, with the consumer repository already initialized:

```powershell
.\tools\install_kit.ps1 -Workspace C:\path\to\proyectox_workspace -CodeownersOwner "@your-org/your-team"
```

Preview every change first with `-DryRun`. The script never pushes.

| Parameter | Default | Purpose |
|---|---|---|
| `-Workspace` | required | Any path inside the consumer repository |
| `-Mode` | `subtree` | `subtree` (updatable) or `copy` (detached snapshot) |
| `-KitSource` | this kit | Kit URL or local path |
| `-KitRef` | `main` | Branch or tag to vendor |
| `-Prefix` | `agentic-planning-kit` | Install directory; see the warning below |
| `-CodeownersOwner` | `@planning-integrators` | Real integrator team |
| `-RefreshOnly` | off | Regenerate managed blocks without touching the vendored kit |
| `-SkipCi` / `-SkipCodeowners` | off | Leave those files alone |
| `-Force` | off | Overwrite an existing workflow or snapshot |
| `-DryRun` | off | Report intended changes only |

`subtree` mode requires at least one commit and a clean working tree, and git creates one commit for the vendored kit. The merged fragments are deliberately left uncommitted so you can review them.

Keep the default prefix. `TRIGGERS.md` and the prompts reference `agentic-planning-kit/` literally, so renaming it means editing every trigger block by hand.

## What the installer changes

1. **`<prefix>/`** — the vendored kit.
2. **Root `.gitignore`** — the force-include block from `templates/gitignore.agentic-planning-v3`.
3. **Root `.gitattributes`** — the LF rules from `templates/gitattributes.agentic-planning-v3`.
4. **`.github/CODEOWNERS`** — the protected-path fragment, with the placeholder owner substituted.
5. **`.github/workflows/agentic-planning-v3.yml`** — the CI template with `KIT_PATH` set to the prefix.

Items 2–4 are written inside idempotent managed blocks:

```text
# >>> agentic-planning-v3 (managed by install_kit.ps1) >>>
...
# <<< agentic-planning-v3 (managed by install_kit.ps1) <<<
```

Re-running with `-RefreshOnly` rewrites the block in place instead of appending a duplicate. Everything outside the markers is yours and is never touched.

**The fragments must live in the repository root, not in the kit directory.** The kit's own `.gitignore` only applies to its own subtree, so its `!.agentic_planning/**` rules protect nothing from there. The block must also be appended *after* your existing rules, because in `.gitignore` the last matching pattern wins — that is what lets `!.agentic_planning/**` rescue canonical sources from a broad `runs/`, `events/` or `projects/` ignore. Get this wrong and the protected check fails with `PLANNING_SOURCE_IGNORED`.

## Manual install

### git subtree — recommended

```bash
git remote add planning-kit <kit-url-or-path>
```

```bash
git subtree add --prefix agentic-planning-kit planning-kit main --squash
```

The kit's files land as ordinary tracked content, so a plain `git clone` and a plain CI checkout both get everything, and `git subtree pull` gives a real upgrade path.

### Plain copy

Copy the kit's contents into `agentic-planning-kit/`, **excluding `.git`**. Simplest option, no upgrade path, and the vendored version is untraceable unless you record it yourself.

### Submodule

```bash
git submodule add <kit-url> agentic-planning-kit
```

Pins an exact upstream commit, but every clone needs `--recurse-submodules` and the CI checkout needs `submodules: true`. A contributor who forgets ends up with an empty kit directory and failing gates.

### Outside the repository

Install the kit anywhere and invoke it with `--root` pointing at the workspace:

```bash
python /opt/agentic-planning-kit/tools/agentic_planning_v3.py validate --root .
```

Keeps the product repository clean and lets several projects share one kit, but CI needs a second checkout step, and reproducibility depends on you pinning a ref yourself. This is the sensible choice for a multi-repository workspace: install once, and let the coordinator repository that owns `.agentic_planning/` point every repository at it.

After a manual install, merge the fragments yourself — or run `install_kit.ps1 -RefreshOnly` to generate them.

## After installing

1. Review and commit the merged fragments.
2. Replace the CODEOWNERS placeholder with a real team. Note that the fragment protects the vendored kit itself: a feature branch must never be able to edit the validator that gates it.
3. Protect `main`: no direct pushes, required checks, and a serialized merge/integration queue.
4. Configure the protected integration identity that runs route 5.
5. Establish planning state from a session opened at the consumer root:
   - greenfield → `TRIGGERS.md` route 3 (`PROPOSE`)
   - brownfield → `TRIGGERS.md` route 1 (`OBSERVE`), then route 5
   - existing v2 workspace → `TRIGGERS.md` route M (`PLAN`)

## Updating

```bash
git subtree pull --prefix agentic-planning-kit planning-kit main --squash
```

Then refresh the generated blocks in case the templates changed:

```powershell
.\tools\install_kit.ps1 -Workspace C:\path\to\proyectox_workspace -RefreshOnly
```

Treat a kit upgrade as an integration-lane change: it moves the rules that judge everyone's work. Land it on its own, with the gates green, before merging feature work on top of it.

## Removing

Delete the `agentic-planning-kit/` directory, the managed blocks in `.gitignore`, `.gitattributes` and `.github/CODEOWNERS`, and `.github/workflows/agentic-planning-v3.yml`. The `.agentic_planning/` tree is your own planning history — removing the kit does not require deleting it.

## Troubleshooting

| Symptom | Cause |
|---|---|
| CI cannot find `tools/agentic_planning_v3.py` | The kit was added as an embedded repo (gitlink), or `KIT_PATH` does not match the install prefix |
| `PLANNING_SOURCE_IGNORED` | The `.gitignore` fragment is missing from the root, or sits above a broader ignore rule |
| `git subtree` refuses to run | It needs at least one commit and a clean working tree; commit or stash first |
| A trigger block cannot find a prompt | The install prefix is not `agentic-planning-kit` |
| CRLF noise in planning artifacts | The `.gitattributes` fragment is missing from the root |
