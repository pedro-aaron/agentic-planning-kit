# PROMPT_INIT — Discover workspace facts for planning-map contract 4

You are a code agent running at the root of the workspace selected for Agentic Planning Kit v3. Execute this file as the complete specification for one factual discovery pass. You inspect implementation and planning state, produce semantic catalog proposals when an ordinary entity owns the output, and write no product code.

INIT v3 is deliberately **not** a global-map writer. `WORKSPACE_MAP.md`, `.agentic_planning/README.md`, `.agentic_planning/catalog/**`, root blueprint projections and managed agent-instruction blocks are protected projections. Only `PROMPT_RECONCILE_MAIN.md`, in an authorized merge-candidate or main-maintenance context, may publish them.

## Invocation contract

The launcher supplies the route-1 fields below. `RECONCILE_MAIN` may call the
same discovery internally with `MODE: RECONCILE_INPUT` and an ephemeral staging
root after its own authorization preflight.

```text
MODE: OBSERVE | RECONCILE_INPUT
TARGET_PATH: .
ENTITY_ID: <ftr_<UUID> | ana_<UUID> | prj_<UUID>; empty means read-only>
REVISION_ID: <rev_<UUID>; required when ENTITY_ID is set>
BASE_MAIN_SHA: <origin/main commit incorporated by the caller>
EXPECTED_MAP_INPUTS: <catalog item IDs + SHA-256 hashes, or empty for first discovery>
DISCOVERY_SCOPE: <whole workspace or exact touched subprojects>
RECONCILIATION_ID: <rec_<UUID>; RECONCILE_INPUT only>
RECONCILIATION_STAGING_ROOT: <ephemeral path supplied by PROMPT_RECONCILE_MAIN; RECONCILE_INPUT only>
```

Never infer `MODE`, identity, revision, base commit or reconciliation authority.

- In `OBSERVE`, a valid descriptor and plan manifest must prove that `ENTITY_ID`
  owns its `map-deltas/` directory. Without that proof, INIT is **read-only**:
  print the proposed observations and `RECONCILIATION_REQUIRED`, then stop with
  zero writes.
- In `RECONCILE_INPUT`, the caller must already have passed the preflight and
  authorization in `PROMPT_RECONCILE_MAIN.md`. INIT may render discovery records
  only inside the supplied staging root. It never publishes a catalog, map,
  index, blueprint or managed block itself.
- A v2 workspace whose v3 migration has not committed must use `PROMPT_MIGRATE_V2_TO_V3.md`; INIT never performs an implicit migration or dual-write.

## Goal

Build an evidence-backed description of the workspace that contract-4 reconciliation can use to render a useful map. Preserve the mature discovery behavior of earlier kit versions:

- identify every independent subproject and repository;
- fully analyze Compose/runtime topology;
- record stack, blessed libraries, modules and exact commands;
- identify deterministic quality gates and state `MISSING` honestly;
- capture hard rules, data-store ownership/access protocols and shared resources;
- classify command/resource concurrency and isolation;
- find `file:symbol` seams;
- infer conventions and engineering practices from real code;
- generalize recipes only from actual examples; and
- retain unknowns instead of inventing facts.

For ordinary feature work, structural observations become immutable semantic deltas under that entity. For reconciliation, the same discovery produces deterministic staged catalog records. The factual content is the same in both contexts; only the authorized destination differs.

## Writer and ownership boundary

### Ordinary entity-owned writes

An ordinary invocation may create only new files at:

```text
.agentic_planning/<features|analyses|projects>/<ENTITY_ID>--<slug>/map-deltas/delta_<UUID>.json
```

The derived entity path must resolve, without traversal or symlink escape, to exactly one existing native v3 tree:

```text
.agentic_planning/features/ftr_<UUID>--<slug>/
.agentic_planning/analyses/ana_<UUID>--<slug>/
.agentic_planning/projects/prj_<UUID>--<slug>/
```

Its `descriptor.json` must match `ENTITY_ID`; `plans/<REVISION_ID>/manifest.json`
must bind `planning_base` and `map_inputs` exactly as defined by
`schemas/entity-manifest.schema.json`. Delta files use create-new semantics and
are never modified, replaced or deleted. A retry either verifies byte identity
or uses a new `delta_id`. Slug and username are labels, never identity.

