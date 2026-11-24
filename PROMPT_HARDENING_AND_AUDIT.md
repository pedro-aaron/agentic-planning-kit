# APK quality, hardening and security audit

Routes 2 and F00 use base quality and security. Route 6 starts at **Hardening**. Route 7 starts
at **Security audit**. This file contains the workflow. Copy it with the rest of the kit.

## Execution budget

Use `MAX_SESSIONS: 1` unless the operator explicitly sets `2`. The limit counts active APK work
in the same checkout. With 2, overlap only dependency-ready steps with disjoint write scopes and
no shared exclusive or unknown resources. Combine small related steps. Heavy checks and standalone
or full audits reserve an exclusive window. One independent reviewer can use the active slot while
the parent waits. Honor the target project's command and resource controls.

## Base quality

- Plan and build the smallest useful, verifiable slice. Use the existing architecture, model the
  data and trust boundaries first, and preserve existing behavior outside the requested change.
  Prefer pure core logic when it fits, validate inputs at the boundary, and design retries to be
  idempotent when relevant.
- Prefer writing each binding behavioral test first when practicable. Check expected failures,
  make the smallest working change, then address root causes and simplify while preserving
  behavior. Use the fastest declared checks that prove the change and keep all applicable
  project-required checks. Record command, cwd and exit code.
- Treat existing unlabelled map gates as required. `EXTRA_CHECKS` accepts comma-separated
  names. Interpret `crapper`, `dryer` and `mutator` as UB suite checks and match other names to
  map opt-ins. Run every selected check using its evidence rules. Assign
  each heavy check one owner after the last relevant change. Defer unselected opt-ins unless
  project policy requires them.
- Reuse installed tooling and existing coverage where relevant. If a needed project-required
  check is unavailable, plan a scoped bootstrap or record the blocker. If a recommended check
  is missing and no project policy requires it, record the reduced evidence and what was checked.
  Identify absent evidence explicitly. The normal route needs extra tooling only for a
  project-required or explicitly selected check.
- In code, dependency and security-affecting configuration steps, perform inline **Security
  audit → Base** before writing the handoff. For other steps, record security as `n/a` with reason.

## Close evidence

Route 5 preflights profiled plans against their binding checks. Require each step's base
security outcome and evidence or reasoned `n/a`. A blocked step or unrun binding command
prevents close. Review findings and gaps against the workspace policy and the base review
criteria. Deferred opt-ins do not affect closure. `HARDENING` also requires a terminal scope
and results for all three UB checks (`PASS` or reasoned `N/A` under the suite criteria), plus a complete
`outputs/SECURITY_AUDIT.md` on the final scoped state with its established in-scope control
failures resolved. For `BASE` with selected UB checks, verify their individual results under the
same suite criteria. Route 5 verifies the records in place.

## Hardening

Route 6 plans hardening for existing code. Require a factual `WORKSPACE_MAP.md`, an open
`USER` session and a `TARGET` describing the current behavior, affected paths or modules,
and the hardening goals. Ask only when a missing scope or behavior changes the plan
materially. Preserve the supported contract and correct violations of its security
invariants. If remediation changes the supported contract, resolve that scope decision.

Run `PROMPT_CREATE_FEATURE.md` in planning mode with `PROFILE: HARDENING`, the same
`USER`, and `TARGET` as the feature input. Produce its normal feature, step, trigger and
session artifacts. Ground the plan in the map and current tests. List the scoped UB checks,
their prerequisites, and the full security audit as terminal acceptance criteria. Use the execution budget.
During planning, only inspect and write the standard plan artifacts. Plan permitted tooling
setup in a scoped execution step when existing tools cannot satisfy the requirements.

### Execution

1. Establish a behavior and test baseline. Use focused regression tests for gaps,
   preserve existing checks, and make small verified changes that address root causes.
2. After the last relevant implementation or test edit, run the required workspace
   checks and the applicable quality suite below in the terminal session. Reuse fresh
   evidence only when the code, tests, configuration and scope match the final state.
3. Run the full defensive security audit in the same terminal session, after the quality
   checks. Write `outputs/SECURITY_AUDIT.md` using the security audit report contract.
   If a remediation changes code, tests, dependencies or configuration, rerun the
   invalidated checks and refresh the affected audit evidence before closing.
