# Sessions — the whole concurrency model

This is the only normative document in the kit, and it is short on purpose. It replaces every
protocol the v3 control plane invented: identities, event chains, catalogs, projections,
reconciliation, protected paths, integration owners and merge queues are all gone.

## The rule

> **Every planning artifact a route writes lives under `.agentic_planning/<username>/`.**

Two people planning at the same time never write the same file, so their work merges without a
conflict — not because a protocol promises it, but because no two paths are equal. That is the
entire model. There is nothing else to configure, install, protect or reconcile.

Everyone works on `main`. That is the intended way to use this kit.

## The username

The username is supplied by the human, in the `USER:` field that opens every trigger. It is
lowercase `[a-z0-9-]`, 2–32 characters, and it is a **directory name, not an account**. The kit
never validates it against a host, a remote, a commit author or a directory service, and never
derives it from one. Two people who pick the same username share a session directory and will
collide — that is their decision to make, and the kit will not police it.

The `USER:` field of the trigger is the authority. A shared configuration file that recorded the
username would itself be a file every user has to write, which is exactly the collision this
design removes. There is no such file.

## Layout

```text
.agentic_planning/
├── README.md                    # static, written once at install; never regenerated
└── <username>/                  # THE SESSION
    ├── SESSION.md               # who I am, what I am working on — this user's own index
    ├── _project_<slug>/
    │   ├── PROJECT_BLUEPRINT.md # ONE file, edited in place
    │   ├── DECISIONS.md         # ONE table, append-only
    │   └── F00/
    │       ├── FEATURE_F00.md
    │       ├── steps/NN-<slug>.md
    │       ├── TRIGGERS.md
    │       └── outputs/
    ├── _feature_<slug>/
    │   ├── FEATURE_<SLUG>.md
    │   ├── steps/NN-<slug>.md
    │   ├── TRIGGERS.md
    │   └── outputs/NN_<slug>.md
    └── _analysis_<slug>/ANALYSIS_<SLUG>.md

WORKSPACE_MAP.md                 # shared — see below
```

## Write scopes by route

| Route | Writes | Shared? |
|---|---|---|
| 0 · Open session | `.agentic_planning/<user>/SESSION.md` | no |
| 1 · INIT | `WORKSPACE_MAP.md` + managed pointer blocks | **yes** |
| 2 · Create feature | `.agentic_planning/<user>/_feature_<slug>/**` | no |
| 3 · New project | `.agentic_planning/<user>/_project_<slug>/**` | no |
| 4 · Analyze | `.agentic_planning/<user>/_analysis_<slug>/**` | no |
| Step execution | product code + `<user>/…/outputs/` | **yes** (the code) |

## The two shared things, and why

**`WORKSPACE_MAP.md`** describes the repository, not anyone's plan. It is a shared fact, it
changes only when the workspace structure changes, and when two people do change it, it is an
ordinary Markdown conflict resolved with ordinary Git. The managed pointer blocks in
`CLAUDE.md` / `AGENTS.md` follow the same rule and are byte-identical for every user, so in
practice they do not conflict at all.

**Product code** is the case Git already exists for. Planning never touches product code; step
execution does, and two people executing steps that overlap resolve it the normal way. The
plan's disjoint write scopes exist to make that rare, not to replace Git when it happens.

## There is no global index

`.agentic_planning/README.md` is written once, by hand or at install, and explains what the
directory is. It is **not** a feature index, and nothing regenerates it.

A single mutable index listing everyone's work is the file that forced both v2 and v3 to invent
a reconciliation writer. The overview it provided is available as a read — `ls .agentic_planning/`,
then open the `SESSION.md` you care about — and a read cannot conflict. Each user's `SESSION.md`
indexes that user's own plans, and only that user writes it.

## What the kit never does

It never runs `git`, initializes a repository, creates branches or worktrees, commits, pushes,
merges, rebases, resolves conflicts, reads commit identifiers, or writes a commit hash into an
artifact. It never requires a remote, a host, a protected branch, CODEOWNERS, CI, a bot identity
or an installer. Version history belongs to whatever version-control system you use, or to none.

Installation is: copy this folder into your workspace.
