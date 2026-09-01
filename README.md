# Agentic Planning Kit v3

A portable, stack-agnostic kit for planning and executing agent work safely when several people use the same repositories through Git.

It is installed over a **workspace** — the root holding every internal project of one solution — so that a feature spanning a migration, an API, a backend and a frontend is planned, claimed, executed and accepted as one unit. See [Workspaces](#workspaces).

V3 keeps v2's strongest guarantees — binding feature contracts, explicit dependency graphs, deterministic quality gates, immutable test expectations and human acceptance QA — and changes the collaboration model:

> **Many writers create immutable, identity-owned sources. One protected integration writer regenerates global projections.**

Feature branches never edit `WORKSPACE_MAP.md`, `.agentic_planning/README.md`, the canonical catalog or managed agent-instruction blocks. They create globally identified manifests, plan revisions, events, run receipts and semantic map deltas. `RECONCILE_MAIN` validates those sources against the current integration candidate and is the only route allowed to update global views.

## Prompts and tools

| Route | File | Purpose | Writes |
|---|---|---|---|
| M | [`PROMPT_MIGRATE_V2_TO_V3.md`](./PROMPT_MIGRATE_V2_TO_V3.md) | Plan, apply or roll back a v2 → v3 migration | Main-only planning control; never branches, commits or pushes |
| 1 | [`PROMPT_INIT.md`](./PROMPT_INIT.md) | Discover factual workspace facts, quality gates and concurrency resources | Branch context: observations/deltas only; integration context: catalog through route 5 |
| 2 | [`PROMPT_CREATE_FEATURE.md`](./PROMPT_CREATE_FEATURE.md) | Create a resource-aware feature plan pending registration | One globally identified feature tree |
| 3 | [`PROMPT_INIT_NEW_PROJECT.md`](./PROMPT_INIT_NEW_PROJECT.md) | Propose, refine and materialize a greenfield project | Immutable project revisions/events and F00 sources |
| 4 | [`PROMPT_ANALYZE_BEFORE_DEVELOP.md`](./PROMPT_ANALYZE_BEFORE_DEVELOP.md) | Produce an evidence-backed analysis | One globally identified analysis tree |
| 5 | [`PROMPT_RECONCILE_MAIN.md`](./PROMPT_RECONCILE_MAIN.md) | Validate integration and regenerate global state | Protected catalog, map, index, mirrors and managed blocks |
| CLI | [`tools/agentic_planning_v3.py`](./tools/agentic_planning_v3.py) | Validate artifacts/claims and deterministically render projections | Read-only by default; explicit `--write` for integration |
| Setup | [`tools/install_kit.ps1`](./tools/install_kit.ps1) / [`.sh`](./tools/install_kit.sh) | Vendor the kit into a consumer repository and merge its Git fragments | Consumer repository; never pushes |

Copy-paste launchers live in [`TRIGGERS.md`](./TRIGGERS.md). The normative data and Git rules live in [`CONTRACT_V3.md`](./CONTRACT_V3.md) and [`GIT_POLICY.md`](./GIT_POLICY.md). [`INSTALL.md`](./INSTALL.md) covers getting the kit into a consumer repository without nesting one Git repository inside another.

## Canonical layout in a consumer workspace

```text
.agentic_planning/
├── CONTRACT.json
├── features/
│   └── ftr_<uuid>--<slug>/
│       ├── descriptor.json
│       ├── plans/<revision-id>/
│       │   ├── manifest.json
│       │   ├── FEATURE.md
│       │   └── execution_prompts/
│       ├── events/<event-id>.json
│       ├── runs/<run-id>/
│       │   ├── <attempt-id>.json
│       │   └── <attempt-id>.md
│       └── map-deltas/<delta-id>.json
├── analyses/ana_<uuid>--<slug>/...
├── projects/prj_<uuid>--<slug>/...
├── imports/legacy/...              # immutable v2 sidecars
├── catalog/                        # RECONCILE_MAIN only
├── reconciliations/<id>/receipt.json
└── README.md                       # generated; never edit directly

WORKSPACE_MAP.md                    # generated; planning-map contract 4
```

Slugs and usernames are labels, never identities. New attempts always receive new run/attempt IDs, so retries cannot overwrite evidence. The compact run path keeps full UUID identities without exceeding common Windows/Git path limits; the receipt itself carries `step_id`.

## Source ownership

| Class | Examples | Writer |
|---|---|---|
| Entity-owned immutable sources | descriptors, plan revisions, ordinary state events, run receipts, map deltas | The feature/analysis/project branch that owns the entity ID |
| Registration events | one `RECONCILED`/`ACTIVE` event per accepted revision | `RECONCILE_MAIN` after candidate validation |
| Main-owned canonical state | `.agentic_planning/catalog/**` | `RECONCILE_MAIN` only |
| Generated projections | `WORKSPACE_MAP.md`, `.agentic_planning/README.md`, root blueprint mirrors, managed pointer blocks | `RECONCILE_MAIN` only |
| Local ephemeral state | staging, caches, local locks, actor/session metadata | Local tool; ignored by Git |
| Product code | source/tests/config within declared scopes | Feature steps and their integration owner |

One-file-per-event makes independent additions merge naturally. A conflicting state transition is detected semantically through its expected parent; it is never settled by filesystem order, timestamps or last-writer-wins.

## Git collaboration workflow

```text
sync from origin/main
  → plan with a global feature ID + claims
  → register the plan through integration
  → execute steps in isolated branches/worktrees with unique run IDs
  → integrate prerequisites and fan-in hotspots
  → merge queue rebuilds against the latest main
  → RECONCILE_MAIN validates claims/diffs/deltas and regenerates views
  → gates pass
  → main advances
```

Contributors must update from `origin/main` before planning and again before requesting merge. That is required hygiene, but it is not the concurrency guarantee: `main` can advance after a local pull. Required checks and a serialized merge/integration queue must rebuild and revalidate the candidate against the actual latest `main`.

No human or ordinary agent commits directly to protected global paths. A textually clean merge does not authorize a semantic conflict.

Consumer repositories must merge the supplied `.gitignore` and `.gitattributes` fragments. The force-include rules for `.agentic_planning/**` are intentional: broad user/global ignores such as `runs/`, `events/` or `projects/` must never hide canonical receipts or events from Git. The protected check fails with `PLANNING_SOURCE_IGNORED` when it detects that condition.

## Resource claims

Every feature manifest declares product write scopes and non-file resources:

| Combination | Result |
|---|---|
| `read` + `read` | Compatible |
| Overlapping `write` scopes | Dependency, declared fan-in owner or block |
| Same `exclusive` resource | Serialize/block |
| Same `isolated` resource with distinct keys | Compatible |
| Any `UNKNOWN` access | Treat as exclusive |

Portable JSON path scopes are limited to `kind: exact` or `kind: tree`; human views may display a tree as `directory/**`. The validator normalizes separators, rejects traversal and checks that the real Git diff stays within the declared scope.

Runtime isolation is separate from Git isolation. Compose projects, DB/schema names, ports, volumes, caches, temporary directories and report locations use a namespace derived from feature/run IDs. A resource without a proven namespace stays exclusive.

## RECONCILE_MAIN

Route 5 is a protected integration task, not a contributor task. It:

1. validates contract versions, IDs, immutable sources and causal events;
2. compares all active claims and the real diff;
3. revalidates map-delta evidence against the integration code;
4. applies semantic deltas with expected-item hashes;
5. reduces feature/analysis/project state deterministically;
6. regenerates the workspace map and global index;
7. updates only managed instruction blocks;
8. writes a reconciliation receipt last;
9. proves idempotency by producing no second diff.

The preferred integration surface is a merge candidate constructed from the latest `main`, so source changes and projections land together. If a hosting platform can only reconcile after merge, it must mark `RECONCILIATION_PENDING` and block subsequent dependent merges until the protected task completes.

## Correctness and acceptance

V3 preserves the v2 quality model:

- The feature planner defines one binding contract.
- Every code-writing step receives binding happy, negative and edge test cases.
- Executors may add tests but never delete, skip or weaken required or existing tests.
- Every applicable deterministic gate from the workspace catalog must pass with exit code 0.
- Reports record commands, exit codes and every test file touched.
- Human QA remains a Spanish action → expected-result checklist for UX, device flows, visuals and end-to-end acceptance.

The planning system's own schemas, claim checks and deterministic rendering are also gates. Markdown instructions alone are not considered enforcement.

## Existing workspace workflow

For a v2 workspace:

1. Synchronize local `main` with `origin/main` outside the agent session.
2. Run migration route M in `PLAN` mode.
3. Review blockers and the exact write/rollback manifest.
4. Run route M in `APPLY` mode with the exact main SHA and authorization.
5. Review and commit the migration changes directly on `main`; the prompt itself never commits or pushes.
6. From then on, v2 trees are read-only and all new writes use v3.

For a new brownfield v3 workspace, run route 1 through the protected integration lane to establish the factual catalog/map, then use routes 4 and 2.

## Greenfield workflow

```text
3A PROPOSE
  → optional 3B REFINE revisions
  → 3C MATERIALIZE immutable project/F00 sources
  → integration + RECONCILE_MAIN creates bootstrap projections
  → execute F00 with unique run receipts
  → integration + RECONCILE_MAIN establishes factual map
  → route 2 for F01+
```

Greenfield file locks are local crash/double-run protection only. Cross-clone authority comes from registered claims and the serialized integration lane.

## Workspaces

The kit is meant to be installed once over a **workspace**: the root holding every internal project that makes up one solution, plus the single planning tree that spans them. Installing it per project is possible, but it gives up most of what the kit is for.

```text
<workspace>/
├── .agentic_planning/          # one planning tree for the whole solution
├── agentic-planning-kit/       # one vendored control plane
├── WORKSPACE_MAP.md            # generated; spans every project
├── CLAUDE.md / AGENTS.md       # managed pointer blocks
├── database/                   # separate projects of one solution;
├── api/                        # each may or may not be its own
├── backend/                    # Git repository
└── frontend/
```

Each of those directories is a separate project with its own lifecycle, build and deployment. Whether they are directories inside one Git repository or independent repositories is a topology decision covered below — either way they form one workspace.

Separate projects are independently deployable, but they are not independent in behavior. That gap is exactly what a workspace closes:

- **A feature is frequently one capability spread across several projects.** A single change lands as a database migration, an API endpoint, backend logic and a frontend view. Planned project by project it becomes several disconnected plans with no shared contract, no declared ordering and no single definition of done. Planned at workspace level it is one feature with one binding contract, explicit inter-project dependencies and one acceptance.
- **Claims only detect the collisions the planner can see.** Two features touching the same API contract from different projects collide only if both are registered in the same planning tree. Split the tree and the conflict is discovered at merge time, or in production.
- **Regression scope is a workspace fact, not a project fact.** A change inside the API can break the frontend's suite. Only a map covering every project can tell an executor which gates actually apply to a given change.
- **Ordering is cross-project.** The migration must land before the code that depends on it. That sequencing can only be declared where both sides are registered.
- **Analyses and evidence stay reusable.** Route 4 evidence gathered once about how the projects interact serves every later feature, instead of being rediscovered per repository.

### Workspace topologies

| Topology | Layout | Consequence |
|---|---|---|
| Single repository | One Git repository at the workspace root; projects are directories inside it | Strongest guarantees. One `main`, one merge queue, and a cross-project change is one atomic commit that CI validates as a unit |
| Multi-repository | Workspace root containing independent Git repositories | One configured coordinator repository owns `.agentic_planning/` and global projections. Manifests pin the planning base of every touched repository and receipts bind every validated integration commit |

Prefer the single-repository topology when the projects genuinely ship together: Git already gives cross-project atomicity there, at no cost. The multi-repository topology buys that atomicity back with process, and only partially — completion is projected only after every repository is integrated, and a partial integration is `PARTIALLY_MERGED`/`BLOCKED`, never `COMPLETED`.

The kit never pretends Git provides an atomic transaction across repositories.

Installation placement for each topology is covered in [`INSTALL.md`](./INSTALL.md).

## Migration and compatibility

- Migration runs only on a clean, exactly synchronized `main` and never creates or changes branches/worktrees.
- Legacy feature, analysis and project trees remain byte-identical.
- Deterministic import sidecars give legacy entities stable IDs and provenance.
- Legacy ambiguous state becomes `UNKNOWN_LEGACY` and serializes affected work.
- V3 readers include legacy; v3 writers never emit legacy paths or mutate legacy rows.
- After cutover, a v2 writer stops with `LEGACY_WRITER_DISABLED`.
- Rollback is allowed only before native v3 activity and only for migration-owned paths whose hashes still match the receipt.

## Files in this kit

```text
agentic-planning-kit/
├── README.md
├── INSTALL.md
├── CONTRACT_V3.md
├── GIT_POLICY.md
├── PROMPT_MIGRATE_V2_TO_V3.md
├── PROMPT_INIT.md
├── PROMPT_CREATE_FEATURE.md
├── PROMPT_INIT_NEW_PROJECT.md
├── PROMPT_ANALYZE_BEFORE_DEVELOP.md
├── PROMPT_RECONCILE_MAIN.md
├── TRIGGERS.md
├── schemas/
├── tools/agentic_planning_v3.py
├── tools/install_kit.ps1
├── tools/install_kit.sh
├── tests/
└── templates/
```

This repository contains the kit only. Consumer migrations and product changes occur only when an operator installs the kit into a target workspace — see [`INSTALL.md`](./INSTALL.md) — and invokes the corresponding prompt.
