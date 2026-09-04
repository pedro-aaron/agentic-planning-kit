# Triggers — Agentic Planning Kit 3.2

Copy-paste **one block** into a fresh code-agent session (Claude Code / Cursor / Codex). Start every
session at the **workspace root** of the target workspace.

- **First time in a clone: run 0 OPEN SESSION.** It creates `.agentic_planning/<username>/` and
  refreshes the global session index; per-user routes then write inside it. Nothing else needs installing.
- Existing code: run **1 INIT**. Use **4 ANALYZE BEFORE DEVELOP** for an evidence-backed codebase
  question or capability assessment; when ready, run **2 CREATE FEATURE** once per feature. Its last
  executing step automatically invokes **5 RECONCILE FEATURE** after its preliminary handoff and before success.
- Empty or planning-only target: run **3A PROPOSE**, optionally repeat **3B REFINE**, then
  explicitly run **3C MATERIALIZE**. F00's terminal step runs INIT and route 5 in one session before route 2 for F01+.

Every block starts with `USER:`. Put **your** username there — lowercase `[a-z0-9-]`, 2–32
characters. It is a directory name, not an account: the kit never checks it against a remote, a
commit author or a directory service. It decides the owner session; route 5 has the intentional,
documented shared write set for reconciliation. See [`SESSIONS.md`](./SESSIONS.md).

---

## 0 · OPEN SESSION — create your planning session

Run once per clone, per person. It creates or preserves the session and refreshes the global index.

```text
Create my planning session for the Agentic Planning Kit, at the workspace root.

USER: <<tu-username>>

Ensure the directory .agentic_planning/<USER>/ exists. If `.agentic_planning/<USER>/SESSION.md` is
missing, write exactly that one file inside it with: an H1 "Sesión de planeación — <USER>"; one line saying
that every plan of this user lives under this directory and that no other user writes here; and
three empty Markdown tables under the headings "## Proyectos", "## Features" and "## Análisis",
each with the columns | Documento | Qué hace | Impacta | Status | Fecha |, plus the status legend
"✅ Ejecutada · 🔄 En ejecución · 📝 Diseñada · ⛔ Superseded · 📌 Documento vivo". If it already
exists, leave it unchanged and only refresh the global index below.
If `.agentic_planning/README.md` does not exist, create it with an H1 and short explanation that it
is the generated global planning index, whose source is each user's `SESSION.md`, then add exactly:
<!-- agentic-planning-index:begin — managed by agentic-planning-kit -->
## Usuarios
| Usuario | Sesión |
|---|---|
<!-- agentic-planning-index:end -->
If it already exists without those markers, append the same block. Rebuild it from direct-child
directories containing `SESSION.md`, sorted by username, with rows `| <user> | [SESSION.md](./<user>/SESSION.md) |`. Do not copy plans, statuses or rows; sessions are the source of truth. Preserve prose
outside markers. Create nothing else. Write no product code. Print the session path and confirm the refreshed index.
```

---

## 1 · INIT EXISTING PROJECT — discover/reconcile a factual `WORKSPACE_MAP.md`

```text
Read agentic-planning-kit/PROMPT_INIT.md and execute it as your complete task spec.

USER: <<tu-username>>
MODE: INIT

Start at the workspace root. This trigger is for a project with real implementation signals. If the target is empty/planning-only, stop without writes and direct me to trigger 3A.
First read any existing CLAUDE.md / AGENTS.md / README.md and reconcile with them. Map EACH subproject and compose. Capture stack/libs, commands/cwd, hard rules, contracts, data-store owner + access mode (`read-write|append-only|read-only|bootstrap-write/runtime-read-only|UNKNOWN`) + lifecycle boundary + principals/env-key names + allowed/forbidden operations, migration protocol only for writable phases, seams, conventions/principles and recipes. Also capture each subproject's QUALITY GATES: the deterministic test/lint/typecheck commands with exit-code semantics that code-writing feature steps must pass, quoted verbatim with cwd and parallel classification; a gate that does not exist is MISSING — never invent or aspirationally add one; coverage is observed-only (record the figure only if an existing command emits it, no thresholds); no mutation testing, no BDD runners. Write one WORKSPACE_MAP.md at the workspace root and mark map maturity factual only when its required claims are backed by implementation evidence.
For safe multi-agent planning, also map command side effects and every shared mutable resource/single-writer hotspot: manifests/lockfiles, generated/cache/temp dirs, composition roots/registries, compose projects, fixed ports, volumes/networks, databases/services and reports. Record `shared_read|exclusive|UNKNOWN`, isolation keys/namespaces and same-checkout constraints; UNKNOWN means serialize, never assume safety.
If invoked inside greenfield F00, reconcile the bootstrap claims: real evidence promotes PLANNED to EXISTING, drift becomes UNKNOWN, and unresolved planned work stays PLANNED. Use map maturity mixed until every foundation-required claim is factual; INIT alone never opens F01+.
Then hydrate the agent entry points: inject the idempotent managed pointer block (between the agentic-routes markers) into CLAUDE.md and AGENTS.md (create them minimally if absent; in a workspace, each subproject's too), and into Cursor rules ONLY if the workspace already uses Cursor (a .cursor/ dir or .cursorrules) — for Cursor, write a dedicated .cursor/rules/agentic-routes.mdc, don't edit the user's rule files. Keep the block a pointer to the map, never a copy.
Writes limited to WORKSPACE_MAP.md, those managed blocks, and — only inside an explicit F00 context — that F00's own reconciliation note under .agentic_planning/<USER>/. Do not write into any other user's session directory. Do not run build/test/migration commands or start servers; only read the commands they declare. Never echo secrets. Mark anything you can't determine under "Unknowns". Print a 3-line summary (map maturity, hydrated entry points, concurrency UNKNOWN count, quality gates found/MISSING per subproject) when done.
```