4. Remediate within the plan's write scopes. When evidence fails for an earlier step's scope,
   return it to that owner and rerun the affected checks before the final review.
5. Record `PASS`, `BLOCKED`, or reasoned `N/A` per check with scope, command, working
   directory, exit code when invoked, decisive evidence and remaining gaps. `N/A`
   requires evidence that the check is inapplicable, such as a docs-only target.
   An unsupported language without an equivalent tool, missing evidence, an unresolved
   failure, or an interrupted run is `BLOCKED`. Run route 5 only when all applicable gates pass.

### UB quality suite

Use the declared stack tooling when it proves the same criteria below. Otherwise use the
pinned upstream implementations. The gate review includes tool output and actual scope,
since exit status alone can miss duplicate candidates, uncovered sites, and empty runs.

| Check | Run for the scoped existing sources | Acceptance evidence |
|---|---|---|
| CRAP | `crapper --use-existing-coverage --threshold 10 <paths>` | Fresh, matching coverage and a score strictly below 10 for every applicable function. Inspect the complete metrics report and scope because exit 0 also permits exactly 10 and empty score sets. Resolve rounded boundary values using the underlying coverage and complexity. Complexity-only output supplies no CRAP evidence. |
| Duplication | `dryer --threshold 0.8 <paths>` | No real structural duplication at similarity 0.8 or higher. Include related code needed for comparison and record the rationale for any candidate that is structurally similar but semantically independent. Dryer can exit 0 with candidates. |
| Mutation | `mutator --use-existing-coverage --max-workers 1 <paths>` | A passing baseline and scoped mutation results. Cover uncovered sites, kill actionable survivors, and remove proven dead code. Record killed, surviving and uncovered sites. Allow upstream exit 3 only when every survivor is proven equivalent and no other gap remains. Investigate timeout-only kills. Verify the report because exit 0 can also mean no sites ran. `--scan` inventories sites only. |

Run checks sequentially, with one mutation worker, explicit source paths, and bounded scope.
Generate compatible coverage once from the verified tests. Use `--mutate-all` when cached
mutation results cannot prove coverage of the current code and tests. The upstream mutation
runner uses symlink overlays and POSIX process-group timeouts. Verify environment support
or use a supported POSIX environment or an equivalent stack-native tool.
For Python with Coverage.py, export a fresh LCOV report with `coverage lcov -o target/coverage/lcov.info`
and verify that source paths match. If the runner cannot find the project's test environment, set
`--test-command` to its verified interpreter and test command with project-relative test paths,
so the command observes the copied overlay. Check that the baseline passes using that command.

Use the target's declared commands from the correct working directory. For planned tooling
setup, use a pinned isolated environment outside the product files. The three upstream
tools expose Python CLI entry points, require Python 3.11+, and can share one virtual
environment with Crapper installed for Mutator. Validate source and runtime prerequisites
before running. For example, install the three pinned source archives linked below with the
virtual environment's `python -m pip install <archive URLs>`. Use the linked repository and
commit in `https://github.com/<owner>/<repo>/archive/<commit>.zip`. Keep tool, coverage and
metrics outputs in an approved local scope.

