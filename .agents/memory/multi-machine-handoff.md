---
name: ACADEA multi-machine handoff
description: Required workflow for preserving context and safely moving work between Mateusz's primary computer and Marlena's clean clone
verified_on: 2026-08-01
---

# Multi-machine handoff

## Purpose

Git-tracked code and `.agents/memory/` are the durable handoff layer between computers. Codex task transcripts, clipboard contents, browser sessions, local shell history, ignored files, and machine-local memory are not shared and must never be treated as if they were.

The goal is to preserve enough intent and operational state that work can continue safely after a pull without committing secrets, proprietary one-off utilities, generated imports, or local research.

## Source-of-truth hierarchy

Use this order when information disagrees:

1. The checked-out code and Drizzle schema at the current commit.
2. Git history showing how and why the implementation changed.
3. The live database or provider dashboard for deployment-only state, verified directly when relevant.
4. `.agents/memory/` for durable intent, constraints, known risks, and handoff state.
5. Task summaries and chat history only as leads to verify.

Never infer that a migration ran because SQL is committed, that a deployment completed because code was pushed, or that a local ignored artifact exists because memory mentions it.

## Machine capability boundary

### Mateusz's primary computer

- Contains the established ignored local workspace, operational utilities, generated imports, research files, and locally configured secrets/authentication.
- Common local-only roots include `.local-work/`, `.import-jsons/`, root `scripts/`, and ignored `.env*` files.
- These assets can be inspected and used locally, but they must not be committed merely to make them available on the second computer.

### Marlena's second computer

- Treat as a clean clone of the GitHub repository.
- Do not assume any ignored utility, generated JSON/SQL import, `.env` file, OAuth session, cloud CLI authentication, browser login, or dependency cache exists there.
- If a task needs a missing local-only asset, either recreate it from tracked source, configure the required secret locally, or arrange an explicit secure transfer. Do not replace missing secrets with hard-coded values.

This boundary is asymmetric by design. A pull transfers only tracked Git content and never synchronizes ignored files or credentials.

## Required start-of-task preflight

Run these checks before non-trivial work:

1. `git status --short --branch`
2. `git fetch --prune origin`
3. Confirm the intended branch with `git branch --show-current`.
4. Compare local and upstream history, for example with `git rev-list --left-right --count HEAD...@{upstream}`.
5. If the worktree is clean and the branch is only behind, run `git pull --ff-only`.
6. If the worktree is dirty, diverged, or contains unexpected changes, preserve it and resolve ownership before pulling, switching branches, or editing overlapping files.
7. Read `AGENTS.md`, `.agents/memory/MEMORY.md`, this file, and the domain-specific memory relevant to the task.

Never use a destructive reset or checkout to make the preflight clean. Never assume changes are disposable because they are uncommitted.

## Branch ownership and switching computers

- Only one computer should actively edit a given branch at a time.
- For non-trivial or overlapping work, use a named feature branch and push it before switching computers.
- Before continuing on the other computer, finish or deliberately checkpoint the current work, commit the intended tracked files, push, and then pull with `--ff-only` on the destination computer.
- Do not independently commit to `main` from both computers without fetching immediately beforehand.
- If both computers must work concurrently, use separate branches and reconcile through an explicit merge or pull request after reviewing both diffs.

## What must be recorded in Git-tracked memory

Update the relevant memory file when a task changes any of the following:

- durable product or copy decisions;
- architecture, schema, API contracts, route behavior, or integration logic;
- deployment topology or provider-dashboard configuration;
- a migration or data import, including whether it was only prepared or actually applied;
- a new required environment variable or external credential name, without its value;
- a dependency on a machine-local ignored file;
- a known production risk, incomplete workflow, or required follow-up.

Keep memory concise and factual. Record outcomes and constraints, not full chat transcripts or temporary debugging detail.

## Required end-of-task handoff

Before moving the task to the other computer, record the relevant state using these labels where applicable:

