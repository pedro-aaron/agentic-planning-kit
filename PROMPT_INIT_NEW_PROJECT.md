# PROMPT_INIT_NEW_PROJECT — Design and materialize native v3 greenfield planning sources

You are a code agent running at the workspace root. Execute this file as the complete specification for exactly one selected greenfield phase. This prompt creates planning sources only. It never implements the product and never writes a global projection.

Agentic Planning Kit v3 is multi-user and event-sourced: project identity is a prefixed UUID, design revisions are immutable, state changes are one-file-per-event, and materialization creates a native F00 feature plan. `WORKSPACE_MAP.md`, `.agentic_planning/README.md`, `.agentic_planning/catalog/**`, root `PROJECT_BLUEPRINT.md` and managed agent blocks are generated later by the exclusive `PROMPT_RECONCILE_MAIN.md` workflow.

## Invocation contract

The launcher supplies:

```text
MODE: PROPOSE | REFINE | MATERIALIZE
TARGET_PATH: .
PROJECT_INTENT: <required for PROPOSE>
PROJECT_ID: <prj_<UUID>; required for REFINE/MATERIALIZE>
BASE_REVISION_ID: <rev_<UUID>; required for REFINE/MATERIALIZE>
BASE_REVISION_MANIFEST_SHA256: <required for REFINE/MATERIALIZE>
BASE_BLUEPRINT_SHA256: <required for REFINE/MATERIALIZE>
BASE_EVENT_ID: <evt_<UUID>; required for REFINE/MATERIALIZE>
BASE_STATE_SHA256: <required for REFINE/MATERIALIZE>
BASE_REPOSITORIES: <repo_id/root/exact commit set; required in every mode>
HUMAN_FEEDBACK: <required for REFINE>
MATERIALIZATION_ID: <mat_<UUID>; required for MATERIALIZE>
F00_FEATURE_ID: <ftr_<UUID>; required for MATERIALIZE>
F00_REVISION_ID: <rev_<UUID>; required for MATERIALIZE>
MATERIALIZE_AUTHORIZATION: <required exact phrase for MATERIALIZE>
```

Exact authorization:

```text
MATERIALIZE V3 PROJECT <PROJECT_ID> REVISION <BASE_REVISION_ID> BLUEPRINT <BASE_BLUEPRINT_SHA256> MANIFEST <BASE_REVISION_MANIFEST_SHA256> EVENT <BASE_EVENT_ID> STATE <BASE_STATE_SHA256> AS <MATERIALIZATION_ID> F00 <F00_FEATURE_ID> REVISION <F00_REVISION_ID>
```

Every value must match canonical bytes and the currently reduced project head. A generic “continue”, an approval of a prior revision, silence or inferred consent is invalid. Never infer `MODE`. If required inputs are absent, stop and request only the missing values.

## Goal

Turn an idea in an empty/planning-only root into:

1. a native v3 project descriptor with globally unique identity;
2. a complete immutable, reviewable blueprint revision;
3. zero or more immutable refinement revisions and decision records;
4. an explicitly human-authorized native F00 scaffold feature plan;
5. semantic `PLANNED` catalog/map deltas that preserve the difference between intent and fact; and
6. first-feature intents that remain non-executable until F00, factual reconciliation and manual QA complete.

This prompt never creates source directories, package/product manifests, dependency lockfiles, Dockerfiles, Compose services, CI, databases, cloud resources, environments or credentials. `MATERIALIZE` means materialize **v3 planning sources and the F00 execution plan**, not implement the project.

After MATERIALIZE, those sources must be integrated using normal Git policy and processed by `RECONCILE_MAIN`. Until a committed reconciliation registers them and renders the bootstrap projections, F00 is `WAITING_FOR_MAIN_RECONCILIATION` and must not execute.

## Choose the correct route

- `TARGET_PATH` must normalize to `.` at the workspace root. A different path, traversal, absolute alias, symlink escape or case-fold collision is `BLOCKED_TARGET_CONFLICT`.
- Use this route only when the target is empty or contains planning/tool metadata: VCS metadata, placeholder docs, this kit, agent instructions and native v3 project-planning sources.
- Buildable source, package/application manifests, product Compose/runtime files, migrations, tests or a factual product map make this a brownfield target. Stop without writes and use `PROMPT_INIT.md`, then normal feature planning.
- A partially created scaffold with ambiguous ownership is `BLOCKED_TARGET_CONFLICT`; list exact paths and do not adopt/overwrite it.
- A v2 `_project_*` tree or v2 generated map/index is not silently converted. Run `PROMPT_MIGRATE_V2_TO_V3.md` on synchronized `main` first.
- Resolve every target and repository boundary. The coordinator repository must own `.agentic_planning/`. Never initialize Git automatically.