`WORKSPACE_MAP.md`, managed entry-point blocks and the global index are shared close resources. The
human scheduler must serialize routes 0/5 in one checkout; if an external overlap occurs, resolve the
ordinary Markdown conflict and rerun route 5.

---

## 2 · CREATE FEATURE — plan a feature → `.agentic_planning/<username>/_feature_<slug>/`

```text
Read agentic-planning-kit/PROMPT_CREATE_FEATURE.md and execute it as your complete task spec.

USER: <<tu-username>>

Before anything, read WORKSPACE_MAP.md at the workspace root plus CLAUDE.md / AGENTS.md; if the map is missing, stale for touched subprojects, lacks Quality gates, or lacks the `Existing docs & planning` global-close entry, stop and ask me to run INIT (trigger 1) first. If .agentic_planning/<USER>/ does not exist, stop and tell me to run trigger 0.
Plan only — write NO product code. Generate .agentic_planning/<USER>/_feature_<slug>/ with exactly: FEATURE_<SLUG>.md (scope, binding contract, fixed decisions, invariants — including "the gauntlet never weakens" —, a Mermaid execution graph, and a manual QA checklist in Spanish that I will execute myself, focused on acceptance: UX, flujos en dispositivo, visual — not correctness the gates already prove), 2–6 single-session step files under steps/ with explicit dependencies planned for maximum safe parallelism (steps without a dependency edge run in parallel; serialize only for overlapping writes or shared exclusive resources from the map — gate commands classified exclusive count as shared resources), each step carrying a one-line suggested model effort (tier low/medium/high + examples for Claude Code, Codex and Cursor), and TRIGGERS.md with ONE launcher per step grouped by parallel level — no orchestrator, no DAG json, no model-routing matrices, no rubrics, no verification/eval/fix cycles, no coverage thresholds, no mutation testing, no JSON artifacts of any kind.
For every step that writes product code: derive BINDING TEST CASES from the feature contract (§3) into its Spec — the executor implements them, may add cases, never removes them — and list the subproject's Quality gates commands the step must run and pass BEFORE writing its handoff report, recording each command + exit code in the report along with every test file touched; existing tests are never deleted, skipped or loosened to pass. If a needed gate is MISSING in the map, add an explicit tooling-bootstrap step or record the degradation in the feature doc — never silently. Steps that write no product code skip gates.
Each step grounds in the map (subproject, seam, recipe, blessed lib), writes only its declared scope, and finishes with a short handoff report outputs/NN_<slug>.md (≤40 lines). Acceptance QA is mine, done manually after the steps.
Also register the feature in MY session index `.agentic_planning/<USER>/SESSION.md`: add its row at the top of `## Features` as 📝 Diseñada, with its purpose and impacts; flip any superseded row of mine. The final step must join every branch, write its preliminary handoff, then automatically invoke route 5 in the same session before success; route 5 reconciles map/pointers, rebuilds the global index and flips only my row to ✅ Ejecutada. Planning itself never edits another user's session or the global index.
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
executable the moment 3C finishes** — open its step triggers directly. F00 creates the first gates;
its terminal step runs `MODE: INIT`, confirms a factual map, then calls route 5 with its F00 path in
the same session, before manual QA and route-2 planning for F01+.

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

## 5 · RECONCILE FEATURE — automatic final-step close and global index

This is explicit, but a normal feature does **not** wait for a person to launch it: its final step
runs it in the same session after every gate and preliminary handoff, before declaring success. It
may be rerun manually only to repair a failed or conflicted close.

```text
Read agentic-planning-kit/PROMPT_INIT.md and execute its RECONCILE_FEATURE mode as your complete task spec.

USER: <<tu-username>>
MODE: RECONCILE_FEATURE
FEATURE_PATH: .agentic_planning/<USER>/_feature_<slug>/
```

`FEATURE_PATH` may instead be `.agentic_planning/<USER>/_project_<slug>/F00/` for F00. The route
checks the completed artifact and its reports, updates only changed factual sections of
`WORKSPACE_MAP.md`, restores managed pointers, marks only the invoker's appropriate session row
`✅ Ejecutada`, and deterministically rebuilds the managed block in `.agentic_planning/README.md`
from direct-child user session paths. It does not run gates again, product code or manual QA. The
human scheduler serializes routes 0/5 in one checkout; preserve unrelated edits, resolve any external
Markdown conflict and rerun this route rather than pretending the close succeeded.

---

## Step execution

Each plan ships its own `TRIGGERS.md` with one launcher per step. Open each in a fresh session, in
dependency order; steps in the same parallel group may run simultaneously. The shape is always:

```text
Read .agentic_planning/<username>/_feature_<slug>/steps/NN-<slug>.md and execute it as your complete task spec.
Start at the workspace root. Before any code, read WORKSPACE_MAP.md, the layer CLAUDE.md/AGENTS.md it names, and the prior reports it lists. Write only within the step's declared scope. If the step writes product code: implement its binding test cases, then run its Gates commands and record each command + exit code in the report; never delete, skip or loosen existing tests to pass. Write outputs/NN_<slug>.md (≤40 lines). **A terminal report ends with `## Cierre` plus three placeholder/result lines; its session then automatically runs route 5 and replaces those lines before success.**
```

Two people executing steps that touch the same product files is an ordinary conflict — resolve it
with your version-control system, the way you would for any other change. The kit's disjoint write
scopes exist to make that rare, not to replace Git when it happens.
