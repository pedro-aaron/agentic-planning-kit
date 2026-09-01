# Git policy — Agentic Planning Kit v3

This policy is normative for consumer workspaces that enable v3 collaboration. Repository-host settings must enforce it; prompt text is not sufficient authority.

## Roles

| Role | May write | Must not write |
|---|---|---|
| Contributor/planner/executor | Its globally identified source tree and declared product scopes | Global projections, canonical catalog, another entity's immutable sources |
| Feature integration owner | Declared feature fan-in scopes and accepted run events | Protected global paths |
| `RECONCILE_MAIN` runner | New registration events, catalog, generated projections, managed blocks and reconciliation receipt | Product code or existing entity-owned immutable sources |
| Migration operator | Migration-owned planning paths while on synchronized `main` | Branches, worktrees, commits, pushes or product paths |

## Branch and synchronization rules

Normal feature/analysis work occurs on branches or isolated worktrees according to the host repository policy. Direct human pushes to `main` are disabled.

Before planning and before requesting integration, the contributor must:

1. have a clean worktree or explicitly account for pre-existing changes without incorporating them;
2. refresh `origin/main`;
3. integrate the current `origin/main` using the repository's declared rebase-or-merge policy;
4. run artifact, claim, scope and product gates;
5. record immutable `planning_base` and current validation evidence separately.

The server-side integration lane then rebuilds against the actual current `main`. A local pull is required hygiene but cannot close the race between local validation and merge.

## Migration exception: main only

V2 → v3 migration is not normal feature work. It runs directly in the already checked-out `main` worktree because its purpose is a one-time control-plane cutover.

The migration prompt:

- requires branch name exactly `main`;
- requires `HEAD == upstream == EXPECTED_MAIN_SHA`, ahead 0 and behind 0;
- requires a completely clean index/worktree, including untracked files;
- may refresh remote-tracking evidence but never pulls, merges or rebases;
- never creates, switches or deletes branches/worktrees;
- never commits or pushes;
- leaves reviewed changes dirty on `main` for the human operator to commit and push.

If any precondition fails, the operator synchronizes outside the migration session and invokes it again with the new SHA.

## Plan registration and claim lifecycle

1. A plan creates globally unique immutable sources and declares scopes/claims.
2. A short integration registers those claims in `main` before product execution begins.
3. Active claims are derived from registered events, not mutable index rows.
4. Amendments create new immutable revisions and revalidate claims.
5. Completion, cancellation or supersession releases claims through an explicit event.
6. Claims never expire or get stolen merely because a clock elapsed.

`UNKNOWN` access is exclusive. A repository host may use concurrency groups or a central lease for runtime resources, but a committed `.lock` file is never a distributed lock.

## Integration queue

For every candidate, the serialized integration lane must:

1. combine it with the latest `main`;
2. validate schemas, IDs, immutable hashes and causal event heads;
3. compare active write/resource claims;
4. ensure the real Git diff is inside declared scopes;
5. run applicable product quality gates;
6. run `RECONCILE_MAIN` in check/write mode on the protected candidate;
7. verify generated projections are deterministic and clean;
8. advance `main` only if its expected old SHA still matches.

If `main` moved, rebuild and rerun. Never reuse a successful check from an older candidate.

When candidate-time writes are unavailable, post-merge reconciliation is permitted only with a repository-wide `RECONCILIATION_PENDING` guard that blocks later dependent integrations. This is a fallback, not the preferred mode.

## Protected global paths

At minimum, ordinary contributor changes to these paths fail CI:

```text
WORKSPACE_MAP.md
PROJECT_BLUEPRINT.md
.agentic_planning/README.md
.agentic_planning/CONTRACT.json
.agentic_planning/catalog/**
.agentic_planning/reconciliations/**
CLAUDE.md / AGENTS.md / tool rules   # their managed block only
```

Migration receipts and sources are exceptions only under the exact migration contract. CODEOWNERS/repository rules should require the planning-integrator owner for generator, schema, workflow and protected-view changes.

## Step branches and fan-in

Parallel steps start from the same accepted feature integration base unless their dependencies require a newer accepted result. Each run receipt records its `validated_against` commits and output hashes; the later reconciliation receipt binds the actual integration candidate commit.

- Disjoint scopes may integrate independently.
- A dependent step begins only after prerequisite changes and successful receipts are integrated into its execution base.
- Composition roots, registries, dependency manifests/lockfiles, migrations and other join hotspots have one declared fan-in owner.
- The final fan-in owner does not silently absorb out-of-scope changes; an amendment is required.

Worktree isolation does not isolate services. Runtime commands use namespaces derived from feature/run IDs, or are serialized.

## Multi-repository features

One coordinator repository owns planning sources and global projections. Each manifest pins every touched repository's planning base and validated commit. Receipts are recorded per repository.

The coordinator may project `EXECUTED` only when all required repositories are integrated and reconciled. A partial outcome is explicit `PARTIALLY_MERGED` or `BLOCKED`; recovery is an idempotent forward integration or documented compensation, never invented atomicity.

## Recovery

- Conflicting immutable events remain preserved and require an explicit reconciliation event.
- A stale map item fails with `STALE_MAP_CLAIM`; unrelated catalog changes may be revalidated without redesign.
- A failed generator leaves no partial protected writes; rerun from its staged/receipt basis or restore exact preimages.
- An abandoned claim requires an audited cancellation/release event.
- Never use `merge=ours`, `merge=union` or last-writer-wins for canonical JSON, events or generated views.