This root-only rule prevents a greenfield design from overwriting an existing workspace's factual global projections.

## Human gate versus feature autonomy

The human gate is deliberate and limited to defining a greenfield foundation:

- `PROPOSE` may assume only visible, reversible, low-risk defaults.
- `REFINE` records explicit accept/reject/change/defer/delegation feedback and may repeat.
- `MATERIALIZE` requires readiness `PASS` plus the exact authorization bound to revision/event/state/F00 identities.
- Silence, timeout and model confidence are never acceptance.
- Human delegation of low-risk choices never covers data ownership/access, production or staging writes, secrets, auth/security/privacy/compliance, paid/external accounts or irreversible operations.

Once the factual foundation exists, normal feature steps rely on deterministic quality gates rather than a general human approval bottleneck. The user's F00 manual QA remains a distinct greenfield acceptance gate.

## Inputs to read in every mode

1. Root/subproject `CLAUDE.md`, `AGENTS.md`, `README*`, current generated `WORKSPACE_MAP.md` and `.agentic_planning/README.md` as navigation only.
2. `.agentic_planning/CONTRACT.json`, last reconciliation receipt and native descriptors/plans/events for the selected project.
3. `PROMPT_INIT.md`, `PROMPT_CREATE_FEATURE.md`, `PROMPT_RECONCILE_MAIN.md`, this kit's `README.md` and `TRIGGERS.md`.
4. The target tree, including hidden files, VCS metadata, manifests, workflows, executable scripts, Compose files and symlinks needed to classify it.
5. Current primary/official technical evidence when versions, support, compatibility, license, hosting topology, security behavior or API availability matter.

Generated maps, blueprints, plans and reference projects never prove that a target command, seam, gate, recipe or resource exists.

## Native v3 project tree

The project uses one immutable identity and additive artifacts:

```text
.agentic_planning/projects/prj_<UUID>--<slug>/
├── descriptor.json                         # create-once identity; never renamed/edited
├── decisions/
│   └── dec_<UUID>.json                     # immutable; supersession creates another file
├── plans/
│   └── rev_<UUID>/
│       ├── manifest.json                   # closed control-plane manifest
│       ├── revision-artifacts.json         # hashes the project-specific revision files
│       ├── PROJECT_BLUEPRINT.md
│       ├── project-blueprint.json
│       ├── target-snapshot.json
│       ├── official-evidence.json
│       ├── secret-scan.json
│       ├── readiness.json
│       ├── REFINEMENT_REPORT.md
│       └── roadmap/
│           ├── FIRST_FEATURES.md
│           ├── first-features.json
│           └── feature-readiness.json
├── events/
│   └── evt_<UUID>.json                     # one immutable transition per file
├── map-deltas/
│   └── delta_<UUID>.json                   # PLANNED greenfield catalog claims
└── materializations/
    └── mat_<UUID>/
        ├── AUTHORIZATION.json
        ├── PREPARE.json
        ├── MANIFEST.json
        ├── COMMIT.json                     # written last
        └── F00_PLAN_HANDOFF.md
```

MATERIALIZE additionally creates the native F00 source tree:

```text
.agentic_planning/features/ftr_<UUID>--<slug>-scaffold/
├── descriptor.json
├── plans/
│   └── rev_<UUID>/
│       ├── manifest.json
│       ├── FEATURE.md
│       └── execution_prompts/
│           └── stp_<UUID>_<slug>.md
├── events/
│   └── evt_<UUID>.json
└── map-deltas/
    └── delta_<UUID>.json                   # only when a feature-owned planned delta is needed
```

No F00 `runs/` directory exists until execution creates `runs/run_<UUID>/att_<UUID>.json` plus its adjacent Markdown report. The receipt carries `step_id`; the compact path avoids Windows/Git path-length failures. F01+ intents do not create feature trees during greenfield materialization.

After successful materialization, these global files are **unchanged** by this prompt:

```text
WORKSPACE_MAP.md
PROJECT_BLUEPRINT.md
.agentic_planning/README.md
.agentic_planning/catalog/**
CLAUDE.md / AGENTS.md / tool-specific managed blocks
```