- **Git:** branch, latest pushed commit, and whether the destination must pull.
- **Code:** implemented behavior and important files or modules.
- **Database:** not required, SQL prepared but not applied, applied to a named environment, or verified after application.
- **External configuration:** not required, pending manual action, configured, or verified.
- **Local-only dependency:** ignored path and what it is needed for; never include secret contents.
- **Verification:** exact checks run, such as `pnpm run typecheck`, `pnpm run build`, API probes, or production smoke tests.
- **Next action:** the smallest concrete remaining step.

Do not write "done" when only code was written. Use separate statements for committed, pushed, migrated, deployed, and production-verified states.

## Current local-only operational state

As of 2026-08-01, the following context exists only on Mateusz's computer and is intentionally excluded from Git:

- `.local-work/articles-en/` contains the 40-article English knowledge-base translation workspace, image selections, QA outputs, generator, and a guarded Cloud SQL import SQL file.
- The latest local SQL generator was corrected after a transaction safely aborted on the pre-existing Polish related slug `/stypendium` in `/stypendia-acadea`. The corrected validation checks newly imported English relationships instead of requiring all existing Polish relationships to resolve.
- The successful application of that corrected SQL to production has not been confirmed in Git-tracked state. Verify the live database before claiming that the 40 English records were imported.
- `.local-work/research/`, `.local-work/docs/`, `.local-work/scripts-data/`, and `.import-jsons/` contain additional research and guide/import artifacts.
- Root `scripts/` contains local operational tooling and dependencies. It is ignored and must not be assumed to exist on Marlena's computer.

## Current feature-branch handoffs

### `codex/academic-results` on Marlena's computer

- **Git:** local feature branch created from synchronized `origin/main`; changes are not committed or pushed.
- **Code:** structured GPA, SAT, and IELTS entry for mentees plus an assigned-student results view for mentors are implemented in the platform frontend, API, and Drizzle schema.
- **Database:** `lib/db/migrations/20260801_academic_results.sql` is prepared but has not been applied to any environment.
- **External configuration:** not required.
- **Local-only dependency:** none for the feature. The bundled Codex Node runtime had to be placed on `PATH` for local package post-install scripts.
- **Verification:** `pnpm run typecheck` passed; the full `pnpm run build` passed after using the bundled Node runtime. No database-backed browser smoke test was run on this clean clone.
- **Next action:** review the diff, then commit/push if approved; apply the academic-results SQL migration before deploying the API/frontend and verify both mentee save and mentor visibility against the target database.

### `feature/community-motivation-leaderboard` on Mateusz's computer

As of 2026-08-01, Mateusz's computer has an uncommitted implementation on `feature/community-motivation-leaderboard`:

- **Git:** the branch was created from `ebd1545`; it has not been committed or pushed, so another computer must not attempt to continue it from Git yet.
- **Code:** mentee opt-in aliases, essay-progress ranking, weekly weighted entries, persistent winners, an admin draw dashboard, and responsive community UI are implemented.
- **Database:** `lib/db/migrations/20260801_community_leaderboard.sql` is prepared and aligned with the Drizzle schema. It has not been applied to any database and has not been production-verified.
- **External configuration:** none required.
- **Local-only dependency:** none required for the feature. The generated visual-QA preview under the ignored platform `dist/` directory is disposable.
- **Verification:** library, platform, and API typechecks passed; API and platform production builds passed; the community UI was inspected at 1440px and 390px with no horizontal overflow or browser warnings. The unchanged public website typecheck was tried both through the root check and on its own, but emitted no diagnostics and was interrupted after remaining active for more than five minutes.
- **Next action:** review and commit the branch, investigate the unusually slow public-site TypeScript check separately, apply the tracked SQL to the intended database, then deploy API and platform builds and smoke-test both community roles.

The file names above are inventory only. Their presence in this note does not make their content available on another computer. If any item becomes necessary for repeatable application behavior, implement a safe tracked equivalent rather than committing local secrets or one-off operational data.

## Secret and configuration rules

- Commit variable names and setup instructions only, never secret values.
- Keep `.env`, `.env.local`, `.env.database`, OAuth refresh tokens, service-account JSON, database passwords, signed URLs, and provider recovery codes out of Git and memory.
- Prefer Google Cloud Secret Manager, Cloudflare-managed configuration, or the relevant deployment provider for production values.
- Configure each computer independently. Never assume a browser login or CLI credential is shared by cloning the repository.
