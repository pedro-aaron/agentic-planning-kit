# PROMPT_INIT_NEW_PROJECT — Design and bootstrap an empty project

You are a code agent (Claude Code / Cursor / Codex) running at the **workspace root**. Execute this file as your complete task spec for exactly one explicitly selected phase of the greenfield workflow.

The launcher supplies these fields:

```text
MODE: <<PROPOSE | REFINE | MATERIALIZE>>
TARGET_PATH: <<must be . in this root-only contract; required in every mode>>
PROJECT_INTENT: <<free-text description; required for PROPOSE>>
PROJECT_ID: <<required for REFINE/MATERIALIZE>>
BASE_REVISION: <<rev-NNN; required for REFINE/MATERIALIZE>>
BASE_BLUEPRINT_SHA256: <<required for REFINE/MATERIALIZE>>
BASE_REVISION_MANIFEST_SHA256: <<required for REFINE/MATERIALIZE>>
HUMAN_FEEDBACK: <<required for REFINE; may contain accept/reject/change/defer decisions>>
MATERIALIZE_AUTHORIZATION: <<required exact explicit authorization for MATERIALIZE>>
```

For `MATERIALIZE`, the exact authorization value is:

```text
MATERIALIZE PROJECT <PROJECT_ID> TARGET . REVISION <BASE_REVISION> BLUEPRINT <BASE_BLUEPRINT_SHA256> MANIFEST <BASE_REVISION_MANIFEST_SHA256>
```

All values must match the current canonical artifacts byte-for-byte. The revision manifest binds the blueprint, decision-log head, readiness, official-evidence index, target snapshot, secret-scan receipt, roadmap/intent snapshot and claims snapshot. A generic “continue”, approval of an earlier revision, or inferred consent is invalid.

Never infer `MODE`. If the required fields for the selected mode are absent, stop and request only the missing fields. This route is intentionally human-in-the-loop because no factual architecture exists yet.

---

## Goal

Turn a project idea in an empty or planning-only workspace into:

1. a revisioned, reviewable project blueprint;
2. zero or more human refinement cycles;
3. an explicitly authorized **F00 scaffold feature plan**;
4. a bootstrap `WORKSPACE_MAP.md` that clearly separates `EXISTING`, `PLANNED` and `UNKNOWN` claims; and
5. non-executable first-feature intents that become eligible for normal `PROMPT_CREATE_FEATURE.md` planning only after F00 executes, factual INIT/map reconciliation completes and the user's manual QA accepts the scaffold.

This prompt never writes product code, source directories, product/package manifests, dependency lockfiles, compose services, databases, cloud resources or credentials. Its explicitly declared planning manifests/lock receipts are control artifacts, not project implementation. `MATERIALIZE` means **materialize the planning artifacts and F00 execution plan**, not implement the project. F00's later agent sessions create and verify the scaffold.

## Choose the correct route first

- This contract is intentionally **root-only**: `TARGET_PATH` must normalize to `.` at the workspace root in all three modes. A different path, traversal, absolute path or symlink alias is `BLOCKED_CONFLICT`; run the kit from a separate empty workspace rooted at the intended new project. This prevents a greenfield materialization from overwriting the factual map of an existing multi-project workspace.
- Use this greenfield route only when the intended target is empty or contains planning/tool metadata only.
- If buildable source, package manifests, application compose files, migrations, product tests, or a factual `WORKSPACE_MAP.md` already exist for the target, stop without writes and direct the operator to route **1 INIT**, followed by **2 CREATE FEATURE**.
- A placeholder README, VCS metadata, agent-tool metadata, this kit, and `.agentic_planning/_project_*` do not by themselves make a project brownfield.
- A partially-created scaffold with ambiguous ownership is neither safely greenfield nor safely brownfield: return `BLOCKED_CONFLICT` with the exact paths and ask the operator which project owns them.
- Resolve target paths and symlinks. Any target that escapes the workspace root, collides by filesystem case-folding, or overlaps another declared project is `BLOCKED_CONFLICT`.

## Human gate versus normal feature autonomy

The human decision gate here is deliberate and limited to greenfield definition. It does not weaken the normal feature rule that deterministic gates decide correctness without a human approval bottleneck.

- `PROPOSE` may recommend and assume only visible, reversible, low-risk defaults.
- `REFINE` records explicit human feedback and may repeat indefinitely.
- `MATERIALIZE` requires an explicit command plus a readiness `PASS` tied to the exact blueprint and revision-manifest hashes.
- Silence, timeout, lack of feedback, or a model's confidence is never human acceptance.
- If the user explicitly delegates low-risk choices, record `authority: human_delegated`; delegation never waives data ownership/access, production writes, secret handling, security/privacy, compliance, or irreversible-operation gates.

## Inputs to read in every phase

