# PROMPT_INIT_NEW_PROJECT — Design and bootstrap an empty project

You are a code agent (Claude Code / Cursor / Codex) running at the **workspace root**. Execute this
file as your complete task spec for exactly one explicitly selected phase.

The launcher supplies only what a person knows:

```text
USER: <username — required in every mode; decides where you write>
MODE: <PROPOSE | REFINE | MATERIALIZE>
PROJECT: <slug; optional when this same session created or refined it>
PROJECT_INTENT: <free text; required for PROPOSE>
HUMAN_FEEDBACK: <required for REFINE>
MATERIALIZE_AUTHORIZATION: <empty on the first MATERIALIZE call; `MATERIALIZE <slug>` on the second>
```

Never infer `MODE`. Never ask a human for a hash, a commit, a revision number or an identifier —
this route has none. If required fields for the selected mode are absent, stop and request only the
missing ones. The route is human-in-the-loop because no factual architecture exists yet.

**Resolve `PROJECT` yourself** when the launcher omitted it: (1) the project this session already
created or refined; (2) the only project under `.agentic_planning/<USER>/`, when exactly one exists.
Otherwise list the candidates and stop. Never guess between two, and never read another user's
directory to resolve it.

---

## Goal

Turn a project idea in an empty or planning-only workspace into one reviewable blueprint, zero or
more human refinement cycles recorded as decisions, an explicitly authorized **F00 scaffold plan that
is executable the moment it exists**, a bootstrap `WORKSPACE_MAP.md` separating `EXISTING`, `PLANNED`
and `UNKNOWN` claims, and a first-feature roadmap that becomes plannable once F00 executes and INIT
makes the map factual.

This prompt never writes product code, source directories, package manifests, dependency lockfiles,
Dockerfiles, compose services, CI, databases, cloud resources, environments or credentials.
`MATERIALIZE` means materialize **the plan**, not implement the project.

## Choose the correct route first

- Use this route only when the target is empty or holds planning/tool metadata: version-control
  metadata, placeholder docs, this kit, agent instructions and existing planning directories.
- If buildable source, package manifests, compose/runtime files, migrations, product tests or a
  factual `WORKSPACE_MAP.md` exist, stop **without writes** and send the operator to route 1, then 2.
- A partially created scaffold with ambiguous ownership is `BLOCKED_CONFLICT`: list the exact paths
  and ask which project owns them. Never adopt or overwrite it. The workspace root is the target.

## Human gate versus normal feature autonomy

The gate here is limited to greenfield definition; it does not weaken the normal rule that
deterministic gates decide correctness without a human bottleneck. `PROPOSE` may assume only
visible, reversible, low-risk defaults. `REFINE` records explicit feedback and repeats as often as
needed. `MATERIALIZE` needs the phrase plus readiness `PASS`. Silence, a timeout, absent feedback or
model confidence is never acceptance. Delegation of low-risk choices is recorded as `human_delegated`
and never waives data ownership, production writes, secret handling, security, privacy, compliance
or irreversible operations.

## Inputs to read in every phase

Root `CLAUDE.md`, `AGENTS.md`, `README*` and any existing `WORKSPACE_MAP.md`; this kit's
`PROMPT_CREATE_FEATURE.md` and `SESSIONS.md`; the project's current `PROJECT_BLUEPRINT.md` and
`DECISIONS.md` in `REFINE`/`MATERIALIZE`; and the target tree read-only — hidden files, manifests,
workflows, executable scripts, compose files and symlinks — enough to classify it as `empty`,
`planning_only`, `partial_conflict` or `existing_project`.

Never treat a planning document or a reference project as evidence that a framework, command, seam,
recipe or quality gate already exists in the target.

## The project tree

Everything lives in the invoking user's session, and nothing else in the workspace changes until
`MATERIALIZE`:

