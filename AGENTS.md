# ACADEA repository instructions

These instructions apply to the entire repository.

Before making non-trivial changes, read:

- `.agents/memory/MEMORY.md`
- `.agents/memory/multi-machine-handoff.md` for the required two-computer workflow and current machine-local state
- `.agents/memory/acadea-site.md` for durable product and copy decisions
- `.agents/memory/acadea-platform-architecture.md` for backend, platform, guide, integration, and deployment context

Treat the checked-out code and database schema as the current source of truth. Chat summaries and memory files preserve intent and handoff context, but they may be older than the current branch. When they disagree, verify the Git history and current implementation before editing.

`AGENTS.md` and `.agents/memory/` are deliberately Git-tracked and public. They
are the shared context layer for AI-assisted work across multiple cloned
devices. Never ignore, untrack, remove, or relocate them. Keep them free of
credentials, personal user records, and other private material.

Use `pnpm`; do not introduce another lockfile. Never commit local `.env` files, credentials, OAuth refresh tokens, service-account JSON, database passwords, or signed media URLs.

This repository is developed on Marlena's and Mateusz's computers. Do not hard-code either user's absolute path in shared scripts. Before editing, run the preflight in `.agents/memory/multi-machine-handoff.md`: inspect `git status`, fetch, compare the local branch with its upstream, and use `git pull --ff-only` only when the worktree is clean and the branch is merely behind. Never reset, overwrite, or silently merge another computer's work.

Do not assume ignored files exist on both computers. Mateusz's computer currently has the local operational assets and secrets; Marlena's computer should be treated as a clean Git clone unless the handoff memory explicitly says otherwise. Keep ignored utilities, generated imports, credentials, and local research out of Git. If work depends on them, record the dependency and recreation or secure-transfer requirement in the handoff memory without recording secret values.

Before finishing a non-trivial task, update the relevant `.agents/memory/` file when durable behavior, architecture, deployment state, external configuration, or machine-local dependencies changed. Clearly distinguish code written, committed, pushed, database migration applied, dashboard configuration completed, and production deployment verified. A task transcript or machine-local Codex memory is not a cross-computer handoff.

Database schema changes are not applied automatically by an application build. Keep Drizzle schema and the deployment SQL/migration step aligned, validate the target database separately, and state clearly whether a change is code-only, migration-only, or deployed.