An ordinary invocation must not write any of these protected paths:

```text
.agentic_planning/CONTRACT.json
.agentic_planning/README.md
.agentic_planning/catalog/**
.agentic_planning/reconciliations/**
WORKSPACE_MAP.md
PROJECT_BLUEPRINT.md
CLAUDE.md
AGENTS.md
.cursor/** and other agent entry points
```

It must not edit a descriptor, revision, event, run receipt or prior delta merely to attach discovery results.

### Reconciliation-owned staging

When embedded through `RECONCILE_INPUT`, INIT writes only into
`RECONCILIATION_STAGING_ROOT`. That directory is ephemeral, must be inside
`.agentic_planning/.local/`, and is not a canonical planning source. The
reconciler validates and publishes the staged result or discards it. A staged
file conveys no authority by itself.

### No authorized destination

If there is no valid entity in `OBSERVE`, perform the entire read-only discovery and return:

```text
DISCOVERY_COMPLETE_READ_ONLY
RECONCILIATION_REQUIRED
```

Include proposed item identities/operations, evidence and blockers in the response, but create no convenience report. This is the correct behavior for an uninitialized brownfield workspace: an authorized `RECONCILE_MAIN` run creates the initial catalog/map after its Git and main-writer preflight.

## Applicability gate

Classify the intended target before any possible write:

- If buildable source, package/application manifests, Compose/runtime configuration, product tests or other implementation signals exist, use this factual route.
- If the root is empty or contains only VCS metadata, placeholder docs, this kit, agent tooling or a native v3 project design tree, stop without writes and direct the operator to `PROMPT_INIT_NEW_PROJECT.md` `PROPOSE`.
- If a partial scaffold exists but its ownership or target is ambiguous, return `BLOCKED_TARGET_AMBIGUOUS` with exact paths.
- F00 may invoke INIT after it has created enough real scaffold to satisfy the factual gate. The resulting facts remain deltas until `RECONCILE_MAIN` publishes them.
- A bootstrap map, blueprint, plan or `PLANNED` catalog claim is intent, not implementation evidence.

Expect a workspace containing several independent subprojects, each possibly with its own Git repository, toolchain, Compose project and data store. Discover each one independently. One subproject's Compose, database, gates or isolation keys never prove another's.

## Canonical semantic delta

Create one closed JSON object per changed catalog item, exactly as defined by `schemas/map-delta.schema.json`. JSON is UTF-8, LF, canonical key ordering, no comments and no undeclared properties:

```json
{
  "artifact_type": "map_delta",
  "schema_version": 3,
  "delta_id": "delta_<UUID>",
  "entity_id": "ftr_<UUID>",
  "item_id": "cat_<UUID>",
  "operation": "ADD|REPLACE|REMOVE",
  "expected_item_hash": "<sha256-or-null-for-ADD>",
  "candidate": {
    "artifact_type": "catalog_item",
    "schema_version": 3,
    "item_id": "cat_<UUID>",
    "kind": "repository|subproject|command|resource|gate|contract|store|seam|recipe|convention|practice|policy|unknown",
    "title": "<title>",
    "summary": "<evidence-backed summary>",
    "status": "VERIFIED|PLANNED|UNKNOWN|DEPRECATED",
    "attributes": [{"key": "<semantic.key>", "value": "<scalar>"}],
    "relationships": [{"type": "<relation>", "target_item_id": "cat_<UUID>"}],
    "evidence": [{"path": "<repository-relative path>", "sha256": "<64-hex>", "section": null}]
  },
  "evidence": [{"path": "<repository-relative path>", "sha256": "<64-hex>"}],
  "evidence_commit": "<40-hex commit containing the evidence, or null for current worktree evidence>"
}
```

Additional rules:

- `ADD` requires a new stable item ID, `expected_item_hash: null` and a complete `candidate`.
- `REPLACE` requires the exact canonical hash of the catalog item read by the producer and a complete `candidate`. This is compare-and-swap, not last-writer-wins.
- `REMOVE` requires the exact canonical hash and `candidate: null`.
- An unchanged item produces no delta; dependency pins belong in the manifest's `map_inputs`.
- A semantic meaning change gets a new item ID plus a `supersedes` relation; a factual correction may replace the same stable item only when its identity is unchanged and CAS matches.
- `VERIFIED` requires implementation/configuration evidence at the declared repository commit. A blueprint, plan, prior map prose or unexecuted command is not sufficient.
- `PLANNED` is permitted only for an approved greenfield/F00 claim or an explicitly prospective structural output. It never appears as an existing seam, command, recipe, store or gate.
- `UNKNOWN` carries the exact question, affected scopes and serialization/blocking consequence.
- Evidence entries contain a normalized path and SHA-256; symbol/line and evidence kind can be encoded as catalog attributes. `evidence_commit` binds a committed observation when known; null means reconciliation must find the exact evidence bytes in its candidate. Command evidence cites the declaration; a verified runtime claim additionally cites an immutable run receipt. Never put secret values, DSNs or authenticated URLs in evidence.
- All deltas from one discovery pass use the same repository snapshot and producer revision recorded by their enclosing entity.
- The reconciler may ignore a valid but not-yet-applicable planned delta; it may never silently reinterpret it as factual.

## Discovery procedure

### 1. Inventory, repository boundaries and planning inputs