```text
.agentic_planning/<USER>/_project_<slug>/
├── PROJECT_BLUEPRINT.md   # ONE file, edited in place, ≤400 lines, the 10 sections below
├── DECISIONS.md           # ONE file, append-only table + one detail block per decision
└── F00/                   # created by MATERIALIZE only
    ├── FEATURE_F00.md
    ├── TRIGGERS.md
    ├── steps/NN-<slug>.md
    └── outputs/
```

`MATERIALIZE` additionally creates, at the workspace root, a bootstrap `WORKSPACE_MAP.md` **only if
none exists** — if one is already there, leave it untouched and say so in your summary — plus the
managed pointer block in `CLAUDE.md` / `AGENTS.md`.

There is no revisions directory, no state file, no manifest, no lock, no receipt and no JSON. The
blueprint carries a `## Historial de revisiones` table at the top — one row per revision: date, the
change in one line, the readiness verdict after it. Older wording lives in version control, or
nowhere; that is the operator's choice, not this kit's.

## Blueprint contract

`PROJECT_BLUEPRINT.md` has exactly these ten sections and stays under 400 lines. Be concrete; length
is not rigor. Cover every applicable concern below inside its section — do not add sections.

1. **Identity, problem, actors, outcomes.** What is being built, for whom, and what changes for them.
   State the target classification you observed (`empty` or `planning_only`) and on what evidence.
2. **Scope, non-goals and measurable success.** What is explicitly not built, and how success is
   measured.
3. **User journeys and capabilities**, without implementation inflation.
4. **Domain, API and event contracts** known at this stage. Unresolved shapes stay explicitly
   unresolved; do not invent one to look complete.
5. **Architecture**: modules, dependency direction, integration boundaries.
6. **Stack, versions, support and license**, with the official-evidence table (below). One row per
   technical choice that depends on a current fact.
7. **Data, secrets and security**: per store — owner; access mode
   (`read-write|append-only|read-only|bootstrap-write/runtime-read-only|no_store|UNKNOWN`);
   lifecycle; principals and environment-variable key names; allowed and forbidden operations;
   migration protocol only for authorized writable phases. Then authentication, authorization,
   tenant boundary, data sensitivity and compliance assumptions, and the secret policy: classes,
   providers, key names, rotation boundary and prohibited storage or logging. **Never a value.**
8. **Environments, layout, commands and operations**: local/dev/staging/production boundaries with
   `agent_write` per environment (staging and production default to `false`); the planned workspace
   layout marking planned paths as planned; the planned build/test/lint/package/run commands, marked
   non-executable until F00 creates them, and which of them are intended to become the subproject's
   **quality gates**; observability, error handling, logging and redaction.
9. **F00 and concurrency**: F00's exact scaffold scope, non-goals, rollback and acceptance gates,
   plus the proposed single-writer hotspots, write scopes, resource modes and isolation keys.
10. **Roadmap, risks and readiness**: the first-feature roadmap as a dependency graph with candidate
    parallel fronts and a ready-to-paste route-2 description per intent; then risks, assumptions,
    open unknowns with an owner each, and the readiness verdict.

Do not select a data owner, access mode, production target, secret mechanism, security boundary or
irreversible operation merely because it is common. `no_store` is a valid, explicit data decision.

### Official-evidence table (blueprint §6)

| Claim | Source kind | Publisher + URL | Version/tag | Retrieved | Supports | Agent inference |
|---|---|---|---|---|---|---|

Source kind is `official_docs`, `official_repository`, `registry` or `standard`. Keep the source
fact and your own inference in separate columns. If current evidence cannot be reached for a claim
F00 depends on, the readiness verdict is `NOT READY` naming that claim — do not substitute memory
for a version lock. A row is required whenever a choice depends on current versions, compatibility,
support or end-of-life, license, hosting topology, security behavior or API availability. Never copy
a secret or confidential configuration out of a reference file into a row.

## Decisions contract

`DECISIONS.md` is append-only and human-readable. An index table at the top, newest first:

| ID | Question | Decision | Status | Authority | Date |
|---|---|---|---|---|---|

