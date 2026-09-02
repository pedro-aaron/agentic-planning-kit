# Installing the kit into a consumer repository

This kit is a control plane, not a library. It is installed into the repository whose work it governs, and continuous integration (CI) executes it there.

## Why you cannot just copy the folder

Copying `agentic-planning-kit/` **including its `.git` directory** into another repository produces an *embedded repository*. Git records the directory as a gitlink (mode `160000`) with no `.gitmodules` entry:

```text
warning: adding embedded git repository: agentic-planning-kit
160000 5f74085... 0    agentic-planning-kit
```

Nothing conflicts and nothing errors, which is what makes it dangerous. The kit's files are never tracked by the consumer repository, a fresh `git clone` produces an empty directory, and the CI checkout produces the same — so every `python "$KIT_PATH/tools/agentic_planning_v3.py"` step fails on a machine that is not yours.

The kit itself is location-independent: `tools/agentic_planning_v3.py` resolves its schemas relative to its own path and takes the workspace separately through `--root`. The only hard requirement is that `tools/` and `schemas/` stay together.

## Where to install: the workspace, not the project

Install the kit once over the **workspace** — the root holding every internal project of one solution — not once per project. The kit's value comes from planning across projects: cross-project features, honest resource claims, correct regression scope and declared ordering between a migration and the code that depends on it. See the workspace rationale in [`README.md`](./README.md#workspaces).

| Topology | Install target | `--root` | CI |
|---|---|---|---|
| Single repository, projects as directories | Workspace root | `.` (covers every project) | One workflow, one checkout |
| Workspace root with independent repositories | The coordinator repository that owns `.agentic_planning/` | The coordinator repository | Each repository's workflow needs the kit — vendor it in the coordinator and check that out as a second step, or use the out-of-repo install below |

Concretely, for a workspace holding a `database/`, an `api/`, a `backend/` and a `frontend/` as separate projects inside a single repository:

```text
<workspace>/                <- git init here, install the kit here
├── .agentic_planning/
├── agentic-planning-kit/
├── database/
├── api/
├── backend/
└── frontend/
```

Each project keeps its own build, tests and deployment; the workspace only adds the shared planning tree above them. In the multi-repository topology the layout is the same, except each project directory is its own Git repository and the kit is installed in the coordinator that owns `.agentic_planning/`.

**One kit per workspace.** A second copy — `agentic-planning-kit2/`, a per-project copy, a stale vendored snapshot next to a fresh one — means two control planes with undefined precedence: prompts resolve to whichever path the trigger names, CI runs whichever `KIT_PATH` says, and the two drift apart silently. Use `git subtree pull` to move one installation forward instead of adding a second directory.

## Quick install

The kit is public at **<https://github.com/pedro-aaron/agentic-planning-kit>**. Clone it once, anywhere outside the consumer repository:

```bash
git clone https://github.com/pedro-aaron/agentic-planning-kit.git
```

Two equivalent installers ship with it. Run either from that clone, with the consumer repository already initialized.

Windows:

```powershell
.\tools\install_kit.ps1 -Workspace C:\path\to\my_workspace
```

macOS and Linux:

```bash
./tools/install_kit.sh --workspace ~/src/my_workspace
```

Only `-Workspace` / `--workspace` is required. `CODEOWNERS` is written with the placeholder owner `@myteam`; pass `-CodeownersOwner` / `--codeowners-owner "@your-team"` to set your own, now or later with a `--refresh-only` run.

Preview every change first with `-DryRun` / `--dry-run`. Neither script ever pushes.

| PowerShell | Bash | Default | Purpose |
|---|---|---|---|
| `-Workspace` | `--workspace` | required | Any path inside the consumer repository |
| `-Mode` | `--mode` | `subtree` | `subtree` (updatable) or `copy` (detached snapshot) |
| `-KitSource` | `--kit-source` | this clone | Kit uniform resource locator (URL) or local path; pass `https://github.com/pedro-aaron/agentic-planning-kit.git` to vendor upstream instead of your local copy |
| `-KitRef` | `--kit-ref` | `main` | Branch or tag to vendor |
| `-RemoteName` | `--remote-name` | `planning-kit` | Remote name used by subtree mode |
| `-Prefix` | `--prefix` | `agentic-planning-kit` | Install directory; see the warning below |
| `-CodeownersOwner` | `--codeowners-owner` | `@myteam` | GitHub handle of the team that owns the protected paths |
| `-RefreshOnly` | `--refresh-only` | off | Regenerate managed blocks without touching the vendored kit |
| `-SkipCi` / `-SkipCodeowners` | `--skip-ci` / `--skip-codeowners` | off | Leave those files alone |
| `-Force` | `--force` | off | Overwrite an existing workflow or snapshot |
| `-DryRun` | `--dry-run` | off | Report intended changes only |