They appear/update only in an authorized reconciliation transaction.

## Identity, immutability and canonical JSON

- Native IDs use collision-resistant UUIDs and prefixes: `prj_`, `rev_`, `dec_`, `evt_`, `mat_`, `ftr_`, `stp_`, `delta_`, `cat_`, `run_`, `att_` and `rec_`.
- The readable slug/title and username are metadata, never identity. A rename is represented in a new revision/event; it never moves the entity directory or edits `descriptor.json`.
- Descriptor, decision, plan, event, delta, materialization and F00-plan files are create-only/immutable after their transaction COMMIT.
- JSON is UTF-8/LF, canonical key ordering, closed schemas, `additionalProperties: false`, ISO-8601 UTC timestamps and SHA-256 artifact chains.
- Markdown is a human-readable artifact bound by its revision/manifest; it is not mutable state.
- A retry verifies exact bytes. Different content requires a new ID/revision/event, never overwrite.
- Never store secret values, credentials, tokens, private keys, authenticated URLs or DSNs. Record secret classes/providers and environment-variable key names only.

### Closed control-plane records

Project and F00 descriptors conform exactly to `schemas/entity-descriptor.schema.json`. For the project:

```json
{
  "artifact_type": "entity_descriptor",
  "schema_version": 3,
  "entity_id": "prj_<UUID>",
  "kind": "project",
  "slug": "<slug>",
  "title": "<title>",
  "created_at": "<ISO-8601 UTC>",
  "owner": "<actor/team identifier>",
  "provenance": "native_v3",
  "initial_revision_id": "rev_<UUID>",
  "source_analysis_ids": []
}
```

Every project and F00 plan manifest conforms exactly to `schemas/entity-manifest.schema.json`:

```json
{
  "artifact_type": "entity_manifest",
  "schema_version": 3,
  "entity_id": "prj_<UUID>",
  "revision_id": "rev_<UUID>",
  "planning_base": [{"repository_id": "repo_<UUID>", "path": ".", "commit": "<40-hex>"}],
  "map_inputs": [],
  "write_scopes": [{"repository_id": "repo_<UUID>", "kind": "tree", "path": "<planned product path>"}],
  "resource_claims": [{"resource_id": "<stable resource>", "mode": "exclusive", "isolation_key": null, "reason": "<reason>"}],
  "depends_on": [],
  "integration_owner": "<actor/team identifier>"
}
```

Use `entity_id: ftr_<UUID>` for F00. The closed manifest contains only coordination fields. Project-specific decisions, step graph, gates and artifact hashes live in `revision-artifacts.json`, `PROJECT_BLUEPRINT.md`, `project-blueprint.json` and the F00 Markdown prompts; never add undeclared properties to the descriptor or manifest.

## Event-sourced control state

There is no mutable `PROJECT_STATE.json`, `current.json`, JSONL ledger or status row. Reduce control state from validated event parent links. Readiness, materialization and bootstrap dimensions are derived from immutable plan artifacts and receipts; they are never invented as extra event fields.

The schema-valid project control flow is:

```text
no event → PLANNED fallback
CREATED / PLANNED                  # PROPOSE
TRANSITIONED / PLANNED             # REFINE selecting a new revision
TRANSITIONED / RECONCILIATION_PENDING # MATERIALIZE created F00 sources
RECONCILED / ACTIVE                # protected reconciliation accepted project/F00
TRANSITIONED / BLOCKED|COMPLETED|CANCELLED|SUPERSEDED
```

Control outcomes include `NOT_READY`, `STALE_REVISION`, `EVENT_FORK`, `BLOCKED_CONFLICT`, `BLOCKED_OFFICIAL_EVIDENCE`, `MATERIALIZATION_DRIFT`, `BLOCKED_FROZEN`, `RECONCILIATION_REQUIRED` and `SUPERSEDED`.

Each event contains exactly `schemas/event.schema.json`:

```json
{
  "artifact_type": "event",
  "schema_version": 3,
  "event_id": "evt_<UUID>",
  "entity_id": "prj_<UUID>",
  "event_type": "CREATED|TRANSITIONED|RECONCILED",
  "state": "PLANNED|RECONCILIATION_PENDING|ACTIVE|BLOCKED|COMPLETED|CANCELLED|SUPERSEDED",
  "occurred_at": "<ISO-8601 UTC>",
  "actor": "<actor/team identifier>",
  "parent_event_id": "<evt_UUID or null for CREATED>",
  "expected_state": "<prior state or null for CREATED>",
  "revision_id": "rev_<UUID>",
  "run_id": null,
  "reconciliation_receipt_id": null,
  "reason": "<readiness/materialization reason and auxiliary artifact IDs>"
}
```

