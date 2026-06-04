# ACADEA

Marketing website for ACADEA (Fundacja Acadea) — a Polish educational consultancy that helps students apply to universities abroad, including a scholarship program and mentor matching.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/acadea-website/` — React + Vite marketing site (wouter routing, framer-motion, Tailwind, shadcn/ui in `src/components/ui`)
  - `src/pages/` — one file per route; routes registered in `src/App.tsx`
  - `src/data/countries.ts` — source of truth for countries/universities, plus `countryLocative` (slug→locative phrase) and `uniDomain` (uni slug→domain) maps
  - `public/images/` — local image assets
- `artifacts/api-server/` — Express API; contact submissions POST to `/api/contact`
- Brand colors: primary `#166534` (green), accent `#FCBC1E` (yellow); content is in Polish.

## Architecture decisions

- Forms (MentorForm, ScholarshipForm, Contact) all POST to the shared `/api/contact` endpoint; the `type` field (free-text, e.g. `"scholarship"`) distinguishes submission kinds.
- Frontend fetches use `const BASE = import.meta.env.BASE_URL.replace(/\/$/, "")` then `fetch(\`${BASE}/api/contact\`)` — never root-relative `/api`, so the artifact base path is respected.
- Blog (`/baza-wiedzy`) is content-only: 30 hardcoded articles with client-side `useState` category filters and no per-article detail pages.
- University logos in `CountryDetail.tsx` use a fallback chain (Clearbit → Google favicon → `GraduationCap` icon); CDN misses (`ERR_NAME_NOT_RESOLVED`) are expected and handled gracefully.

## Product

- Public marketing pages: Home, How it works, Countries & universities (with detail pages), Knowledge base (blog), Scholarship program, About us, Contact.
- Lead-capture flows: book a consultation, become a mentor, and apply for the scholarship (`/stypendium/aplikacja`, with mentor picker, achievements/projects questions).
- WhatsApp community join (link + scannable QR code on Home).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
