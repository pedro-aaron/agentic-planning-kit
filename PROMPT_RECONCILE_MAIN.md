# PROMPT_RECONCILE_MAIN — Exclusively reconcile v3 state and global projections

You are the exclusive global-state writer for Agentic Planning Kit v3. Run at the workspace root in an integration checkout created from the current protected `main`, or—only when candidate mutation is impossible—in the blocked post-merge maintenance fallback described below. Execute this file as the complete specification.

This prompt reconciles planning-control state. It does not implement product behavior. It may validate product diffs and implementation evidence, but its writes are limited to new registration events, canonical catalog/global planning projections and reconciliation receipts.

## Authority invariant

Exactly one workflow may write these paths:

```text
.agentic_planning/CONTRACT.json                  # initial v3 activation or explicit contract upgrade only
.agentic_planning/<features|analyses|projects>/<entity>/events/<new-event>.json # registration only
.agentic_planning/catalog/**
.agentic_planning/README.md
.agentic_planning/reconciliations/**
WORKSPACE_MAP.md
PROJECT_BLUEPRINT.md                            # only the declared root-project projection
CLAUDE.md / AGENTS.md                           # agentic-routes managed block only
existing tool-specific agent entry points       # agentic-routes managed block only
```

That workflow is `RECONCILE_MAIN`. Ordinary feature, analysis, project, INIT and execution sessions must never edit them. If the incoming candidate already changed a protected global path, fail with `BLOCKED_DIRECT_GLOBAL_EDIT`; do not bless the edit by re-rendering over it.

Git branch/worktree isolation is not the writer lock. Authority comes from protected `main`, an up-to-date integration candidate, required checks/merge queue, exact input hashes and this prompt's transaction. A local exclusive-create lock may prevent two processes in one checkout, but it is never a distributed lock and never overrides Git or queue state.

## Invocation contract

The launcher supplies:

```text
MODE: CHECK | WRITE | RECOVER
RUN_CONTEXT: MERGE_CANDIDATE | MAIN_POST_MERGE
TARGET_PATH: .
RECONCILIATION_ID: rec_<UUID>
EXPECTED_UPSTREAM: origin/main
EXPECTED_MAIN_SHA: <40-hex current protected-main commit>
EXPECTED_CANDIDATE_SHA: <40-hex candidate commit; equals EXPECTED_MAIN_SHA in post-merge fallback>
EXPECTED_CONTRACT_SHA256: <sha256 | ABSENT>
WRITER_AUTHORITY: <automation/integrator identity declared by CONTRACT or INITIAL_V3_ACTIVATION>
CANDIDATE_PROVENANCE: <merge-queue/integration receipt; NONE only in MAIN_POST_MERGE>
PENDING_GUARD: <required-check/status identifier; required in MAIN_POST_MERGE>
RECOVERY_JOURNAL_PATH: <local .agentic_planning/.local path; required only for RECOVER>
RECONCILIATION_AUTHORIZATION: <empty for CHECK; exact phrase below for WRITE/RECOVER>
```

Authorization phrase:

```text
RECONCILE V3 GLOBALS CONTEXT <RUN_CONTEXT> MAIN <EXPECTED_MAIN_SHA> CANDIDATE <EXPECTED_CANDIDATE_SHA> ID <RECONCILIATION_ID>
```

Never infer, normalize loosely or repair a missing field. `CHECK` is read-only. `WRITE` repeats the complete CHECK immediately before its first write. `RECOVER` is limited to the exact incomplete local transaction journal; it cannot start a new reconciliation or accept different inputs.

## Preferred and fallback execution

### Preferred: merge candidate

The preferred atomic unit is:

```text
latest protected main
  + exactly one merge-queue candidate/change set
  + deterministic RECONCILE_MAIN outputs
  → all required checks
  → one protected-main update
```

The candidate must be rebuilt whenever `main` advances. A developer's earlier pull/rebase is required hygiene, but it is not sufficient because another merge may land afterward. The merge queue's exact-base candidate and last-moment validation are the guarantee.

This prompt does not create/switch branches, create worktrees, merge, rebase, pull, commit, push or open PRs. The platform prepares and integrates the candidate; this prompt only verifies its provenance and writes the permitted candidate files.

### Fallback: main after product merge

Use `MAIN_POST_MERGE` only when the platform cannot modify the candidate before merge. Before the product merge becomes visible:

1. A required repository status/check keyed to the resulting main SHA must enter `RECONCILIATION_PENDING`.
2. Branch protection must block every subsequent merge and every new plan registration while pending.
3. The post-merge run must operate on exactly that clean, synchronized `main` SHA.
4. WRITE writes the global reconciliation update directly in the main checkout for the platform/operator to commit without creating a branch.
5. The pending guard clears only after the global update is committed, its `receipt.json` is present on protected main and a fresh CHECK verifies zero drift.

If the platform cannot enforce the pending guard, return `BLOCKED_POST_MERGE_GUARD_UNAVAILABLE`; accepting a window with code-new/map-old is forbidden. A failed fallback remains pending and blocks later merges. The prompt never clears an external guard itself merely because local files look correct.

## Git and workspace preflight

Run in CHECK and repeat immediately before WRITE/RECOVER publication:

1. Resolve `TARGET_PATH` and the coordinator repository without symlink escape or case-fold collision.
2. Require the coordinator to own `.agentic_planning/` and protected global paths. If none exists, return `BLOCKED_COORDINATOR_REPOSITORY_REQUIRED`; never initialize Git automatically.
3. Refresh `EXPECTED_UPSTREAM` with `git fetch` only. Do not pull/merge/rebase.
4. Resolve the fetched protected-main SHA and require it equals `EXPECTED_MAIN_SHA`.
5. In `MERGE_CANDIDATE`:
   - verify `CANDIDATE_PROVENANCE` against the configured queue/integrator;
   - require the candidate commit equals `EXPECTED_CANDIDATE_SHA`;
   - require its declared first parent/base is exactly `EXPECTED_MAIN_SHA` or the platform supplies an equivalent exact tree-composition receipt;
   - require the checkout/index clean before reconciliation staging; and
   - require no protected global path differs between candidate input and `EXPECTED_MAIN_SHA`.
6. In `MAIN_POST_MERGE`:
   - require current branch exactly `main`, never detached or another branch;
   - require HEAD, upstream, `EXPECTED_MAIN_SHA` and `EXPECTED_CANDIDATE_SHA` all equal;
   - require ahead/behind both zero and the worktree/index clean; and
   - verify `PENDING_GUARD` is active for this SHA.
7. Record status, HEAD, base/upstream, tree hashes and non-secret remote fingerprints. Never print credentials embedded in a URL.
8. Inventory linked worktrees, incomplete migration receipts and local reconciliation journals. Another active writer returns `BLOCKED_MAINTENANCE_ACTIVE`.
9. Require `.agentic_planning/CONTRACT.json` hash to equal `EXPECTED_CONTRACT_SHA256`.

When the contract is `ABSENT`, WRITE may perform `INITIAL_V3_ACTIVATION` only if there is no v1/v2 planning state, no legacy generated map/index that needs import and the invocation explicitly selects an authorized initial main reconciliation. A v2 workspace must use `PROMPT_MIGRATE_V2_TO_V3.md`. Initial activation creates a closed contract exactly conforming to `schemas/contract.schema.json`; optional policies not represented in that closed object live in repository protection configuration and this prompt.

### Multiple repositories

One coordinator repository owns global planning state. For every product repository referenced by active descriptors/manifests/deltas:

- resolve its stable `repo_id`, root, exact commit and non-secret remote fingerprint;
- verify the candidate/input commit equals the manifest's declared validated snapshot or a permitted descendant revalidated here;
- require cleanliness when reconciliation depends on uncommitted evidence being absent;
- never claim an atomic cross-repository merge; and
- block a terminal `COMPLETED` projection with `PARTIALLY_MERGED` if any required repository integration commit is absent.

Reconciliation writes only to the coordinator. Missing, stale or divergent product-repository evidence fails closed.

## Canonical input set

Read and hash, without trusting filenames or filesystem order:

```text
.agentic_planning/CONTRACT.json
.agentic_planning/features/ftr_<UUID>--<slug>/**
.agentic_planning/analyses/ana_<UUID>--<slug>/**
.agentic_planning/projects/prj_<UUID>--<slug>/**
.agentic_planning/imports/legacy/**               # immutable v3 migration sidecars
.agentic_planning/catalog/**                      # current main-owned baseline
implementation/config evidence named by deltas
current generated projections and managed blocks
```