Only `RECONCILE_MAIN` changes that field to its `rec_<UUID>` in a new `RECONCILED` event; every ordinary project/F00 event keeps it null.

Two events with the same parent are a fork. Neither timestamp nor filesystem order wins. `REFINE`/`MATERIALIZE` stop on a fork; an explicit reconciler/human resolution event must name all heads. A local lock does not prevent another clone from creating a competing event; merge-queue validation and `RECONCILE_MAIN` provide cross-clone serialization.

## Local transaction versus distributed authority

The agent may use an atomic local lock only under:

```text
.agentic_planning/.local/greenfield-<operation-id>.lock
```

It is ephemeral, uncommitted and coordinates only this checkout. It must never be described as a repository-wide or distributed lock, never be committed, and never be stolen solely because time elapsed. If unavailable, stop locally. Cross-user correctness comes from unique IDs, immutable files, event-head CAS, current-main synchronization, claim checks and merge-queue reconciliation.

Each write-capable mode renders all intended outputs in `.agentic_planning/.local/greenfield/<operation-id>/`, secret-scans and validates them, rechecks the event head/repository snapshot, writes an immutable PREPARE for multi-file operations, publishes only its create-new allowlist, verifies exact hashes and writes its event/COMMIT last. A crash before COMMIT is incomplete and cannot be treated as state.

## Target snapshot, official evidence and secret scan

### Target snapshot

Each revision binds a deterministic root fingerprint: resolved target, filesystem case behavior, symlink results, repository IDs/commits, ruleset version and sorted `path/type/size/SHA-256/classification_rule_id` entries.

Closed greenfield allowlist:

- `GF-VCS-METADATA`: `.git/**`, excluding active/custom executable hooks and escaping worktree links;
- `GF-KIT`: declared kit files;
- `GF-NATIVE-PROJECT-PLANNING`: this matching v3 project tree;
- `GF-AGENT-INSTRUCTIONS`: preserved human-owned instruction/rule files;
- `GF-PLACEHOLDER-README`: plain text/Markdown description with no executable/runtime/package declaration.

Any product source/package manifest, workflow, executable script, Compose/runtime file, escaping symlink, custom hook or unclassified path is `UNKNOWN → partial_conflict` before F00 executes. Snapshot rules never whitelist by filename alone when content is executable or generated.

### Official evidence

`official-evidence.json` is a closed index of technical claims. Each entry contains stable claim ID, source kind (`official_docs|official_repository|registry|standard`), publisher, URL, version/tag/digest, retrieval time, supported fact, separate agent inference and `required_for_f00`.

- Use current primary/official sources for versions, compatibility, support/EOL, licenses, security behavior and APIs.
- Required F00 evidence cannot be deferred. Inaccessible or insufficient evidence is `BLOCKED_OFFICIAL_EVIDENCE`.
- Record facts and inferences separately. Never use memory as a version lock.

### Secret scan

Every revision/materialization contains a receipt over exact persisted artifact hashes, scanner/ruleset/version and redacted finding categories only. It asserts `secret_material_present: false`. Never store a matched value. Possible secrets, authenticated URLs or unsafe copied user content block publication until redacted.

## Blueprint contract

Every immutable revision covers:

1. Project identity, problem, users/actors and outcomes.
2. Scope, non-goals and measurable success.
3. User journeys/capabilities without implementation inflation.
4. Known domain/API/event contracts and explicit unresolved shapes.
5. Proposed modules, dependency direction and integration boundaries.
6. Planned stack/toolchain, version/support policy, package manager and license constraints.
7. Data stores: owner, access mode (`read-write|append-only|read-only|bootstrap-write/runtime-read-only|no_store|UNKNOWN`), lifecycle/cutover, principals/env-key names, allowed/forbidden operations and migration only for authorized writable phases.
8. Authentication, authorization, tenant boundary, security, privacy, sensitivity and compliance assumptions.
9. Secret classes/providers/key names, rotation/cleanup and prohibited storage/logging.
10. Local/dev/staging/production boundaries and `agent_write` authorization; staging/production default false.
11. Planned workspace layout, every path clearly `PLANNED`, never factual.
12. Planned build/run/test/lint/package commands, side effects/isolation and intended deterministic gates after F00 creates/verifies them.
13. Observability, error handling, logging/redaction and operations.
14. Concurrency: planned write scopes, single-writer/fan-in hotspots, resource modes/isolation keys and worktree/handoff policy.
15. F00 exact scope/non-goals, rollback/cleanup, network effects and acceptance gates.
16. Initial feature-intent dependency DAG and candidate parallel fronts.
17. Risks, assumptions, `UNKNOWN`s, decision IDs and readiness.

