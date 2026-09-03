# Triggers — Agentic Planning Kit 3.1

Copy-paste **one block** into a fresh code-agent session (Claude Code / Cursor / Codex). Start every
session at the **workspace root** of the target workspace.

- **First time in a clone: run 0 OPEN SESSION.** It creates `.agentic_planning/<username>/`, and
  every later route writes inside it. Nothing else in the kit needs installing.
- Existing code: run **1 INIT**. Use **4 ANALYZE BEFORE DEVELOP** for an evidence-backed codebase
  question or capability assessment; when ready to plan implementation, run **2 CREATE FEATURE**
  once per feature.
- Empty or planning-only target: run **3A PROPOSE**, optionally repeat **3B REFINE**, then
  explicitly run **3C MATERIALIZE**. Execute F00, then run INIT before using route 2 for F01+.

Every block starts with `USER:`. Put **your** username there — lowercase `[a-z0-9-]`, 2–32
characters. It is a directory name, not an account: the kit never checks it against a remote, a
commit author or a directory service. It decides where the route writes, and it is the only thing
that keeps your planning from colliding with anyone else's. See [`SESSIONS.md`](./SESSIONS.md).

---

## 0 · OPEN SESSION — create your planning session

Run once per clone, per person. Takes a second and writes one file.

```text
Create my planning session for the Agentic Planning Kit, at the workspace root.

USER: <<tu-username>>

Create the directory .agentic_planning/<USER>/ and write exactly one file inside it,
.agentic_planning/<USER>/SESSION.md, with: an H1 "Sesión de planeación — <USER>"; one line saying
that every plan of this user lives under this directory and that no other user writes here; and
three empty Markdown tables under the headings "## Proyectos", "## Features" and "## Análisis",
each with the columns | Documento | Qué hace | Impacta | Status | Fecha |, plus the status legend
"✅ Ejecutada · 🔄 En ejecución · 📝 Diseñada · ⛔ Superseded · 📌 Documento vivo".
If .agentic_planning/README.md does not exist, create it with a short paragraph explaining that
this directory holds one session directory per user, that the kit is in agentic-planning-kit/, and
that `ls .agentic_planning/` is how you see who is planning what. Never regenerate it if it exists.
Create nothing else. Write no product code. Do not touch another user's directory.
Print the session path and confirm the two files.
```

---

## 1 · INIT EXISTING PROJECT — discover/reconcile a factual `WORKSPACE_MAP.md`

```text
Read agentic-planning-kit/PROMPT_INIT.md and execute it as your complete task spec.

USER: <<tu-username>>

Start at the workspace root. This trigger is for a project with real implementation signals. If the target is empty/planning-only, stop without writes and direct me to trigger 3A.
First read any existing CLAUDE.md / AGENTS.md / README.md and reconcile with them. Map EACH subproject and compose. Capture stack/libs, commands/cwd, hard rules, contracts, data-store owner + access mode (`read-write|append-only|read-only|bootstrap-write/runtime-read-only|UNKNOWN`) + lifecycle boundary + principals/env-key names + allowed/forbidden operations, migration protocol only for writable phases, seams, conventions/principles and recipes. Also capture each subproject's QUALITY GATES: the deterministic test/lint/typecheck commands with exit-code semantics that code-writing feature steps must pass, quoted verbatim with cwd and parallel classification; a gate that does not exist is MISSING — never invent or aspirationally add one; coverage is observed-only (record the figure only if an existing command emits it, no thresholds); no mutation testing, no BDD runners. Write one WORKSPACE_MAP.md at the workspace root and mark map maturity factual only when its required claims are backed by implementation evidence.
For safe multi-agent planning, also map command side effects and every shared mutable resource/single-writer hotspot: manifests/lockfiles, generated/cache/temp dirs, composition roots/registries, compose projects, fixed ports, volumes/networks, databases/services and reports. Record `shared_read|exclusive|UNKNOWN`, isolation keys/namespaces and same-checkout constraints; UNKNOWN means serialize, never assume safety.
If invoked inside greenfield F00, reconcile the bootstrap claims: real evidence promotes PLANNED to EXISTING, drift becomes UNKNOWN, and unresolved planned work stays PLANNED. Use map maturity mixed until every foundation-required claim is factual; INIT alone never opens F01+.
Then hydrate the agent entry points: inject the idempotent managed pointer block (between the agentic-routes markers) into CLAUDE.md and AGENTS.md (create them minimally if absent; in a workspace, each subproject's too), and into Cursor rules ONLY if the workspace already uses Cursor (a .cursor/ dir or .cursorrules) — for Cursor, write a dedicated .cursor/rules/agentic-routes.mdc, don't edit the user's rule files. Keep the block a pointer to the map, never a copy.
Writes limited to WORKSPACE_MAP.md, those managed blocks, and — only inside an explicit F00 context — that F00's own reconciliation note under .agentic_planning/<USER>/. Do not write into any other user's session directory. Do not run build/test/migration commands or start servers; only read the commands they declare. Never echo secrets. Mark anything you can't determine under "Unknowns". Print a 3-line summary (map maturity, hydrated entry points, concurrency UNKNOWN count, quality gates found/MISSING per subproject) when done.
```