Legacy `_feature_*`, `_analysis_*` and `_project_*` trees are read-only evidence only through validated import sidecars. Never mutate or interpret them as native writers.

Normalize all JSON as closed schema objects. Reject unknown fields, duplicate IDs, prefix/type mismatches, paths that escape their entity, case-insensitive collisions, modified immutable files and secret material. Canonical source-set hashing includes path, type, byte hash and repository commit, sorted by normalized path then ID.

## Entity, revision, event and run validation

### Descriptors and revisions

- `descriptor.json` is create-once identity: globally unique prefixed UUID, entity kind, readable slug/title, creator metadata, creation time and provenance. Username/slug is never identity.
- Revisions live at `plans/rev_<UUID>/`, are immutable and contain the closed manifest defined by `schemas/entity-manifest.schema.json`. Rich plan content and stable step IDs live in the adjacent Markdown execution sources.
- A later semantic plan change creates a new revision; it never edits a prior one.
- Revision ancestry must be acyclic and have one unambiguous active head derived from events. Competing heads without an explicit resolution event are `BLOCKED_REVISION_FORK`.

### Events

- Each transition is one immutable `events/evt_<UUID>.json` object.
- It contains exactly the fields in `schemas/event.schema.json`: entity/revision, event type, parent event, expected prior state, resulting state, optional run, reason, actor and timestamp.
- Reduce events deterministically by validated parent links/state transitions, never by file enumeration or timestamp alone.
- Two events claiming the same prior head create a conflict; neither silently wins. A schema-authorized resolution event must name all conflicting heads and human/integrator authority.
- Terminal events release claims only when their evidence/receipts and required repository commits validate. Timeouts never release claims silently.

### Runs and attempts

For features, validate:

```text
runs/run_<UUID>/att_<UUID>.md
runs/run_<UUID>/att_<UUID>.json              # contains mandatory step_id
```

Every retry has a new attempt ID; no fixed output is overwritten. Closed receipts bind entity, revision, step, validated commits and artifact hashes. The adjacent immutable Markdown report records commands/exit codes, attributable diff, resource namespaces and gate evidence. A report without a valid receipt is narrative only and cannot advance state or factual catalog claims.

## Write-scope and claim validation

Each active revision declares repositories, `write_scopes[]`, `resource_claims[]` and an integration owner. For the v3 MVP, JSON scopes are structural exact files or normalized directory trees (`kind: exact|tree`); Markdown may display a tree as `directory/**`. Arbitrary glob semantics are forbidden.

1. Compute the real product/planning-source diff between candidate and `EXPECTED_MAIN_SHA` for each repository.
2. Exclude only outputs that this reconciliation itself will generate; an incoming change to one of them already failed preflight.
3. Require every changed product/source path to fit a declared write scope of the executing entity/revision.
4. Require every new native planning source to fit its entity-owned paths and immutable/create-only rules.
5. Reject broad scopes that include a repository root, `.git`, `.agentic_planning/catalog`, global projections or another entity.
6. Validate fan-in files—lockfiles, route registries, composition roots, migration ledgers—against the one declared integration-owner step/event.

Claim compatibility:

| Existing claim | Candidate claim | Result |
|---|---|---|
| `read` | `read` | compatible |
| `exclusive` or a write-scope overlap | any contender | dependency/serialization required |
| `isolated` key A | `isolated` key B | compatible only when A ≠ B and isolation/cleanup evidence is factual |
| `unknown` | any non-read | exclusive; serialize |

Path/resource overlap is semantic: exact file, ancestor prefix, fixed port, Compose project/volume/network, database/schema, cache, generated directory and external account/service are compared by normalized resource ID. Branches/worktrees do not isolate non-filesystem resources.

Validate candidate claims against every non-terminal active entity already on main plus other changes in the candidate. A declared dependency must point to a state that actually precedes the candidate. Reject conflicting active claims with both entity/revision IDs and the smallest overlapping scope/resource.

## Semantic map-delta reconciliation

Read immutable `map-deltas/delta_<UUID>.json` from native entities and validate the contract defined by `PROMPT_INIT.md`.

### Eligibility