Both write byte-identical files, and either one refreshes an installation performed by the other: the managed-block markers say `install_kit`, not the script name. A mixed-platform team can use whichever is at hand.

`subtree` mode requires at least one commit and a clean working tree, and git creates one commit for the vendored kit. The merged fragments are deliberately left uncommitted so you can review them.

Keep the default prefix. `TRIGGERS.md` and the prompts reference `agentic-planning-kit/` literally, so renaming it means editing every trigger block by hand.

### Git identity

That commit needs an author, so git must know who you are before the installer runs. A fresh shell — a new Windows Subsystem for Linux (WSL) distribution, a container, a continuous-integration (CI) runner — usually does not, and the install stops with `Author identity unknown` after staging the vendored files but before committing them. Set it once:

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

These two values are metadata written inside every commit, not credentials: they authenticate nothing and grant no access. Pushing is authorized separately, by a token over HTTPS or by a Secure Shell (SSH) key.

For GitHub to attribute the commits to your profile, `user.email` must be an address verified on your account. Settings → Emails also offers a private `ID+username@users.noreply.github.com` address, which links commits to your profile without publishing your real address in the history. `user.name` is free text and need not match your GitHub username.

To commit under a different identity in one repository — a work account, a shared machine — omit `--global` and set it inside that repository:

```bash
git -C /path/to/my_workspace config user.name "Your Name"
git -C /path/to/my_workspace config user.email "you@company.com"
```

Windows and WSL keep separate git configurations. Setting the identity in one leaves the other unset, so a clone driven from both needs it in both.

## What the installer changes

1. **`<prefix>/`** — the vendored kit.
2. **Root `.gitignore`** — the force-include block from `templates/gitignore.agentic-planning-v3`.
3. **Root `.gitattributes`** — the line-feed (LF) end-of-line rules from `templates/gitattributes.agentic-planning-v3`.
4. **`.github/CODEOWNERS`** — the protected-path fragment, with the placeholder owner substituted.
5. **`.github/workflows/agentic-planning-v3.yml`** — the CI template with `KIT_PATH` set to the prefix.

Items 2–4 are written inside idempotent managed blocks:

```text
# >>> agentic-planning-v3 (managed by install_kit) >>>
...
# <<< agentic-planning-v3 (managed by install_kit) <<<
```

Re-running with `-RefreshOnly` / `--refresh-only` rewrites the block in place instead of appending a duplicate. Everything outside the markers is yours and is never touched. A file carrying a managed block is rewritten with LF endings throughout, matching the kit's `.gitattributes` rules — expect that one-time normalization if the consumer repository stored those files with carriage-return line-feed (CRLF) endings.

**The fragments must live in the repository root, not in the kit directory.** The kit's own `.gitignore` only applies to its own subtree, so its `!.agentic_planning/**` rules protect nothing from there. The block must also be appended *after* your existing rules, because in `.gitignore` the last matching pattern wins — that is what lets `!.agentic_planning/**` rescue canonical sources from a broad `runs/`, `events/` or `projects/` ignore. Get this wrong and the protected check fails with `PLANNING_SOURCE_IGNORED`.

## Manual install

Every command below can be run without cloning the kit first — the URL is public.

### git subtree — recommended

```bash
git remote add planning-kit https://github.com/pedro-aaron/agentic-planning-kit.git
```

```bash
git subtree add --prefix agentic-planning-kit planning-kit main --squash
```

The kit's files land as ordinary tracked content, so a plain `git clone` and a plain CI checkout both get everything, and `git subtree pull` gives a real upgrade path.

To pin a released version instead of tracking `main`, substitute the tag for `main` in both the `subtree add` and later `subtree pull` commands.

### Plain copy

Copy the kit's contents into `agentic-planning-kit/`, **excluding `.git`**. Simplest option, no upgrade path, and the vendored version is untraceable unless you record it yourself.

### Submodule

