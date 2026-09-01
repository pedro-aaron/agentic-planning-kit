# Agentic Planning Kit v3 — control-plane contract

This document is normative for artifacts written with `writer_contract: "v3"`.
Product repositories may use any implementation stack; Python is used only by the
kit's local control plane.

## 1. Ownership and sources of truth

1. An entity descriptor, plan revision, event, run receipt, and map delta is an
   immutable, ID-addressed source artifact. Slugs, usernames, timestamps, and
   filesystem order are never identities.
2. `.agentic_planning/README.md` and `WORKSPACE_MAP.md` are generated views. They
   contain no source-only state and must be reproducible byte-for-byte from entity
   artifacts and the catalog.
3. Ordinary feature or analysis work must not edit generated views or
   `.agentic_planning/catalog/**`. It may only add artifacts below its own globally
   identified entity directory.
4. `RECONCILE_MAIN` is the only writer of protected global paths. It runs against
   the latest integration candidate for `main`, validates first, stages every
   output, and publishes only a complete valid result.
5. V2 artifacts are read-only after cutover. V3 never dual-writes a legacy row,
   fixed output path, or mutable plan.

The closed `.agentic_planning/CONTRACT.json` also pins
`planning_map_contract: 4`, the exclusive `writer_authority`, an optional
`root_project_id`, and the exact `managed_entry_points` whose generated marker
blocks reconciliation may update.

## 2. Identity and layout

IDs are a lowercase UUID preceded by a type prefix: `repo_`, `ftr_`, `ana_`,
`prj_`, `rev_`, `evt_`, `stp_`, `run_`, `att_`, `delta_`, `cat_`, or `rec_`. A readable
slug may repeat. Native entity paths are:

```text
.agentic_planning/
├── CONTRACT.json
├── features/<ftr_id>--<slug>/
│   ├── descriptor.json
│   ├── plans/<rev_id>/manifest.json
│   ├── events/<evt_id>.json
│   ├── runs/<run_id>/<attempt_id>.json
│   └── map-deltas/<delta_id>.json
├── analyses/<ana_id>--<slug>/...
├── projects/<prj_id>--<slug>/...
├── catalog/**/*.json
├── reconciliations/<rec_id>/receipt.json
└── README.md                         # generated

WORKSPACE_MAP.md                      # generated
```

Every planned step receives a stable `stp_<UUID>`. A logical execution receives a
`run_id`; each retry of that run receives a new `attempt_id`, so existing receipts
and evidence are never overwritten. The compact path avoids Windows/Git path-length
failures; `step_id` remains mandatory inside every receipt. A plan change creates a new `revision_id`.
Receipts are written only when an attempt is terminal (`SUCCEEDED`, `FAILED`, or
`CANCELLED`); queue/running state is ephemeral and is never frozen as a receipt.
The immutable descriptor records only `initial_revision_id`; the current revision
is the last non-null `revision_id` in the reduced event chain, falling back to the
initial revision when no event selects another. One event is one JSON file. Events
for an entity form one parent-linked chain; two children of the same parent are a
compare-and-swap conflict. A `RECONCILED` event must name its successful
`reconciliation_receipt_id`, and that receipt must hash the event as an output.

## 3. Artifact rules

The closed JSON Schemas in `schemas/` define persisted fields. Unknown fields,
duplicate JSON keys, malformed IDs, unsafe paths, and non-finite numbers are
invalid. JSON is UTF-8; generated Markdown is UTF-8 with LF endings. Stable
ordering is by semantic key and ID, never discovery order or local time.

`planning_base` records where a plan was authored. It is immutable and distinct
from the integration candidate against which a merge queue validates it. Catalog
input hashes and map-delta `expected_item_hash` values provide item-level stale
detection instead of invalidating work for an unrelated map change.

Catalog records use the closed kinds `repository`, `subproject`, `command`,
`resource`, `gate`, `contract`, `store`, `seam`, `recipe`, `convention`,
`practice`, `policy`, and `unknown`. Their factual status is `VERIFIED`,
`PLANNED`, `UNKNOWN`, `UNKNOWN_LEGACY`, or `DEPRECATED`.

## 4. Scopes and shared resources

Write scopes are repository-relative POSIX paths and are either one exact path or
a directory tree. They must not be absolute, contain `..`, use backslashes, or
target a protected global path. Tree scopes are represented structurally as
`{"kind":"tree","path":"dir"}` rather than arbitrary globs.

Resource claims use these compatibility rules:

| Claim pair | Compatible |
|---|---:|
| `read` / `read` | yes |
| `isolated` / `isolated` with different non-empty isolation keys | yes |
| any pair containing `exclusive` or `unknown` | no |
| every other pair for the same resource | no |

`unknown` is deliberately exclusive. A local filesystem lock coordinates only
one checkout; it is never evidence of exclusivity between clones. An abandoned
claim is released by an explicit auditable terminal event, not silently by time.
Overlapping write scopes are integration conflicts even when textual Git merging
would succeed.

## 5. State and reconciliation

Entity state is reduced from its event chain. Terminal states are `COMPLETED`,
`CANCELLED`, and `SUPERSEDED`; their claims are inactive. No event chain means
`PLANNED`. A semantic amendment or a successful non-final step may select a new
revision/run while preserving the current non-terminal state; this is still an
auditable causal event, not a mutable update. A reconciliation performs, in order:

1. schema, ID, path, event-chain, run, scope, and claim validation;
2. catalog/delta compare-and-swap validation against the candidate state;
3. deterministic reduction and rendering in an isolated staging location;
4. exact comparison or atomic replacement of generated files;
5. an immutable reconciliation receipt containing input and output hashes.

A validation or reconciliation failure must leave generated views untouched.
Repeating reconciliation over identical inputs is a byte-identical no-op.
Reconciliation receipts also form one parent-linked compare-and-swap chain; two
receipts with the same parent are a global-writer conflict and neither wins by time.

## 6. Git policy

Humans synchronize their local branch before requesting integration, but that is
hygiene rather than a concurrency guarantee. Protected `main`, required checks,
and a serial merge queue revalidate the candidate against the newest `main`.
Direct commits to protected global paths are rejected unless produced by the
exclusive reconciliation identity. If `main` advances, the candidate is rebuilt
and validated again.

The v2-to-v3 migration is a main-only maintenance operation. It neither creates
nor switches branches and leaves committing or pushing to the operator. Multiple
product repositories require one configured coordinator repository that owns the
planning tree and global projections; partial multi-repository integration must
never be projected as completed.

The executable checks used by prompts and CI are:

```text
python tools/agentic_planning_v3.py validate --root <workspace>
python tools/agentic_planning_v3.py claims --root <workspace>
python tools/agentic_planning_v3.py render --root <workspace> --check|--write
python tools/agentic_planning_v3.py protected --root <workspace> --base <git-ref>
python tools/agentic_planning_v3.py protected --root <workspace> --base <git-ref> --integration
```

The last form is reserved for `RECONCILE_MAIN`: catalog edits are permitted, but
both generated views must equal the current deterministic render. Other protected
edits remain rejected because this control plane cannot prove their provenance.