`WORKSPACE_MAP.md` is the one shared planning file in the kit: it describes the repository, not
anyone's plan. If two people run INIT around the same time, resolve it like any other file.

---

## 2 · CREATE FEATURE — plan a feature → `.agentic_planning/<username>/_feature_<slug>/`

```text
Read agentic-planning-kit/PROMPT_CREATE_FEATURE.md and execute it as your complete task spec.

USER: <<tu-username>>

Before anything, read WORKSPACE_MAP.md at the workspace root plus CLAUDE.md / AGENTS.md; if the map is missing, stale for the touched subprojects, or lacks their Quality gates tables, stop and ask me to run INIT (trigger 1) first. If .agentic_planning/<USER>/ does not exist, stop and tell me to run trigger 0.
Plan only — write NO product code. Generate .agentic_planning/<USER>/_feature_<slug>/ with exactly: FEATURE_<SLUG>.md (scope, binding contract, fixed decisions, invariants — including "the gauntlet never weakens" —, a Mermaid execution graph, and a manual QA checklist in Spanish that I will execute myself, focused on acceptance: UX, flujos en dispositivo, visual — not correctness the gates already prove), 2–6 single-session step files under steps/ with explicit dependencies planned for maximum safe parallelism (steps without a dependency edge run in parallel; serialize only for overlapping writes or shared exclusive resources from the map — gate commands classified exclusive count as shared resources), each step carrying a one-line suggested model effort (tier low/medium/high + examples for Claude Code, Codex and Cursor), and TRIGGERS.md with ONE launcher per step grouped by parallel level — no orchestrator, no DAG json, no model-routing matrices, no rubrics, no verification/eval/fix cycles, no coverage thresholds, no mutation testing, no JSON artifacts of any kind.
For every step that writes product code: derive BINDING TEST CASES from the feature contract (§3) into its Spec — the executor implements them, may add cases, never removes them — and list the subproject's Quality gates commands the step must run and pass BEFORE writing its handoff report, recording each command + exit code in the report along with every test file touched; existing tests are never deleted, skipped or loosened to pass. If a needed gate is MISSING in the map, add an explicit tooling-bootstrap step or record the degradation in the feature doc — never silently. Steps that write no product code skip gates.
Each step grounds in the map (subproject, seam, recipe, blessed lib), writes only its declared scope, and finishes with a short handoff report outputs/NN_<slug>.md (≤40 lines). Acceptance QA is mine, done manually after the steps.
Also register the feature in MY session index .agentic_planning/<USER>/SESSION.md: add its row at the top of the "## Features" table with status 📝 Diseñada, what it does and the impacted subprojects; flip any superseded feature of mine; and make the plan's final step responsible for updating the row to ✅ Ejecutada. Never write into another user's session directory and never create or edit a global index.
Print a short summary when done: slug, step list with dependencies/parallel groups, touched subprojects, gates per step, assumptions.

Feature to build:
<<escribe aquí lo que quieres que haga el feature>>
```

---

## 3 · INIT NEW PROJECT — empty/planning-only target

Three deliberately separate human-in-the-loop phases. 3A and 3B never imply authorization for 3C.
You only ever type the project slug — the kit asks for no hashes and no identifiers.

### 3A · PROPOSE — show the base project plan

```text
Read agentic-planning-kit/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

USER: <<tu-username>>
MODE: PROPOSE
PROJECT_INTENT:
<<describe el proyecto, los usuarios, los resultados esperados, las restricciones y las decisiones ya tomadas>>
```

