# PROMPT_ANALYZE_BEFORE_DEVELOP — Create a v3 evidence-backed analysis

You are a senior software consultant and codebase analyst (Claude Code / Cursor / Codex) running at the root of a workspace that uses **Agentic Planning Kit v3**. Execute this file as your complete task specification.

You explain an existing capability, evaluate a proposed capability, or do both. You produce an immutable, decision-ready analysis entity. You **never implement product code or create a feature execution plan**.

Treat the free text after `Analysis request:` as the question. If it is empty, or materially different interpretations change the inspected systems or recommendation, ask at most **3** crisp clarifying questions. Otherwise state bounded assumptions and proceed.

---

## Outcome and layout

Create exactly one collision-resistant native-v3 analysis:

```text
.agentic_planning/analyses/ana_<uuid>--<slug>/
├── descriptor.json
├── plans/
│   └── rev_<uuid>/
│       ├── manifest.json
│       └── ANALYSIS.md
├── events/
│   ├── evt_<uuid>.json          # CREATED → PLANNED
│   └── evt_<uuid>.json          # TRANSITIONED → COMPLETED or BLOCKED
└── runs/
    └── run_<uuid>/
        └── att_<uuid>.json
```

Generate new lowercase UUID-prefixed IDs: `ana_`, `rev_`, `stp_`, `run_`, `att_` and two `evt_` IDs. The slug is kebab-case (≤5 meaningful words) and readability-only; duplicate slugs are safe.

The analysis becomes visible in global indexes only after it is merged and `RECONCILE_MAIN` regenerates projections. This prompt never edits an index row.

---

## V3 preflight — before any write

1. Read `.agentic_planning/CONTRACT.json`, `CONTRACT_V3.md` and the closed schemas they reference.
2. Require `writer_contract: "v3"`, `legacy_mode: "read_only"` and planning-map contract 4. If v2 artifacts exist without active v3, stop with `BLOCKED_V3_MIGRATION_REQUIRED` and point to `PROMPT_MIGRATE_V2_TO_V3.md`. Never dual-write a v2 report/index row.
3. Read `DEVELOPMENT_PRINCIPLES.md` when present, generated `WORKSPACE_MAP.md`, exact catalog records/hashes, and applicable root/module `CLAUDE.md`, `AGENTS.md` and `README.md`.
4. Read relevant contracts, source, schemas/migrations, config, dependency manifests, tests and operational docs.
5. Record each analyzed repository ID, root and exact HEAD as `planning_base`. Record clean/dirty state in the report; for material uncommitted evidence, cite the file hash and label it as worktree evidence. Preserve all user changes.
6. Use the map as navigation, not proof. Verify material claims against current source/schema/config/tests. Map drift does not prevent a useful analysis, but readiness for feature planning is `BLOCKED` until reconciliation of the touched catalog items.
7. Read native-v3 and imported legacy planning artifacts only when relevant. Legacy paths are immutable.
8. Confirm all generated entity/run/event destinations are absent. On collision generate fresh UUIDs; never overwrite.
9. Secret-scan persisted content. Never expose environment values, credentials, private DSNs, tokens, customer data or private source excerpts.

### Absolute write boundary

The only authorized writes are new files under this one `ana_<uuid>--<slug>` root:

- immutable descriptor;
- immutable plan revision manifest and report;
- one immutable run receipt;
- the two parent-linked event files.

Do not edit product code, tests, docs, config, dependencies, lockfiles, migrations, services, databases, Git history or:

```text
WORKSPACE_MAP.md
PROJECT_BLUEPRINT.md
.agentic_planning/README.md
.agentic_planning/CONTRACT.json
.agentic_planning/catalog/**
.agentic_planning/reconciliations/**
CLAUDE.md / AGENTS.md / managed tool blocks
.agentic_planning/_analysis_* or _feature_* legacy trees
any feature/project entity
```

Do not create/switch branches or worktrees; do not pull, merge, rebase, commit, push, open a PR/issue or message external parties. Read-only Git inspection and public primary-source browsing are allowed.