```bash
git submodule add https://github.com/pedro-aaron/agentic-planning-kit.git agentic-planning-kit
```

Pins an exact upstream commit, but every clone needs `--recurse-submodules` and the CI checkout needs `submodules: true`. A contributor who forgets ends up with an empty kit directory and failing gates.

### Outside the repository

Clone the kit anywhere and invoke it with `--root` pointing at the workspace:

```bash
git clone https://github.com/pedro-aaron/agentic-planning-kit.git /opt/agentic-planning-kit
```

```bash
python /opt/agentic-planning-kit/tools/agentic_planning_v3.py validate --root .
```

In CI, fetch the kit as a second checkout beside the product repository and point `KIT_PATH` at it:

```yaml
- uses: actions/checkout@v4
  with:
    repository: pedro-aaron/agentic-planning-kit
    ref: main          # pin a tag or Secure Hash Algorithm (SHA) commit identifier for reproducible gates
    path: .planning-kit
```

Keeps the product repository clean and lets several repositories share one kit, but CI needs a second checkout step, and reproducibility depends on you pinning a ref yourself. This is the sensible choice for a **multi-repository workspace**: install once, and let every repository's CI reach the same kit while the coordinator repository that owns `.agentic_planning/` remains the single planning tree. It is the wrong choice for a single-repository workspace, where vendoring costs nothing and removes a moving part.

After a manual install, merge the fragments yourself — or run either installer with `-RefreshOnly` / `--refresh-only` to generate them.

## After installing

1. Review, commit and push the merged fragments. Neither installer ever pushes, and the subtree commit it created is local until you send it:

   ```bash
   git -C /path/to/my_workspace status
   git -C /path/to/my_workspace add .gitignore .gitattributes .github
   git -C /path/to/my_workspace commit -m "Install agentic-planning-kit v3 control plane"
   git -C /path/to/my_workspace push
   ```

   A subtree install produces three commits on `main`: the squashed kit content, the merge that grafts it under the prefix, and your own commit for the fragments. Any Git client works — GitHub Desktop pushes them just as well.

2. Establish planning state from a session opened at the consumer root:
   - greenfield → `TRIGGERS.md` route 3 (`PROPOSE`)
   - brownfield → `TRIGGERS.md` route 1 (`OBSERVE`), then route 5
   - existing v2 workspace → `TRIGGERS.md` route M (`PLAN`)

   Until this runs there is no `.agentic_planning/CONTRACT.json`, and the validator exits with `ARTIFACT_MISSING`. That is expected on a fresh install.

3. Set the CODEOWNERS owner to your team handle, replacing the `@myteam` placeholder. Note that the fragment protects the vendored kit itself: a feature branch must never be able to edit the validator that gates it.
4. Protect `main`: no direct pushes, required checks, and a serialized merge/integration queue. Do this **after** step 2 — the CI check fails while planning state is missing, so making it required any earlier blocks every pull request.
5. Configure the protected integration identity that runs route 5.

Pushing the install does not by itself configure `main`. Steps 3 to 5 happen in the repository's settings on GitHub, not in the working tree, and nothing in the kit can perform them for you.

## Updating

From the consumer repository, with the `planning-kit` remote already configured by the installer:

```bash
git subtree pull --prefix agentic-planning-kit planning-kit main --squash
```

If the remote is missing — a fresh clone of the consumer repository does not carry it, since remotes are local configuration — add it back first:

```bash
git remote add planning-kit https://github.com/pedro-aaron/agentic-planning-kit.git
```

Then refresh the generated blocks in case the templates changed:

```powershell
.\tools\install_kit.ps1 -Workspace C:\path\to\my_workspace -RefreshOnly
```

```bash
./tools/install_kit.sh --workspace ~/src/my_workspace --refresh-only
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
| `env: 'bash\r': No such file or directory` from `install_kit.sh` | The kit was cloned on Windows with `core.autocrlf=true`. Refresh the checkout with `git rm --cached -r . && git reset --hard`, or convert in place with `sed -i 's/\r$//' tools/install_kit.sh` |
| `Author identity unknown` / `empty ident name` during `subtree add` | Git has no `user.name` / `user.email` in that shell. Set them, then run `git reset --hard` in the consumer root to drop the half-staged kit and re-run the installer — do not commit the staged files by hand, since a plain commit lacks the `git-subtree-dir:` metadata that later `subtree pull` needs |