1. Root `CLAUDE.md`, `AGENTS.md`, `README*`, existing `WORKSPACE_MAP.md`, and `.agentic_planning/` indexes if present.
2. `agentic-planning-kit2/PROMPT_INIT.md`, `PROMPT_CREATE_FEATURE.md`, `README.md`, and `TRIGGERS.md`.
3. The selected project's current state/revision artifacts when `MODE=REFINE|MATERIALIZE`.
4. The target tree, read-only, including hidden files, VCS metadata, manifests, workflows, executable scripts, compose files and symlinks needed to classify it as `empty`, `planning_only`, `partial_conflict`, or `existing_project`.

Never treat planning documents or reference projects as evidence that a framework, command, seam, recipe or quality gate already exists in the target.

## Project planning tree

All mutable design work stays under one stable project identity:

```text
.agentic_planning/_project_<project-id>/
├── README.md
├── PROJECT_BLUEPRINT.md             # rendered current-revision mirror
├── project-blueprint.json           # normalized projection of the same revision
├── PROJECT_STATE.json               # machine-canonical state + CAS fields
├── DECISION_LOG.md                  # rendered human view
├── decision-log.jsonl               # machine-canonical append-only entries
├── READINESS.md                     # rendered current gate
├── readiness.json                   # machine-canonical boolean gate
├── current.json                     # exact current revision + hashes
├── target-snapshot.json             # machine-canonical classified root fingerprint
├── official-evidence.json           # machine-canonical official-source claim index
├── secret-scan.json                 # redacted receipt over persisted planning artifacts
├── map-claims.json                  # current tri-state claims; WORKSPACE_MAP is its view
├── research/
│   └── rev-NNN/<domain>/...         # optional read-only research lanes
├── operations/
│   └── <mode>-<invocation-id>/...   # immutable no-change/recovery/control receipts
├── revisions/
│   └── rev-NNN/
│       ├── PROJECT_BLUEPRINT.md      # binding immutable blueprint for this revision
│       ├── project-blueprint.json
│       ├── target-snapshot.json
│       ├── official-evidence.json
│       ├── secret-scan.json
│       ├── readiness.json
│       ├── map-claims.json
│       ├── roadmap/
│       │   ├── FIRST_FEATURES.md
│       │   ├── first-features.json
│       │   └── feature-readiness.json
│       ├── REFINEMENT_REPORT.md
│       └── revision-manifest.json
├── roadmap/
│   ├── FIRST_FEATURES.md
│   ├── first-features.json           # immutable intent definitions once 3C freezes them
│   ├── feature-readiness.json        # current projection; never changes intent definitions
│   ├── feature-readiness.jsonl       # rendered append-only event index
│   ├── READINESS_LEDGER_HEAD.json    # current event/head/projection hashes + CAS version
│   ├── READINESS_LEDGER.lock         # ephemeral O_EXCL single-writer lock
│   └── readiness-events/
│       └── <sequence>-<event-id>.json # immutable machine-canonical events
└── materialization/
    └── rev-NNN/
        ├── MATERIALIZATION_LOCK.json
        ├── MATERIALIZATION_AUTHORIZATION.json
        ├── MATERIALIZATION_SECRET_SCAN.json
        ├── LOCK_RELEASE.json
        ├── MATERIALIZATION_MANIFEST.json
        └── F00_PLAN_HANDOFF.md
```

After a successful `MATERIALIZE`, the workspace root additionally contains:

```text
PROJECT_BLUEPRINT.md                         # frozen mirror of the authorized revision
WORKSPACE_MAP.md                             # contract 3, maturity bootstrap-greenfield
CLAUDE.md / AGENTS.md managed pointer block  # greenfield-aware; existing human text preserved
.agentic_planning/_feature_00_<slug>-scaffold/
```

`project_id` is immutable and independent from the display name/slug. A pre-materialization rename updates labels in a new revision but never moves or rewrites project history.

## State machine

`PROJECT_STATE.json` keeps design, bootstrap execution and workspace maturity separate:

```text
design_status:
  ABSENT → PROPOSED | READY; PROPOSED → REFINING ↔ READY → FROZEN

bootstrap_plan_status:
  ABSENT → MATERIALIZATION_AUTHORIZED → F00_PLANNED

bootstrap_execution_status (updated later by F00, not by 3A/3B/3C):
  NOT_STARTED → ACTIVE → DONE (steps finished + factual INIT; the user's manual QA accepts it)

workspace_status (updated later after F00's factual INIT):
  EMPTY → BOOTSTRAP_MAP → FOUNDATION_PRESENT → FACTUAL_MAP_READY | BLOCKED_DRIFT
```