`ID` is `D-01`, `D-02`, … — sequential, typeable, never a UUID. Below the table, one short block per
decision with **Rationale**, **Alternatives**, **Consequences**, **Affects** (blueprint sections) and
**Supersedes** when applicable.

- Status: `PROPOSED` · `ASSUMED_BY_POLICY` · `ACCEPTED` · `REJECTED` · `SUPERSEDED` · `DEFERRED`.
- Authority: `explicit_human` · `human_delegated` · `agent_low_risk_policy`.
- Changing a decision **appends** a new one that supersedes the old and flips the old row's status.
  History is never rewritten and never deleted.
- `ASSUMED_BY_POLICY` is allowed only for reversible, low-risk defaults visible in the proposal, and is forbidden for data, security, privacy, secret, production and irreversible decisions. `MATERIALIZE` accepts every visible one as a batch; to reject or change one, run `REFINE` first.
- `ASSUMED_BY_POLICY` is allowed only for reversible, low-risk defaults visible in the proposal, and
  is forbidden for data, security, privacy, secret, production and irreversible decisions.
  `MATERIALIZE` accepts every visible one as a batch; to reject or change one, run `REFINE` first.
## Readiness gate

Readiness is boolean, not a score, and lives in blueprint §10 as `PASS` or `NOT READY` with the
failing items named. It is `PASS` only when all of these hold:

- the target is empty or planning-only, and its classification is stated;
- scope, non-goals, actors and success outcomes are coherent, and architecture, contracts and
  dependency directions are coherent enough for F00;
- the stack, versions and support policy have sufficient official evidence;
- every applicable data owner, access mode, lifecycle, principal and operation decision is explicit,
  as are the secret, security, privacy and tenant boundaries and the local/dev versus
  staging/production write boundaries;
- F00's planned paths, write scopes, exclusive resources, rollback and acceptance gates are bounded,
  its planned commands and their generated/cache/temp effects are identified including the intended
  gates, and concurrency hotspots and isolation are defined or fail closed;
- no decision F00 depends on is still `PROPOSED`, and no blocking unknown remains.

A non-blocking unknown must have an owner, a rationale and a deferred feature. The authorization
phrase never substitutes for readiness.

---

## MODE `PROPOSE`

Produce the first complete proposal from `PROJECT_INTENT` without making the human answer everything
up front.
1. Verify `.agentic_planning/<USER>/` exists; if not, create it with a minimal `SESSION.md` and say so.
2. Classify the target. `partial_conflict` stops with `BLOCKED_CONFLICT` and the exact paths.
3. Derive a readable `<slug>` (kebab-case, ≤4 words). If `_project_<slug>/` already exists under this
   user, stop and ask whether to refine it or pick another slug.
4. Parse explicit user decisions separately from your own proposals and low-risk assumptions, and run
   a bounded read-only research pass for the choices that need official evidence.
5. Write `PROJECT_BLUEPRINT.md` (all ten sections, `## Historial de revisiones` row 1) and
   `DECISIONS.md`. Write nothing else — no root blueprint, no map, no pointer block, no F00 — then add
   the project's row to `SESSION.md` under `## Proyectos`, status `📝 Diseñada`.
6. Return a compact summary: outcomes, architecture and stack recommendation, F00 scope, the feature
   roadmap, risks, assumptions, the readiness verdict and **at most three** highest-impact questions.
   Do not withhold the proposal merely because feedback would improve it.

## MODE `REFINE`

Repeatable, as often as needed.

1. Read `HUMAN_FEEDBACK` literally. Classify each item as accept, reject, change, defer, question or
   delegated low-risk choice. Do not interpret silence.
2. If F00 already exists for this project, stop with `BLOCKED_FROZEN`: a change after materialization
   is an ordinary feature or a fix, not a re-plan. Say that plainly and stop.
3. **Edit `PROJECT_BLUEPRINT.md` in place.** Do not copy it, do not create a revision directory, do
   not leave a superseded duplicate on disk. Add one row to `## Historial de revisiones` describing
   the change in one line, and update the readiness verdict in §10.