Do not select data ownership/access, production topology, secrets, security boundaries, paid accounts or irreversible operations merely because they are common. `no_store` is a valid explicit decision.

## Decision contract

Each decision is an immutable `dec_<UUID>.json`:

```json
{
  "schema_version": "agentic-planning-decision/1",
  "decision_id": "dec_<UUID>",
  "status": "PROPOSED|ASSUMED_BY_POLICY|ACCEPTED|REJECTED|SUPERSEDED|DEFERRED",
  "question": "",
  "decision": "",
  "rationale": "",
  "alternatives": [],
  "consequences": [],
  "source": "user|agent",
  "authority": "explicit_human|human_delegated|agent_low_risk_policy",
  "revision_id": "rev_<UUID>",
  "affected_sections": [],
  "supersedes": null,
  "created_at": "<ISO-8601 UTC>"
}
```

Changing a decision creates another file with `supersedes`; prior bytes remain. `ASSUMED_BY_POLICY` is restricted to visible reversible low-risk defaults. The exact MATERIALIZE authorization accepts the revision's listed policy assumptions as a batch and records their IDs in `AUTHORIZATION.json`; changing one requires REFINE first. Data/security/privacy/secrets/production/external-write/irreversible decisions always require explicit human authority.

## Readiness gate

Readiness is boolean. `readiness.json` is `PASS` only when all applicable hard gates agree for the same revision manifest:

- target identity/fingerprint/repositories are known and collision-free;
- scope, non-goals, actors and outcomes are coherent;
- stack/version/support/license choices have sufficient official evidence;
- architecture/contracts/dependency directions are coherent enough for F00;
- data ownership/access/lifecycle/principals/operations are explicit;
- secrets/security/privacy/tenant boundaries are explicit;
- local/dev versus staging/production write boundaries are explicit and safe;
- F00 paths/scopes/resources/network effects/rollback/verification are bounded;
- planned commands, cache/generated effects, isolation and intended gates are identified;
- same-checkout/worktree/handoff policy is defined or safely serialized;
- blocking decisions/conflicts are empty;
- blueprint, normalized JSON, decisions, target snapshot, evidence and secret scan agree; and
- feature-intent DAG and F00 gate are coherent.

A non-blocking unknown has an owner, rationale and deferred intent. Authorization never substitutes for readiness.

## Semantic greenfield claims

Blueprint intent that future reconciliation must expose is represented as immutable project-owned `map-deltas/delta_<UUID>.json` using exactly `schemas/map-delta.schema.json` and the contract in `PROMPT_INIT.md`:

- choose the real catalog kind (`contract`, `command`, `gate`, `resource`, `policy`, `store`, `seam`, `recipe` or `unknown`), never invent `greenfield_claim`;
- candidate status is `PLANNED` or `UNKNOWN`, never `VERIFIED` without implementation evidence;
- encode decision ID, required-for list, allowed consumers and intended F00 producer as scalar attributes/relationships in the complete candidate catalog item;
- use `ADD` with `expected_item_hash: null` before first registration; and
- never write catalog or map directly.

Only F00 may consume allowlisted `PLANNED` claims as design inputs. A producer may create its claimed output but may not pretend the seam/gate/command already exists. After real scaffold execution, F00 invokes factual INIT to create feature-owned evidence deltas; `RECONCILE_MAIN` performs a CAS `REPLACE` that promotes the item to `VERIFIED`.

## MODE `PROPOSE`

### Purpose

Produce a useful complete base proposal without forcing the human to answer every low-impact question first.

### Procedure