Additional terminal/control states: `NOT_READY`, `BLOCKED_CONFLICT`, `BLOCKED_OFFICIAL_EVIDENCE`, `STALE_BLUEPRINT`, `MATERIALIZATION_DRIFT`, `BLOCKED_FROZEN`, `SUPERSEDED`.

Every design/materialization state mutation uses compare-and-swap on `project_id + target_path + revision + blueprint_sha256 + revision_manifest_sha256 + state_version`. The observed `workspace_fingerprint` is a separate drift precondition, not the monotonic CAS token: authorized F00 controller nodes advance it only through signed/hashed target-snapshot and handoff receipts. A stale base returns `STALE_BLUEPRINT` without writes. Design materialization and product implementation are never represented by the same status.

## Canonical artifact rules

- `revisions/rev-NNN/PROJECT_BLUEPRINT.md` is the binding source for that revision.
- Its `project-blueprint.json` is a normalized projection with `blueprint_sha256`; any semantic mismatch fails closed.
- `PROJECT_STATE.json`, `decision-log.jsonl`, `readiness.json`, `current.json`, snapshots/evidence/scans/claims/readiness projections, revision manifests and materialization manifests are machine-canonical strict JSON/JSONL. Markdown files are rendered human views.
- Every machine object declares `schema_version`, required fields and `additionalProperties: false`; use stable IDs, ISO-8601 UTC timestamps and SHA-256 artifact chains. Reject rather than ignore undeclared fields. Do not guess `approved_by` identities.
- `decision-log.jsonl` is append-only. Changes add `SUPERSEDED`, `REJECTED` or `DEFERRED` entries; they never rewrite history.
- Revision snapshots, lock claims, release receipts, manifests and materialized feature-intent definitions are immutable. Pre-materialization refinements create a new revision and update current mirrors; later readiness/execution changes create immutable files in `readiness-events/` and atomically re-render JSONL/projection/head without mutating `first-features.json`.
- Never store secret values, tokens, passwords, private keys, authenticated URLs, DSNs or copied sensitive user content. Record secret classes and environment-variable key names only.

### Target snapshot, claims, evidence and scan contracts

- `target-snapshot.json` records the resolved root, canonical `TARGET_PATH: .`, filesystem case mode, symlink results, ruleset version and a sorted list of path/type/size/SHA-256/`classification_rule_id` entries. The closed allowlist is: `GF-VCS-METADATA` for `.git/**` except active/custom executable hooks and escaping worktree links; `GF-KIT` for this kit's declared files; `GF-SAME-PROJECT-PLANNING` for the matching project planning tree; `GF-AGENT-INSTRUCTIONS` for root agent instruction/rule documents that are preserved as human-owned; and `GF-PLACEHOLDER-README` only for a root plain-text/Markdown project-description README with no executable code, workflow, generated artifact or runtime/package declaration. Any source/package/application manifest, workflow, executable script, compose/runtime file, escaping symlink, custom hook or unclassified/ambiguous path is `UNKNOWN → partial_conflict`.
- `map-claims.json` is the machine-canonical tri-state registry. Each closed record contains `claim_id`, `semantic_sha256`, `status: EXISTING|PLANNED|UNKNOWN`, `kind`, `claim`, `decision_id`, `required_for`, `producer_feature_ids`, `allowed_consumers_by_status`, `evidence[]`, `supersedes`, revision and timestamps. `PLANNED` claims may be consumed as design input only by F00; a bound producer feature may create its declared output but may not treat it as a pre-existing seam/command/resource. `EXISTING` claims may be consumed by normal features named by policy. Evidence entries identify a real path/symbol or a hashed command report. A changed claim meaning gets a new ID plus `supersedes`; status promotion never changes its semantics. `WORKSPACE_MAP.md` is a rendered view and permanently cites the registry hash.
- `official-evidence.json` indexes each technical claim with `claim_id`, official source kind (`official_docs|official_repository|registry|standard`), publisher, URL, selected version/tag/digest, retrieval time, supported fact, separate agent inference and `required_for_f00`. Required F00 evidence cannot be deferred; inaccessible/insufficient primary evidence yields `BLOCKED_OFFICIAL_EVIDENCE`.
- `secret-scan.json` records scanned artifact hashes, scanner/ruleset/version and redacted finding categories only; it must assert `secret_material_present: false`. Render intended persisted artifacts in an isolated planning staging area, sanitize and scan them before canonical commit. The receipt never stores a matched value. A possible secret, authenticated URL or DSN that cannot be safely redacted blocks the write.
- Each readiness event is a closed object with event ID, intent ID/definition hash, previous/new status, dependency/claim evidence, project predicates/map/claims hashes, source receipt, prior-head hash, CAS state version and timestamp. Allowed progression is `WAITING_FOR_F00_PASS_AND_FACTUAL_MAP → READY_FOR_CREATE_FEATURE`; from there the lean route 2 plans the feature from the intent description and writes no further ledger events — feature completion is tracked by the user's manual QA. Later dependency-unlock events never rewrite prior events.
- Every readiness/project-state mutation acquires `roadmap/READINESS_LEDGER.lock` with atomic exclusive create and verifies the last committed head. The ephemeral lock records owner + prior-head hash and may be deleted only by that owner after an immutable release receipt under `operations/ledger-<event-id>/`; it is never stolen by timeout. Under the lock, write an immutable PREPARE event with the prior head/CAS version, stage state + JSONL + projection + head carrying one `commit_id`, atomically replace each file, then write the immutable COMMIT receipt **last** with all resulting hashes. Readers accept a state/projection/head only when that commit receipt exists; otherwise they use the last committed head and recover/rebuild under an explicitly authorized lock-recovery operation. Last-writer-wins and blind JSONL append are forbidden.
- Cross-file validation separates immutable `revision_*` hashes from current operational snapshot/claims/readiness hashes. The revision manifest never changes after F00; reconciliation and handoff receipts form the authorized chain to current facts. `ACCEPTED` decisions require human authority; `ASSUMED_BY_POLICY` requires `agent_low_risk_policy` and an allowed reversible category; `DEFERRED`/`UNKNOWN` may not be required by F00.