- Producer descriptor/revision/event must exist and match.
- Repository commits/evidence must exist in the candidate snapshot.
- Every observation group must be complete; `OBSERVATION_INCOMPLETE` groups are ignored and block required transitions.
- `VERIFIED` claims require direct code/config/declaration evidence. Run-dependent facts require a valid run receipt.
- `PLANNED` deltas may register greenfield intent/claims but cannot replace factual items or create factual seams/gates/recipes.
- `UNKNOWN` stays explicit and carries its blocking/serialization scope.

### CAS algorithm

For each item, sort only by explicit dependency/topology and stable delta ID as a deterministic tie-breaker for otherwise independent operations:

1. `ADD`: item must not exist and ID/natural key must not collide.
2. `REPLACE`: current canonical item hash must equal `expected_item_hash`; candidate ID must equal `item_id`.
3. `REMOVE`: current canonical item hash must equal `expected_item_hash`, `candidate` must be null and active dependents must already be migrated or block.
4. Two applicable deltas based on the same predecessor that propose different successors are `BLOCKED_DELTA_FORK`. Timestamp or merge order never decides.
5. Identical duplicate delta bytes are one input; same ID with different bytes is corruption.
6. A delta already listed in a successful receipt is an idempotent no-op only when bytes and resulting item hash still match.

Apply eligible deltas to a staged catalog tree partitioned by kind, for example:

```text
.agentic_planning/catalog/repository/cat_<UUID>.json
.agentic_planning/catalog/subproject/cat_<UUID>.json
.agentic_planning/catalog/resource/cat_<UUID>.json
.agentic_planning/catalog/gate/cat_<UUID>.json
.agentic_planning/catalog/seam/cat_<UUID>.json
.agentic_planning/catalog/recipe/cat_<UUID>.json
.agentic_planning/catalog/unknown/cat_<UUID>.json
```

Catalog records are closed canonical JSON objects defined by `schemas/catalog-item.schema.json`: stable ID, kind, title, summary, status, scalar attributes, relationships and evidence. Delta provenance lives in immutable deltas and reconciliation receipts. Reconciliation is the only catalog writer.

When initial factual discovery or a requested full audit is required, invoke `PROMPT_INIT.md` internally with `MODE: RECONCILE_INPUT`, this `RECONCILIATION_ID` and this reconciliation's staging root. INIT contributes staged proposals; this prompt still validates and publishes them.

## Deterministic state/index reduction

Build `.agentic_planning/README.md` from descriptors, immutable revisions, reduced events, validated runs, claims and legacy import sidecars.

- Include globally unique ID, title/slug, active revision, owner metadata, status, planning-base commits, active claims, source-analysis/project relationships and bound registration receipt where present.
- Feature/analysis/project status comes only from the reducer, never a mutable Markdown cell.
- “Derived from”/“Derivó en” comes from `source_analysis_ids`/project roadmap links or proven legacy imports.
- Sort by declared creation time and entity ID as tie-breaker; never filesystem order.
- Include `GENERATED — DO NOT EDIT; run PROMPT_RECONCILE_MAIN.md` and stable source/catalog identifiers. Keep the reconciliation receipt separate to avoid a receipt/output hash cycle.
- Human notes do not live in this generated index. Preserve them in their canonical entity/catalog source or block if their ownership cannot be determined.

## Deterministic planning-map rendering

Render `WORKSPACE_MAP.md` as planning-map contract 4 from the staged catalog, never by patching prose in the old map. Use the factual layout and per-subproject rules from `PROMPT_INIT.md`.

The header includes map contract, maturity and canonical catalog-tree hash. Stable catalog IDs/evidence remain visible; the separate receipt hashes the rendered output but is not embedded back into it.

Maturity reduction:

- `bootstrap-greenfield`: an authorized project/F00 plan is registered but factual scaffold requirements are not yet evidenced;
- `mixed`: some F00 foundation claims are factual, but required claims/gates/seams/resources or drift remain unresolved;
- `factual`: every foundation-required claim is `VERIFIED`, required commands/gates/seams/resources are grounded and there is no blocking drift.

Never rewrite reality to match a blueprint. Preserve planned and unknown records distinctly.

## Root project-blueprint projection

`PROJECT_BLUEPRINT.md` is generated only when the active contract and catalog unambiguously designate one root project for this root. Render the active authorized project revision byte-for-byte or as a clearly marked pointer/projection. It must identify project/revision/manifest hashes; the separate reconciliation receipt hashes the projection.

