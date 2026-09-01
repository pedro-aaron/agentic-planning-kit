# PROMPT_MIGRATE_V2_TO_V3 — Migrate an existing planning workspace on `main`

You are a code agent running at the root of a workspace that already uses Agentic Planning Kit v2. Execute this file as the complete migration specification. The migration changes planning-control artifacts only; it never implements or edits product code.

The migration is deliberately a **main-only maintenance operation**. It does not create a migration branch, switch branches, create a worktree, merge, rebase, pull, commit, push, open a PR or modify a remote. The operator synchronizes `main` first; this prompt proves that synchronization before it writes.

## Invocation contract

The trigger supplies:

```text
MODE: PLAN | APPLY | ROLLBACK
TARGET_PATH: .
EXPECTED_MAIN_SHA: <40-hex commit observed after the operator synchronized main>
EXPECTED_UPSTREAM: origin/main
MIGRATION_ID: <mig_<UUID>; omit only in PLAN so the agent can propose one>
RECEIPT_PATH: <required only for ROLLBACK>
MIGRATION_AUTHORIZATION: <empty for PLAN; exact phrase below for APPLY/ROLLBACK>
```

Authorization phrases:

```text
APPLY V3 MIGRATION ON MAIN AT <EXPECTED_MAIN_SHA> ID <MIGRATION_ID>
ROLLBACK V3 MIGRATION ON MAIN AT <EXPECTED_MAIN_SHA> RECEIPT <RECEIPT_PATH>
```

Never infer or repair a missing value. `PLAN` is read-only. `APPLY` must perform the complete PLAN analysis again in memory before its first write. A PLAN result is advisory and never authorizes a later APPLY against a different commit.

## Goal

Migrate v2 planning state to the v3 collaboration contract:

- globally unique entity IDs independent from slugs or usernames;
- immutable descriptors, plan revisions and one-file-per-event history;
- unique run/attempt paths that never overwrite earlier reports;
- declared repository write scopes and shared-resource claims;
- structured workspace catalog plus semantic `map-deltas`;
- `.agentic_planning/README.md`, `WORKSPACE_MAP.md`, root blueprint mirrors and managed agent blocks as generated global projections;
- `RECONCILE_MAIN` as their only writer;
- legacy artifacts preserved byte-for-byte and indexed through additive import manifests;
- v3-only writes after cutover — never dual-write v2 and v3.

## Absolute safety boundary

The migration may inspect the entire workspace but may write only planning-control paths declared in its staged manifest:

```text
.agentic_planning/CONTRACT.json
.agentic_planning/imports/legacy/**
.agentic_planning/catalog/**
.agentic_planning/migrations/<migration-id>/**
.agentic_planning/README.md
WORKSPACE_MAP.md
PROJECT_BLUEPRINT.md                       # only if it is an existing v2 generated mirror
CLAUDE.md / AGENTS.md / existing tool rules # only their agentic-routes managed block
```

It must not edit source, tests, product documentation, dependency/package manifests, dependency lockfiles, CI, hooks, databases, migrations, environments or cloud resources. It must not run product build/test/migration commands. It must not copy secret values into any artifact.

Legacy planning trees are immutable inputs. Never rename, move, delete or edit bytes below legacy paths such as:

```text
.agentic_planning/_feature_*/**
.agentic_planning/_analysis_*/**
.agentic_planning/_project_*/**
```

Existing human text outside managed blocks is immutable. A migration that cannot distinguish generated text from human-owned text stops with `BLOCKED_HUMAN_CONTENT_BOUNDARY`.

## Main-only Git preflight

Run this preflight before PLAN output and repeat it immediately before APPLY or ROLLBACK writes:

1. Resolve `TARGET_PATH` without following a symlink outside the declared workspace.
2. Require the workspace planning-control root to be a Git repository. If the workspace contains several independent repositories, apply the multi-repository rule below.
3. Require current branch name exactly `main`; detached HEAD or any other branch returns `BLOCKED_NOT_MAIN`.
4. Require the worktree and index completely clean, including untracked files, before migration staging. Ignore nothing merely because it looks generated.
5. Require an upstream configured for `main` and require its canonical name to equal `EXPECTED_UPSTREAM`.
6. Run `git fetch` for that upstream only to refresh remote-tracking evidence. Do not pull, merge or rebase.
7. Require `HEAD == EXPECTED_MAIN_SHA` and `EXPECTED_UPSTREAM == EXPECTED_MAIN_SHA`.
8. Require ahead count `0`, behind count `0` and no divergence. A stale local main returns `BLOCKED_MAIN_NOT_SYNCHRONIZED` and tells the operator to synchronize it outside this prompt.
9. Capture `git status --porcelain=v1`, HEAD, upstream and tree hash in the migration plan/receipt. Do not print remote URLs containing credentials.
10. Inspect linked worktrees and active v2/v3 maintenance receipts. Another active migration or reconciliation returns `BLOCKED_MAINTENANCE_ACTIVE`.