## Blueprint contract

Every revision contains concrete sections for:

1. Project identity, problem, target users/actors and desired outcomes.
2. Scope, non-goals and success measures.
3. User journeys and product capabilities, without implementation inflation.
4. Canonical domain/API/event contracts known at this stage; unresolved shapes remain explicit.
5. Proposed architecture, modules, dependency direction and integration boundaries.
6. Planned stack/toolchain, version-resolution/support policy, package manager and licensing constraints.
7. Data stores: owner; access mode (`read-write|append-only|read-only|bootstrap-write/runtime-read-only|no_store|UNKNOWN`); lifecycle/cutover; principals/env-key names; allowed/forbidden operations; migration protocol only for authorized writable phases.
8. Authentication, authorization, tenant boundary, security, privacy, data sensitivity and compliance assumptions.
9. Secret policy: classes/providers/key names, rotation/cleanup boundary and prohibited storage/logging.
10. Environments and deployment: local/dev/staging/production boundaries; `agent_write` authorization per environment; production/staging default to false.
11. Planned workspace layout and the distinction between planned paths and factual paths.
12. Planned build/test/lint/package/run commands, clearly marked non-executable until F00 creates and verifies them, and which of them are intended to serve as the subproject's **quality gates** (deterministic, exit-code-verified) once real.
13. Observability, errors, logging/redaction and operations.
14. Agent concurrency: proposed single-writer hotspots, read/product/generated/output scopes, resource modes/isolation keys and worktree/handoff policy.
15. F00 exact scaffold scope, non-goals, rollback/cleanup and acceptance gates.
16. Initial feature roadmap as a dependency DAG with candidate parallel feature fronts.
17. Risks, assumptions, `UNKNOWN`s, decision IDs and readiness status.

Do not select a data owner/access mode, production target, secret mechanism, security boundary or irreversible operation merely because it is common. `no_store` is an explicit valid data decision.

## Decision log contract

Each append-only decision entry contains at least:

```json
{
  "id": "D-<stable-id>",
  "status": "PROPOSED|ASSUMED_BY_POLICY|ACCEPTED|REJECTED|SUPERSEDED|DEFERRED",
  "question": "",
  "decision": "",
  "rationale": "",
  "alternatives": [],
  "consequences": [],
  "source": "user|agent",
  "authority": "explicit_human|human_delegated|agent_low_risk_policy",
  "blueprint_revision": "rev-NNN",
  "affected_sections": [],
  "supersedes": null,
  "created_at": "<ISO-8601 UTC>"
}
```

`ASSUMED_BY_POLICY` is allowed only for reversible low-risk defaults that are visible in the proposal. The exact `MATERIALIZE` authorization accepts every visible `ASSUMED_BY_POLICY` ID bound into that revision manifest as a batch; 3C records the accepted ID list in immutable `MATERIALIZATION_AUTHORIZATION.json` without changing the frozen revision or decision-log head. To reject or change any such ID, use `REFINE` first and authorize the resulting new manifest. This mechanism is forbidden for data/security/privacy/secrets/production/irreversible decisions.

## Readiness gate

Readiness is boolean, not a weighted score. `readiness.json` is `PASS` only when every applicable hard gate below is true for the same revision/hash:

- target identity/path/fingerprint is known, inside the workspace and collision-free;
- scope, non-goals, actors and success outcomes are coherent;
- stack/toolchain/version/support policy has sufficient primary/official evidence;
- architecture, contracts and dependency directions are coherent enough for F00;
- every applicable data owner/access/lifecycle/principal/operation decision is explicit;
- secret/security/privacy/tenant boundaries are explicit;
- local/dev versus staging/production write boundaries are explicit and safe;
- F00 planned paths, write scopes, exclusive resources, rollback and verification are bounded;
- planned commands and generated/cache/temp effects are identified, including the intended quality gates;
- concurrency, same-checkout/worktree isolation and handoff policy are defined or fail closed;
- blocking decision IDs and conflicts are empty;
- workspace fingerprint, blueprint hash, decision log and normalized JSON projection agree;
- revision manifest, target snapshot, official-evidence index, secret-scan receipt, map claims and roadmap hashes agree;
- roadmap dependencies and F00 gate are coherent.

A non-blocking unknown must have an owner, rationale and deferred feature. `MATERIALIZE_AUTHORIZATION` never substitutes for readiness.

## Official evidence policy

When a technical choice depends on current versions, compatibility, support/EOL, license, hosting topology, security behavior or API availability:

- use primary/official documentation, release metadata, registries or repositories;
- record source, selected version/range, retrieval date and the claim it supports;
- distinguish source fact from agent inference;
- if current evidence cannot be accessed, mark the decision `BLOCKED_OFFICIAL_EVIDENCE` or defer it; do not rely on memory as a version lock;
- do not quote/copy secrets or confidential configuration found in reference files.

Research lanes for architecture/toolchain, data/security and delivery/operations may run concurrently with unique planning outputs. One synthesis session exclusively owns the revision, state and decision log.

---

## MODE `PROPOSE` — trigger 3A

### Purpose

Produce the first complete base proposal from `PROJECT_INTENT` without requiring the human to answer every question up front.

### Procedure

1. Validate the target as `empty` or `planning_only`; fingerprint factual non-planning content without exposing secrets.
2. Derive an immutable `project_id` and a readable mutable slug. Detect an identical prior proposal by normalized intent + target fingerprint; identical replay verifies/no-ops, while a collision stops.
3. Parse explicit user decisions separately from agent proposals and low-risk assumptions.
4. If needed, run bounded read-only research lanes and collect official evidence.
5. Build revision `rev-001`: blueprint Markdown + JSON projection, decision entries, target/official-evidence/secret-scan/claims snapshots, readiness, roadmap and first-feature intents. Persist immutable revision copies and current mirrors; compute `revision-manifest.json` last so it chains every artifact.
6. Write only `.agentic_planning/_project_<project-id>/`; do not create root blueprint/map/pointers or a feature tree.
7. Set `design_status` to `READY` only if readiness is genuinely `PASS`; otherwise `PROPOSED`/`REFINING` with stable blocking IDs.
8. Return a compact base-plan summary: outcomes, architecture/stack recommendation, F00, feature DAG/waves, risks, assumptions and at most **three** highest-impact human questions. Do not block creation of the proposal merely because feedback would improve it.

### First-feature intents

`roadmap/first-features.json` contains F00 plus F01+ intents. F01+ entries are never executable before factual handoff:

```json
{
  "id": "F01",
  "intent": "<feature intent suitable for route 2 later>",
  "initial_readiness": "WAITING_FOR_F00_PASS_AND_FACTUAL_MAP",
  "depends_on": ["F00_PASS", "FACTUAL_MAP"],
  "required_claim_ids": [],
  "produces_claim_ids": [],
  "materialization_gate": "post_f00_factual_map",
  "plan_path_source": "roadmap/feature-readiness.json"
}
```

Do not generate F01+ `execution_prompts/` or pretend that their planned paths are seams.

---

## MODE `REFINE` — trigger 3B (repeatable)

### Preconditions

- Exact `TARGET_PATH=.`, `PROJECT_ID`, `BASE_REVISION`, `BASE_BLUEPRINT_SHA256` and `BASE_REVISION_MANIFEST_SHA256` are mandatory.
- State may be `PROPOSED`, `REFINING` or `READY` and must match the supplied CAS base.
- If F00 is already planned/active, stop with `BLOCKED_FROZEN`. This prompt defines no cancellation or lock-stealing trigger; handle a later change as an explicit feature/ADR/remediation, or restart in a separate clean target when no product work should be preserved.

### Procedure

1. Read `HUMAN_FEEDBACK` literally. Classify each item as accept, reject, change, defer, question or delegated low-risk choice; do not interpret silence.
2. Validate the base revision/blueprint/revision-manifest hashes and current target snapshot immediately before the single-writer synthesis. Stale input returns `STALE_BLUEPRINT` without writes.
3. Optional read-only reviewers may analyze disjoint domains in parallel and write unique research reports; they never edit canonical state.
4. Append decision entries, preserve supersession links and produce `rev-(N+1)` only for a semantic change. A semantic no-op does not touch canonical revision/state artifacts; it writes only immutable `operations/refine-<invocation-id>/NO_CHANGE.{md,json}` receipts bound to the unchanged manifest.
5. Re-render the current blueprint/state/decision/readiness views atomically from canonical artifacts.
6. Any semantic refinement invalidates earlier readiness and recomputes it for the new hash.
7. Return changed decisions, consequences, roadmap changes, readiness, remaining blockers and at most three next questions.

