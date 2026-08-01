# ACADEA repository instructions

These instructions apply to the entire repository.

Before making non-trivial changes, read:

- `.agents/memory/MEMORY.md`
- `.agents/memory/acadea-site.md` for durable product and copy decisions
- `.agents/memory/acadea-platform-architecture.md` for backend, platform, guide, integration, and deployment context

Treat the checked-out code and database schema as the current source of truth. Chat summaries and memory files preserve intent and handoff context, but they may be older than the current branch. When they disagree, verify the Git history and current implementation before editing.

Use `pnpm`; do not introduce another lockfile. Never commit local `.env` files, credentials, OAuth refresh tokens, service-account JSON, database passwords, or signed media URLs.

This repository is developed on Marlena's and Mateusz's computers. Do not hard-code either user's absolute path in shared scripts. Before starting work, inspect `git status`, fetch, and confirm the intended branch. Preserve uncommitted work and keep reusable context in `.agents/memory/` so it can be shared through Git.

Database schema changes are not applied automatically by an application build. Keep Drizzle schema and the deployment SQL/migration step aligned, validate the target database separately, and state clearly whether a change is code-only, migration-only, or deployed.