The prompt never uses `git checkout`, `git switch`, `git branch`, `git worktree`, `git merge`, `git rebase`, `git pull`, `git commit` or `git push`.

### Multiple repositories or a non-Git workspace root

V3 collaboration requires one Git repository to own `.agentic_planning/` and global projections. That repository is the **coordinator repository**.

- If the workspace root is not a repository and no already-configured coordinator repository owns the planning tree, stop with `BLOCKED_COORDINATOR_REPOSITORY_REQUIRED`. Never initialize Git automatically.
- If a coordinator exists, require its checked-out branch to be `main`, clean and exactly synchronized as above.
- Inventory every product repository referenced by the v2 map. Each must be on its own `main`, clean and synchronized before APPLY; record its root, non-secret remote fingerprint and SHA.
- Migration writes only in the coordinator repository. It does not edit product repositories.
- No artifact may claim the migration is atomic across repositories. A missing or stale repository blocks APPLY rather than producing partial coordination state.

## Mandatory read-only PLAN pass

PLAN and the first half of APPLY perform the same analysis without writes:

1. Inventory v2 kit/version markers, `WORKSPACE_MAP.md`, `.agentic_planning/README.md`, all legacy feature/analysis/project trees, generated outputs, root blueprint mirrors and managed agent blocks.
2. Hash every persisted legacy planning file. Record path, type, size and SHA-256; do not store file contents in the receipt.
3. Detect secrets using redacted finding categories. A possible secret in a planning artifact blocks APPLY until the operator removes it; never persist the matched value.
4. Classify every legacy artifact as `feature`, `analysis`, `project`, `step`, `output`, `map`, `index`, `blueprint`, `managed_block` or `unknown`.
5. Identify human-owned prose and unmanaged files. They stay untouched.
6. Detect duplicate slugs, broken links, ambiguous statuses, incomplete runs, stale index rows and map drift. Record them; do not silently repair factual ambiguity.
7. Build an exact staged-write manifest and rollback manifest. Every destination must use create-new semantics except the explicitly generated projections and managed blocks with recorded preimage hashes.
8. Render all prospective JSON and Markdown into an isolated local staging directory under `.agentic_planning/.local/`. Staging is ephemeral and must not be committed; remove it after success. Validate and secret-scan the rendered bytes before applying.
9. Print a concise plan: migration ID, legacy counts/hashes, proposed IDs, created paths, projection replacements, blockers, ambiguity count and rollback eligibility.

PLAN performs no writes, including no receipt, lock or staging directory. In APPLY, staging begins only after the in-memory plan is complete and authorization/preflight still match.

## Stable identity and import rules

- Create one repository identity `repo_id` in `.agentic_planning/CONTRACT.json` using a new UUID only when no v3 contract exists.
- New native v3 records use collision-resistant UUID-based IDs with prefixes `repo_`, `ftr_`, `ana_`, `prj_`, `rev_`, `evt_`, `stp_`, `run_`, `att_`, `delta_`, `cat_` and `rec_`; the migration transaction itself uses `mig_`.
- Legacy imports use deterministic UUIDv5 identifiers derived from `repo_id + normalized legacy path + legacy tree SHA-256`. The same input always produces the same ID.
- Username, timestamp and slug are metadata, never identity.
- Store import sidecars under `.agentic_planning/imports/legacy/<entity-id>/`; never add sidecars inside a legacy tree.
- Each sidecar records source path/hash, kind, derived ID, readable slug/title, imported status with confidence, links to legacy docs and `provenance: legacy_import`.
- Existing step reports become referenced legacy runs. Record their hashes and paths; do not copy or rewrite them. A future retry uses a new v3 `run_id` and `attempt_id` path.
- Ambiguous state becomes `UNKNOWN_LEGACY`, which is non-terminal and serialized. Do not infer completion from folder presence alone.
- Import existing relationships such as supersession or “Derivó en” only when supported by real links/content; otherwise leave them unknown.

## Catalog and map baseline

1. Import the factual v2 `WORKSPACE_MAP.md` as a baseline catalog revision with stable section/claim IDs and the exact source hash.
2. Preserve uncertain prose as `UNKNOWN_LEGACY`; do not promote it to a factual claim.
3. Partition facts into catalog records for subprojects, resources, gates, seams, recipes, repositories and unknowns.
4. Every record cites the legacy map section and, when available, implementation evidence.
5. Generated `WORKSPACE_MAP.md` is planning-map contract 4 and identifies its catalog input hash; the separate reconciliation receipt hashes the generated map to avoid a receipt/output hash cycle.
6. Future branch work never edits the catalog or map. It creates semantic `map-deltas` with expected item hashes; `RECONCILE_MAIN` applies them.