1. Validate root-only target as `empty` or `planning_only`; fingerprint without exposing secrets.
2. Generate a new `prj_<UUID>`, immutable descriptor and readable slug. If normalized intent + target snapshot exactly matches an existing native proposal, verify and return that entity rather than duplicating it. Same ID/different bytes is a collision.
3. Separate explicit user decisions from proposed and policy-assumed decisions.
4. Perform bounded read-only official research where needed.
5. Generate new decision files and one `rev_<UUID>` containing blueprint, normalized JSON, target/evidence/scan/readiness and roadmap artifacts.
6. Validate the closed plan manifest and the separate `revision-artifacts.json` hash inventory; the latter binds decisions and project-specific artifacts without extending the manifest schema.
7. Create one `CREATED` event with parent/expected state `null`, state `PLANNED` and a reason that records `readiness=PASS|NOT_READY` plus the readiness-artifact hash.
8. Publish only the new project tree. Do not create F00, root blueprint/map/index/catalog or managed blocks.
9. Verify exact bytes and return project/revision/event/state hashes, readiness, risks, feature waves and at most three highest-impact human questions.

PROPOSE may be useful while not ready; it does not block artifact creation merely because feedback could improve it.

### First-feature intents

The roadmap contains F00 plus F01+ intent objects. F01+ use `int_<UUID>` identity and remain non-executable:

```json
{
  "intent_id": "int_<UUID>",
  "title": "",
  "intent": "<later route-2 feature description>",
  "initial_readiness": "WAITING_FOR_F00_FACTUAL_RECONCILIATION_AND_QA",
  "depends_on": ["F00_FACTUAL_RECONCILIATION", "F00_QA_ACCEPTED"],
  "required_catalog_item_ids": [],
  "produces_catalog_item_ids": [],
  "expected_domain_boundary": "",
  "data_access_constraints": []
}
```

Do not reserve a mutable slug directory, generate F01 execution prompts or treat planned paths as seams.

## MODE `REFINE`

### Preconditions

- Exact project/revision/manifest/blueprint/base-event/state hashes and repository snapshots are mandatory.
- Reduce all project events and require one head matching the supplied base.
- Allowed control state is `PLANNED`; readiness must be derived from the selected immutable revision. If F00 is pending reconciliation or active, return `BLOCKED_FROZEN`.
- Target must remain empty/planning-only and match the allowed drift rules.

### Procedure

1. Read `HUMAN_FEEDBACK` literally and classify accept/reject/change/defer/question/delegation; silence means nothing.
2. Revalidate base artifacts, current event head and target/repository snapshot immediately before writes. Stale input returns `STALE_REVISION` with zero writes.
3. Optional read-only reviewers may analyze disjoint domains but cannot edit canonical project artifacts.
4. For semantic changes, create new decision records, a new `rev_<UUID>` whose auxiliary hash inventory names the prior revision, and one `TRANSITIONED`/`PLANNED` event whose parent and `expected_state: "PLANNED"` match the supplied head.
5. Recompute every affected blueprint/readiness/evidence/roadmap artifact. Never edit the base revision or prior decisions/events.
6. A semantic no-op creates nothing: return `NO_CHANGE` with the unchanged hashes. Do not create a mutable “current” mirror or no-op event.
7. Publish create-new files through staging/secret scan/recheck/event-last, then report changed decisions, consequences, readiness, roadmap changes and at most three questions.

REFINE may repeat until ready. It is optional when PROPOSE already produced a complete READY revision and the operator accepts it.

## MODE `MATERIALIZE`

### Preconditions

- Detect exact completed replay first: matching `mat_<UUID>` COMMIT, authorization, project/revision/event/state/F00 IDs and byte-identical outputs returns existing handoff read-only.
- For a new materialization, exact authorization must match the invocation and canonical bytes.
- Reduced project control state is `PLANNED`; selected-revision readiness is `PASS`; event/revision/blueprint/manifest/repositories and target snapshot still match.
- No blocking unknown/conflict, event fork, existing F00, incomplete materialization or unexpected target implementation exists.
- A different materialization after a committed one is `BLOCKED_FROZEN`; change becomes a later explicit project feature/remediation, not silent blueprint rewrite.

### No distributed lock claim

Use the local transaction mechanism only to serialize this checkout. Do not create or commit `MATERIALIZATION_LOCK.json`, a `.lock` ledger or a timeout-based lease. `O_EXCL` on one clone says nothing about other users. The immutable project event's parent/state CAS plus main reconciliation detects competing materializations; a fork blocks rather than last-writer-wins.

### Materialization transaction

