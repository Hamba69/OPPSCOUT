# Owner actions

## Branch `backup-before-workflow-rewrite`

**Owner authorization recorded 19 October 2026:** the owner explicitly requested: “stage, comiit, merge all branches sync and push everything.” This supersedes the prior no-merge restriction for this synchronization task.

Scope: commit the current audit deliverables on `main`; integrate branch commits that are not already in `main` after checking mergeability; synchronize with `origin`; push the resulting changes. Preserve existing branch refs. Do not delete branches. Branch contents and overlap are recorded in [decisions.md](./decisions.md); equivalent work may already have reached `main` through other commits, so avoid duplicate changes.

The remote-tracking branches will be checked for commits not already contained in `main`; no remote-only work should be silently overwritten. This authorization does not permit destructive resets or force pushes.