4. Append decisions to `DECISIONS.md`, flipping superseded rows. Never rewrite an existing block.
5. If nothing changed semantically, write nothing and report `NO CHANGE` with the reason.
6. Return: what changed, decisions appended or superseded, roadmap changes, the readiness verdict,
   remaining blockers and at most three next questions.

## MODE `MATERIALIZE`

Two calls, and the only thing the human types is the project slug.

**First call** — `MATERIALIZE_AUTHORIZATION` empty:

1. Resolve the project, re-read the blueprint and decisions, run the full readiness check.
2. **Write nothing.**
3. Print, in this order: the readiness verdict; the project you resolved; a plain-language summary of
   exactly what will be created, path by path; the `ASSUMED_BY_POLICY` decisions being accepted as a
   batch; and then the phrase, already filled in: `MATERIALIZE <slug>`.
4. Stop with `AUTHORIZATION_REQUIRED`.

**Second call** — the phrase pasted back: re-resolve, re-check readiness, and confirm the phrase
names the project you resolved. If it names a different project, refuse. Readiness must be `PASS` on
both calls. A generic "continue", a bare "yes", approval of an earlier state, silence or model
confidence is never acceptance.

### What MATERIALIZE writes

- `.agentic_planning/<USER>/_project_<slug>/F00/` — the complete F00 plan (contract below).
- Root `WORKSPACE_MAP.md` — bootstrap map, **create-new only**. If one exists, leave it and report it.
- The managed pointer block in `CLAUDE.md` / `AGENTS.md`, creating them minimally if absent and
  preserving every line outside the markers.
- The `## Proyectos` row in `SESSION.md`, flipped to `🔄 En ejecución`, and a one-line note at the top
  of the blueprint saying F00 is materialized and where its triggers are.

It must not create product or test directories, package manifests, lockfiles, Dockerfiles, compose
files, CI, environments, databases or cloud resources.

### Bootstrap map contract
The bootstrap map is honest, non-factual planning state. It uses the section structure of
`PROMPT_INIT.md`, adds `Map maturity: bootstrap` at the top, and marks every claim `EXISTING`
(observed right now, with its path as evidence), `PLANNED` (intended, produced by a named feature,
consumable as design input by F00 only) or `UNKNOWN` (undetermined; it blocks what depends on it).
Never label a planned command, seam, library, recipe, store, resource or quality gate as `EXISTING`.
If a real fact conflicts with the approved target, keep the fact and add a planned delta; never
rewrite reality to match intent.

### F00 feature-plan contract

Generate `F00/` using the anatomy and safety rules of `PROMPT_CREATE_FEATURE.md` — single-session
steps with explicit dependencies, one trigger per step, a suggested model effort each, handoff
reports ≤40 lines, a manual QA checklist in Spanish; no cycles, no DAG json, no rubrics — with these
narrowly scoped greenfield exceptions:

- F00 grounds in the blueprint, the decisions, the official evidence and the `EXISTING` root facts;
  it may consume the `PLANNED` claims the blueprint allowlists for F00.
- F00 needs no factual seams or recipes, because its purpose is to create the first ones. Reports
  mark new patterns as `thin` until INIT observes them. Its steps run **strictly sequentially**.
- Gates apply only from the step that creates them onward — **the gauntlet cannot precede its own
  creation**. From that step on, every code-writing step passes the just-created gates and records
  each command and exit code.

No other feature gets these exceptions.

**F00 is executable as soon as this call finishes.** There is no registration, reconciliation,
integration or approval between materialization and the first step. Print its trigger path.