- No declared root project: do not create the file; remove a prior generated projection only through an explicit catalog/contract transition with preimage hash.
- Multiple eligible root projects: `BLOCKED_ROOT_PROJECT_AMBIGUOUS`.
- Existing human-owned root content without recognized generated markers/preimage: `BLOCKED_HUMAN_CONTENT_BOUNDARY`.
- Project revisions remain canonical; the root file is never edited as source.

## Managed agent-entry-point projection

Only update text between exact managed markers. Preserve every byte outside them. Targets come from the contract; create a minimal `CLAUDE.md` or `AGENTS.md` only when the contract explicitly declares it. Tool-specific entry points are modified only when they already exist or are explicitly declared generated targets.

Normal factual block:

```markdown
<!-- agentic-routes:begin — generated by Agentic Planning Kit v3; do not edit this block. -->
## Agentic planning routes

Read [`WORKSPACE_MAP.md`](./WORKSPACE_MAP.md) before planning or implementation. It is the contract-4 projection of the main-owned catalog and records stacks, commands/gates, hard rules, data access, resource isolation, seams and recipes. Ordinary work writes immutable entity artifacts/events/runs/map-deltas only; it never edits the map, global index or catalog. Use `PROMPT_RECONCILE_MAIN.md` as the exclusive global writer.
<!-- agentic-routes:end -->
```

Bootstrap/mixed block additionally states that `PLANNED` claims are F00-only design inputs and normal product features remain blocked until factual reconciliation plus required manual QA. Do not copy the full map into entry points.

For a workspace with subproject instructions, use a correct relative link to the same coordinator-owned root map. Marker duplication, malformed nesting or uncertain human/generated ownership fails closed.

## Render and transaction protocol

### CHECK

CHECK performs all discovery, validation, reduction and rendering in memory. It creates no lock, staging directory or receipt. Report the prospective source-set hash, catalog mutations, projection hashes, changed paths and blockers.

### WRITE staging

After exact authorization and a repeated clean preflight:

1. Acquire `.agentic_planning/.local/reconcile-<rec-id>.lock` with atomic exclusive create. It coordinates only this checkout. A matching Git/queue authority is still mandatory; do not steal an orphan by timeout.
2. Create `.agentic_planning/.local/reconcile/<rec-id>/` with separate `new/`, `preimages/` and `manifest/` areas.
3. For each accepted revision in `PLANNED` or `RECONCILIATION_PENDING` that must become executable, stage one new schema-valid `RECONCILED` event with state `ACTIVE`, its current event as `parent_event_id`, `expected_state` equal to that current state, the accepted `revision_id`, `run_id: null`, `reconciliation_receipt_id` equal to this reconciliation ID, and a precise reason. Never modify an existing event.
4. Render every prospective catalog file, index, map, blueprint projection and managed postimage from the source set plus staged registration events. Use canonical JSON, UTF-8, LF, normalized paths and deterministic ordering.
5. Projection bytes must not depend on wall-clock time, filesystem enumeration, process ID or username. They may contain only the stable reconciliation receipt path when the format requires it. Re-running with the same canonical inputs and reconciliation ID produces byte-identical staging.
6. Store exact preimages and an exact allowed-path/hash journal locally for crash recovery. Never expose preimage content or secrets in a receipt.
7. Secret-scan staged bytes and changed managed blocks. Any possible secret blocks publication.
8. Stage the exact schema-valid reconciliation receipt as the final postimage (excluding its own hash from `output_hashes`), then validate links, schemas, applied-delta attribution, state reductions, map/index/catalog consistency and a second clean render against the complete staged tree. A second render must be byte-identical.
9. Re-fetch/recheck protected main/candidate provenance. If main advanced, remove only this run's local staging/lock and return `STALE_MAIN_REQUEUE` with zero canonical writes.

### Publication

