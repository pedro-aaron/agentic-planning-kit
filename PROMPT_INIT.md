# PROMPT_INIT — Generate/reconcile `WORKSPACE_MAP.md` (the workspace map)

You are a code agent (Claude Code / Cursor / Codex) running at the **root of a workspace** — the directory the kit is pointed at. Execute this file as your complete task spec. You will produce the factual map plus managed entry-point pointers, and write **no product code**. The launcher supplies `USER: <username>` and `MODE: INIT | RECONCILE_FEATURE` (`INIT` if omitted); the latter also supplies `FEATURE_PATH`, starts at its mode section (skip the normal applicability/procedure) and may update that user's status plus the generated global index, never another user's session.

---

## Goal

Produce `WORKSPACE_MAP.md` at the workspace root: a **factual map of the workspace** that the feature-planning workflow (`PROMPT_CREATE_FEATURE.md`) consumes to ground every step it generates. This file is the **per-workspace adapter** — it is what makes the generic feature prompt work in this specific workspace. Get it right and every future feature plan inherits accurate paths, commands, rules, seams, shared mutable-resource hazards, isolation keys for safe multi-agent parallel execution, **and the quality gates** — the deterministic, exit-code-verified commands that code-writing steps must pass before finishing.

**Applicability gate — this is the brownfield/factual route.** Before writing, classify the intended target from observed files:

- If buildable source, package/application manifests, compose/runtime configuration, product tests or other real implementation signals exist, continue with INIT.
- If the target is empty or contains only VCS metadata, placeholder docs, agent tooling, this kit or `.agentic_planning/<user>/_project_*` design artifacts, stop **without writes** and direct the operator to `PROMPT_INIT_NEW_PROJECT.md` trigger **3A PROPOSE**. Do not manufacture a factual map from a project description.
- If a partial scaffold exists but its ownership or intended target is ambiguous, stop with the exact conflicting paths and request resolution; do not adopt or overwrite it.
- F00 from the greenfield route may invoke this prompt only after it has created enough real scaffold to satisfy the first condition. That invocation performs the bootstrap-to-factual reconciliation below.

**Expect a workspace, not a single project.** The common target of this kit is a root directory that holds **several independent subprojects**, each with its **own toolchain, its own `docker-compose` and possibly its own database** (the discovery still produces **one** `WORKSPACE_MAP.md` at the workspace root, organized **per subproject**). Treat this as the norm and run the discovery per subproject — see "Workspace of subprojects" below.

Then **hydrate the agent entry points** (`CLAUDE.md`, `AGENTS.md`, and Cursor rules if present) with a managed pointer block, so any agent reading those files is routed to the map and the mandatory feature-close reconciliation (see "Hydrate the agent entry points" below).

## What `WORKSPACE_MAP.md` is — and is not

- It **complements** `CLAUDE.md` / `AGENTS.md` / `README.md`; it does **not** replace them. The map holds the routes (where things are); those files hold behavior (how to act). INIT keeps the map authoritative and only injects a short **pointer** into the entry points — it never copies the map's content into them and never contradicts them.
- It is a **map of routes**: where things live, how to build/test them, the hard rules, the canonical contracts, the **seams** where new work attaches, the command/file/resource constraints that determine safe parallelism, the **quality gates** that verify correctness deterministically, and the **patterns/recipes** for adding new work that looks like it belongs. It is not a tutorial and not aspirational.
- The most valuable parts for incorporating new features are the **conventions** (the blessed way to do each thing) and the **recipes** (the repeatable shape of "add a new ___"). Capture them so a generated feature imitates what already exists instead of inventing a second way.
- **Every claim must be grounded** in a file you actually read or a command you actually found declared (in `package.json`, `Makefile`, `docker-compose.yml`, CI config, `pyproject.toml`, `build.gradle`, etc.). Patterns and recipes must be **discovered by example** — generalized from 2–3 real instances and cited with exemplar `file:symbol`s, never guessed. **Quality gates in particular are factual, never aspirational: a gate that does not exist is `MISSING`.** Anything you cannot determine goes under **Unknowns** — never invent paths, commands, conventions, or patterns.
- It is a **living document**. Re-run `INIT` after broad structural changes; every feature's final step runs `RECONCILE_FEATURE`, which checks and updates its affected facts, the global planning index and managed pointers. Always **update in place** (preserve human edits and unrelated sections) rather than overwriting wholesale.