`REFINE` may repeat until readiness passes. It is optional when `PROPOSE` already produced a complete `READY` blueprint and the operator is satisfied.

---

## MODE `MATERIALIZE` — trigger 3C

### Preconditions

- Before applying the normal preconditions, detect an exact completed replay: `design_status=FROZEN`, `bootstrap_plan_status=F00_PLANNED`, same target/revision/blueprint/revision-manifest/idempotency key, released matching lock and byte-identical manifest outputs. That case is a read-only verify/no-op returning the existing `F00_PLAN_HANDOFF.md`; it does not require state `READY` and writes nothing.
- For a new materialization, the user invoked the explicit trigger and supplied exact `TARGET_PATH=.`, project/revision/blueprint/revision-manifest hashes plus the exact authorization phrase defined at the top of this prompt.
- `design_status=READY`, `readiness=PASS`, and every artifact/hash/target snapshot still matches.
- No blocking unknown, conflict, stale revision, active materialization lock or active F00 exists.
- The target remains empty/planning-only. Before freeze, any unexpected source/manifest is `MATERIALIZATION_DRIFT` and requires `REFINE` or brownfield INIT. After freeze, this workflow never returns to `REFINE` or silently supersedes: a different hash/revision is `BLOCKED_FROZEN` and must be handled later as an explicit project change/remediation or in a new clean target.

### Idempotency and locking

1. Acquire `materialization/rev-NNN/MATERIALIZATION_LOCK.json` using an actual filesystem exclusive-create primitive (`O_CREAT|O_EXCL`, `CreateNew`, or equivalent), never a test-then-write sequence. If the execution surface cannot provide atomic exclusive create, return `BLOCKED_LOCK_UNAVAILABLE`. The closed lock object contains project ID, `TARGET_PATH`, revision, blueprint/revision-manifest/target-snapshot hashes, generator contract, idempotency key, opaque owner-session ID, `status: CLAIMED` and creation time.
2. Under the lock, recalculate the target snapshot before any materialization write and require an exact match to the authorized snapshot. Validate the authorization again, write immutable `MATERIALIZATION_AUTHORIZATION.json` with the phrase hash, authorized manifest, visible accepted low-risk assumption IDs and no identity guess, then CAS `bootstrap_plan_status=MATERIALIZATION_AUTHORIZED`.
3. Same basis + matching completed manifest and `LOCK_RELEASE.json` returns the existing `F00_PLAN_HANDOFF.md` without rewrites.
4. Same basis + mismatched files is `MATERIALIZATION_DRIFT`.
5. Different hash or revision never overwrites an earlier materialization and returns `BLOCKED_FROZEN` once 3C succeeded.
6. Render all prospective 3C outputs in an isolated planning staging directory, scan their exact hashes, and require immutable `MATERIALIZATION_SECRET_SCAN.json` with `secret_material_present: false` before committing them. Recalculate a post-write target snapshot before release; it may differ only by the manifest-declared planning writes. Unexpected drift blocks `LOCK_RELEASE`.
7. Lock claims and release receipts are immutable. A claim is active iff it has no matching `LOCK_RELEASE.json` bound to its hash. A lock has no automatic timeout that grants write authority. An orphan is `BLOCKED_LOCK_ORPHAN`; 3A/3B/3C do not delete, replace or steal it, and recovery requires a separate explicit operator protocol.

### Materialization writes

`MATERIALIZE` may write only:

- the frozen root `PROJECT_BLUEPRINT.md` mirror;
- a bootstrap `WORKSPACE_MAP.md` contract 3 with `Map maturity: bootstrap-greenfield`;
- managed greenfield pointer blocks in present agent entry points;
- the exact F00 feature plan tree;
- materialization authorization/manifest/handoff receipts and state updates; the frozen decision log is not rewritten by 3C.

It must not create product/source/test directories, product/package manifests, dependency lockfiles, Dockerfiles, compose files, CI, environments, databases or cloud resources. The planning-control manifests and lock receipts explicitly listed above are the only meaning of “manifest/lock” permitted in 3C.

