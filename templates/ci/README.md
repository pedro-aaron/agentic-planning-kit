# Continuous integration (CI) templates

These files are templates, not active workflows for the kit repository.

1. Copy `github-actions-agentic-planning-v3.yml` into the consumer repository's `.github/workflows/` directory.
2. Set `KIT_PATH` to the copied kit location.
3. Merge the CODEOWNERS fragment into the repository's existing file and replace the placeholder owner.
4. Protect `main`: disallow direct pushes, require the validation job and enable a serialized merge/integration queue.
5. Configure the protected integration identity separately. Pull-request CI validates branch-owned sources but does not demand globally regenerated views. The protected merge-candidate lane must run reconciliation, then the merge-group `render --check` and `protected --integration` checks, before advancing `main`.

Other Git hosting platforms must implement the same invariants: latest-main candidate, required checks, protected global paths, serialized integration and compare-and-swap when advancing the target ref.
