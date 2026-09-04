# Agentic Planning Kit 3.2

A portable, stack-agnostic kit for planning features as a **small graph of self-contained
single-session agent steps**, launched from individual copy-paste triggers — steps without a
dependency edge between them run in parallel. Drop it into any workspace and it adapts through a
generated workspace map.

**Two properties define 3.2.**

> **It knows nothing about Git.** No repository, remote, branch, commit, merge, protected path,
> CODEOWNERS, CI or installer. Version control is yours; the kit is a planning method.
>
> **It knows about users.** Every planning artifact lives under `.agentic_planning/<username>/`,
> so ordinary planning stays isolated on `main`; each feature then closes through one explicit,
> exclusive reconciliation of the shared map, pointers and global user index.

The concurrency model is one page: [`SESSIONS.md`](./SESSIONS.md). The copy-paste launchers are in
[`TRIGGERS.md`](./TRIGGERS.md).

## Install

Copy this folder into your workspace. That is the whole installation.

## Routes

| Route | Prompt | Produces | When |
|---|---|---|---|
| **0** | — (trigger only) | `.agentic_planning/<username>/SESSION.md` + refreshed global user index | once, after you clone |
| **1** | [`PROMPT_INIT.md`](./PROMPT_INIT.md) | a **factual** `WORKSPACE_MAP.md`: per-subproject stack/libs, commands, rules, contracts, seams, recipes, quality gates and close/index pointers | existing code; once, and after broad structural change |
| **2** | [`PROMPT_CREATE_FEATURE.md`](./PROMPT_CREATE_FEATURE.md) | `<username>/_feature_<slug>/` — feature doc with binding contract, Mermaid execution graph and manual QA checklist; 2–6 step files with explicit dependencies, a suggested model effort each and, for code steps, **binding test cases + the gates they must pass**; one trigger per step | once per feature, after a factual map |
| **3** | [`PROMPT_INIT_NEW_PROJECT.md`](./PROMPT_INIT_NEW_PROJECT.md) | `<username>/_project_<slug>/` — one blueprint, one decision table, and the F00 scaffold plan (F00 creates the subproject's first quality gates) | empty/planning-only target; propose → refine → materialize |
| **4** | [`PROMPT_ANALYZE_BEFORE_DEVELOP.md`](./PROMPT_ANALYZE_BEFORE_DEVELOP.md) | `<username>/_analysis_<slug>/ANALYSIS_<SLUG>.md` — an evidence-backed report on current behavior or a proposed capability | before feature planning, when a decision needs analysis |
| **5** | [`PROMPT_INIT.md`](./PROMPT_INIT.md) `RECONCILE_FEATURE` | affected map facts + managed pointers + global `.agentic_planning/README.md` index + caller's completion status | automatically in every feature's final step, after gates |

Every route opens with `USER: <username>`. It chooses the owner session; routes 0/5 enumerate
direct-child session paths for the global index, while route 5 writes status only to its invoker.

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
       → final step automatically runs 5 RECONCILE FEATURE → map/pointers/global index refreshed
       → you perform the manual QA checklist (FEATURE doc §7)

EMPTY / PLANNING-ONLY TARGET
   3A PROPOSE → 3B REFINE (0..N) → 3C MATERIALIZE → execute F00 (creates the first gates)
       → terminal F00 session runs 1 INIT then 5 RECONCILE FEATURE → route 2 for F01+
```

1. **Open your session** with route 0. It creates or preserves your session and refreshes the global navigation index.
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
5. **Execute and close.** Open each step trigger in a fresh agent session, **in dependency order — steps with
   no edge between them may run simultaneously** (the plan guarantees disjoint write scopes and
   disjoint exclusive resources, gate commands included; you are the scheduler). Every step grounds
   in the map, writes only its declared scope and leaves a handoff report `outputs/NN_<slug>.md`
   (≤40 lines); code-writing steps also implement binding cases, pass their gates and record every
   command + exit code. The terminal report reserves `## Cierre` plus three result lines; the final
   join runs route 5 in that same session, replaces that block and cannot succeed until map/pointers/index/status reconcile.
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
- **Planning is isolated; close is explicit.** Plans stay in their owner's directory. Routes 1/3C
  establish the map and pointers; the terminal route-5 close reconciles affected facts, managed
  pointers and the generated user index. The human serializes global routes 0/5 in one checkout;
  external overlap remains an ordinary Git conflict followed by a rerun, never locks or a merge queue.
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
- **The map and index stay fresh** — every feature closes through route 5. It inspects/reconciles the
  affected map facts and pointers (factual map sections change only when needed) and always rebuilds
  `.agentic_planning/README.md` as links to direct-child user sessions; those sessions remain canonical.
- **QA belongs to the human.** Every plan ships a concrete, Spanish-language manual QA checklist
  (action → expected result) focused on acceptance: UX, device flows, visuals.

## Design rules

These are binding on the kit itself. A change that fails one is rejected regardless of its merit —
they exist because the previous major version failed all eight and stopped producing usable plans.

| | Rule |
|---|---|
| **R1** | **Git does concurrency.** The kit never implements merge, locking, protection, ordering or conflict detection. |
| **R2** | **Every artifact is read by a human first.** No file exists only to be consumed by a tool. |
| **R3** | **One fact, one place, one file.** A revision edits the document; the global README is a generated navigation projection, never a second source of facts. |
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
runners — and: entity UUIDs, event sourcing, compare-and-swap chains, catalogs beyond the single
generated navigation index, protected paths, integration owners, merge queues, run/attempt receipts,
JSON schemas, a validation CLI, CI templates and an installer.

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
├── TRIGGERS.md                      ← copy-paste launchers for routes 0–5
├── PROMPT_INIT.md                   ← route 1 map discovery + route 5 reconciliation
├── PROMPT_CREATE_FEATURE.md         ← route 2: a lean, parallel-friendly feature plan
├── PROMPT_INIT_NEW_PROJECT.md       ← route 3: propose / refine / materialize an empty project
├── PROMPT_ANALYZE_BEFORE_DEVELOP.md ← route 4: analyze behavior or a proposed capability
└── LICENSE
```
