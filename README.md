# Agentic Planning Kit 3.1

A portable, stack-agnostic kit for planning features as a **small graph of self-contained
single-session agent steps**, launched from individual copy-paste triggers — steps without a
dependency edge between them run in parallel. Drop it into any workspace and it adapts through a
generated workspace map.

**Two properties define 3.1.**

> **It knows nothing about Git.** No repository, remote, branch, commit, merge, protected path,
> CODEOWNERS, CI or installer. Version control is yours; the kit is a planning method.
>
> **It knows about users.** Every planning artifact lives under `.agentic_planning/<username>/`,
> so everyone works on `main` and no two people ever write the same file.

The concurrency model is one page: [`SESSIONS.md`](./SESSIONS.md). The copy-paste launchers are in
[`TRIGGERS.md`](./TRIGGERS.md).

## Install

Copy this folder into your workspace. That is the whole installation.

## Routes

| Route | Prompt | Produces | When |
|---|---|---|---|
| **0** | — (trigger only) | `.agentic_planning/<username>/SESSION.md` | once, after you clone |
| **1** | [`PROMPT_INIT.md`](./PROMPT_INIT.md) | a **factual** `WORKSPACE_MAP.md`: per subproject stack/libs, commands, hard rules, contracts, data-store access modes, seams, conventions, recipes **and quality gates** — the deterministic test/lint/check commands with exit-code semantics, `MISSING` when absent | existing code; once, and after structural change |
| **2** | [`PROMPT_CREATE_FEATURE.md`](./PROMPT_CREATE_FEATURE.md) | `<username>/_feature_<slug>/` — feature doc with binding contract, Mermaid execution graph and manual QA checklist; 2–6 step files with explicit dependencies, a suggested model effort each and, for code steps, **binding test cases + the gates they must pass**; one trigger per step | once per feature, after a factual map |
| **3** | [`PROMPT_INIT_NEW_PROJECT.md`](./PROMPT_INIT_NEW_PROJECT.md) | `<username>/_project_<slug>/` — one blueprint, one decision table, and the F00 scaffold plan (F00 creates the subproject's first quality gates) | empty/planning-only target; propose → refine → materialize |
| **4** | [`PROMPT_ANALYZE_BEFORE_DEVELOP.md`](./PROMPT_ANALYZE_BEFORE_DEVELOP.md) | `<username>/_analysis_<slug>/ANALYSIS_<SLUG>.md` — an evidence-backed report on current behavior or a proposed capability | before feature planning, when a decision needs analysis |

Every trigger for routes 1–4 opens with `USER: <username>`. That field decides where the route
writes, and it is the only piece of state the kit carries between sessions.

## Workflow

```text
ANY WORKSPACE
  0 OPEN SESSION → .agentic_planning/<username>/

EXISTING CODE
  1 INIT → factual WORKSPACE_MAP.md (incl. quality gates)
       → 4 ANALYZE → decision-ready report → optionally 2 CREATE FEATURE
       → 2 CREATE FEATURE → step plan with execution graph + binding test cases + gates
       → run each step trigger in dependency order (parallel branches simultaneously);
         code steps pass their gates before finishing
       → you perform the manual QA checklist (FEATURE doc §7)

EMPTY / PLANNING-ONLY TARGET
  3A PROPOSE → 3B REFINE (0..N) → 3C MATERIALIZE → execute F00 (creates the first gates)
       → 1 INIT → route 2 for F01+
```

1. **Open your session** with route 0. It writes one file and takes a second.
2. **Classify the target.** Existing implementation uses route 1; an empty or planning-only target
   uses route 3A.
3. **Analyze before developing (route 4, when needed).** For a codebase question or a consequential
   new capability, route 4 does read-only local inspection plus bounded current primary-source
   research and writes one report. It separates current behavior from recommendations, checks the
   maintenance and fit of technology candidates, and never edits product code or plans a feature.
4. **Plan a feature (route 2).** Requires a factual `WORKSPACE_MAP.md` with Quality gates tables for
   the touched subprojects. The planner writes the feature doc, 2–6 step files with explicit
   dependencies, a one-line suggested model effort each and — for every code step — the binding test
   cases derived from the contract plus the gates it must pass, then a trigger per step.
5. **Execute.** Open each step trigger in a fresh agent session, **in dependency order — steps with
   no edge between them may run simultaneously** (the plan guarantees disjoint write scopes and
   disjoint exclusive resources, gate commands included; you are the scheduler). Each step grounds
   in the map, writes only its declared scope, implements its binding test cases, passes the gates
   and records each command + exit code, and finishes with a handoff report `outputs/NN_<slug>.md`
   (≤40 lines) that dependent steps read.
6. **QA is yours.** After the last step you walk the manual QA checklist by hand — acceptance, not
   correctness: the gates already proved the code against the binding cases. A defect becomes a new
   ad-hoc fix or a new small plan. There is no automated evaluation or remediation loop.

## What the method guarantees

- **1 step = 1 agent session**, finished only when its short handoff report exists — and, for code
  steps, only when the gates passed.
- **Correctness is machine-checked.** Every code-writing step runs the subproject's declared quality
  gates (deterministic commands, exit 0/1) before it finishes, and its report records the evidence.
  No evaluator sessions — the gate is the same command a human would run.
- **The bar is set by the planner, met by the executor.** Binding test cases live in the step spec,
  derived from the feature contract in the planning session — the session that writes the code does
  not get to decide what "tested" means.
- **The gauntlet only ratchets up.** Each feature's tests join the suite every future feature must
  pass; weakening an existing test is an invariant violation, visible in the step report and in a
  seconds-long diff over test files.
- **Planning cannot collide.** Every route writes under one user's directory. The only shared
  planning file is `WORKSPACE_MAP.md`, which describes the repo rather than anyone's plan.
- **Parallel-friendly and cheap.** Dependencies live in a human-readable Mermaid graph and
  independent steps run concurrently — with no DAG json, no orchestrator, no concurrency contracts.
  Model choice is one effort hint per step.
- **Contracts defined once** (feature doc §3) and mirrored, never re-derived.
- **Every step grounds itself** ("Before any code, read …") in the factual workspace map plus only
  the prior reports it truly needs.
- **New code imitates existing code**: each step names the seam (map §8), the recipe + exemplar
  (map §9) and the blessed library (map §2). No second way to do what already has a way.
- **Hard rules are respected**, not gamified: the map's imperative and read-only rules appear in the
  feature's invariants and each touched step. Migrations run only against local/dev, never
  production; read-only or sealed stores get no mutation plan.
- **The map stays fresh** — only when the feature actually changed workspace structure, the last step
  updates the touched `WORKSPACE_MAP.md` sections in place. No structural change, no map-sync step.
- **QA belongs to the human.** Every plan ships a concrete, Spanish-language manual QA checklist
  (action → expected result) focused on acceptance: UX, device flows, visuals.

## Design rules

These are binding on the kit itself. A change that fails one is rejected regardless of its merit —
they exist because the previous major version failed all eight and stopped producing usable plans.

| | Rule |
|---|---|
| **R1** | **Git does concurrency.** The kit never implements merge, locking, protection, ordering or conflict detection. |
| **R2** | **Every artifact is read by a human first.** No file exists only to be consumed by a tool. |
| **R3** | **One fact, one place, one file.** A revision edits the document; it never copies it. |
| **R4** | **No identifier a human cannot type.** Slugs and usernames. No UUIDs in paths or authorization phrases. |
| **R5** | **No route ends in a state another route must unlock.** Every route's output is usable the moment it finishes. |
| **R6** | **One format: Markdown.** No JSON schemas, no machine artifacts, no CLI to validate, no CI to maintain. |
| **R7** | **The line budget is a contract.** Adding lines requires removing lines. |
| **R8** | **It installs by copying a folder.** No subtree, no CODEOWNERS, no protected branches, no service identities. |

### Line budgets

| Artifact | Cap |
|---|---|
| The whole kit | 8 files · 1 700 lines |
| A route prompt | 300 lines (route 3: 350) |
| `PROJECT_BLUEPRINT.md` | 400 lines · 10 sections |
| `FEATURE_<SLUG>.md` | 200 lines |
| A step file | 60 lines |
| A handoff report | 40 lines |
| Installation | 1 step |

## Deliberately absent

Evaluator sessions, rubrics, remediation loops, DAG json, orchestrators, coverage thresholds
(coverage is *recorded* when a gate already emits it, never enforced), mutation testing, BDD
runners — and, new in 3.1: entity UUIDs, event sourcing, compare-and-swap chains, catalogs,
generated projections, reconciliation, protected paths, integration owners, merge queues,
materialization authorization phrases, run/attempt receipts, JSON schemas, a validation CLI, CI
templates and an installer.

## Porting to another workspace

Copy this folder into the target workspace. For existing code run trigger 1; use trigger 4 whenever
a question or proposed capability needs analysis; then run trigger 2 per feature. For an empty
target start with 3A. Nothing in the prompts is specific to any workspace — implementation facts,
gates included, flow through `WORKSPACE_MAP.md`.

## Files

```text
agentic-planning-kit/
├── README.md                        ← you are here
├── SESSIONS.md                      ← the concurrency model, in one page
├── TRIGGERS.md                      ← copy-paste launchers for routes 0, 1, 2, 3A/3B/3C and 4
├── PROMPT_INIT.md                   ← route 1: discover a factual workspace map incl. quality gates
├── PROMPT_CREATE_FEATURE.md         ← route 2: a lean, parallel-friendly feature plan
├── PROMPT_INIT_NEW_PROJECT.md       ← route 3: propose / refine / materialize an empty project
├── PROMPT_ANALYZE_BEFORE_DEVELOP.md ← route 4: analyze behavior or a proposed capability
└── LICENSE
```