### Bootstrap-to-factual reconciliation (greenfield F00 only)

If the map is `bootstrap`/`mixed` and the matching project blueprint exists: (1) treat its roadmap
and `PLANNED` claims as intent, never evidence; (2) check each claim against disk — promote only
real file/symbol or declared-command evidence to `EXISTING`, retain unbuilt `PLANNED`, and mark
conflicts `UNKNOWN` with evidence; (3) record drift, citing the relevant `DECISIONS.md` `D-NN`;
(4) set `factual` only when every F00 foundation claim is grounded and no blocker remains, otherwise
`mixed` (normal CREATE FEATURE stays blocked); (5) INIT never declares F00 accepted — route 5 closes execution, manual QA accepts it.

## MODE `RECONCILE_FEATURE` — mandatory final-step close

Canonicalize `FEATURE_PATH` under `.agentic_planning/<USER>/` to exactly one `_feature_<slug>/` or `_project_<slug>/F00/` and one invoking-session row (Features for a feature; Proyectos for F00). It runs **inside the last step after all gates and its preliminary handoff**, never rerunning gates/builds/migrations. Complete all preflight before writes: graph outputs for every declared step; exit `0` evidence for every applicable declared code gate; factual normal map, or factual F00 map after terminal INIT (gates before F00's gate-bootstrap are `n/a`); writable map/pointer/index targets. If any check fails, stop without marking completion. Otherwise, before the handoff is declared complete:

1. Update only affected factual map sections; upsert the `Existing docs & planning` global-close pointer and classify `WORKSPACE_MAP.md`, `.agentic_planning/README.md` and managed entry-point blocks `exclusive`; apply **Hydrate the agent entry points** exactly to root/affected subprojects and only present Cursor/other entry points, preserving text outside markers.
2. Create `.agentic_planning/README.md` with an H1/explanation, or insert `<!-- agentic-planning-index:begin — managed by agentic-planning-kit -->` / `<!-- agentic-planning-index:end -->` if missing; rebuild only that block, sorted by direct-child username, as `## Usuarios` rows `| <user> | [SESSION.md](./<user>/SESSION.md) |`. Do not copy status or feature rows: sessions are canonical.
3. Only after 1–2 succeed, mark the invoking artifact's own row `✅ Ejecutada (YYYY-MM-DD)` (`## Features` for `_feature_*`, `## Proyectos` for `F00`); never alter another user. This means execution/reconciliation closed; manual QA remains pending.

Preserve prose outside that block. The human scheduler must serialize routes 0/5 in one checkout; if an external overlap still conflicts, resolve it and rerun this mode — never lock or overwrite blindly. Print feature path, map/pointer changes, index user count and status change, then skip the normal procedure.

## Procedure

1. **Inventory and route gate.** List the top-level tree; read `README*`, `CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING*` and per-directory entry docs. Apply the gate, then detect a single project versus independent subprojects (lockfiles / VCS roots / compose / local `CLAUDE.md`). For a workspace, apply steps 2–9 per subproject without conflating its stack, compose or DB.
   - **Analyze `docker-compose*.yml` / `compose*.yaml` in full when present — this is fundamental.** Enumerate every service (name, image/build, published `ports`, `volumes`, `networks`, `depends_on`, `healthcheck`) and its env (`environment:` / `env_file:` keys **by name**, never values). Compose is the ground truth for the run/test commands (§4), the data store and how the dev DB is reached (§6), and the dev environment as a whole. Note override/profile files (`docker-compose.override.yml`, `*.dev.yml`, `*.prod.yml`) and which one is the default `up`.
2. **Detect stack & toolchain, and the key libraries actually used.** From manifests (`package.json`, `pyproject.toml`/`requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`/`build.gradle`, `Gemfile`, `composer.json`, `*.csproj`, Dockerfiles, compose) **and from how they're imported in real code**. Record languages, frameworks, package managers, runtime versions, and the **blessed choice per concern** (HTTP client, ORM/data access, validation, state management, styling/UI, testing, logging…). When more than one option appears, note which is the canonical one and which is legacy/being-phased-out — so a new feature picks the right one.
3. **Find commands and their concurrency effects.** Extract the **exact** build / run / test / lint commands from `scripts` blocks, `Makefile`, `Taskfile`, `justfile`, CI workflows, compose services. Quote them verbatim. Note the working directory each must run from. From declarations/config only, identify source/generated/cache/temp/report writes, fixed ports, compose project/volumes/networks, DB/service state and any supported isolation key/namespace. Classify each command `parallel-safe`, `parallel-safe with isolation`, `exclusive`, or `UNKNOWN`; `UNKNOWN` means future planners serialize it. Do not execute commands during INIT.
4. **Identify the quality gates.** From the commands found in step 3, mark which ones serve as **deterministic quality gates** — the commands a code-writing feature step must run and pass (exit 0) before it may finish: test suites, lint/format checks, type checks, and any other check with unambiguous exit-code semantics. Quote each verbatim with its cwd and parallel classification, and record what it proves (unit correctness, integration against a live service, style, types…). A gate that does not exist for a subproject is **`MISSING`** — record the absence explicitly; never invent one, never propose installing one from INIT. If an existing command already emits a coverage figure at no extra cost, note it as **observed-only** (step reports may record the number; no threshold is ever enforced). Do **not** record mutation testing, BDD runners or coverage thresholds — gates are only what already exists and exits 0/1.
5. **Find hard rules / guardrails and integration hotspots.** The "never do X" constraints: e.g. tests run inside a container, never run a particular build tool from an agent, migrations must be reversible, do not commit `.env`, do not touch generated files. Pull these from `CLAUDE.md`/`AGENTS.md`/`CONTRIBUTING` and from obvious signals (committed lockfiles, `schemas/` snapshots, codegen markers). Also record single-writer files/areas that parallel feature work commonly converges on: package/lock manifests, generated outputs, composition roots, central registries, route tables, compose files, workspace maps and migration ledgers. Ground each hotspot; do not guess that a path is safe.
6. **Find canonical contracts & schemas — and each data store's ownership/access protocol.** Record engine, owner and access mode: `read-write`, `append-only`, `read-only`, `bootstrap-write/runtime-read-only`, or `UNKNOWN`. Identify lifecycle/cutover boundaries, distinct principals/roles/env-key names, allowed/forbidden operations and server-side enforcement. Only for an authorized writable phase, discover migration mechanism/location/dev access/change protocol. For read-only/sealed stores, write `Migration tool: not applicable after boundary`, capture query seams plus immutability/negative-authorization verification, and never infer permission to mutate. If mode/owner/principal is unclear, record `UNKNOWN` so feature planning blocks rather than guesses. Ground all access in compose and verify any writable target is non-production local/dev.
7. **Identify seams (attachment points).** For each common concern, find the precise `file:symbol` where new work hooks in — e.g. HTTP routing, the data/persistence layer, auth/tenant boundary, the UI navigation/routing, background jobs, the validation layer.
8. **Extract conventions, principles & engineering practices from real code** (not just lint config). Read a handful of representative files and record two things. **(a) Code style:** file/folder organization, naming, how models/DTOs are defined, error-handling, dependency direction, test structure. **(b) Engineering practices the repo actually demonstrates** — and rate each **strict / pragmatic / absent** with an exemplar: contract/interface-first design (interfaces/ports/protocols/ABCs/traits defined apart from implementations?), dependency injection/inversion (constructor injection, DI container, `Depends`, etc.), SOLID signals (single-responsibility module size, open/closed extension points, substitutability), abstraction architecture (layered / hexagonal-ports-&-adapters / clean / pragmatic), type safety (typed throughout? strict mode/mypy?), immutability & purity, validation at boundaries, and the testing bar (what's expected: unit/integration, mocking style, coverage signals). Capture the repo's **real** bar, not an idealized one — note where it is deliberately pragmatic. Cite the files you read.
9. **Discover patterns & recipes by example.** This is the highest-value pass. For each recurring "add a new ___" (endpoint, screen, model/migration, job, component, test…), open **2–3 existing instances**, generalize the **ordered steps** they share, and write the recipe citing the exemplar `file:symbol`s and the blessed libraries it uses. Record the recipe's typical independently-owned write area and any shared integration/registration file that needs a later single writer. A recipe is only as trustworthy as its examples — if you can find just one instance, say so; if none, leave it to Unknowns.
10. **Write the file** using the exact structure below, including the route-5/global-index pointers.
11. **Hydrate entry points** (next section) and print a 3-line summary: sections/modules/recipes/gates,
    hydrated pointers, Unknowns and resources/commands still `UNKNOWN` and therefore serialized.

## Output structure — write exactly these sections

````markdown
# WORKSPACE_MAP.md — workspace map for agentic feature planning

> Generated by `agentic-planning-kit/PROMPT_INIT.md` on <YYYY-MM-DD>. Complements (does not replace) CLAUDE.md / AGENTS.md / README. Regenerate after structural changes. Every entry is grounded in a real file/command; see "Unknowns" for gaps.

**Planning-map contract:** 4 — includes command side effects, single-writer hotspots, route-5 reconciliation and factual per-subproject quality gates.
**Map maturity:** <factual normally; mixed only during an incomplete greenfield F00 reconciliation>
<!-- Greenfield-origin workspace only: permanently preserve **Blueprint:** `.agentic_planning/<user>/_project_<slug>/PROJECT_BLUEPRINT.md`. While the map is not yet factual use **Greenfield gate:** `F00_PENDING`; the factual INIT changes only the gate to `FACTUAL_READY`, never removes the blueprint reference. -->

## 1. Overview
<2–4 sentences: what the workspace does; single-project workspace vs. multi-subproject workspace (N subprojects); top-level shape.>
<!-- If a workspace: use the per-subproject shaping from "Workspace of subprojects" instead of the flat §2–§9 below. -->

## 2. Stack & toolchain
| Area | Language | Framework(s) | Package manager | Runtime/version |
|------|----------|--------------|-----------------|-----------------|
| ...  | ...      | ...          | ...             | ...             |

**Key libraries — the blessed choice per concern** (so new code uses the right one):
| Concern | Library used | Notes (canonical vs. legacy / where imported) |
|---------|--------------|-----------------------------------------------|
| HTTP client | ... | ... |
| Data access / ORM | ... | ... |
| Validation | ... | ... |
| State management | ... | ... |
| Styling / UI | ... | ... |
| Testing | ... | ... |
| <other> | ... | ... |

## 3. Modules / layers
| Module (dir) | Stack | Responsibility | Entry point (file) |
|--------------|-------|----------------|--------------------|
| ...          | ...   | ...            | ...                |

## 4. Build / run / test commands
| Module | Build | Run / dev | Test | Lint/format | Run from (cwd) | Parallel classification / isolation |
|--------|-------|-----------|------|-------------|----------------|-------------------------------------|
| ...    | `...` | `...`     | `...`| `...`       | `...`          | parallel-safe / isolated by `<key>` / exclusive / UNKNOWN — <side effects> |

### Quality gates (deterministic, exit-code verified)
The commands a code-writing feature step must run and pass before writing its handoff report (see `PROMPT_CREATE_FEATURE.md`). **Factual only** — `MISSING` means the gate does not exist; plans must then bootstrap it explicitly or degrade loudly, never silently.

| Module | Gate | Command (verbatim) | Proves | Run from (cwd) | Parallel classification | Status | Evidence |
|--------|------|--------------------|--------|----------------|-------------------------|--------|----------|
| ... | test / lint / typecheck / <other> | `...` | ... | ... | parallel-safe / exclusive / UNKNOWN | EXISTS / MISSING | `file` |

- **Coverage:** <observed-only — which command emits a figure, if any, or "none">. No thresholds are enforced.
- **Not gates:** mutation testing, BDD runners, coverage thresholds — do not record aspirationally.

## 5. Hard rules / guardrails
- <one bullet per rule; quote the source file. e.g. "Tests run inside the `api` container (`docker exec`) — not on host (CLAUDE.md)".>
- <e.g. writable mode: reversible local/dev migration; read-only/sealed mode: no mutation/repair, server-side denial + zero-diff evidence — see §6 protocol.>
- <e.g. "The DB worked against is the local `docker-compose` service — confirmed dev, never a production host. If compose can't be confirmed as dev, stop (§6 Target environment = UNKNOWN).">
- <e.g. "Never commit `.env`; never echo secrets.">

### Agent concurrency & resource isolation

`UNKNOWN` is a serialization requirement, not permission to assume safety.

| Resource / single-writer hotspot | Scope | Access (`shared_read` / `exclusive` / `UNKNOWN`) | Isolation key / namespace | Parallel-safe only when | Evidence |
|----------------------------------|-------|--------------------------------------------------|---------------------------|-------------------------|----------|
| package manifest / composition root / registry / compose / DB / fixed port / cache / generated dir / `WORKSPACE_MAP.md` / `.agentic_planning/README.md` | `path` or service | ... | ... | ... | `file:line/symbol` |

| Command family | Source/cache/state side effects | Isolation support | Parallel classification | Evidence |
|----------------|---------------------------------|-------------------|-------------------------|----------|
| build/test/lint/compose/migrate | ... | ... | parallel-safe / with isolation / exclusive / UNKNOWN | `file` |

- **Runtime-evidence provisioning (when the workspace has an interactive client — mobile app, desktop UI, authenticated web):** record the declared self-provisioning path so an agent asked to produce runtime evidence knows how to do it without a human: emulator/AVD names and how to boot them headless, physical-device serials (and when to prefer the emulator), tool paths not on PATH (e.g. adb), and any dev/auto-login bypass (mechanism, where credentials live — e.g. untracked `local.properties` keys → debug-only BuildConfig — and the guarantee that it is compiled out of release). If no such path exists, write `UNKNOWN` here explicitly — that tells planners device evidence needs a human-in-the-loop task, not silent blocking.

- **Shared-checkout rule:** <what broad commands read/write; which focused commands can run while peers edit; or UNKNOWN>.
- **Same-checkout constraints:** <what forces two concurrent sessions to share state — fixed ports, a single build cache, one compose project; or UNKNOWN, which means serialize>.
- **Join hotspots:** <files/resources assigned to one later integration owner rather than parallel branches>.

> If `<DB protocol gotchas>` exist, list them in §6, not here.

## 6. Canonical contracts & schemas
| What | Location (file) | Owned by / notes |
|------|-----------------|------------------|
| ...  | `path`          | ...              |

### Database ownership, access mode & migration protocol
<Write "no data store" if there is none. Otherwise:>
- **Data store(s):** <engine + version>.
- **Owner and access mode:** <owner>; <read-write | append-only | read-only | bootstrap-write/runtime-read-only | UNKNOWN>; <lifecycle/cutover boundary>.
- **Principals / roles:** <runtime vs admin/bootstrap identities and env-key names only>; <allowed/forbidden operations>.
- **Migration tool:** <tool + where migrations live (dir)>.
- **Live/dev DB access:** <DB **compose service** name (from `docker-compose*.yml`) + `.env` vars by name (never values); published host/port; network>. <If no access is configured, say so and mirror it to §11 Unknowns.>
- **Change protocol:** <the rule here — e.g. apply to the live dev DB AND add a reversible migration; run the migration inside `<container>`; one statement per op; must survive `down`/`up`>.
- **Target environment:** <dev/compose local | staging | UNKNOWN> — **confirmed from compose:** <how — internal service / `localhost` / local image vs. external or prod host>. **Guardrail:** the "live DB" agents may touch is the **non-production** dev/local instance only. Migrating a **production** database is out of scope for agents — it is a human-run, backup-first operation. If compose (or a `*.prod.yml`/env var) points the DB at a remote/prod host, or you cannot confirm it is dev, set this to **UNKNOWN** and say so here and in §11 Unknowns.
- **Gotchas:** <schema qualification, RLS / row ownership, async-driver one-statement rule, seed data, etc.>.
- **Immutability evidence (when read-only/sealed):** <server-side denied-operation matrix, credential separation, before/after fingerprints; no migration recipe>.

## 7. Conventions, principles & practices

### Code style & conventions
- **Identifiers / code comments:** <language>.
- **User-facing copy:** <language>.
- **File / folder organization:** <how code is grouped — by layer, by feature, etc.; cite an example>.
- **Naming:** <casing + key conventions; lint/format config location>.
- **Models / DTOs:** <how data shapes are defined — e.g. pydantic, dataclasses, TS interfaces, data classes; cite an example>.
- **Error handling:** <pattern — domain exceptions mapped at the edge, Result types, error middleware; cite an example>.
- **Dependency direction / layering:** <who may import whom — e.g. routers→services→data, never the reverse>.
- **Test style:** <framework, where tests live, fixtures, AAA vs. table-driven; cite an example test>.
- **Last structural change:** <what changed and when, if discoverable>.

### Engineering principles & practices (the repo's real bar)
Rate each **strict / pragmatic / absent** and cite an exemplar — this is the bar a new feature must meet, not raise unilaterally.
| Practice | Level | How it shows up here (exemplar file) |
|----------|-------|--------------------------------------|
| Contract / interface-first (interfaces, ports, protocols, ABCs, traits defined apart from impls) | strict/pragmatic/absent | `...` |
| Dependency injection / inversion (constructor injection, DI container, `Depends`…) | ... | `...` |
| SOLID — single responsibility (module/class size & focus) | ... | `...` |
| SOLID — open/closed & substitutability (extension points, no type-switching) | ... | `...` |
| Abstraction architecture (layered / hexagonal ports-&-adapters / clean / pragmatic) | ... | `...` |
| Type safety (typed throughout? strict mode / mypy?) | ... | `...` |
| Immutability & pure functions | ... | `...` |
| Validation at boundaries | ... | `...` |
| Testing bar (unit/integration, mocking style, coverage signals) | ... | `...` |

> Where the repo has **no precedent** for a practice, a feature may apply a sensible default (interface-first for a new seam, SRP, tests) **without over-engineering** — never impose a paradigm the repo doesn't use.

## 8. Seams (attachment points)
| Concern | file:symbol | Notes |
|---------|-------------|-------|
| HTTP routing | `...` | how a new endpoint is added |
| Data / persistence | `...` | how a new table/record/migration is added |
| Auth / tenant boundary | `...` | |
| UI navigation / routing | `...` | how a new screen/route is added |
| Background jobs / queue | `...` | |
| Validation | `...` | |
| Shared registration / integration hotspot | `...` | single writer; concurrent steps serialize here |
| <others discovered> | `...` | |

## 9. Patterns & recipes — how to add a new ___
Each recipe is generalized from real examples and cited. A feature plan points its steps at these so generated code imitates what exists. Only include recipes backed by ≥1 real instance; thin evidence is flagged.

| Recipe ("add a new ___") | Ordered steps (file:symbol → file:symbol) | Typical step-owned write area | Shared integration file/resource | Exemplar(s) | Blessed libs | Confidence |
|--------------------------|-------------------------------------------|---------------------------------|----------------------------------|-------------|--------------|------------|
| endpoint | 1) router in `...` 2) service in `...` 3) register in `...` 4) test in `...` | `feature/path/**` | `router registry` (single-writer join) | `path` (+1 more) | <from §2> | high / from N examples |
| model + migration | ... | ... | ... | `path` | ... | ... |
| UI screen / route | ... | ... | ... | `path` | ... | ... |
| background job | ... | ... | ... | `path` | ... | ... |
| <other recurring unit> | ... | ... | ... | `path` | ... | ... |