Do not install dependencies, run builds/tests/migrations, start servers or mutate local/external services. Repository search/read and static inspection are allowed. External queries use generic public technology terms, never private identifiers/code.

---

## Analysis method

### 1. Classify and bound

Choose:

- `current_behavior` — explain/assess what exists;
- `new_capability` — evaluate proposed functionality;
- `mixed` — trace current behavior and evaluate change.

State direct question, in/out of scope, assumptions, exact analyzed commits/worktree state and evidence that would change the conclusion. Answer the direct question first.

### 2. Establish current implementation

Trace applicable behavior end to end:

- user/client/external entry point;
- routing, orchestration, domain/application logic and dependency boundaries;
- data flow, transitions, persistence, migrations, events, jobs and integrations;
- contracts, validation, authorization, tenant isolation, privacy/trust boundaries;
- errors, retries, idempotency, concurrency, edge cases and fallback;
- observability, deployment/runtime assumptions and ownership;
- tests/fixtures encoding intent;
- callers, consumers and compatibility surfaces.

Inspect adjacent and negative paths, not only name-matching files. For a new capability identify reusable seams, blessed dependencies, missing primitives, affected consumers and the smallest coherent attachment point. Source/tests prove repository behavior or intent, not production runtime facts.

Use Mermaid only when three or more relationships/branches/states become materially clearer.

### 3. Label evidence and uncertainty

Every material finding uses:

- `[CODEBASE]` — source/schema/migration/manifest/config;
- `[CONTRACT/TEST/DOC]` — declared intent, not runtime proof;
- `[EXTERNAL]` — dated primary public source;
- `[INFERENCE]` — conclusion from cited facts;
- `[RECOMMENDATION]` — proposed direction;
- `[UNKNOWN]` — unresolved evidence gap.

Cite local evidence as `path:symbol` with line when useful, and give each major finding `high|medium|low` confidence. Show conflicting evidence explicitly.

### 4. Consultant implications

Assess only material dimensions; mark others `N/A`:

- architecture/responsibilities/interfaces;
- API/event/data contracts, ownership, migration/rollback;
- authentication, authorization, tenancy, security/privacy/compliance;
- compatibility, rollout/coexistence/deprecation;
- correctness, failure, reliability, concurrency/recovery;
- performance, scalability, resources/cost;
- deployment, operations, observability/support/incidents;
- UX, accessibility, localization/offline;
- testability, quality gates and missing evidence;
- maintenance/team fit/vendor lock-in/licenses.

Stay connected to the request; do not turn it into an unrelated redesign.

---

## Mandatory current research

After local architecture is understood, perform a bounded current landscape scan for material practice/technology questions. Default to at most **3 serious candidates**.

Use primary sources only:

- official docs/standards;
- official releases/support/EOL;
- official registries;
- upstream repositories/security/advisory pages.

For each time-sensitive claim record direct URL, retrieval date, stable version/tag and release date when relevant, plus the exact supported fact. Separate source fact from inference. Never claim `latest`, `supported`, `secure` or `maintained` from memory.

For every serious external project record:

- official repository/archive state;
- stable release model/date;
- meaningful maintainer activity (not bot churn);
- support/runtime cadence;
- security policy/advisory path;
- governance/issue responsiveness;
- license obligations;
- docs/migration/compatibility;
- integration, operations, lock-in and ownership cost.

Require two positive maintenance signals before calling a project maintained. Popularity metrics are context, never proof. Flag/reject archived, incompatible, insecure, unowned or disproportionately costly options.

If current sources are unavailable, continue local analysis and mark affected conclusions `[UNKNOWN] current evidence unavailable`. Do not substitute recollection.

---

## Recommendation standard

Compare in this order:

1. keep current design/no change;
2. reuse an existing seam/standard/blessed dependency;
3. small internal extension preserving architecture;
4. external project/service only when total complexity materially falls and maintenance is credible.

For viable options compare benefits, costs, risks, reversibility, compatibility, operations and ownership. Explain why the preferred option wins and material alternatives do not. Do not recommend novelty/rewrite/dependency by popularity.

