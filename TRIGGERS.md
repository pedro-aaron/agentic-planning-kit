# Triggers — Agentic Planning Kit 3.3

Copy-paste **one block** into a fresh code-agent session (Claude Code / Cursor / Codex). Start every
session at the **workspace root** of the target workspace.
Each named prompt is the route's complete specification; its launcher supplies the inputs.

- **First time in a clone: run 0 OPEN SESSION.** It creates `.agentic_planning/<username>/` and
  refreshes the global session index; per-user routes then write inside it. Nothing else needs installing.
- Existing code: run **1 INIT**. Use **4 ANALYZE BEFORE DEVELOP** for an evidence-backed codebase
  question or capability assessment; when ready, run **2 CREATE FEATURE** once per feature. Its last
  executing step automatically invokes **5 RECONCILE FEATURE** after its preliminary handoff and before success.
- Empty or planning-only target: run **3A PROPOSE**, optionally repeat **3B REFINE**, then
  explicitly run **3C MATERIALIZE**. F00's terminal step runs INIT and route 5 in one session before route 2 for F01+.
- Existing code can use **6 PLAN HARDENING** after INIT. Run **7 SECURITY AUDIT** on demand with
  or without a feature plan or workspace map.

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

Generate/reconcile WORKSPACE_MAP.md and its managed pointers; write no product code.
```

`WORKSPACE_MAP.md`, managed entry-point blocks and the global index are shared close resources. The
human scheduler must serialize routes 0/5 in one checkout; if an external overlap occurs, resolve the
ordinary Markdown conflict and rerun route 5.

---

## 2 · CREATE FEATURE — base profile for features and prototypes

Base quality and inline security apply by default. Add `EXTRA_CHECKS: mutator` to include
mutation testing, or list other optional checks by name. Use `MAX_SESSIONS: 2` for safe overlap.

```text
Read agentic-planning-kit/PROMPT_CREATE_FEATURE.md and execute it as your complete task spec.

USER: <<tu-username>>
MAX_SESSIONS: 1

Plan only — write no product code.

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

Analyze only — write no product code or feature plan.

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

## 6 · PLAN HARDENING — extended quality and full security

Requires a factual workspace map. Execute the generated step triggers when ready.

```text
Read agentic-planning-kit/PROMPT_HARDENING_AND_AUDIT.md, section Hardening, and follow its planning workflow.

USER: <<tu-username>>
MAX_SESSIONS: 1
TARGET:
<<describe las rutas o módulos, el comportamiento que debe conservarse y los objetivos de hardening>>
```

---

## 7 · SECURITY AUDIT — standalone, base by default

Set `AUDIT: FULL` for the deeper source review and independent verification. Omit `TARGET`
to review the current working tree. Reports stay under the owner session.

```text
Read agentic-planning-kit/PROMPT_HARDENING_AND_AUDIT.md, section Security audit, and run the standalone audit.

USER: <<tu-username>>
AUDIT: BASE
TARGET: <<rutas locales dentro del workspace, u omite esta línea>>
```

---

## Step execution

Each plan ships its own `TRIGGERS.md` with one launcher per step. Open each in a fresh session, in
the plan's launch order and session budget. The shape is always:

```text
Start at the workspace root.
Read .agentic_planning/<username>/_feature_<slug>/steps/NN-<slug>.md and execute it as your complete task spec.
```

The terminal launcher also invokes route 5 in that session after its preliminary report; it fills
`## Cierre` with the close results before success. The generated plan supplies that explicit suffix.

Two people executing steps that touch the same product files is an ordinary conflict — resolve it
with your version-control system, the way you would for any other change. The kit's disjoint write
scopes exist to make that rare, not to replace Git when it happens.