## 10. Existing docs & planning
- `CLAUDE.md` / `AGENTS.md`: <present? what it covers>
- **Global close/index:** `.agentic_planning/README.md` links direct-child `SESSION.md` files (the source of truth); route 5 `RECONCILE FEATURE` runs automatically in every final feature step after gates and reconciles map facts, pointers and the index.
- Other key docs: <links>

## 11. Unknowns
- <anything you could not determine, phrased as a question for a human>

---
_Map only. Code lives in the repo; binding contracts live in the files referenced in §6; the way to add new code lives in §9; the gates new code must pass live in §4._
````

## Workspace of subprojects (the common case)

Most targets of this kit are a **workspace holding several independent subprojects**, each with its **own toolchain, its own `docker-compose` and possibly its own database**. Treat this as the norm. When you detect it:

1. **Run discovery (steps 2–9) once per subproject**, scoped to that subproject's files. Each subproject gets its **own** stack/libs, commands (+cwd), quality gates, hard rules, **database & migration protocol — built from *its own* `docker-compose*.yml` and its own dev-DB confirmation**, seams, conventions/principles, and recipes. A feature touching subproject X must ground in X's compose and X's DB, **never another subproject's** — so do not merge them. Quality gates are honest per subproject: one subproject may have a strong suite while its sibling has `MISSING` gates — record both truthfully.
2. **Analyze every subproject's compose.** Each subproject's `docker-compose*.yml` is mandatory reading; confirm **each** DB target resolves to a local/dev instance independently (§6 guardrail, per subproject).
3. **Shape `WORKSPACE_MAP.md` per subproject** instead of one flat set of sections:

````markdown
## 1. Overview
<Workspace of N subprojects; one-line each; whether the workspace root is itself a buildable project or just a container of subprojects.>

## 2. Subprojects (workspace layout)
| Subproject (dir) | Stack | Own compose? | Has DB? | Purpose | Own CLAUDE.md/AGENTS.md? |
|------------------|-------|--------------|---------|---------|--------------------------|
| ...              | ...   | ...          | ...     | ...     | ...                      |

### Cross-cutting (workspace-wide)
- **Hard rules:** <e.g. "cd into the subproject before building; each subproject owns its own toolchain">.
- **Startup / dependency order:** <e.g. "B must be up before A"; shared networks>.
- **Shared contracts / domain:** <any spec or types shared across subprojects, with location>.
- **Cross-subproject concurrency:** <shared ports/networks/services/caches/global files; access mode/isolation key; UNKNOWN means serialize>. Do not infer one subproject's isolation from another's compose.

## <subproject dir>   ← repeat this block per subproject
- **Stack & blessed libs:** ...
- **Commands (+cwd) & compose services:** ...
- **Quality gates:** <gate → command (verbatim) + cwd + parallel classification + EXISTS/MISSING; coverage observed-only note; or "all MISSING" honestly>.
- **Agent concurrency / resources:** <command classification, product/generated/cache/temp side effects, single-writer hotspots, shared_read/exclusive/UNKNOWN resources, isolation keys, same-checkout constraints, and same-checkout constraints or UNKNOWN>.
- **Hard rules:** ...
- **Canonical contracts & DB/access protocol:** <owner, access mode, lifecycle boundary, principals, allowed/forbidden ops, compose service, dev confirmation, migration tool only if writable, gotchas — or "no data store">
- **Seams (file:symbol):** ...
- **Conventions / principles:** <or "same as workspace default">
- **Recipes (add a new ___):** ...
## Existing docs & planning
- **Global close/index:** `.agentic_planning/README.md` links direct-child `SESSION.md` files; every final feature step runs route 5 to reconcile it, map facts and managed pointers.
## Unknowns
````