1. Reconfirm no canonical input or undeclared path changed after staging.
2. Publish staged registration events, catalog records and generated views using same-filesystem atomic replace/create operations, parent-safe ordering and the exact local journal allowlist. Never use broad delete/copy commands or globs.
3. Verify every published byte and ensure no undeclared path changed.
4. Compare the published tree byte-for-byte with the already validated staged postimage, recheck managed boundaries and secret scan, and confirm the only missing postimage is the receipt. Do not run the applied-delta reducer on the intentionally receipt-less intermediate tree.
5. Create `.agentic_planning/reconciliations/<rec-id>/receipt.json` **last**, byte-identical to the staged receipt and with exclusive-create semantics. It uses exactly `schemas/reconciliation-receipt.schema.json`, status `SUCCEEDED`, all repository commits, the prior successful receipt, generator version, sorted canonical input/output path hashes, applied delta IDs and an empty `error_codes` array. The receipt itself is not included in its own `output_hashes`.
6. Re-run the full schemas, reducer, claims/scopes, applied-delta, catalog/map/index and deterministic-render checks. Readers trust new global state only when this final check and the matching successful receipt both exist. Before then, the workspace is `RECONCILIATION_INCOMPLETE` and all merge/planning writers remain blocked.
7. Remove only this reconciliation's local staging/lock after the final check succeeds. Do not commit or push.

No generic filesystem offers an atomic multi-file transaction. A local exact journal plus preimages, atomic per-file replacement, a pending integration guard and receipt-last publication provide fail-closed recovery; never describe this as an impossible all-filesystem atomicity guarantee.

### RECOVER

RECOVER requires the exact local journal, same reconciliation ID, same authorization, same base/candidate/source hashes and intact staging/preimages.

- If every postimage is already present and validates, create the original schema-valid `receipt.json` last.
- If publication is partial and staged inputs remain exact, finish the remaining declared replacements, then validate and create the receipt.
- If inputs/staging changed but every published path can be restored from exact preimages, restore them, verify the pre-reconciliation tree, retain the local journal for audit and return `RECOVERY_RESTORED`; do not create a canonical failure artifact.
- If neither safe completion nor exact restoration is possible, return `BLOCKED_MANUAL_RECOVERY`; do not start a new run or guess.
- Recovery never expands the allowed path manifest and never consumes new deltas.

## Idempotency

- Same `rec_id`, same committed receipt and same bytes: read-only verification/no-op.
- Same canonical source-set/catalog result as the last committed reconciliation and projections already match: return `ALREADY_RECONCILED` without creating a new receipt or changing receipt identifiers.
- Same ID with different inputs: `RECONCILIATION_ID_COLLISION`.
- A new input set gets a new reconciliation ID.
- Rendering twice from the same canonical input yields identical bytes. Generated timestamps, if shown, derive from canonical source events; runtime timestamps live only in receipts.

## Fail-closed conditions

Any of these means no new successful receipt and no claim of reconciled state:

- main/candidate/upstream/provenance mismatch or main advanced;
- dirty/untracked input before staging;
- direct incoming edit to a protected global path;
- descriptor/revision/event/run corruption or fork;
- undeclared real diff or write-scope escape;
- incompatible active claim/resource;
- stale/double-applied/forked map delta;
- unsupported planned-to-factual promotion;
- missing cross-repository result;
- human/generated content-boundary ambiguity;
- schema, deterministic-render, secret-scan or post-write verification failure;
- incomplete prior migration/reconciliation; or
- unavailable post-merge pending guard.

Do not “resolve” these by dropping a row, accepting latest timestamp, widening a scope, overwriting a hash, stealing a lock or editing the source entity.

## No dual-write and protection policy

After v3 activation:

- legacy trees are immutable/read-only;
- state transitions are one-file-per-event;
- plans are immutable revisions;
- runs/attempts have unique IDs;
- ordinary work creates entity-owned deltas;
- only this prompt writes registration events, catalog/global projections and reconciliation receipts; and
- CODEOWNERS/branch protection/required checks should reject direct global edits and stale candidates.

The user/team policy requires synchronizing from `origin/main` before requesting merge. Reconciliation still validates the exact merge-queue candidate against the latest main; a manual pull is never treated as a distributed lock.

## Completion response

Report:

- mode/context/reconciliation ID and writer authority;
- main/candidate/product-repository commits;
- canonical source-set and catalog hashes;
- entity/status counts and any event forks;
- active claims, diff-vs-scope result and conflicts;
- applied/ignored/blocked delta IDs;
- map maturity and generated projection hashes;
- exact created/updated paths;
- receipt or recovery status;
- idempotency result; and
- post-merge pending-guard state when applicable.

End with explicit confirmations: no product file was edited by reconciliation; no branch/worktree/merge/rebase/pull/commit/push was created; and global paths were written only under the exclusive `RECONCILE_MAIN` transaction.