1. Resolve the workspace root and every candidate subproject without escaping via symlink.
2. Read root and subproject `README*`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING*`, existing tool rules, `.agentic_planning/CONTRACT.json`, the current generated map/index headers, the current reconciliation receipt and the producer revision manifest when supplied.
3. Treat generated global projections as navigation aids. Read canonical catalog records and cited implementation files before proposing a replacement.
4. Find all Git roots, lockfiles, manifests, Compose files and per-directory agent instructions. Record the exact commit of each repository; if it differs from the supplied base, return `STALE_BASE_REPOSITORY` before writing deltas.
5. If the workspace root is not Git but a coordinator repository owns `.agentic_planning/`, record that coordinator explicitly. If no coordinator owns global planning state, return `BLOCKED_COORDINATOR_REPOSITORY_REQUIRED` for any write-capable workflow.

### 2. Compose and runtime topology — mandatory when present

Read every `docker-compose*.yml`, `docker-compose*.yaml`, `compose*.yml` and `compose*.yaml` in full. For each subproject record:

- service name, image/build context and Dockerfile;
- published and internal ports;
- volumes, networks, profiles and project-name/namespace support;
- `depends_on`, health checks and startup order;
- environment and `env_file` **key names only**, never values;
- default file/override/profile used for local development;
- source/generated/cache/report writes and persistent state;
- whether the topology is demonstrably local/dev; and
- collisions with other subprojects or concurrent runs.

Compose is important evidence for run commands, data-store access, fixed resources and isolation. It is not permission to start services.

### 3. Stack, libraries and modules

From manifests, runtime files and real imports, record languages, frameworks, package managers, runtime versions and modules/layers. For each concern—HTTP, data access/ORM, validation, state, styling/UI, testing, logging and other material concerns—identify the blessed current library, legacy alternatives and evidence. Do not select a winner merely because a dependency is present; check real usage and repository guidance.

### 4. Commands, side effects and quality gates

Extract exact commands from scripts blocks, Makefiles, Taskfiles, justfiles, CI and Compose. Never execute them during INIT. For each command record:

- verbatim command and cwd;
- what it builds/runs/checks;
- source, generated, cache, temp and report writes;
- fixed ports, Compose names, volumes, networks and data/service state;
- supported isolation key/namespace;
- `parallel-safe`, `parallel-safe-with-isolation`, `exclusive` or `UNKNOWN`; and
- declaration evidence.

Identify deterministic exit-code quality gates: tests, lint/format checks, type checks and other existing checks with clear pass/fail semantics. A nonexistent gate is `MISSING`; INIT does not install one or turn an aspiration into a gate. Coverage emitted by an existing command is observed-only with no threshold. Mutation testing, BDD runners and coverage thresholds are not added aspirationally.

### 5. Hard rules, scopes and shared resources

Ground every “never” or “must” rule in instructions, contribution docs or unmistakable repository signals. Discover integration hotspots such as package/lock manifests, generated outputs, composition roots, route/registry files, Compose definitions and migration ledgers.

Classify resources and commands using this closed behavior:

- `read/read` is compatible;
- overlapping writes require an explicit dependency, isolated namespace or one fan-in owner;
- `exclusive` claims serialize;
- `isolated` is safe only when declared isolation keys differ and cleanup is bounded;
- `UNKNOWN` is exclusive for planning purposes; and
- global projections/catalog are never feature write scopes.

Record shared-checkout constraints, isolated-worktree support and the authorized handoff mechanism. Git worktrees isolate files, not fixed ports, databases, volumes, caches or external services.

For interactive clients, record the factual self-provisioning path for runtime evidence—emulator/device, tool paths and debug-only login mechanism—without credentials. If none is declared, use `UNKNOWN` and require a human-in-the-loop evidence task.

### 6. Canonical contracts and every data-store protocol

For every store record engine/version, owner and access mode:

```text
read-write | append-only | read-only | bootstrap-write/runtime-read-only | no_store | UNKNOWN
```

Record lifecycle/cutover boundaries; runtime vs admin/bootstrap principals and environment-key names; allowed/forbidden operations; server-side enforcement; query seams; and, only in an authorized writable phase, migration mechanism/location/dev access/change protocol.

- For read-only or sealed stores: `Migration tool: not applicable after boundary`; require negative-authorization and before/after fingerprint evidence. Never invent a repair/mutation route.
- For writable stores: prove the target is local/dev and non-production from Compose/config. If it could be remote or production, mark target `UNKNOWN` and block agent writes.
- Production migration is always a human-run, backup-first operation outside feature-agent authority.
- Capture schema qualification, RLS/ownership, one-statement driver constraints, seeds and other factual gotchas.

### 7. Seams

Find precise `file:symbol` attachment points for HTTP routes, persistence, auth/tenant boundaries, UI navigation, background jobs, validation, composition and other recurring concerns. A directory name alone is not a seam. Shared registration points are fan-in resources with one integration owner.

### 8. Conventions and engineering practices

Read representative implementation and tests. Record organization, naming, DTO/model style, error handling, dependency direction, test structure and branch/commit policy when declared. Rate these practices `strict`, `pragmatic` or `absent`, each with evidence:

- contract/interface-first;
- dependency injection/inversion;
- SOLID single responsibility and extension/substitutability;
- layered, hexagonal, clean or pragmatic architecture;
- type safety;
- immutability/pure functions;
- boundary validation; and
- testing bar and mocking style.

Report the repository's real bar. Do not impose a new architecture from INIT.

### 9. Recipes by example

For each recurring “add a new ___” pattern, inspect two or three examples when possible. Record ordered `file:symbol` steps, blessed libraries, typical entity-owned write scope, shared fan-in resource and confidence. One example is explicitly thin evidence; no example means no recipe. Common candidates include endpoint, model/migration, UI screen/route, background job, component and test.

### 10. Compare with catalog and emit results

1. Normalize discovered facts into stable catalog-item shapes.
2. Match by stable ID first, then by an unambiguous natural key declared by the catalog schema. Never match only by rendered prose or filesystem order.
3. Record unchanged dependency pins in `map_inputs`; do not emit a no-op delta.
4. Emit `REPLACE`/`REMOVE` with exact CAS hashes for factual change or removal. Deprecation is a `REPLACE` whose candidate status is `DEPRECATED`.
5. Emit `ADD` for genuinely new items.
6. Put unresolved contradictions into `unknown` records; do not resolve them by choosing the latest timestamp.
7. Secret-scan exact prospective JSON. Any possible secret blocks all writes for that observation.
8. Stage the complete discovery set locally, validate it, then create every delta with exclusive-create semantics and verify hashes. If publication cannot complete, return `OBSERVATION_INCOMPLETE` with the exact created delta IDs; reconciliation rejects that set until a later complete replacement set is explicitly supplied.

## Planning-map contract 4 projection

INIT discovers the records used by the following projection; it does not write the projection. `RECONCILE_MAIN` renders it deterministically from catalog records, descriptors/events and accepted deltas.

The map header must identify:

```markdown
**Planning-map contract:** 4
**Map maturity:** bootstrap-greenfield | mixed | factual
**Catalog input:** `<canonical catalog tree hash>`
```

The immutable reconciliation receipt is stored separately under `.agentic_planning/reconciliations/`; it is not embedded in the generated map, avoiding a receipt/output hash cycle.

For a single project, the rendered sections are:

1. Overview and repository snapshot.
2. Stack, toolchain and blessed libraries.
3. Modules/layers.
4. Exact build/run/test commands and deterministic quality gates.
5. Hard rules, write scopes, shared resources and isolation.
6. Canonical contracts and data-store ownership/access/migration protocol.
7. Conventions and engineering practices.
8. `file:symbol` seams.
9. Evidence-backed recipes.
10. Existing docs and planning sources.
11. Unknowns, drift and blocking consequences.

For a workspace of subprojects, render overview/layout and cross-cutting facts first, then a self-contained block per subproject containing its own stack, Compose/services, commands/cwd, gates, resources/isolation, hard rules, store protocol, seams, conventions and recipes. Never merge sibling subprojects' gates or databases into a shared assertion merely to shorten the map.

Generated tables retain stable catalog IDs and evidence references so future deltas can CAS against canonical records rather than parse Markdown.

## Greenfield bootstrap-to-factual behavior

When invoked after F00:

1. Read the frozen native project revision, registered greenfield claims, F00 feature revision, execution events/run receipts and real scaffold.
2. Treat every approved target claim as `PLANNED` until direct evidence proves it.
3. Produce deltas that promote a claim to `VERIFIED` only when its semantics are unchanged and the code/config or verified command report exists at the candidate commit.
4. Preserve unbuilt claims as `PLANNED`; produce `UNKNOWN` drift records for conflicts.
5. Do not modify project/feature revisions, prior events or global projections.
6. `RECONCILE_MAIN` sets `Map maturity: factual` only when all F00 foundation-required claims are factual, required gates/seams/resources are grounded and no blocking drift remains. Otherwise it renders `mixed` and normal product feature execution remains blocked.
7. INIT does not declare F00 accepted. F00 execution evidence, reconciliation and the user's manual QA remain separate gates.

## Multi-repository rules

V3 requires one coordinator repository to own `.agentic_planning/` and global projections. Record each product repository by stable `repo_id`, normalized root and exact commit.

- A delta may cite several repositories but is written only in its producer entity inside the coordinator.
- There is no atomic Git transaction across repositories. A plan/receipt that spans repositories records each commit and cannot claim `EXECUTED` while one is missing.
- Stale, missing or dirty repository evidence blocks a reconciliation that would publish cross-repository facts.
- Remote URLs are fingerprints only; redact credentials.

## Constraints

- Do not write product code, refactor, install dependencies, start services, run generators, run builds/tests, invoke migrations or mutate local/external data.
- Do not create branches, worktrees, commits, merges, rebases, pulls, pushes or PRs.
- Never update global projections in an ordinary context, even if the diff would be conflict-free.
- Never edit legacy v1/v2 planning trees after v3 cutover. Legacy is read-only evidence through migration sidecars.
- Never dual-write a legacy map/index row and a v3 delta/event.
- Never claim concurrency safety without evidence. `UNKNOWN` serializes.
- Never copy `.env` values, tokens, keys, DSNs or authenticated URLs. Environment variable names are allowed.
- Every filesystem path is normalized, inside the workspace and case-collision checked.
- Prefer compact structured records over prose. Missing evidence remains `MISSING` or `UNKNOWN`.

## Completion response

Return, in three compact parts:

1. applicability, run context, producer/revision/base commits and whether writes were authorized;
2. subprojects, Compose services, commands/gates, stores, resources, seams, recipes and unknown counts; and
3. created delta paths and hashes, or `DISCOVERY_COMPLETE_READ_ONLY / RECONCILIATION_REQUIRED`.

Explicitly confirm: **no global projection, catalog record, managed block or product file was written by INIT**.