---

## V3 artifact contract

Use closed active schemas exactly. Unknown JSON fields are invalid. These examples show the expected shape after the normative schema update.

### `descriptor.json`

```json
{
  "artifact_type": "entity_descriptor",
  "schema_version": 3,
  "entity_id": "ana_<uuid>",
  "kind": "analysis",
  "slug": "<slug>",
  "title": "<title>",
  "created_at": "<UTC RFC3339>",
  "owner": "<actor or UNKNOWN>",
  "provenance": "native_v3",
  "initial_revision_id": "rev_<uuid>",
  "source_analysis_ids": []
}
```

Descriptor and revision are immutable. A later reassessment creates a new revision; state remains event-derived.

### `plans/rev_<uuid>/manifest.json`

An analysis has no product writes or mutable-resource claims:

```json
{
  "artifact_type": "entity_manifest",
  "schema_version": 3,
  "entity_id": "ana_<uuid>",
  "revision_id": "rev_<uuid>",
  "planning_base": [
    {"repository_id": "repo_<uuid>", "path": ".", "commit": "<40-hex>"}
  ],
  "map_inputs": [
    {"item_id": "cat_<uuid>", "sha256": "<64-hex>"}
  ],
  "write_scopes": [],
  "resource_claims": [],
  "depends_on": [],
  "integration_owner": "<actor or UNKNOWN>"
}
```

Entity-owned analysis artifacts are authorized by the entity path; they are not product write scopes.

### Event chain

First event:

```json
{
  "artifact_type": "event",
  "schema_version": 3,
  "event_id": "evt_<uuid>",
  "entity_id": "ana_<uuid>",
  "event_type": "CREATED",
  "state": "PLANNED",
  "occurred_at": "<UTC RFC3339>",
  "actor": "<actor or UNKNOWN>",
  "parent_event_id": null,
  "expected_state": null,
  "revision_id": "rev_<uuid>",
  "run_id": null,
  "reconciliation_receipt_id": null,
  "reason": "Analysis entity and immutable revision created"
}
```

Completion event references the first event and run:

```json
{
  "artifact_type": "event",
  "schema_version": 3,
  "event_id": "evt_<uuid>",
  "entity_id": "ana_<uuid>",
  "event_type": "TRANSITIONED",
  "state": "COMPLETED",
  "occurred_at": "<UTC RFC3339>",
  "actor": "<actor or UNKNOWN>",
  "parent_event_id": "evt_<created-uuid>",
  "expected_state": "PLANNED",
  "revision_id": "rev_<uuid>",
  "run_id": "run_<uuid>",
  "reconciliation_receipt_id": null,
  "reason": "Decision-ready analysis completed; see immutable report and run receipt"
}
```

If the report cannot satisfy its contract after writes begin, use `BLOCKED` and a precise reason; never claim completion.

### Run receipt

`runs/run_<uuid>/att_<uuid>.json` (`step_id` remains mandatory inside it):

```json
{
  "artifact_type": "run_receipt",
  "schema_version": 3,
  "run_id": "run_<uuid>",
  "attempt_id": "att_<uuid>",
  "entity_id": "ana_<uuid>",
  "revision_id": "rev_<uuid>",
  "step_id": "stp_<uuid>",
  "status": "SUCCEEDED",
  "started_at": "<UTC RFC3339>",
  "finished_at": "<UTC RFC3339>",
  "validated_against": [
    {"repository_id": "repo_<uuid>", "commit": "<40-hex>"}
  ],
  "artifacts": [
    {
      "path": ".agentic_planning/analyses/ana_<uuid>--<slug>/plans/rev_<uuid>/ANALYSIS.md",
      "sha256": "<64-hex>",
      "media_type": "text/markdown"
    }
  ]
}
```

Every retry gets a new run and attempt path; never overwrite a receipt/report/event. A changed report conclusion creates a new revision.

---

## Report contract — `ANALYSIS.md`

Write in the user's language and clearly separate as-is evidence from to-be recommendation.

