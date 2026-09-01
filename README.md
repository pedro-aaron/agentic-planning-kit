# Agentic Planning Kit 2

A portable, stack-agnostic kit for planning features as a **small graph of self-contained single-session agent steps**, launched from individual copy-paste triggers — steps without a dependency edge between them run in parallel. Drop it into any workspace and it adapts through a generated workspace map.

**What v2 adds: deterministic quality gates.** Correctness is verified by tools with exit codes — every step that writes product code ships tests for **binding test cases fixed at planning time** and must **pass the subproject's declared quality gates** before it may write its handoff report. Acceptance QA stays exactly where v1 put it: a manual, human-run checklist in Spanish. In one line: **correctness belongs to machines; acceptance belongs to the user.**

Four project-agnostic prompts + their triggers:

| Prompt | Trigger | Produces | Run |
|--------|---------|----------|-----|
| [`PROMPT_INIT.md`](./PROMPT_INIT.md) | TRIGGERS §1 | A **factual** `WORKSPACE_MAP.md` at planning-map contract 3 (per subproject: stack/libs, commands, hard rules, contracts, data-store access modes, seams, conventions, recipes **and quality gates** — the deterministic test/lint/check commands with exit-code semantics, `MISSING` when absent) plus managed pointers in CLAUDE.md / AGENTS.md / Cursor rules | existing project; once and after structural changes |
| [`PROMPT_CREATE_FEATURE.md`](./PROMPT_CREATE_FEATURE.md) | TRIGGERS §2 | `.agentic_planning/_feature_<slug>/` — a lean plan: feature doc with binding contract + Mermaid execution graph + manual QA checklist, 2–6 step files with explicit dependencies, a suggested model effort each and — for code steps — **binding test cases + the gates they must pass**, one trigger per step | once per feature, after a factual map |
| [`PROMPT_INIT_NEW_PROJECT.md`](./PROMPT_INIT_NEW_PROJECT.md) | TRIGGERS §3A/3B/3C | A revisioned project blueprint, a bootstrap map and the F00 scaffold plan (F00 creates the subproject's first quality gates) | empty/planning-only project; propose, refine, materialize |
| [`PROMPT_ANALYZE_BEFORE_DEVELOP.md`](./PROMPT_ANALYZE_BEFORE_DEVELOP.md) | TRIGGERS §4 | `.agentic_planning/_analysis_<slug>/ANALYSIS_<SLUG>.md` — an evidence-backed report on current behavior or a proposed capability, including implications, current primary-source research and maintained-project assessment | after INIT; before feature planning when a decision needs analysis, or whenever an implemented capability needs explanation |

The launcher blocks to copy-paste live in [`TRIGGERS.md`](./TRIGGERS.md).

## What v2 changes vs. `agentic-planning-kit/` (v1)

| Concern | v1 | v2 |
|---------|----|----|
| Verification during a step | Optional sanity build/test command | **Mandatory gates** for code-writing steps: run the subproject's declared gate commands and record each command + exit code in the handoff report |
| Tests | At the executor's discretion | **A deliverable**: the planner derives binding test cases from the feature contract (§3) into each code step's Spec; the executor implements them — it may add cases, never remove them |
| Test integrity | Implicit | **The gauntlet never weakens**: no deleting, skipping, `xfail`-ing or loosening existing tests unless the contract explicitly changed; every test file touched is listed in the report for a seconds-long human diff audit |
| Map | Planning-map contract 2 | Contract 3 — adds factual **Quality gates** tables per subproject (a gate that doesn't exist is `MISSING`; plans degrade loudly or bootstrap tooling explicitly, never silently) |
| Parallelism | Disjoint write scopes + exclusive resources | Same, **plus gate commands count as resources** — a gate classified `exclusive` forces staggered gate runs or serialization |
| Acceptance QA | Manual, human, Spanish checklist | **Unchanged** — now focused on what gates cannot prove: UX, device flows, visual acceptance |

Deliberately still absent (v1's pruning stands): evaluator sessions, rubrics, remediation loops, DAG json, orchestrators, coverage thresholds (coverage is *recorded* when a gate already emits it, never enforced), mutation testing, BDD runners.

## Workflow

```text
EXISTING PROJECT
  1 INIT → factual WORKSPACE_MAP.md (incl. quality gates)
       → 4 ANALYZE BEFORE DEVELOP → decision-ready report → optionally 2 CREATE FEATURE
       → 2 CREATE FEATURE → step plan with execution graph + binding test cases + gates
       → run each step trigger in dependency order (parallel branches simultaneously);
         code steps pass their gates before finishing
       → user performs the manual QA checklist (FEATURE doc §7)

EMPTY / PLANNING-ONLY PROJECT
  3A PROPOSE → 3B REFINE (0..N) → 3C MATERIALIZE → execute F00 (creates the first gates) → 1 INIT → route 2 for F01+
```

1. **Classify the target.** Existing implementation uses route 1; an empty/planning-only target uses route 3A.
2. **Analyze before developing (route 4, when needed).** For a codebase question or a consequential new capability, route 4 performs read-only local inspection plus bounded current primary-source research and writes one report under `.agentic_planning/_analysis_<slug>/`. It separates current behavior from recommendations, checks the maintenance and fit of technology/GitHub candidates, and never edits product code, creates a feature plan, or registers a feature-index row.
3. **Plan a feature (route 2).** Requires a factual `WORKSPACE_MAP.md` with Quality gates tables for the touched subprojects (contract 3). The planner writes `FEATURE_<SLUG>.md` (motivation, scope, **binding contract**, fixed decisions, invariants, **Mermaid execution graph**, **manual QA checklist in Spanish**), 2–6 step files with explicit dependencies, a one-line **suggested model effort** each and — for every code step — the **binding test cases** derived from the contract plus the **gates** it must pass, an index + graph in the README, and `TRIGGERS.md` with **one launcher per step**, grouped by parallel level.
4. **Execute.** Open each step trigger in a fresh agent session, **in dependency order — steps with no edge between them may run simultaneously** (the plan guarantees disjoint write scopes and disjoint exclusive resources, gate commands included; the human is the scheduler). Each step grounds in the map (subproject, seam `file:symbol`, recipe, blessed lib) and writes only its declared scope. A code step implements its binding test cases, **passes the subproject's gates and records each command + exit code**, and finishes with a short handoff report `outputs/NN_<slug>.md` (≤40 lines) that dependent steps read.
5. **QA is the user's.** After the last step, the user walks the manual QA checklist by hand — acceptance, not correctness: the gates already proved the code against the binding cases. A defect found becomes a new ad-hoc fix request or a new small plan — there is no automated evaluation or remediation loop.

## What the method guarantees

- **1 step = 1 agent session**, finished only when its short handoff report exists — and, for code steps, only when the gates passed.
- **Correctness is machine-checked.** Every code-writing step passes the subproject's declared quality gates (deterministic commands, exit 0/1) before it finishes, and its report records the evidence. No evaluator sessions — the gate is the same command a human would run.
- **The bar is set by the planner, met by the executor.** Binding test cases live in the step Spec, derived from the feature contract in the planning session — the session that writes the code doesn't get to decide what "tested" means.
- **The gauntlet only ratchets up.** Each feature's tests join the suite every future feature must pass; weakening existing tests is an invariant violation, visible in the step report and in a seconds-long `git diff` over test files.
- **Analysis stays analysis.** Route 4 writes one decision-ready report, preserves product files and feature indexes, and treats current external claims as valid only when backed by dated primary sources.
- **Parallel-friendly and cheap.** Dependencies live in a human-readable Mermaid graph and independent steps run concurrently — but with no DAG json, no orchestrator, no concurrency contracts. Model choice is one effort hint per step (tier + Claude Code / Codex / Cursor examples) — no routing matrices, no rubrics, no evaluator/remediation cycles, no evidence trees (`tests/`, `evals/`, `fixes/`). In route 2 execution, the only generated evidence is one ≤40-line report per step.
- **Contracts defined once** (in the FEATURE doc §3) and mirrored, never re-derived.
- **Every step grounds itself** ("Before any code, read …") in the factual workspace map + only the prior reports it truly needs.
- **New code imitates existing code**: each step names the seam (map §8), the recipe + exemplar (map §9) and the blessed library (map §2). No second way to do what already has a way.
- **Hard rules are respected**, not gamified: the map's imperative/read-only rules appear in the feature's invariants and each touched step. Migrations run only against local/dev, never production; read-only/sealed stores get no mutation plan.
- **The map stays fresh** — only when the feature actually changed workspace structure, the last step updates the touched `WORKSPACE_MAP.md` sections in place (quality gates included when the feature added or changed one). No structural change → no map-sync step.
- **A living feature index.** `.agentic_planning/README.md` lists every feature (what it does, impacted subprojects, status), newest first. Planning adds the row (`📝 Diseñada`); each plan's final step flips it to `✅ Ejecutada`; superseding features flip the superseded row. The index never goes stale.
- **QA belongs to the human.** The feature doc ships a concrete, Spanish-language manual QA checklist (action → expected result) focused on acceptance — UX, device flows, visuals. No automated acceptance gate, no `HUMAN_VERIFICATION.md` machinery.

## Workspaces

When the root holds several independent subprojects — each with its own toolchain, compose, DB and git — INIT analyzes **each** subproject and writes one root `WORKSPACE_MAP.md` organized per subproject, quality gates included (a subproject with a strong test suite and one with none get honest, different tables). A feature may span subprojects: route 2 emits one step per touched subproject, in dependency order, and each step grounds only in *its* subproject's section of the map and passes only *its* subproject's gates.

`WORKSPACE_MAP.md` **complements** `CLAUDE.md` / `AGENTS.md` (never replaces them). INIT hydrates those entry points with a small managed pointer block (between `<!-- agentic-routes:begin/end -->` markers) routing any agent to the map.

## Porting to another workspace

Copy the `agentic-planning-kit2/` folder into the target workspace. For existing code run TRIGGER 1, use TRIGGER 4 whenever a question or proposed capability needs analysis, then run TRIGGER 2 per feature. For an empty target start with 3A. Nothing in the prompts is specific to this workspace — implementation facts (gates included) flow through `WORKSPACE_MAP.md`.

## Files

```
agentic-planning-kit2/
├── README.md                  ← you are here
├── PROMPT_INIT.md             ← Prompt 1: discover/reconcile a factual workspace map (incl. quality gates)
├── PROMPT_CREATE_FEATURE.md   ← Prompt 2: generate a lean, parallel-friendly feature plan with binding test cases + gates
├── PROMPT_INIT_NEW_PROJECT.md ← Prompt 3: propose/refine/materialize an empty project
├── PROMPT_ANALYZE_BEFORE_DEVELOP.md
│                               ← Prompt 4: analyze current behavior or a proposed capability
└── TRIGGERS.md                ← the copy-paste launcher blocks for routes 1, 2, 3A/3B/3C and 4
```