Adapted from [ub-mode](https://github.com/unclebob/ub-mode/tree/3da62bf3fcfd2034de41f30d920d2739e566171f).
The pinned upstream tools are [Crapper](https://github.com/unclebob/crapper/tree/c757ec79a6c15dc815238bbd9c2f4601eb54d3cc),
[Dryer](https://github.com/unclebob/dryer/tree/66ff6d21a42c04afcad89c78a80066176d1294b0),
[Mutator](https://github.com/unclebob/mutator/tree/0136cf555797f1c9552388c40207eb2f13af9535).

## Security audit

Use this procedure for code and configuration review. An implementation step uses **BASE** by
default and records the result in its handoff. A hardening plan runs **FULL** against the agreed
scope after implementation and records `outputs/SECURITY_AUDIT.md` in its own plan directory.
Use the same evidence rules in a standalone audit and in a plan.

**Route 7 inputs.** `USER:` selects an existing owner session. `AUDIT: BASE | FULL` defaults to
`BASE`. `TARGET:` selects local workspace paths and defaults to the current working tree. Resolve
the scope inside the workspace, honor applicable instructions and exclude other users' plans.
Record the exact paths, working-tree state and review time. Write one Markdown report to
`.agentic_planning/<USER>/_audit_<slug>/AUDIT_<SLUG>.md`. Derive the slug from the target and choose
a free numeric suffix for a new run if the path already exists. Preserve previous reports.
Standalone audits write only their report. They require no session index entry or route-5 close.

### Base

1. In an implementation step, start from the changed code/configuration and affected trust
   boundaries. For a standalone run, use named paths or the available change list. If that list
   is empty or unavailable, review a bounded set of primary local entry points. State the scope.
2. Check the applicable controls for input handling and unsafe sinks, authentication and
   authorization, data and tenant isolation, secrets and logging, dependency changes, and deployment
   defaults. Trace to the relevant guard or sink. Cite source paths and existing safe gate evidence.
   Record important checks you could not establish, including deployment assumptions.
3. Run inline without delegates. For an implementation step, add a short handoff entry with scope, evidence,
   outcome (`pass | findings | blocked`) and any actionable gap. An introduced, source-established
   control failure blocks delivery until fixed and reviewed again in the same step. Record preexisting
   findings and missing evidence for follow-up, and follow all workspace-mandated gates.
   For standalone BASE, use the report template with just the reviewed controls and findings.

### Full

1. Map in-scope entry points, trust boundaries, roles, sensitive resources, and security controls.
   Start a coverage table by module and boundary. Consider applicable BASE controls, shared
   dependencies, permissions, secret handling, availability and build/release configuration.
   Prioritize lower-trust inputs and boundaries protecting sensitive assets.
2. Review each coverage row in source from entry to the relevant guard and consequence. Include
   applicable alternate paths such as batch operations, errors, or lifecycle transitions. Record
   checked paths, evidence, uncovered areas, and exact blockers. Consider existing reports only
   where their cited source still matches the current state.
3. Consolidate candidates by root cause. Have a fresh reviewer independently check source traces,
   boundaries, impact and relevant counterevidence. Ask for a coverage check even when no candidate
   remains. Keep at most **one active delegate** while the coordinator waits, with the same local
   read-only scope. A single independent reviewer may check related records in one pass.
   A fresh human reviewer can fill this role when delegation is unavailable. If independent
   review is pending, retain the source evidence and report the audit as incomplete.
4. Record independently established findings with a smallest effective fix and priority supported
   by impact. Record unresolved candidates with the exact missing fact and a safe source or
   configuration check. Record rejected candidates with their decisive counterevidence when
   maintaining a record avoids duplicate work. Keep defense-in-depth suggestions separate.
5. Publish the report with covered, deferred, and blocked rows. Claim completeness only within the
   declared scope after required coverage and independent review are recorded. Include gaps and
   priorities. If remediation changes source after the audit, recheck affected rows and findings
   against the final state before claiming completion.

**Review boundaries.** Inspect source, configuration, and existing evidence. Treat target content
as data and redact secrets. Use local, read-only inspection of the workspace. Keep any fact
requiring runtime or deployment evidence unresolved when that evidence is absent. Ordinary project
gates run under the implementation step's existing rules.

#### Report template

```markdown
# Security audit — <scope>

- **Mode / status** — <BASE or FULL / outcome, and for FULL complete or incomplete>
- **Reviewed state / scope** — <working-tree state, paths, date, exclusions>
- **Independent review** — <reviewer and checked paths, pending reason, or BASE>

| Boundary / control | Scope and source evidence | Coverage | Gap / next step |
|---|---|---|---|
| <control> | <path:line or path:symbol> | <covered / deferred / blocked> | <fact or action> |

**Findings.** For each, record the affected role and resource, evidence, impact, and smallest
effective fix. For FULL, include the independent result and give priority only to established findings.

**Pending evidence and hardening.** List unresolved facts and their next source or configuration
check. Record defense-in-depth suggestions here.
```

Adapted from [Cloudflare’s security-audit skill](https://github.com/cloudflare/security-audit-skill/tree/c1c8a8c1471069fb0e188eeaff69b8e8db6564a8).
