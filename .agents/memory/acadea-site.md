---
name: ACADEA marketing site conventions
description: Durable copy/positioning decisions and nav naming for the ACADEA website
---

# ACADEA site decisions

- **Scholarship positioning**: The program is framed as a GENERAL mentoring program (students choose their own path — e.g. aviation, dance, study abroad is just one option), NOT a "client funds a scholarship / mecenas edukacji" fund model. Avoid reintroducing the "każdy klient ACADEA jest mecenasem" / "jak działa fundusz" framing.
  **Why:** owner explicitly asked to drop the fund-funded/charity-mecenas narrative and reposition as mentoring.

- **Nav label naming**: "Jak to działa" is labeled **"Jak pomagamy"**; "O nas" is labeled **"Poznajmy się"**. Route paths stay `/jak-to-dziala` and `/o-nas` (labels only changed in Navbar.tsx + Footer.tsx).

- **Country count copy**: use "25+ krajów" everywhere (not 15+).

- **Booking consent**: marketing-consent checkbox is REQUIRED client-side; not yet enforced server-side in `POST /api/booking/create`. If legal enforcement is needed, add it to the server Zod schema.

- **Scholarship parent-consent links**: browser-facing consent links belong to `acadea.org`, never `api.acadea.org`. The API uses `PUBLIC_SITE_URL` when configured and otherwise defaults to `https://acadea.org`; root consent paths on the API host exist only as temporary redirects for already-sent emails. Polish and English consent pages must be prerendered, marked `noindex`, and excluded from the sitemap.

- **Google Ad Grants website remediation**: The homepage and About page must identify Fundacja Acadea prominently, state its education-access mission and current activities, and show KRS 0001240540. Keep the mission tied to the free knowledge base, mentoring/scholarship programme, and application support. The primary navigation includes Contact, and the footer shows the foundation's KRS, NIP, REGON, and registered address visibly.

- **Public-site performance and crawlability**: Keep the interactive globe deferred and desktop-only; do not reintroduce Framer Motion into the eagerly loaded homepage or navigation. The consultation prompt is desktop-only so it cannot block tablet/mobile navigation. Every public English navigation route and English country-detail route must be prerendered and included in the sitemap when indexable.
