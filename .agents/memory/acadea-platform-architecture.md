---
name: ACADEA platform architecture and guide logic
description: Durable technical context for the ACADEA website, mentor/mentee platform, API, data model, integrations, deployment, and two-computer development workflow
verified_at_commit: cf2d2720a49ff3520f1fe8faba3d911704759e0c
verified_on: 2026-08-01
---

# ACADEA technical context

## Source-of-truth rule

This note records the implementation at commit `cf2d272` on `main`. Re-check the current branch and schema before relying on it. The code is authoritative over older chat summaries. Production state and dashboard-only settings may differ from the repository.

## Repository and runtime map

- This is a private `pnpm` TypeScript monorepo. The root build runs library typechecking, artifact typechecking, and each artifact build.
- `artifacts/acadea-website`: React 19 + Vite public marketing site and knowledge base (`acadea.org`). It supports Polish and English routes, builds a sitemap, and prerenders SEO HTML.
- `artifacts/acadea-platform`: React 19 + Vite admin/mentor/mentee application (`app.acadea.org`). Its default API base is `/api/platform`; local Vite proxies `/api` to `http://127.0.0.1:5001`.
- `artifacts/api-server`: Express 5 API. Every route is mounted below `/api`. The platform API lives primarily in the large `src/routes/platform.ts` module.
- `lib/db`: Drizzle ORM schema and PostgreSQL pool. Runtime configuration uses `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`, and `PGSSLMODE` rather than the documented `DATABASE_URL` example.
- `lib/api-spec`, `lib/api-zod`, and `lib/api-client-react`: public-site API contract and generated clients. The platform frontend currently uses its own small `apiFetch` wrapper instead of these generated clients.

There are currently no automated test files or configured Jest/Vitest/Playwright/Cypress suite. The main automated gates are `pnpm run typecheck` and `pnpm run build`.

## Deployment and live topology

- On 2026-08-01, `acadea.org` and `app.acadea.org` were live behind Cloudflare. The exact frontend build/deploy configuration is not stored in this repository.
- `api.acadea.org` resolves through Google infrastructure and `/api/healthz` returns `{ "status": "ok" }`.
- `cloudbuild.api.yaml` builds the API Docker image, pushes it to Artifact Registry, and deploys the `acadea-api` Cloud Run service in `europe-west1`. Cloud Run uses the default VPC/subnet with private-ranges-only egress.
- PostgreSQL is the application database. The repository contains Cloud SQL-oriented configuration and one-off SQL files, but no conventional ordered migration directory. A code deploy does not itself prove that the production database schema was updated.
- The API container builds on Node 22. The current `run-local.sh` forces Node 24 and hard-codes Mateusz's absolute checkout path, so it is not portable to Marlena's computer and should not be treated as a shared launcher until fixed.

## Authentication and roles

- Platform roles: `admin`, `mentor`, `mentee`. User statuses: `active`, `pending`, `disabled`.
- Mentee signup creates a pending user and unapproved mentee profile, records acceptance of platform terms in `notes`, creates the Google workspace when configured, and immediately issues a session.
- Login, signup, and password reset use Cloudflare Turnstile when configured.
- Platform sessions are opaque 32-byte bearer tokens. Only SHA-256 token hashes are stored in PostgreSQL; sessions last 14 days. Password-reset tokens last 30 minutes.
- Authorization is enforced in route middleware using bearer tokens and role checks. The frontend stores the session token under `acadea-platform-session`.
- First-admin bootstrap requires `PLATFORM_SETUP_SECRET` or the fallback `ADMIN_PANEL_SECRET`, and is disabled once an admin exists.

## Core platform data model

- Accounts and access: `platform_users`, `platform_sessions`, `platform_password_reset_tokens`, `mentor_profiles`, `mentee_profiles`, `platform_mentor_assignments`, `platform_guide_assignments`.
- University process: `platform_guides`, `platform_guide_checklist_items`, `platform_material_templates`, `platform_material_item_states`, `platform_file_assets`.
- Mentoring: `mentor_availability_rules`, `mentor_universities`, `platform_meetings`, `platform_mentor_workspace_links`.
- Integrations and commerce: `platform_google_connections`, `platform_products`, `platform_cart_items`, `platform_popup_configs`, `platform_email_classifier_rules`, `platform_university_emails`.

## University-guide model and inheritance

`platform_guides` is used for both reusable templates and per-student live guides:

- `admin_template`: canonical university/program template created by an admin. Published templates become selectable by approved mentees. A special subset is used as item-level hint guides.
- `mentor_blueprint`: reusable template owned by a mentor.
- `self_service_live`: mentee-owned live copy adopted from an admin template.
- `mentor_live`: live copy assigned to a mentee and owned by a mentor.

Important fields:

- `sourceGuideId` links a live guide to its reusable source.
- `menteeUserId` makes a live guide visible in that student's overview.
- `ownerUserId` controls mentor/admin editing ownership.
- `sortOrder` controls top-level display order.
- `offerStatus` is `none`, `conditional`, or `final` with `offerMarkedAt`.
- `emailSenderDomains` identifies university sender domains for Gmail monitoring.
- `isVisibleToUnapprovedUsers` exists on guide records, but normal mentee template discovery is still gated by profile approval in the current overview route.

When a mentee adopts a published `admin_template`, the backend:

1. requires `adminApproved`;
2. rejects an already-active guide with the same source;
3. checks the mentee's active-guide limit;
4. creates a `self_service_live` guide tied to the source and mentee;
5. copies checklist items with completion reset to false;
6. keeps source-backed summary, description, and university email domains available through shaping logic.