Keep each subproject self-contained: a planner reading one subproject's block has everything to ground a step there — including which gates its code steps must pass. If a subproject genuinely shares the workspace defaults, write "same as workspace" rather than repeating.

## Hydrate the agent entry points

After the map is written, make the repo's agent entry points point to it. The block is **managed and idempotent**: delimited by HTML-comment markers so it is invisible when rendered, and re-running INIT replaces the block in place (never duplicates it, never touches text outside the markers).

The managed block (identical content for `CLAUDE.md` and `AGENTS.md`):

```markdown
<!-- agentic-routes:begin — managed by agentic-planning-kit. Edit WORKSPACE_MAP.md, not this block. -->
## Workspace map

This workspace has a generated route map at [`WORKSPACE_MAP.md`](./WORKSPACE_MAP.md): stack and blessed libraries, modules/subprojects, build/test commands (and where they run), quality gates, hard rules, contracts, shared-resource constraints, seams, conventions and recipes. **Read it before planning or implementing changes.** Normal feature planning requires `Map maturity: factual`; if it is `mixed`, complete F00 and its factual handoff first. Plans live under your own `.agentic_planning/<username>/`; their final step must automatically run `agentic-planning-kit/TRIGGERS.md` route 5 to reconcile this map, managed pointers and the global `.agentic_planning/README.md` index. Regenerate broadly with `PROMPT_INIT.md`.
<!-- agentic-routes:end -->
```

