# Triggers — agentic planning kit 2

Copy-paste **one block** into a fresh code-agent session (Claude Code / Cursor / Codex). Start every session at the **workspace root** of the target workspace.

- Existing project: run **1 INIT**. Use **4 ANALYZE BEFORE DEVELOP** for an evidence-backed codebase question or capability assessment; when ready to plan implementation, run **2 CREATE FEATURE** once per feature.
- Empty/planning-only project: run **3A PROPOSE**, optionally repeat **3B REFINE**, then explicitly run **3C MATERIALIZE**. Execute F00 and its factual handoff before using route 2 for F01+.

---

## 1 · INIT EXISTING PROJECT — discover/reconcile a factual `WORKSPACE_MAP.md`

```text
Read agentic-planning-kit2/PROMPT_INIT.md and execute it as your complete task spec.
Start at the workspace root. This trigger is for a project with real implementation signals. If the target is empty/planning-only, stop without writes and direct me to trigger 3A.
First read any existing CLAUDE.md / AGENTS.md / README.md and reconcile with them. Map EACH subproject and compose. Capture stack/libs, commands/cwd, hard rules, contracts, data-store owner + access mode (`read-write|append-only|read-only|bootstrap-write/runtime-read-only|UNKNOWN`) + lifecycle boundary + principals/env-key names + allowed/forbidden operations, migration protocol only for writable phases, seams, conventions/principles and recipes. Also capture each subproject's QUALITY GATES: the deterministic test/lint/typecheck commands with exit-code semantics that code-writing feature steps must pass, quoted verbatim with cwd and parallel classification; a gate that does not exist is MISSING — never invent or aspirationally add one; coverage is observed-only (record the figure only if an existing command emits it, no thresholds); no mutation testing, no BDD runners. Write one WORKSPACE_MAP.md at planning-map contract 3 and map maturity factual only when its required claims are backed by implementation evidence.
For safe multi-agent planning, also map command side effects and every shared mutable resource/single-writer hotspot: manifests/lockfiles, generated/cache/temp dirs, composition roots/registries, compose projects, fixed ports, volumes/networks, databases/services and reports. Record `shared_read|exclusive|UNKNOWN`, isolation keys/namespaces, same-checkout constraints, and any authorized VCS/worktree base-snapshot + handoff/integration mechanism per subproject; UNKNOWN means serialize, never assume safety.
If invoked inside greenfield F00, reconcile the bootstrap claims by stable ID: real evidence may promote PLANNED to EXISTING, drift becomes UNKNOWN, and unresolved planned work stays PLANNED. Use map maturity mixed until every foundation-required claim is factual; INIT alone never opens F01+.
Then hydrate the agent entry points: inject the idempotent managed pointer block (between the agentic-routes markers) into CLAUDE.md and AGENTS.md (create them minimally if absent; in a workspace, each subproject's too), and into Cursor rules ONLY if the workspace already uses Cursor (a .cursor/ dir or .cursorrules) — for Cursor, write a dedicated .cursor/rules/agentic-routes.mdc, don't edit the user's rule files. Keep the block a pointer to the map, never a copy.
Writes limited to WORKSPACE_MAP.md and those managed blocks; an explicit valid F00 context additionally authorizes its current map-claims/target-snapshot update and exact reconciliation receipt. Do not run build/test/migration commands or start servers; only read the commands they declare. Never echo secrets. Mark anything you can't determine under "Unknowns". Print a 3-line summary (including map maturity, hydrated entry points, concurrency UNKNOWN count and quality gates found/MISSING per subproject) when done.
```

---

## 2 · CREATE FEATURE — plan a feature → `.agentic_planning/_feature_<slug>/`

```text
Read agentic-planning-kit2/PROMPT_CREATE_FEATURE.md and execute it as your complete task spec.
Before anything, read WORKSPACE_MAP.md at the workspace root plus CLAUDE.md / AGENTS.md; if the map is missing, stale for the touched subprojects, or lacks their Quality gates tables (planning-map contract < 3), stop and ask me to run INIT (trigger 1) first.
Plan only — write NO product code. Generate .agentic_planning/_feature_<slug>/ with exactly: FEATURE_<SLUG>.md (scope, binding contract, fixed decisions, invariants — including "the gauntlet never weakens" —, a Mermaid execution graph, and a manual QA checklist in Spanish that I will execute myself, focused on acceptance: UX, flujos en dispositivo, visual — not correctness the gates already prove), 2–6 single-session step files with explicit dependencies planned for maximum safe parallelism (steps without a dependency edge run in parallel; serialize only for overlapping writes or shared exclusive resources from the map — gate commands classified exclusive count as shared resources), each step carrying a one-line suggested model effort (tier low/medium/high + examples for Claude Code, Codex and Cursor), execution_prompts/README.md (index table + the same Mermaid graph + parallel-safety note incl. gate staggering when needed) and execution_prompts/TRIGGERS.md with ONE launcher per step grouped by parallel level — no orchestrator, no DAG json, no planning-basis, no model-routing matrices, no rubrics, no verification/eval/fix cycles, no tests/evals/fixes/cache trees, no coverage thresholds, no mutation testing.
For every step that writes product code: derive BINDING TEST CASES from the feature contract (happy path, negative, edge) into its Spec — the executor implements them, may add cases, never removes them — and list the subproject's Quality gates commands the step must run and pass BEFORE writing its handoff report, recording each command + exit code in the report along with every test file touched; existing tests are never deleted, skipped or loosened to pass. If a needed gate is MISSING in the map, add an explicit tooling-bootstrap step or record the degradation in the feature doc — never silently. Steps that write no product code skip gates.
Each step grounds in the map (subproject, seam, recipe, blessed lib), writes only its declared scope, and finishes with a short handoff report outputs/NN_<slug>.md (≤40 lines). Acceptance QA is mine, done manually after the steps.
Also register the feature in the index .agentic_planning/README.md (newest first; create it from the kit's index template if missing): add its row at the top with status 📝 Diseñada, what it does and the impacted subprojects; flip any superseded feature's row; and make the plan's final step responsible for updating the row to ✅ Ejecutada — the index must always stay hydrated.
Print a short summary when done: slug, step list with dependencies/parallel groups, touched subprojects, gates per step, assumptions.

Feature to build:
<<escribe aquí lo que quieres que haga el feature>>
```