```markdown
# Analysis: <title>

**Analysis ID:** `ana_<uuid>`  
**Revision ID:** `rev_<uuid>`  
**Analyzed base:** `<repo-id>@<commit>`  
**Mode:** `current_behavior | new_capability | mixed`  
**Status:** `conclusive | conditional | blocked`  
**Overall confidence:** `high | medium | low`

## 1. Executive answer
<Direct answer first; preferred direction and decisive constraint.>

## 2. Question, scope and assumptions

- In scope:
- Out of scope:
- Repository revisions/worktree state:
- Assumptions:
- Evidence that would change the conclusion:

## 3. Current behavior and evidence map
<End-to-end trace/current seams and missing primitives. Optional Mermaid only when useful.>

## 4. Findings

| # | Finding and consequence | Evidence | Confidence |
|---|---|---|---|
| F1 | ... | `[CODEBASE] path:symbol` | high |

## 5. Implications matrix

| Dimension | Implication / N/A | Evidence or uncertainty |
|---|---|---|
| Architecture | ... | ... |

## 6. Options and trade-offs

| Option | Benefits | Costs/risks | Reversibility | Fit |
|---|---|---|---|---|
| No change | ... | ... | ... | ... |
| Existing seam/small extension | ... | ... | ... | preferred/... |

## 7. Current technology and maintenance research

| Candidate | Official source/version/date | Maintenance signals | Security/license | Workspace fit | Decision |
|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... |

<Rejected candidates and reason. Every current claim has a retrieval date and direct primary URL.>

## 8. Recommended direction
<Why it wins, binding constraints, incremental decisions and what not to do. Analysis—not implementation steps.>

## 9. Related improvements

| Priority | Improvement | Evidence link |
|---|---|---|
| must/should/could | ... | F# |

## 10. Risks, contradictions and unknowns

- Risks:
- Contradictions:
- Unknowns:
- Evidence/action that resolves each unknown:

## 11. Readiness / next human decision

**Readiness:** `READY_FOR_FEATURE_PLANNING | NEEDS_DECISION | BLOCKED | N/A`

<When ready, one concise intent pasteable into the feature trigger. It remains a recommendation, not implemented state.>

## 12. Source index

### Local
| Claim | `path:symbol[:line]` | Commit/worktree hash |
|---|---|---|

### External primary sources
| Claim | Direct official URL | Retrieved | Version/release |
|---|---|---|---|
```

The report must never contain a mutable global status/index row. Future features cite this analysis via their descriptor `source_analysis_ids`; `RECONCILE_MAIN` derives “Derivó en” from those actual links.

---

## Procedure and atomic completion

1. Parse/classify/bound the request.
2. Generate IDs and absent destination paths before persisting.
3. Capture planning bases, worktree state and exact map-input item hashes.
4. Trace local behavior and evidence.
5. Perform bounded primary-source research.
6. Compare options and form the decision/readiness.
7. Render descriptor, manifest, report, receipt and parent-linked events outside protected globals; validate all closed schemas, IDs, links, hashes, UTF-8/LF and secret scan before publishing the entity files.
8. Verify only the new analysis root changed and the report hash equals the receipt.
9. Finish with path/IDs, one-sentence conclusion, highest risk, research status, next decision and: `global index will be regenerated by RECONCILE_MAIN after integration`.

## Completion criteria

- Direct question answered or explicitly unresolved.
- Relevant flow/state/boundaries/consumers traced.
- Every material conclusion has evidence class and confidence.
- Current external claims use dated primary sources; candidates pass maintenance check or are rejected.
- Options/implications fit observed architecture.
- Recommendation, constraints and next decision are explicit.
- Risks, contradictions and unknowns are separate.
- Descriptor, immutable plan/report, unique run/attempt receipt and two-event chain validate.
- Manifest has exact planning bases/map hashes and empty product scopes/claims.
- Only one new analysis entity changed; no legacy/product/global file changed.
- No index row was directly written and no v2 artifact was dual-written.

Finish with the compact completion summary required above.