## Index and state projection

- `.agentic_planning/README.md` becomes a generated view of v3 descriptors/events plus immutable legacy import sidecars.
- Sort deterministically by declared creation date and entity ID as a tie-breaker; never depend on filesystem order.
- Feature and analysis status comes from events/import state, not mutable table cells.
- “Derivó en” is derived from feature `source_analysis_ids` or proven legacy links.
- Generated views carry `GENERATED — DO NOT EDIT; run RECONCILE_MAIN` markers.
- Preserve any human-owned index prose in an explicitly labeled legacy-note catalog record or stop if ownership cannot be determined.

## APPLY transaction

APPLY follows this order:

1. Verify the exact authorization phrase and repeat the main-only preflight.
2. Compute the full PLAN in memory; any blocker means zero writes.
3. Acquire an atomic local maintenance lock under `.agentic_planning/.local/`. This lock coordinates only this checkout and is never described as distributed authority or committed.
4. Render and validate all prospective outputs in isolated staging.
5. Write an immutable `PREPARE.json` under `.agentic_planning/migrations/<migration-id>/` containing preflight evidence, source hashes, staged output hashes, exact allowed writes and rollback preconditions.
6. Create `.agentic_planning/CONTRACT.json`, legacy import sidecars, baseline catalog records and imported events using create-new semantics.
7. Run the deterministic v3 reconciliation reducer against the complete staged post-migration tree, then publish its catalog, map, index, managed blocks and schema-valid reconciliation receipt as part of this one migration transaction. Do not launch a separate reconciliation session against an already dirty checkout.
8. Verify every written byte against the staged manifest and verify that no undeclared path changed.
9. Write `COMMIT.json` last with the final tree hashes, reconciliation receipt and migration status `V3_ACTIVE`.
10. Remove local staging/lock. Do not commit or push. Return the exact changed-path list and tell the operator the worktree is intentionally dirty for review and commit on `main`.

If execution stops after PREPARE but before COMMIT, state is `MIGRATION_INCOMPLETE`. A later APPLY with the same migration ID may recover only when every existing output matches PREPARE exactly; otherwise stop for explicit ROLLBACK. Never start a different migration over an incomplete one.

## No dual-write cutover

After COMMIT:

- `.agentic_planning/CONTRACT.json` conforms exactly to `schemas/contract.schema.json`, including `writer_contract: v3`, `planning_map_contract: 4`, `legacy_mode: read_only`, exclusive writer authority, optional root project, exact managed entry points and protected global paths.
- Any v1/v2 prompt that attempts `_feature_<slug>`, `_analysis_<slug>`, fixed `outputs/NN_*.md`, direct index-row edits or direct map updates must stop with `LEGACY_WRITER_DISABLED`.
- V3 prompts may read legacy imports but write only native v3 artifacts.
- Do not maintain a v2 row and a v3 event for the same transition.

## ROLLBACK

ROLLBACK is exceptional and main-only. It never deletes or rewrites legacy artifacts.

1. Verify the exact authorization, main synchronization and receipt chain.
2. Require that no native v3 entity/event/run/delta was created after the migration COMMIT. If one exists, stop with `BLOCKED_V3_ACTIVITY_PRESENT`; use a forward fix instead.
3. Restore only generated projections and managed blocks from recorded exact preimages.
4. Remove only paths created by this migration whose hashes still match COMMIT. A changed path is preserved and blocks automatic rollback.
5. Write `ROLLBACK.json` last and leave all legacy bytes intact.
6. Do not commit, push or change branches.

Rollback freezes v3 writes; it never silently re-enables v2 writers. Re-enabling an older contract requires a separate explicit human decision.

## Completion criteria

APPLY is complete only when:

- main remained the checked-out branch and was synchronized at the write preflight;
- no branch, worktree, commit, merge, pull or push was created;
- all legacy planning files retain their original SHA-256;
- all imported entities have stable IDs and provenance sidecars;
- the baseline catalog and contract validate;
- map and index rebuild deterministically from canonical sources;
- the successful reconciliation receipt hashes generated projections and managed blocks without being embedded into those outputs (the migration's own `COMMIT.json` remains a separate cutover receipt, not a Git commit);
- a second APPLY with the same inputs is a verified no-op;
- v2 writers are disabled and legacy remains readable;
- the migration secret scan is clean;
- PREPARE and COMMIT receipts form a complete hash chain.

Finish with: mode, migration ID, main/upstream SHA, repository count, imported counts by kind, ambiguous legacy count, created/updated paths, protected legacy hash verification, reconciliation result, rollback eligibility and explicit confirmation: **no branch, worktree, commit or push was created**.