---

## 3 · INIT NEW PROJECT — empty/planning-only target

These phases are deliberately separate human-in-the-loop triggers. 3A and 3B never imply authorization for 3C. Replace every placeholder; never reuse an old revision/hash after a refinement.

### 3A · PROPOSE — show the base project plan

```text
Read agentic-planning-kit2/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

MODE: PROPOSE
TARGET_PATH: .
PROJECT_INTENT:
<<describe the project, users, desired outcomes, constraints and any decisions already made>>
PROJECT_ID:
BASE_REVISION:
BASE_BLUEPRINT_SHA256:
BASE_REVISION_MANIFEST_SHA256:
HUMAN_FEEDBACK:
MATERIALIZE_AUTHORIZATION:
```

### 3B · REFINE — apply human feedback (repeatable)

```text
Read agentic-planning-kit2/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

MODE: REFINE
TARGET_PATH: .
PROJECT_INTENT:
PROJECT_ID: <<exact project ID returned by 3A/previous 3B>>
BASE_REVISION: <<exact current rev-NNN>>
BASE_BLUEPRINT_SHA256: <<exact current blueprint SHA-256>>
BASE_REVISION_MANIFEST_SHA256: <<exact current revision-manifest SHA-256>>
HUMAN_FEEDBACK:
<<accept, reject, change or defer concrete decisions; unanswered items remain unanswered>>
MATERIALIZE_AUTHORIZATION:
```

Repeat 3B with the newly returned revision/blueprint/revision-manifest hashes until `readiness=PASS` and the proposal matches the intended project. A semantic no-op does not create a new revision.

### 3C · MATERIALIZE — freeze the plan and create F00

```text
Read agentic-planning-kit2/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

MODE: MATERIALIZE
TARGET_PATH: .
PROJECT_INTENT:
PROJECT_ID: <<exact project ID>>
BASE_REVISION: <<exact READY rev-NNN>>
BASE_BLUEPRINT_SHA256: <<exact READY blueprint SHA-256>>
BASE_REVISION_MANIFEST_SHA256: <<exact READY revision-manifest SHA-256>>
HUMAN_FEEDBACK:
MATERIALIZE_AUTHORIZATION: MATERIALIZE PROJECT <<same PROJECT_ID>> TARGET . REVISION <<same BASE_REVISION>> BLUEPRINT <<same BASE_BLUEPRINT_SHA256>> MANIFEST <<same BASE_REVISION_MANIFEST_SHA256>>
```

3C materializes the frozen blueprint, bootstrap map, F00 execution plan and F01+ intents. It does not create product code. Execute F00 from its generated launchers (F00 creates the subproject's first quality gates — test/lint config and smoke checks), then run INIT (trigger 1) to get a factual map; after that, plan F01+ intents with route 2 by pasting each intent's description as the feature text.

---

## 4 · ANALYZE BEFORE DEVELOP — inspect current behavior or evaluate a proposed capability → analysis report

```text
Read agentic-planning-kit2/PROMPT_ANALYZE_BEFORE_DEVELOP.md and execute it as your complete task spec.
Start at the workspace root. Read DEVELOPMENT_PRINCIPLES.md when present, WORKSPACE_MAP.md, and the applicable CLAUDE.md / AGENTS.md before analyzing. Analyze only: write no product code and do not create a feature plan. Ground codebase claims in path:symbol evidence and distinguish facts, intended behavior, external evidence, inferences, recommendations and unknowns.
Answer the direct question, trace the relevant behavior end to end, and assess architectural, contract/data, security/tenancy, compatibility, operational, UX, performance and testing implications where material. Always perform a bounded current-research pass using primary sources. For technology or GitHub candidates, verify releases, meaningful maintenance, support, compatibility, security, governance and license; popularity alone is not evidence. Prefer the workspace's existing seams and blessed choices unless current evidence demonstrates a real gap.
Write exactly one new report under .agentic_planning/_analysis_<slug>/ANALYSIS_<SLUG>.md and leave every other pre-existing file untouched.
Also register the analysis in the index .agentic_planning/README.md: add ONE row at the top of its "## Análisis" table (newest first; create the section and its legend line from the kit's template if missing) with the link, the question plus your headline recommendation, the report's own status (✅ Conclusivo | ⚠️ Condicional | ⛔ Bloqueado, plus 🕓 when readiness is NEEDS_DECISION) and the date; leave "Derivó en" as — unless a feature document already cites this analysis. Write only your own row: never edit other rows and never touch the Features table.
Print the report path, main conclusion, highest risk, research status, next decision and confirmation that the index row was added.

Analysis request:
<<describe la nueva funcionalidad, el comportamiento existente o la pregunta a investigar>>
```
