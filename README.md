# Agentic Planning Kit 3.3

A portable, stack-agnostic kit for planning and implementing software in small, single-session
steps. Copy the `agentic-planning-kit/` folder into the target workspace and use the launchers in
[TRIGGERS.md](./TRIGGERS.md). The included prompts define the workflow. A generated
`WORKSPACE_MAP.md` supplies the project's commands, conventions and constraints.

## Choose a route

| Route | Prompt | Result |
|---|---|---|
| 0 · Open session | [Launchers](./TRIGGERS.md) | Creates or preserves the owner's `SESSION.md` and refreshes the global index. |
| 1 · INIT | [Map and reconciliation](./PROMPT_INIT.md) | Discovers a factual workspace map and writes managed pointers for existing code. |
| 2 · Create feature | [Feature planning](./PROMPT_CREATE_FEATURE.md) | Plans a feature or proof of concept with binding tests, required gates and inline base security. |
| 3 · New project | [Greenfield planning](./PROMPT_INIT_NEW_PROJECT.md) | Proposes and refines a blueprint, then materializes the F00 scaffold plan. |
| 4 · Analyze | [Analysis](./PROMPT_ANALYZE_BEFORE_DEVELOP.md) | Writes an evidence-backed report before a development decision. |
| 5 · Reconcile feature | [Map and reconciliation](./PROMPT_INIT.md) | Updates affected map facts, managed pointers, the global index and the owner's status from the final step. |
| 6 · Plan hardening | [Hardening](./PROMPT_HARDENING_AND_AUDIT.md#hardening) | Plans quality and security hardening for existing code. Execution includes CRAP, duplication, mutation and the full defensive audit. |
| 7 · Security audit | [Security audit](./PROMPT_HARDENING_AND_AUDIT.md#security-audit) | Runs a standalone audit. Defaults to `BASE`, with `FULL` available on demand. |

Every launcher takes `USER: <username>`. The owner's artifacts live in
`.agentic_planning/<username>/`. Routes 0 and 5 handle the shared index.

## Develop and harden

1. Open the session with route 0. Run route 1 for existing code, or route 3A to design a new project.
   For a greenfield target, route 3C prepares F00 after refinement. F00 runs serially, applies the
   base profile and creates the first deterministic gates before its terminal INIT and close.
2. Use route 2 for the next useful slice. The plan contains a binding contract, a Mermaid graph,
   step specs with behavioral tests and checks, and an acceptance checklist in Spanish. Executors
   reuse the project's tools and retain its required gates. Extra CRAP, duplication, mutation and
   other opt-in checks stay deferred unless selected or required by the project. Each changed code
   or security-affecting config step performs the base review inline.
3. Launch each step in the plan's dependency order. Default to one active APK session. Set
   `MAX_SESSIONS: 2` only to overlap independent steps with disjoint write scopes and compatible
   resources. Heavy checks and full audits run serially. Full audits use at most one independent
   reviewer at a time while the lead waits. [Session rules](./SESSIONS.md)
4. Use route 6 when you want to make an existing slice ready for harder quality and security
   requirements. The generated plan schedules extended checks against the final scoped state,
   opens a full source audit, and requires evidence for both before closure. If a check is
   applicable, a missing tool or unresolved failure keeps hardening open. Use route 7 at any time
   for an audit report, including before hardening or without a workspace map.
5. The terminal feature step invokes route 5 after collecting the handoffs and required evidence.
   Then run the feature's manual acceptance checklist.

## Portability

APK ships the adapted UB and Cloudflare workflows as local Markdown. Base development and both
security audit modes use the workspace's source, configuration and available evidence. They need no
external skill installation. Hardening uses compatible existing tools or the pinned tool sources
documented in the prompt. A scoped tooling setup can require a supported runtime or network access.
Existing maps with unlabelled gates retain their binding checks. Run INIT to refresh gate
classification from project evidence. Plans generated before profiles keep their original close
requirements. [Quality and audit workflow](./PROMPT_HARDENING_AND_AUDIT.md)

## Design rules

| | Rule |
|---|---|
| R1 | Version control and conflict resolution belong to the workspace. Session scheduling is manual. |
| R2 | Write human-readable artifacts. |
| R3 | Keep canonical facts in one place. The global index links to the owner sessions. |
| R4 | Use typeable usernames and slugs. |
| R5 | Each route delivers a usable result. Route 5 runs inside the terminal feature step. |
| R6 | Planning and audit artifacts use Markdown. |
| R7 | Keep the kit and its artifacts within the line budgets. |
| R8 | Install by copying one folder. |

| Artifact | Cap |
|---|---|
| The whole kit | 9 files · 1,800 lines |
| A route prompt | 300 lines (route 3: 350) |
| `PROJECT_BLUEPRINT.md` | 400 lines · 10 sections |
| `FEATURE_<SLUG>.md` | 200 lines |
| A step file | 60 lines |
| A handoff report | 40 lines |

## Files

```text
agentic-planning-kit/
├── README.md
├── SESSIONS.md
├── TRIGGERS.md
├── PROMPT_INIT.md
├── PROMPT_CREATE_FEATURE.md
├── PROMPT_INIT_NEW_PROJECT.md
├── PROMPT_ANALYZE_BEFORE_DEVELOP.md
├── PROMPT_HARDENING_AND_AUDIT.md
└── LICENSE
```