F00's scope is limited to: the selected toolchain and package manifests plus lock policy; a minimal
installable, buildable source skeleton; a minimal non-business entrypoint when needed to prove build
and run wiring; test/lint/format/build configuration and focused smoke checks — **these become the
subproject's first quality gates**; environment examples with key names and placeholders only;
approved architecture and decision docs, agent pointers and local-safe wiring; and command/resource
isolation documentation. It excludes business behavior and F01+ capabilities; production or staging
mutation and deployment; live data, seeding, imports, migrations and schema changes, unless the
blueprint makes an isolated local bootstrap foundation-critical and the human accepted it;
credentials and secret values; anything not in the blueprint; and coverage thresholds, mutation
testing or BDD runners — the first gates are only what exists and exits 0 or 1.

Its binding invariants, on every step: zero secret material; zero staging, production, cloud or
account mutation; dependency versions and locks matching the official evidence; data-store owner,
mode, principals and operations matching the accepted decisions; any allowed local bootstrap being
explicitly authorized, ephemeral, namespaced and cleanup-verified; zero business or F01+ behavior.
Anonymous reads from public registries and official documentation may be declared F00 command
effects; authenticated registries, accounts and any external state write are blocked.

Required execution shape, one trigger per step: read-only target audit → scaffold and toolchain steps
in dependency order (manifests → source layout → quality config, which creates the first gates →
docs and env) → factual INIT using `PROMPT_INIT.md` (trigger 1) → the user performs the manual QA
checklist in `FEATURE_F00.md` §7.

### After F00

Once F00's steps finish and INIT sets `Map maturity: factual`, the user runs the manual QA checklist.
If it passes, the roadmap intents in blueprint §10 become plannable: run route 2 once per intent with
that intent's ready-to-paste description as the feature text, and from then on every code-writing
step passes the gates F00 created. Defects found in QA become ad-hoc fixes before planning F01+.

### Managed pointer block

Hydrate existing or created `CLAUDE.md` and `AGENTS.md` with this idempotent block, preserving every line outside the markers and substituting the real path.

```markdown
<!-- agentic-routes:begin — managed by agentic-planning-kit. -->
## Project blueprint and bootstrap map

Read `.agentic_planning/<USER>/_project_<slug>/PROJECT_BLUEPRINT.md` and `WORKSPACE_MAP.md` before
work. The map is `bootstrap`: only `EXISTING` claims are facts; F00 may consume its allowlisted
`PLANNED` design inputs; `UNKNOWN` blocks the work that depends on it. No product feature other than
F00 may be planned until F00 executes and INIT sets map maturity to `factual`. Planning routes live
in `agentic-planning-kit/TRIGGERS.md`; every route writes under your own
`.agentic_planning/<username>/`.
<!-- agentic-routes:end -->
```

When F00's INIT sets the map to factual, it replaces this block with the normal one from
`PROMPT_INIT.md`.

---

## Constraints shared by all modes

- No product code and no external mutation in any mode. Never run version-control commands, install
  dependencies, run generators, start services, create databases, call deployment APIs or contact
  people. External research is read-only and prefers primary sources when current facts matter.
- Never write a secret value, token, password, private key, authenticated URL or DSN into any
  artifact — classes and environment-variable key names only. If `PROJECT_INTENT` carries possible
  secret material, write a redacted placeholder and warn.
- Write only under `.agentic_planning/<USER>/`, plus the root artifacts `MATERIALIZE` is allowed.
  **Never write into another user's session directory**, for any reason.
- Preserve existing user files; never adopt, overwrite, move or delete an ambiguous target. A risky
  unknown is a blocker, not permission to choose a convenient default. Nothing here may weaken F00's
  binding invariants or route 2's map requirements.
- Nothing here may weaken F00's binding invariants or route 2's map requirements.

## Phase completion responses

- `PROPOSE`: project slug and path, readiness verdict, assumptions, roadmap fronts, up to three questions.
- `REFINE`: what changed or `NO CHANGE`, decisions appended and superseded, readiness verdict,
  remaining blockers, up to three questions.
- `MATERIALIZE`: the authorized slug, every path created, whether the bootstrap map was written or
  already existed, the F00 trigger path, the roadmap intent count, and the sentence
  `planning materialized; product not implemented; F00 is executable now`.