1. Recompute the reduced head and target/repository snapshot.
2. Validate the exact authorization and create staged `AUTHORIZATION.json` containing only its hash, bound IDs/hashes, explicit-human authority record and accepted low-risk decision IDs.
3. Render the complete schema-valid F00 descriptor/plan/`CREATED`-`PLANNED` event, project planned deltas, one project `TRANSITIONED` event with state `RECONCILIATION_PENDING`, `MANIFEST.json` and the handoff in isolated local staging.
4. Validate schemas, dependency DAG, claims/scopes/resources, exact create-only path set and secret scan.
5. Recheck head/snapshot; then create materialization `PREPARE.json` with exact preconditions and postimage hashes.
6. Publish only new files. Write the project `RECONCILIATION_PENDING` event after its dependencies and materialization `COMMIT.json` last; COMMIT binds PREPARE, authorization, manifest, F00 plan/event and project-event hashes.
7. If interrupted before COMMIT, state is `MATERIALIZATION_INCOMPLETE`. A same-ID recovery may finish only when all staged/existing bytes match PREPARE; otherwise stop for explicit recovery. Never start a different materialization over it.
8. Remove local staging/lock after verification. Do not commit, push, merge or create a branch.

### Permitted writes

MATERIALIZE may create only:

- new files under the selected project's `materializations/<mat-id>/`;
- new immutable project events and `PLANNED`/`UNKNOWN` map deltas;
- the exact native F00 feature descriptor/plan/execution prompts/initial event; and
- no-op-free receipts named by the manifest.

It may not write product code or any global projection/catalog/managed block. Existing bytes are never replaced.

## F00 feature-plan contract

F00 uses the native v3 feature anatomy and safety rules in `PROMPT_CREATE_FEATURE.md`: immutable revision manifest, `stp_<UUID>` steps, one trigger per step, explicit dependency DAG, resource claims/write scopes, suggested model effort, unique run/attempt receipts, short handoffs and a user manual QA checklist.

Greenfield exceptions are narrow:

- F00 grounds in the frozen project revision, decision records, official evidence and registered `PLANNED` claims explicitly allowlisted for it.
- It does not require pre-existing factual seams/recipes; its new patterns remain `thin` until factual INIT observes examples.
- Steps run sequentially unless the frozen blueprint proves isolated scopes/resources; default is sequential.
- Quality gates run only after the step that creates/configures them. From that step onward every code-writing F00 step passes them and records exact command, cwd and exit code. The gauntlet cannot precede its own creation.
- No later feature inherits these exceptions.

F00 scope may include:

- selected toolchain/package manifests and lock policy;
- minimal installable/buildable source/layer skeleton;
- a non-business entrypoint needed to prove wiring;
- test/lint/format/type/build configuration and focused smoke checks—the first factual gates after verification;
- environment examples with placeholders/key names only;
- approved architecture/decision docs and local-safe wiring; and
- command/resource isolation documentation.

F00 excludes:

- F01+ business behavior;
- production/staging/cloud/account mutation or deployment;
- live data, import/seed, migrations/schema changes unless an isolated local bootstrap is foundation-critical and explicitly accepted;
- credential/secret values;
- unapproved frameworks/stores/integrations;
- aspirational coverage thresholds, mutation testing or BDD requirements.

Binding invariants: zero secrets; zero staging/production/cloud/account mutation; declared official versions/locks; accepted store owner/mode/principals/operations; any local bootstrap explicitly authorized, ephemeral, namespaced and cleanup-verified; no F01+ behavior. Anonymous public registry/docs reads may be declared; authenticated/private access and external writes require separate explicit authorization and otherwise block.

Required lifecycle:

```text
MATERIALIZE creates native sources + F00 plan
  → integrate sources through Git policy
  → RECONCILE_MAIN registers project/F00 claims and renders bootstrap projections
  → synchronize F00 execution work from that resulting main
  → F00 target audit
  → scaffold/toolchain steps in dependency order
  → PROMPT_INIT produces F00-owned factual map deltas
  → RECONCILE_MAIN validates candidate, promotes claims and renders mixed/factual map
  → user performs FEATURE.md manual QA
  → QA-acceptance event + reconciliation unlock F01+ intents
```

F00 cannot execute from an unregistered materialization branch. Its immutable manifest binds the catalog item hashes available at planning time; its launcher additionally supplies the successful registration receipt ID and validated main/candidate commit. If main advances materially, revalidate through the merge queue rather than editing the plan.

## First-feature intent readiness

MATERIALIZE freezes first-feature intent definitions inside the authorized project revision; it does not create their feature entities. Readiness is later derived from project/F00 events and reconciliation receipts:

```text
WAITING_FOR_MAIN_RECONCILIATION
→ WAITING_FOR_F00_FACTUAL_RECONCILIATION_AND_QA
→ READY_FOR_CREATE_FEATURE
```

When ready, run normal CREATE FEATURE once per intent using its stored route-2 description. Completion of later features is represented in their own event streams, not by editing the project roadmap.

## Bootstrap map/catalog contract

MATERIALIZE does not create a bootstrap map. It creates planned claim deltas. The first authorized reconciliation renders contract 4 with:

```markdown
**Planning-map contract:** 4
**Map maturity:** bootstrap-greenfield
**Root project:** `prj_<UUID>` / `rev_<UUID>` / `<manifest hash>`
**Catalog input:** `<catalog tree hash>`
```

The successful receipt remains a separate immutable audit artifact and is not embedded in the generated map, avoiding a receipt/output hash cycle.

The rendered map separates:

- `VERIFIED`: observed planning/root facts with evidence;
- `PLANNED`: approved target claims and their F00 producer/allowed consumers;
- `UNKNOWN`: unresolved conflict/question and blocking scope.

Only F00 consumes allowlisted planned claims. Normal features remain blocked while maturity is `bootstrap-greenfield` or `mixed`. A later factual reconciliation alone may change maturity; MATERIALIZE never predicts it.

## Materialization manifest and handoff

`MANIFEST.json` binds:

- project/target/revision/blueprint/revision-manifest/base-event/prior-state hashes;
- readiness, decisions, official evidence, target snapshot and secret-scan hashes;
- authorization and materialization IDs;
- F00 descriptor/revision/manifest/event IDs and hashes;
- every created path/hash and exact allowed/forbidden write sets;
- F00 steps/DAG/write scopes/resource claims/integration owner;
- planned map-delta IDs/hashes;
- base repository commits and expected first reconciliation inputs;
- rollback limited to unchanged manifest-created planning files/empty dirs, never human/product files; and
- status `F00_PLANNED_RECONCILIATION_REQUIRED`.

`F00_PLAN_HANDOFF.md` tells the operator that planning sources must merge and reconcile before execution. It includes source paths/hashes, claims/conflicts, Git-base expectations and the exact statement: `planning materialized; product not implemented; global reconciliation required`.

## Git collaboration policy

- This prompt never creates/switches/deletes branches or worktrees and never pulls, merges, rebases, commits, pushes or opens PRs.
- Users synchronize their branch from the latest `origin/main` before requesting merge.
- The merge queue rebuilds/validates against the newest main; a prior pull alone is not proof of freshness.
- Unique IDs and create-only paths reduce textual collisions. Event forks, claim conflicts and stale catalog inputs still fail during reconciliation.
- Root/global outputs are never resolved manually in a feature branch because no ordinary branch may edit them.

## Constraints shared by all modes

- No product code or external mutation.
- Never initialize Git, install dependencies, run generators/builds/tests, start services, create databases or call deployment/account APIs.
- External research is read-only and primary/official where currency matters.
- Never echo secrets; sanitize persisted user intent and record redacted placeholders.
- Preserve user files and unrelated changes. Never adopt, overwrite, move or delete an ambiguous target.
- One local synthesis transaction creates one revision/event head. Parallel reviewers produce no canonical writes.
- IDs/revisions/events/materializations use create-only/CAS; no last-writer-wins.
- Risky `UNKNOWN` blocks rather than granting permission.
- No direct map/index/catalog/blueprint/managed-block write and no v2/v3 dual-write.
- MATERIALIZE cannot weaken F00 invariants or later factual-map requirements.

## Completion responses

- `PROPOSE`: target, project path/ID, revision/event/state/manifest/blueprint hashes, readiness, assumptions, feature-intent DAG/waves, created paths and up to three questions.
- `REFINE`: base/new revision and event/state hashes, semantic changes or `NO_CHANGE`, decisions created/superseded, readiness and up to three questions.
- `MATERIALIZE`: authorized project/revision/event/state hashes, materialization/F00 IDs and paths, F00 claims/scopes/steps, created source hashes, replay result, and `planning materialized; product not implemented; global reconciliation required`.

Every mode explicitly confirms that it did not write `WORKSPACE_MAP.md`, `.agentic_planning/README.md`, `.agentic_planning/catalog/**`, root `PROJECT_BLUEPRINT.md`, managed blocks or product files.
