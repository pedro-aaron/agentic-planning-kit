# Triggers — Agentic Planning Kit v3

Copy one block into a fresh agent session started at the target workspace root. Replace every placeholder. Each referenced prompt is the complete task specification; the trigger supplies only invocation data.

## Git preamble for normal v3 work

Routes 1–4 run on a contributor/integration branch according to the repository policy. Before launching them, refresh and integrate `origin/main`, then provide the actual SHA. Never let an ordinary route write protected global projections.

Route 5 is the protected integration writer. Route M is the one-time exception: v2 migration runs directly on an already synchronized `main` and never creates or changes branches/worktrees.

---

## M · MIGRATE V2 → V3 — main only

Run PLAN first. It is read-only.

```text
Read agentic-planning-kit/PROMPT_MIGRATE_V2_TO_V3.md and execute it as your complete task spec.

MODE: PLAN
TARGET_PATH: .
EXPECTED_MAIN_SHA: <<exact local main SHA after synchronizing with origin/main>>
EXPECTED_UPSTREAM: origin/main
MIGRATION_ID:
RECEIPT_PATH:
MIGRATION_AUTHORIZATION:
```

After reviewing the plan, run APPLY with the proposed ID and exact authorization. The prompt redoes the full dry-run before writing.

```text
Read agentic-planning-kit/PROMPT_MIGRATE_V2_TO_V3.md and execute it as your complete task spec.

MODE: APPLY
TARGET_PATH: .
EXPECTED_MAIN_SHA: <<same exact synchronized main SHA>>
EXPECTED_UPSTREAM: origin/main
MIGRATION_ID: <<mig_UUID returned by PLAN>>
RECEIPT_PATH:
MIGRATION_AUTHORIZATION: APPLY V3 MIGRATION ON MAIN AT <<EXPECTED_MAIN_SHA>> ID <<MIGRATION_ID>>
```

Rollback is permitted only before native v3 activity and requires the completed receipt:

```text
Read agentic-planning-kit/PROMPT_MIGRATE_V2_TO_V3.md and execute it as your complete task spec.

MODE: ROLLBACK
TARGET_PATH: .
EXPECTED_MAIN_SHA: <<exact synchronized main SHA containing only the migration>>
EXPECTED_UPSTREAM: origin/main
MIGRATION_ID: <<exact migration ID>>
RECEIPT_PATH: <<exact .agentic_planning/migrations/.../COMMIT.json>>
MIGRATION_AUTHORIZATION: ROLLBACK V3 MIGRATION ON MAIN AT <<EXPECTED_MAIN_SHA>> RECEIPT <<RECEIPT_PATH>>
```

The migration never runs `checkout`, `switch`, `branch`, `worktree`, `pull`, `merge`, `rebase`, `commit` or `push`.

---

## 1 · INIT / DISCOVER — factual map inputs

Use `OBSERVE` from an ordinary branch to produce a scoped observation/map-delta inside an already identified entity. Protected catalog/map writes require route 5.

```text
Read agentic-planning-kit/PROMPT_INIT.md and execute it as your complete task spec.

MODE: OBSERVE
TARGET_PATH: .
ENTITY_ID: <<ftr_/ana_/prj_ entity that owns this observation, or empty for read-only report>>
REVISION_ID: <<owning revision, when applicable>>
BASE_MAIN_SHA: <<origin/main SHA incorporated into this branch>>
EXPECTED_MAP_INPUTS: <<section IDs + hashes, or empty for initial discovery>>
DISCOVERY_SCOPE: <<whole workspace or exact touched subprojects>>
```

Initial brownfield installation is performed by route 5 with INIT discovery as its factual input, not by letting a contributor overwrite `WORKSPACE_MAP.md`.

---

## 2 · CREATE FEATURE — identity, plan, claims and registration sources

```text
Read agentic-planning-kit/PROMPT_CREATE_FEATURE.md and execute it as your complete task spec.

TARGET_PATH: .
FEATURE_ID: AUTO
BASE_MAIN_SHA: <<origin/main SHA incorporated into this branch>>
SOURCE_ANALYSIS_IDS: <<ana_ IDs or none>>
FEATURE_INTENT:
<<describe the outcome, users, constraints and explicit non-scope>>
```

The route writes one `.agentic_planning/features/ftr_<uuid>--<slug>/` tree. It does not edit the map, index, catalog, root mirrors or managed agent blocks. Register the plan/claims through integration before executing its product steps.

Each generated step launcher supplies the exact `FEATURE_ID`, plan revision, step ID, `RUN_ID`, a fresh `ATTEMPT_ID`, expected execution base and declared scopes/resources. The eventual integration commit is bound later by `RECONCILE_MAIN`; it is never predicted by the step.

---

## 3 · INIT NEW PROJECT — greenfield sources

### 3A · PROPOSE

```text
Read agentic-planning-kit/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

MODE: PROPOSE
TARGET_PATH: .
PROJECT_ID: AUTO
BASE_MAIN_SHA: <<origin/main SHA incorporated into this branch>>
PARENT_REVISION_ID:
PARENT_REVISION_SHA256:
PROJECT_INTENT:
<<users, outcomes, constraints and decisions already made>>
HUMAN_FEEDBACK:
MATERIALIZE_AUTHORIZATION:
```

### 3B · REFINE

