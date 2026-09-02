# Triggers — Agentic Planning Kit v3

Copy one block into an agent session started at the target workspace root, replace the parts in `<< >>`, and send it. Each referenced prompt is the complete task specification; the trigger supplies only what the agent cannot work out for itself.

## What you supply and what the agent derives

These blocks ask for **what only you know**: what you want built, which thing you mean, what you decided. They do not ask for commit identifiers, content hashes or entity identifiers (IDs).

Every prompt resolves those itself, from the repository and the planning tree, and stops to ask only when a value is genuinely ambiguous. If a prompt ever asks you to look up a hash by hand, that is a defect in the prompt, not a step you should perform.

Where a block asks for a **name**, use the readable slug or a plain description — "login", "the checkout analysis", "the billing project". The agent resolves it to the underlying `ftr_`/`ana_`/`prj_` identity and tells you which one it picked before writing anything.

Routes 5 and M are different on purpose: they are operator surfaces that write protected state, so they take exact values and exact authorization phrases. See the notes on each.

Unfamiliar with a term used below — projection, claim, reconciliation, F00? See the [glossary](./README.md#glossary).

## Sessions, and the names between them

One session per route is enough — you do not need a fresh one per block. A route that has several phases is a conversation: run `PROPOSE`, read what came back, then send `REFINE` in the same session, as many times as you like. Start a fresh session when you begin a different route, or when you come back to a route later.

That matters because the later blocks of a route refer to work the earlier ones created. In a continuing session you never retype a name: `REFINE` and `MATERIALIZE` act on the project that session just produced. A name appears in a block only when the session cannot know which thing you mean — route 1's `ENTITY`, which points at work some earlier route created, or a route 3 phase you are resuming days later.

Every route that creates something names it back to you on completion, in the first line of its report. Note it down if you expect to come back.

**If you no longer have it** — new session, new machine, next week, a colleague's work — you do not need to remember anything. The names are the directory names in the planning tree:

```bash
ls .agentic_planning/projects .agentic_planning/features .agentic_planning/analyses
```

Each entry reads `prj_<uuid>--<slug>`, `ftr_<uuid>--<slug>` or `ana_<uuid>--<slug>`. The slug is the name; use it. Or simply ask the agent in the session — "which projects exist here?" — since it reads the same tree. You never need to type the UUID.

## Before you start

Routes 1–4 run on a contributor branch. Refresh and integrate `origin/main` first, the way you would before any other work — the prompts read the resulting state themselves.

Route 5 is the protected integration writer. Route M is a one-time exception: v2 migration runs directly on an already synchronized `main` and never creates or changes branches or worktrees.

---

## 1 · INIT / DISCOVER — record what the workspace actually contains

Use this to inspect the workspace and record findings against an entity you already created. Without an entity it still runs, read-only, and prints what it found.

```text
Read agentic-planning-kit/PROMPT_INIT.md and execute it as your complete task spec.

MODE: OBSERVE
TARGET_PATH: .
ENTITY: <<name of the feature, analysis or project this observation belongs to; leave empty for a read-only report>>
DISCOVERY_SCOPE: <<the whole workspace, or name the subprojects you touched>>
```

The agent resolves `ENTITY` to its exact entity and revision, reads the current catalog state it needs to compare against, and confirms both back to you. If the name matches more than one entity, it lists the candidates and stops.

Initial brownfield installation is performed by route 5 using this discovery as its factual input, not by letting a contributor overwrite `WORKSPACE_MAP.md`.

---

## 2 · CREATE FEATURE — plan a feature

```text
Read agentic-planning-kit/PROMPT_CREATE_FEATURE.md and execute it as your complete task spec.

TARGET_PATH: .
Feature to build:
<<what a user should be able to do once this exists, who it is for, any constraint that matters, and what is explicitly out of scope>>
```

Write it in plain language. The agent asks up to three clarifying questions if different readings would change the plan, then states its assumptions and proceeds.

If the feature came out of an earlier analysis, say so in the text — "based on the checkout analysis" — and the agent links it.

The route writes one `.agentic_planning/features/ftr_<uuid>--<slug>/` tree. It does not edit the map, index, catalog, root mirrors or managed agent blocks. Register the plan and its claims through integration before executing its product steps.

Each generated step launcher supplies its own exact identifiers when the step runs. The eventual integration commit is bound later by `RECONCILE_MAIN`; a step never predicts it.

---

## 3 · INIT NEW PROJECT — start a project from nothing

Three phases: propose a blueprint, refine it until you are happy, then authorize materialization. Run all three in the same session — each one builds on what the previous returned, so the name you need is already on screen.

### 3A · PROPOSE

```text
Read agentic-planning-kit/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

MODE: PROPOSE
TARGET_PATH: .
PROJECT_INTENT:
<<what you want to build, who will use it, what it must and must not do, and any decision you have already made — stack, hosting, deadlines, things that are off the table>>
```

Describe the project the way you would to a new colleague. There is nothing to look up: this is the first revision, so there is no parent to point at, and the agent records the repository state itself.

The agent produces an immutable blueprint revision and opens its report by naming the project it created, alongside what it assumed and up to three questions worth answering. Note that name down if you plan to come back later; within this session you will not need to type it again.

### 3B · REFINE

Repeat as often as you need. Each round produces a new immutable revision.

```text
Read agentic-planning-kit/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

MODE: REFINE
TARGET_PATH: .
HUMAN_FEEDBACK:
<<what you accept, reject, want changed, or want deferred — be explicit about decisions>>
```

You do not repeat the project name: the session already knows which project it just created. To build on an earlier revision instead, say which in the feedback. Only if you are returning in a new session, or the workspace holds more than one project, add a `PROJECT: <<name>>` line.

### 3C · MATERIALIZE

Materialization is irreversible: it creates immutable project sources and the F00 scaffold plan. It therefore takes two calls.

First, ask for it. The agent runs the readiness check, shows you exactly what will be created, and prints the authorization phrase already filled in with the values it verified.

```text
Read agentic-planning-kit/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

MODE: MATERIALIZE
TARGET_PATH: .
MATERIALIZE_AUTHORIZATION:
```

Then read the summary. If you agree, send the same block again with the printed phrase pasted into `MATERIALIZE_AUTHORIZATION:`, unchanged. Anything else — a bare "yes", a reworded phrase, a phrase from an earlier run — is refused.

No project name here either: in a continuing session the agent knows which project it just refined, and the authorization phrase names the project explicitly anyway. From a new session, add a `PROJECT: <<name>>` line to the first call.

Route 5 produces the root blueprint and bootstrap projections after integration; F00 never writes them directly.

---

## 4 · ANALYZE BEFORE DEVELOP — investigate before committing to a plan

```text
Read agentic-planning-kit/PROMPT_ANALYZE_BEFORE_DEVELOP.md and execute it as your complete task spec.

TARGET_PATH: .
Analysis request:
<<the behavior you want explained, the capability you are considering, or the decision you need evidence for>>
```

The agent records which repositories and commits it analyzed as part of the report, so the conclusions stay traceable to the state they were drawn from.

The route writes one analysis tree. The global index and its "Derivó en" links are projections created by route 5.

---

## 5 · RECONCILE MAIN — protected integration writer

This is an operator and automation surface, not a daily one. The exact commit identifiers, hashes and authorization phrase below are what make the protected write safe, and they are meant to be supplied by the integration automation that builds the candidate. If a person is typing them by hand, automate the lane instead.

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

For crash recovery, rerun the same block with `MODE: RECOVER`, the same IDs, SHAs and authorization, and the exact local `RECOVERY_JOURNAL_PATH`; recovery may only finish or restore that transaction.

---

## M · MIGRATE V2 → V3 — main only

A one-time operation that rewrites planning state directly on `main`. It takes exact values because a migration aimed at the wrong commit is not recoverable by rerunning it.

Synchronize `main` with `origin/main` first, then read the commit you are migrating:

```bash
git rev-parse origin/main
```

Use that value for `EXPECTED_MAIN_SHA` in every block below. Run PLAN first — it is read-only.

```text
Read agentic-planning-kit/PROMPT_MIGRATE_V2_TO_V3.md and execute it as your complete task spec.

MODE: PLAN
TARGET_PATH: .
EXPECTED_MAIN_SHA: <<output of git rev-parse origin/main>>
EXPECTED_UPSTREAM: origin/main
MIGRATION_ID:
RECEIPT_PATH:
MIGRATION_AUTHORIZATION:
```

After reviewing the plan, run APPLY with the proposed ID and exact authorization. The prompt redoes the full dry run before writing.

```text
Read agentic-planning-kit/PROMPT_MIGRATE_V2_TO_V3.md and execute it as your complete task spec.

MODE: APPLY
TARGET_PATH: .
EXPECTED_MAIN_SHA: <<same SHA as in PLAN>>
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
EXPECTED_MAIN_SHA: <<synchronized main SHA containing only the migration>>
EXPECTED_UPSTREAM: origin/main
MIGRATION_ID: <<exact migration ID>>
RECEIPT_PATH: <<exact .agentic_planning/migrations/.../COMMIT.json>>
MIGRATION_AUTHORIZATION: ROLLBACK V3 MIGRATION ON MAIN AT <<EXPECTED_MAIN_SHA>> RECEIPT <<RECEIPT_PATH>>
```

The migration never runs `checkout`, `switch`, `branch`, `worktree`, `pull`, `merge`, `rebase`, `commit` or `push`.

---

## Local and continuous integration (CI) validation

The command-line interface (CLI) is read-only unless `render --write` is explicitly used by the protected integration task:

```text
python agentic-planning-kit/tools/agentic_planning_v3.py validate --root .
python agentic-planning-kit/tools/agentic_planning_v3.py claims --root .
python agentic-planning-kit/tools/agentic_planning_v3.py render --root . --check
python agentic-planning-kit/tools/agentic_planning_v3.py protected --root . --base origin/main
```

The protected integration lane uses the last command with `--integration` only after route 5 has staged exact global outputs. Use the exact final CLI syntax documented by `--help`; repository-host required checks remain authoritative.