Rules per target:

- **`CLAUDE.md`** — if it exists, insert the block near the top (after the title/first heading) or replace the existing managed block. If it does **not** exist, create a minimal `CLAUDE.md` containing only the managed block.
- **`AGENTS.md`** — same rule as `CLAUDE.md`.
- **Cursor** — only if the workspace already uses Cursor (a `.cursor/` directory or a `.cursorrules` file exists). Do **not** edit the user's existing rule files. Instead:
  - Modern format (`.cursor/rules/`): create/replace `.cursor/rules/agentic-routes.mdc` with frontmatter `---\ndescription: Workspace route map\nalwaysApply: true\n---` followed by the managed block body (the prose, without the HTML markers).
  - Legacy `.cursorrules`: append/replace the managed block (with markers) at the end.
- **Other entry points** (e.g. `.github/copilot-instructions.md`, `.windsurfrules`, `.clinerules`) — if one is present, hydrate it the same way (managed block, idempotent); if absent, skip it. Do not create entry points for tools the workspace doesn't use.
- **Workspace of subprojects:** if `WORKSPACE_MAP.md` covers a workspace and a subproject has its own `CLAUDE.md`/`AGENTS.md`, hydrate each subproject's file too, pointing at the same root map (relative path).

Keep the block a *pointer*, never a copy: do not paste stack/commands/seams/gates into the entry points — they read the map for that.