Admin assignment can create either `mentor_live` or `self_service_live`. Mentor and admin edits to a source guide propagate `emailSenderDomains` to its derived rows, while `shapeGuideList` dynamically reads source summary/description for self-service guides. Other copied checklist content does not automatically inherit later source edits.

Deleting a guide uses custom cascade cleanup to remove linked live guides and references from material templates in addition to database foreign-key cascades.

## Guide access, hints, and materials

- `mentee_profiles.maxActiveGuideCount` defaults to 1 and caps simultaneous live guides.
- `maxHintGuideCount` defaults to 1 and controls how many university templates receive active hints.
- `disabledHintGuideTemplateIds` stores explicit hint exclusions.
- `platform_guide_assignments` is used for persistent guide/template access. Current code also writes an assignment during self-service adoption and when hint access is enabled, so this table represents more than one business concept.
- Material templates can apply to whole guide IDs or to individual structure rows through `appliesToGuideIds`.
- Material rows have country/university/item levels and actions such as `check_only`, `file_required`, `file_or_doc`, and `check_or_file`.
- Item-level hint guides are stored as otherwise normal admin/mentor blueprint rows whose `driveFolderUrl` contains an internal `__meta:` JSON marker with `kind: "item_guide"` and applicable guide IDs. This is a compatibility convention, not a dedicated schema field.
- Blueprint import format version 1 can create/update guides, item guides, and material templates; merge/replace material rows; delete or reorder guides; and place guides before/after another slug. Slugs are normalized and imported row matching is scoped by level, task, country, university, action, and linked guide.
- Mentee overview is the aggregation boundary: profile, limits, mentors, meetings, live guides, accessible templates, material rows/states, hint eligibility, products/cart/popups, storage, Google connections, and university emails are returned together.

## Google integrations

There are two intentionally separate mechanisms:

- User OAuth for a mentor's `calendar` connection uses Calendar plus `gmail.send`. It supports availability/booking, Google Calendar events/Meet links, and mail sent from the mentor's connected account.
- User OAuth for a mentee's `gmail_readonly` connection reads recent messages and is available only when `emailInboxEnabled` is true.
- Google Drive and Google Docs workspace operations use a service account from `GOOGLE_SERVICE_ACCOUNT_JSON`, optionally within `GOOGLE_SHARED_DRIVE_ID`. They do not use the mentor's or mentee's Drive OAuth token.

The current connection types are `calendar` and `gmail_readonly`. An older chat described a half-built `drive` OAuth type, but that type has since been removed from the current schema and routing.

The Gmail monitor scans up to 40 messages from the last 120 days, keeps only messages matching configured university domains from active guides, runs regex classifier rules, and stores up to 100 most recent interpreted rows for the mentee. Unmatched rules default to `info_only` plus manual review.

## Files and storage

- Mentee workspaces, uploaded material files, essay documents, and document tabs primarily use Google Drive/Docs through the service account.
- The default mentee storage limit is 100 MB; the minimum accepted configured value is 10 MB. A single material upload is capped at 15 MB.
- Once a mentee exceeds the limit, the current policy sets a 24-hour cleanup deadline. After the deadline, it trashes newest eligible non-Google files until under quota; Google Docs, folders, shortcuts, and the main essay doc are excluded.
- Cloudflare R2 configuration exists and `/api/media/r2?key=...` creates a one-hour signed GET redirect. The current endpoint itself has no platform-auth middleware and accepts any non-empty object key, so key confidentiality and endpoint authorization require care.

## Products and Stripe status

- Admins can manage products/bundles that add guide slots, hint slots, storage, Gmail monitoring, or mentor access. Products can be synced to Stripe Product and Price records.
- Mentees have a cart. Checkout creates a Stripe Checkout Session when every item has a Stripe Price and `STRIPE_SECRET_KEY` is configured.
- In development, when Stripe is not usable, checkout directly applies entitlements and clears the cart.
- Production payment fulfillment is incomplete at this commit: there is no Stripe webhook route, durable payment/checkout record, idempotent fulfillment handler, or reconciliation path. A successful hosted Checkout redirect therefore does not by itself apply entitlements in this code. Do not describe Stripe billing as production-complete.

## Public website and article-language logic

- The public site and platform share the Express API but are separate frontends.
- Knowledge-base articles are database-backed with local fixtures as a fallback for some rendering paths.
- `articles.language` is `pl` or `en`. `translationKey` pairs language variants and has a unique `(translation_key, language)` index.
- Article detail lookup returns `alternateSlug` for a published article with the same translation key in the other language. The public UI uses that slug for language switching and SEO alternate links.
- Category groups and categories have English-name support in the Cloud SQL update script.

## Known handoff gaps and risks

- Machine-local operational assets and their current known state are tracked in `multi-machine-handoff.md`. In particular, the corrected 40-article English import exists only on Mateusz's computer and its successful production application is not yet confirmed in Git-tracked state.
- `run-local.sh` is tied to Mateusz's path and Node 24, while the shared package manager is pnpm and the production container uses Node 22.
- API CORS is currently unrestricted (`cors()`), so production origin policy should be reviewed before exposing sensitive platform functionality more broadly.
- The public R2 signing endpoint does not require authentication.
- The self-service adoption route inserts `platform_guide_assignments` before checking the active-guide limit. A rejected adoption can therefore leave persistent template access behind.
- Stripe Checkout has no webhook-based entitlement fulfillment yet.
- The platform backend and frontend are each very large single files, and there is no automated test suite; guide/import/access changes need focused manual regression checks plus typecheck/build.

## Two-computer workflow

The mandatory preflight, branch-ownership rules, local asset boundary, and end-of-task handoff format live in `multi-machine-handoff.md`. Follow that document before editing on either computer. Keep this architecture note focused on application behavior and update it when the durable implementation changes.