### 3B · REFINE — apply human feedback (repeatable)

```text
Read agentic-planning-kit/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

USER: <<tu-username>>
MODE: REFINE
PROJECT: <<slug; omítelo si sigues en la misma sesión>>
HUMAN_FEEDBACK:
<<acepta, rechaza, cambia o pospone decisiones concretas; lo que no contestes sigue sin contestar>>
```

Repeat 3B until readiness is `PASS` and the proposal matches the project you intend. A refinement
that changes nothing semantically edits nothing and says so.

### 3C · MATERIALIZE — freeze the plan and create F00

```text
Read agentic-planning-kit/PROMPT_INIT_NEW_PROJECT.md and execute it as your complete task spec.

USER: <<tu-username>>
MODE: MATERIALIZE
PROJECT: <<slug; omítelo si sigues en la misma sesión>>
MATERIALIZE_AUTHORIZATION: <<vacío la primera vez; MATERIALIZE <slug> la segunda>>
```

Call it once with the authorization empty: the agent runs readiness, writes nothing, and prints what
it will create. Call it again with `MATERIALIZE <slug>` to proceed.

3C freezes the blueprint and writes the F00 execution plan. It creates no product code. **F00 is
executable the moment 3C finishes** — open its step triggers directly. F00 creates the subproject's
first quality gates (test/lint config and smoke checks); then run INIT (trigger 1) for a factual map,
do the manual QA, and plan F01+ with route 2 by pasting each intent's description as the feature text.

---

## 4 · ANALYZE BEFORE DEVELOP — inspect behavior or evaluate a proposed capability

```text
Read agentic-planning-kit/PROMPT_ANALYZE_BEFORE_DEVELOP.md and execute it as your complete task spec.

USER: <<tu-username>>

Start at the workspace root. Read WORKSPACE_MAP.md and the applicable CLAUDE.md / AGENTS.md before analyzing. If .agentic_planning/<USER>/ does not exist, stop and tell me to run trigger 0. Analyze only: write no product code and do not create a feature plan. Ground codebase claims in path:symbol evidence and distinguish facts, intended behavior, external evidence, inferences, recommendations and unknowns.
Answer the direct question, trace the relevant behavior end to end, and assess architectural, contract/data, security/tenancy, compatibility, operational, UX, performance and testing implications where material. Always perform a bounded current-research pass using primary sources. For technology or GitHub candidates, verify releases, meaningful maintenance, support, compatibility, security, governance and license; popularity alone is not evidence. Prefer the workspace's existing seams and blessed choices unless current evidence demonstrates a real gap.
Write exactly one new report at .agentic_planning/<USER>/_analysis_<slug>/ANALYSIS_<SLUG>.md and leave every other pre-existing file untouched.
Also register it in MY session index .agentic_planning/<USER>/SESSION.md: add ONE row at the top of the "## Análisis" table with the link, the question plus your headline recommendation, the report's status (✅ Conclusivo | ⚠️ Condicional | ⛔ Bloqueado, plus 🕓 when readiness is NEEDS_DECISION) and the date. Write only your own row, in your own session file; never touch another user's directory and never create a global index.
Print the report path, main conclusion, highest risk, research status, next decision and confirmation that the index row was added.

Analysis request:
<<describe la nueva funcionalidad, el comportamiento existente o la pregunta a investigar>>
```

---

## Step execution

Each plan ships its own `TRIGGERS.md` with one launcher per step. Open each in a fresh session, in
dependency order; steps in the same parallel group may run simultaneously. The shape is always:

```text
Read .agentic_planning/<username>/_feature_<slug>/steps/NN-<slug>.md and execute it as your complete task spec.
Start at the workspace root. Before any code, read WORKSPACE_MAP.md, the layer CLAUDE.md/AGENTS.md it names, and the prior reports it lists. Write only within the step's declared scope. If the step writes product code: implement its binding test cases, then run its Gates commands and record each command + exit code in the report; never delete, skip or loosen existing tests to pass. Finish by writing outputs/NN_<slug>.md (≤40 lines).
```

Two people executing steps that touch the same product files is an ordinary conflict — resolve it
with your version-control system, the way you would for any other change. The kit's disjoint write
scopes exist to make that rare, not to replace Git when it happens.