Root `PROJECT_BLUEPRINT.md` and `WORKSPACE_MAP.md` use create-new semantics, except an exact byte/hash match from this same completed idempotency key is a no-op. Any pre-existing non-managed or human-owned content at either destination is `BLOCKED_CONFLICT`. `CLAUDE.md` and `AGENTS.md` may be created minimally if absent; if present, only the marked managed block may change with a preimage hash. Other tool entry points are modified only when already present and only inside their managed block. Never classify a human file as an “updated planning path” to overwrite it.

### Bootstrap map contract

The initial map is honest, non-factual planning state:

```markdown
# WORKSPACE_MAP.md — bootstrap map for agentic feature planning

**Planning-map contract:** 3
**Map maturity:** bootstrap-greenfield
**Blueprint:** `.agentic_planning/_project_<project-id>/revisions/rev-NNN/PROJECT_BLUEPRINT.md` @ `<sha256>`
**Claims registry:** `.agentic_planning/_project_<project-id>/map-claims.json` @ `<sha256>`
**Greenfield gate:** `F00_NOT_PASSED`

## Existing facts
<Only observed root/planning files, each marked EXISTING with evidence.>

## Planned target claims
| Claim ID | Status | Planned claim | Decision source | Allowed consumers |
|---|---|---|---|---|
| C-... | PLANNED | ... | D-... | F00 design input; declared producer feature output-only |

## Unknowns and drift
| Claim ID | Status | Question/conflict | Blocking scope |
|---|---|---|---|
| C-... | UNKNOWN | ... | ... |

## Bootstrap transition
Only F00 may consume PLANNED claims. Normal CREATE FEATURE remains blocked until F00 executes, the user's manual QA passes, and a factual INIT/reconciliation sets `Map maturity: factual`. After that, F01+ intents are planned with route 2 by pasting each intent's description as the feature text.
```

Never label a planned command, seam, library, recipe, store, resource or quality gate as `EXISTING`. If a real fact conflicts with the approved target, preserve the fact and add a planned delta; never rewrite reality to match intent.

### F00 feature-plan contract