```text
Read agentic-planning-kit/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

MODE: REFINE
TARGET_PATH: .
PROJECT_ID: <<exact prj_ ID>>
BASE_MAIN_SHA: <<current incorporated origin/main SHA>>
PARENT_REVISION_ID: <<exact accepted rev_ ID>>
PARENT_REVISION_SHA256: <<exact parent hash>>
PROJECT_INTENT:
HUMAN_FEEDBACK:
<<accept, reject, change or defer explicit decisions>>
MATERIALIZE_AUTHORIZATION:
```

### 3C · MATERIALIZE

```text
Read agentic-planning-kit/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

MODE: MATERIALIZE
TARGET_PATH: .
PROJECT_ID: <<exact prj_ ID>>
BASE_MAIN_SHA: <<current incorporated origin/main SHA>>
PARENT_REVISION_ID: <<exact READY rev_ ID>>
PARENT_REVISION_SHA256: <<exact READY revision hash>>
PROJECT_INTENT:
HUMAN_FEEDBACK:
MATERIALIZE_AUTHORIZATION: MATERIALIZE V3 PROJECT <<PROJECT_ID>> REVISION <<PARENT_REVISION_ID>> AT MAIN BASE <<BASE_MAIN_SHA>>
```

MATERIALIZE creates immutable project/F00 sources. Route 5 produces root blueprint/bootstrap projections after integration; F00 never writes them directly.

---

## 4 · ANALYZE BEFORE DEVELOP — evidence-backed analysis source

```text
Read agentic-planning-kit/PROMPT_ANALYZE_BEFORE_DEVELOP.md and execute it as your complete task spec.

TARGET_PATH: .
ANALYSIS_ID: AUTO
BASE_MAIN_SHA: <<origin/main SHA incorporated into this branch>>
ANALYSIS_REQUEST:
<<current behavior, proposed capability or decision to investigate>>
```

The route writes only one globally identified analysis tree. The global index and “Derivó en” links are projections created by route 5.

---

## 5 · RECONCILE MAIN — protected integration writer

Preferred mode: run on the serialized merge candidate built from the latest `main`, so sources and projections integrate together.

```text
Read agentic-planning-kit/PROMPT_RECONCILE_MAIN.md and execute it as your complete task spec.

MODE: CHECK | WRITE
TARGET_PATH: .
RUN_CONTEXT: MERGE_CANDIDATE
RECONCILIATION_ID: <<exact rec_UUID; use the same reviewed ID for WRITE>>
EXPECTED_UPSTREAM: origin/main
EXPECTED_MAIN_SHA: <<exact target main SHA used to build candidate>>
EXPECTED_CANDIDATE_SHA: <<exact candidate HEAD SHA>>
EXPECTED_CONTRACT_SHA256: <<exact contract hash, or ABSENT only for authorized initial activation>>
WRITER_AUTHORITY: <<configured automation/integrator identity>>
CANDIDATE_PROVENANCE: <<merge-queue/integration receipt>>
PENDING_GUARD:
RECOVERY_JOURNAL_PATH:
RECONCILIATION_AUTHORIZATION: <<empty for CHECK; for WRITE use: RECONCILE V3 GLOBALS CONTEXT MERGE_CANDIDATE MAIN <EXPECTED_MAIN_SHA> CANDIDATE <EXPECTED_CANDIDATE_SHA> ID <RECONCILIATION_ID>>
```

Post-merge fallback, only when candidate-time writes are unavailable:

```text
Read agentic-planning-kit/PROMPT_RECONCILE_MAIN.md and execute it as your complete task spec.

MODE: WRITE
TARGET_PATH: .
RUN_CONTEXT: MAIN_POST_MERGE
RECONCILIATION_ID: <<exact rec_UUID reviewed in CHECK>>
EXPECTED_UPSTREAM: origin/main
EXPECTED_MAIN_SHA: <<exact current synchronized main SHA>>
EXPECTED_CANDIDATE_SHA: <<same SHA>>
EXPECTED_CONTRACT_SHA256: <<exact contract hash>>
WRITER_AUTHORITY: <<configured automation/integrator identity>>
CANDIDATE_PROVENANCE: NONE
PENDING_GUARD: <<active required-check/status identifier for this SHA>>
RECOVERY_JOURNAL_PATH:
RECONCILIATION_AUTHORIZATION: RECONCILE V3 GLOBALS CONTEXT MAIN_POST_MERGE MAIN <EXPECTED_MAIN_SHA> CANDIDATE <EXPECTED_CANDIDATE_SHA> ID <RECONCILIATION_ID>
```

`MAIN_POST_MERGE` requires a repository-wide `RECONCILIATION_PENDING` guard and blocks later dependent integration until its receipt commits.

For crash recovery, rerun the same block with `MODE: RECOVER`, the same IDs/SHAs/authorization and the exact local `RECOVERY_JOURNAL_PATH`; recovery may only finish or restore that transaction.

---

## Local/CI validation

The CLI is read-only unless `render --write` is explicitly used by the protected integration task:

```text
python agentic-planning-kit/tools/agentic_planning_v3.py validate --root .
python agentic-planning-kit/tools/agentic_planning_v3.py claims --root .
python agentic-planning-kit/tools/agentic_planning_v3.py render --root . --check
python agentic-planning-kit/tools/agentic_planning_v3.py protected --root . --base origin/main
```

The protected integration lane uses the last command with `--integration` only after route 5 has staged exact global outputs. Use the exact final CLI syntax documented by `--help`; repository-host required checks remain authoritative.