## Constraints

- **Writes in `INIT`:** `WORKSPACE_MAP.md` and managed pointer blocks only (plus an F00 note in its own outputs). **`RECONCILE_FEATURE` additionally writes** `.agentic_planning/README.md`'s managed index and the invoking user's status row; it may read, never write, other sessions. No product-code edits, refactors or edits outside markers.
- **Do not run state-changing commands.** Inspect manifests and configs; do not start servers, run installers, run migrations, or invoke build/test commands. You are *reading* the commands, not executing them. This applies to gate commands too — INIT records them; feature steps run them.
- **Do not claim concurrency safety without evidence.** A declared namespace/isolation key or disjoint side effect may prove safety; absence of evidence is `UNKNOWN` and future plans serialize that command/resource. Safety and data-store rules override parallelism.
- **Never echo secrets.** Do not copy `.env`, tokens, keys, or connection strings into the file. Reference them by name only.
- **Tables over prose.** A map, not an essay. If a section has nothing real to put in it, write "none found" — do not pad. A subproject with no gates gets `MISSING`, not filler.
- If `WORKSPACE_MAP.md` already exists, **update it in place** (preserve human edits where they don't conflict), don't blindly overwrite. A pre-existing map without Quality gates tables gains them.

## Deliverable

`INIT` delivers `WORKSPACE_MAP.md` (flat or per-subproject, with stack, commands, gates, DB protocol, resources, seams, conventions, recipes and route-5/global-index pointers) plus managed entry-point blocks. `RECONCILE_FEATURE` updates its affected facts/pointers, the invoking status and the generated global index. Print the appropriate compact summary: map maturity/subprojects/gates/pointers/Unknowns for INIT; feature/map/index/status for reconciliation.