Generate `.agentic_planning/_feature_00_<slug>-scaffold/` using the lean anatomy and safety rules from `PROMPT_CREATE_FEATURE.md` (single-session steps with explicit dependencies, one trigger per step, per-step suggested model effort, short handoff reports, manual QA checklist for the user — no cycles, no DAG json, no rubrics; F00's own steps run strictly sequentially per the execution shape below), with these narrowly-scoped greenfield exceptions:

- F00 grounds in the frozen blueprint, decision log, official evidence and `EXISTING` root facts; it may consume `PLANNED` claims explicitly allowlisted for F00.
- F00 does not require factual seams/recipes because its purpose is to create the first examples. Reports must mark new patterns as `thin` until factual INIT observes them.
- F00 steps run the quality gates only once the step that creates their configuration has landed; earlier F00 steps are exempt — **the gauntlet cannot precede its own creation**. From the gate-creation step onward, every code-writing F00 step passes the just-created gates and records command + exit code in its report.
- No other feature receives these exceptions.

F00 scope is limited to:

- selected toolchain/package manifests and lock policy;
- minimal installable/buildable source/layer skeleton;
- a minimal non-business entrypoint when needed to prove build/run wiring;
- test/lint/format/build configuration and focused smoke checks — **these become the subproject's first quality gates**; the later factual INIT records them in the map's Quality gates tables;
- environment examples with placeholders/key names only;
- architecture/decision docs, agent pointers and local-safe wiring explicitly approved;
- command/resource isolation documentation.

F00 explicitly excludes:

- business behavior or F01+ capabilities;
- production/staging mutation or deployment;
- live data, seed/import, migrations or schema changes unless the blueprint defines an isolated local bootstrap as foundation-critical and the human explicitly accepted it;
- credentials or secret values;
- speculative frameworks/stores/integrations not frozen in the blueprint;
- coverage thresholds, mutation testing or BDD runners — the first gates are only what exists and exits 0/1.

F00's invariants (binding on every step): zero secret material; zero staging/production/cloud/account mutation; selected dependency versions/locks matching official evidence; data-store owner/mode/principals/operations matching accepted decisions; any allowed local bootstrap being explicitly authorized, ephemeral, namespaced and cleanup-verified; zero business/F01+ behavior. Anonymous reads from public package registries and official documentation may be allowed only as declared F00 command/network effects; authenticated/private registries, accounts and any external state write require a separate explicit authorization and are otherwise blocked.

Required F00 execution shape (sequential, one trigger per step):

```text
target audit (read-only)
  → scaffold/toolchain steps in dependency order (manifests, source layout, quality config → first gates, docs/env)
  → factual INIT/reconciliation using PROMPT_INIT.md (trigger 1)
  → user performs the manual QA checklist in FEATURE_<SLUG>.md §7
```

### After F00

Once F00's steps finish and factual INIT sets `Map maturity: factual`, the user runs the manual QA checklist. If it passes, F01+ intents become plannable: run route 2 (CREATE FEATURE) once per intent, pasting the stored intent description as the feature text — from then on, every code-writing step passes the gates F00 created. Defects found in QA become ad-hoc fixes before planning F01+.

### Greenfield managed pointer block

During bootstrap, hydrate existing/created `CLAUDE.md` and `AGENTS.md` with this idempotent managed block, preserving all text outside the markers:

```markdown
<!-- agentic-routes:begin — managed by agentic-planning-kit2. -->
## Greenfield project blueprint and bootstrap map

Read [`PROJECT_BLUEPRINT.md`](./PROJECT_BLUEPRINT.md) and [`WORKSPACE_MAP.md`](./WORKSPACE_MAP.md) before work. The map is `bootstrap-greenfield`: only `EXISTING` claims are facts; F00 may consume its allowlisted `PLANNED` design inputs, while a later declared producer may only create a PLANNED claim as output; `UNKNOWN` blocks affected work. No product feature may execute until F00 executes and factual INIT sets map maturity to `factual`. Use `agentic-planning-kit2/TRIGGERS.md` routes 3A/3B/3C for greenfield planning and route 2 only after the map is factual.
<!-- agentic-routes:end -->
```

When F00's factual INIT sets the map to `Map maturity: factual`, it replaces the greenfield warning with the normal pointer block from `PROMPT_INIT.md`.

### First-feature roadmap materialization

`MATERIALIZE` freezes `roadmap/FIRST_FEATURES.md` and `first-features.json`, but creates no F01+ feature tree. Each entry includes intent, dependencies, expected domain boundary, data/access constraints, `required_claim_ids`, `produces_claim_ids` and a ready-to-paste route-2 feature description. Statuses before the map is factual are `WAITING_FOR_F00_PASS_AND_FACTUAL_MAP`. This is still the project's initial feature roadmap; it is deliberately non-executable rather than grounded in invented paths.

### Materialization completion

Write `MATERIALIZATION_MANIFEST.json` with:

- project/target/revision/blueprint/revision-manifest/readiness/decision-log/official-evidence/revision-secret-scan/claims/authorized-target-snapshot/workspace-fingerprint hashes plus the immutable materialization-authorization and pre/post-write target-snapshot hashes; declare the expected materialization-secret-scan path (its hash is linked later by `LOCK_RELEASE.json` to avoid a hash cycle);
- generator planning contract versions;
- every created planning path and its hash except `MATERIALIZATION_MANIFEST.json`, `MATERIALIZATION_SECRET_SCAN.json` and `LOCK_RELEASE.json`, plus managed-block preimage/postimage hashes only; these control files cannot self-include and the release receipt links their hashes;
- F00 path and step-list hash;
- root blueprint/bootstrap-map/pointer hashes;
- exact allowed/forbidden writes;
- rollback limited to manifest-created planning files and empty directories, never user files;
- `materialization_status: F00_PLANNED` and the expected immutable lock-release path.

Set `design_status=FROZEN`, `bootstrap_plan_status=F00_PLANNED`, `bootstrap_execution_status=NOT_STARTED`, and `workspace_status=BOOTSTRAP_MAP`. After committing, verify every file still matches the staged scan, then write `LOCK_RELEASE.json` last; it contains the lock, completed materialization-manifest and materialization-secret-scan hashes. Return `F00_PLAN_HANDOFF.md` and explicitly state that no product code was created.

---

## Constraints shared by all modes

- No product code or external mutation in 3A/3B/3C.
- Never initialize git, install dependencies, run generators, start services, create databases, call cloud deployment APIs or contact people.
- External research is read-only and restricted to primary/official sources when current technical facts matter.
- Never echo secrets. Sanitize user intent before writing if it contains possible secret material; record a redacted placeholder and warn.
- Preserve existing user files and unrelated changes. Never adopt, overwrite, move or delete an ambiguous target.
- One synthesis writer owns canonical blueprint/state/log/readiness/current files. Parallel reviewers write unique reports only.
- State and materialization use CAS/idempotency; no last-writer-wins.
- A risky unknown is a blocker, not permission to choose a convenient default.
- 3C cannot weaken F00's binding invariants or normal route-2 map requirements.

## Phase completion responses

- `PROPOSE`: root target, project ID, revision/blueprint/revision-manifest hashes, readiness, assumptions, feature-level DAG/waves, artifact paths and up to three questions.
- `REFINE`: base/new blueprint and revision-manifest hashes, semantic changes or `NO_CHANGE`, decisions appended/superseded, readiness and up to three questions.
- `MATERIALIZE`: exact authorized blueprint + revision-manifest hashes, manifest/F00 paths, bootstrap-map maturity, first-feature intent count, idempotency result and the statement `planning materialized; product not implemented`.
