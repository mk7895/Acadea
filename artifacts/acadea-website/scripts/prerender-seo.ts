import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { articles } from "../src/data/articles";
import { countries } from "../src/data/countries";
import { HOME_FAQ_ITEMS } from "../src/data/home-faq";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  SITE_URL,
  createArticleSchema,
  createBreadcrumbSchema,
  createCollectionPageSchema,
  createFaqSchema,
  createItemListSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createSiteNavigationSchema,
  createWebPageSchema,
  createWebSiteSchema,
} from "../src/lib/seo";

type JsonLdSchema = Record<string, unknown>;

type RouteMeta = {
  path: string;
  title: string;
  description: string;
  heading?: string;
  image?: string;
  type?: "website" | "article";
  keywords?: string[];
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  schemas?: JsonLdSchema[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const distRoot = path.join(projectRoot, "dist", "public");
const templatePath = path.join(distRoot, "index.html");

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${SITE_URL}${normalized}`;
}

function upsertMetaByName(html: string, name: string, content: string) {
  const tag = `<meta name="${name}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(
    `<meta\\s+name=["']${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
    "i",
  );

  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function upsertMetaByProperty(html: string, property: string, content: string) {
  const tag = `<meta property="${property}" content="${escapeHtml(content)}" />`;
  const pattern = new RegExp(
    `<meta\\s+property=["']${property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'][^>]*>`,
    "i",
  );

  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function upsertLink(
  html: string,
  selector: { rel: string; hreflang?: string },
  href: string,
) {
  const attributes = [`rel="${selector.rel}"`];
  if (selector.hreflang) {
    attributes.push(`hreflang="${selector.hreflang}"`);
  }

  const tag = `<link ${attributes.join(" ")} href="${escapeHtml(href)}" />`;
  const relPattern = selector.rel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hreflangPattern = selector.hreflang
    ? `[^>]*hreflang=["']${selector.hreflang.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`
    : "";
  const pattern = new RegExp(
    `<link\\s+[^>]*rel=["']${relPattern}["']${hreflangPattern}[^>]*>`,
    "i",
  );

  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function injectJsonLd(html: string, schemas: JsonLdSchema[]) {
  const jsonLd = schemas
    .map(
      (schema) =>
        `    <script type="application/ld+json" data-acadea-seo="true">${JSON.stringify(schema)}</script>`,
    )
    .join("\n");

  return html.replace("</head>", `${jsonLd}\n  </head>`);
}

function injectNoScriptFallback(html: string, meta: RouteMeta) {
  const heading = escapeHtml(meta.heading ?? meta.title.replace(/\s*\|\s*ACADEA$/, ""));
  const description = escapeHtml(meta.description);

  const fallback = [
    "<noscript>",
    "  <style>#root{display:none!important}</style>",
    '  <main style="margin:0 auto;max-width:56rem;padding:2rem 1rem;font-family:Inter,system-ui,sans-serif;line-height:1.6;color:#1f2937">',
    `    <h1 style="margin:0 0 1rem;font-size:2rem;line-height:1.15;color:#166534">${heading}</h1>`,
    `    <p style="margin:0;color:#4b5563">${description}</p>`,
    "  </main>",
    "</noscript>",
  ].join("\n");

  return html.replace("<div id=\"root\"></div>", `${fallback}\n    <div id="root"></div>`);
}

function buildStaticRouteMeta(): RouteMeta[] {
  return [
    {
      path: "/",
      title: "Studia za granicą i doradztwo aplikacyjne | ACADEA",
      description:
        "Pomagamy kandydatom dostać się na studia za granicą. ACADEA wspiera w wyborze uczelni, esejach, dokumentach, egzaminach i planowaniu aplikacji.",
      heading: "Studia za granicą i doradztwo aplikacyjne",
      keywords: [
        "studia za granicą",
        "doradztwo aplikacyjne",
        "aplikacja na studia",
        "studia za granicą pomoc",
        "ACADEA",
      ],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebSiteSchema(),
        createWebPageSchema({
          path: "/",
          title: "Studia za granicą | Doradztwo aplikacyjne i wybór uczelni | ACADEA",
          description:
            "ACADEA pomaga w aplikacji na studia za granicą, wyborze uczelni, dokumentach, esejach, stypendiach i planowaniu całego procesu.",
        }),
        createFaqSchema(HOME_FAQ_ITEMS),
        createBreadcrumbSchema([{ name: "Strona Główna", path: "/" }]),
        createSiteNavigationSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Jak pomagamy", path: "/jak-to-dziala" },
          { name: "Kraje i Uczelnie", path: "/kraje" },
          { name: "Baza Wiedzy", path: "/baza-wiedzy" },
          { name: "Stypendia", path: "/stypendium" },
          { name: "Poznajmy się", path: "/o-nas" },
          { name: "Kontakt", path: "/kontakt" },
        ]),
      ],
    },
    {
      path: "/jak-to-dziala",
      title: "Jak pomagamy w aplikacji na studia za granicą | ACADEA",
      description:
        "Zobacz, jak wygląda współpraca z ACADEA krok po kroku: wybór uczelni, egzaminy, dokumenty, eseje, aplikacja, rozmowy i formalności po przyjęciu.",
      heading: "Jak pomagamy w aplikacji na studia za granicą",
      keywords: [
        "jak aplikować na studia za granicą",
        "pomoc w aplikacji",
        "eseje aplikacyjne",
        "doradztwo studia za granicą",
      ],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/jak-to-dziala",
          title: "Jak pomagamy w aplikacji na studia za granicą | ACADEA",
          description:
            "Opis procesu współpracy z ACADEA przy aplikacji na studia za granicą od wyboru uczelni po wyjazd.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Jak pomagamy", path: "/jak-to-dziala" },
        ]),
      ],
    },
    {
      path: "/kraje",
      title: "Kraje i uczelnie za granicą | ACADEA",
      description:
        "Poznaj kraje i uczelnie, do których pomagamy aplikować. Sprawdź wymagania, kierunki i możliwości studiowania za granicą z ACADEA.",
      heading: "Kraje i uczelnie za granicą",
      keywords: [
        "studia za granicą kraje",
        "uczelnie za granicą",
        "gdzie studiować za granicą",
        "kraje i uczelnie",
      ],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createCollectionPageSchema({
          path: "/kraje",
          title: "Kraje i uczelnie za granicą | ACADEA",
          description:
            "Przegląd krajów i uczelni, do których pomagamy aplikować w ramach doradztwa ACADEA.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Kraje i Uczelnie", path: "/kraje" },
        ]),
        createItemListSchema({
          name: "Kraje dostępne w ACADEA",
          items: countries.map((country) => ({
            name: country.name,
            path: `/kraje/${country.slug}`,
          })),
        }),
      ],
    },
    {
      path: "/o-nas",
      title: "Poznajmy się | Zespół ACADEA",
      description:
        "Poznaj zespół ACADEA i historię osób, które same przeszły proces aplikacji na studia za granicą, a dziś wspierają kolejnych kandydatów.",
      heading: "Poznajmy się",
      keywords: ["o nas ACADEA", "zespół ACADEA", "mentorzy studia za granicą"],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/o-nas",
          title: "Poznajmy się | Zespół ACADEA",
          description:
            "Strona o zespole ACADEA, jego wartościach i doświadczeniu w aplikacji na studia za granicą.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Poznajmy się", path: "/o-nas" },
        ]),
      ],
    },
    {
      path: "/kontakt",
      title: "Kontakt i bezpłatna konsultacja | ACADEA",
      description:
        "Skontaktuj się z ACADEA i umów bezpłatną konsultację dotyczącą studiów za granicą, wyboru uczelni i procesu aplikacyjnego.",
      heading: "Kontakt i bezpłatna konsultacja",
      keywords: ["kontakt ACADEA", "bezpłatna konsultacja studia za granicą", "doradztwo kontakt"],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/kontakt",
          title: "Kontakt i bezpłatna konsultacja | ACADEA",
          description:
            "Dane kontaktowe ACADEA oraz formularz kontaktowy dla kandydatów zainteresowanych studiami za granicą.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Kontakt", path: "/kontakt" },
        ]),
      ],
    },
    {
      path: "/baza-wiedzy",
      title: "Baza wiedzy o studiach za granicą | ACADEA",
      description:
        "Poradniki ACADEA o studiach za granicą: aplikacja, terminy, dokumenty, egzaminy, kierunki, kraje, uczelnie i stypendia.",
      heading: "Baza wiedzy o studiach za granicą",
      keywords: [
        "baza wiedzy studia za granicą",
        "poradniki studia za granicą",
        "aplikacja na studia poradnik",
        "ACADEA blog",
      ],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createCollectionPageSchema({
          path: "/baza-wiedzy",
          title: "Baza wiedzy o studiach za granicą | ACADEA",
          description:
            "Artykuły i poradniki ACADEA o aplikacji na studia za granicą, uczelniach, krajach, egzaminach i finansowaniu.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Baza Wiedzy", path: "/baza-wiedzy" },
        ]),
      ],
    },
    {
      path: "/stypendium",
      title: "Program Stypendialny ACADEA | Konkurs stypendialny",
      description:
        "Poznaj Program Stypendialny ACADEA i sprawdź zasady konkursu dla ambitnych kandydatów, którzy potrzebują wsparcia mentoringowego i edukacyjnego.",
      heading: "Program Stypendialny ACADEA",
      keywords: [
        "stypendium ACADEA",
        "konkurs stypendialny",
        "program stypendialny",
        "stypendium studia za granicą",
      ],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/stypendium",
          title: "Program Stypendialny ACADEA | Konkurs stypendialny",
          description:
            "Strona programu stypendialnego ACADEA z opisem konkursu, mentorów i formularza zgłoszeniowego.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Stypendia", path: "/stypendium" },
        ]),
      ],
    },
    {
      path: "/stypendium/aplikacja",
      title: "Aplikacja do konkursu stypendialnego | ACADEA",
      description:
        "Wypełnij formularz zgłoszeniowy do Konkursu Stypendialnego ACADEA i opowiedz o swoich planach, osiągnięciach oraz motywacji.",
      heading: "Aplikacja do konkursu stypendialnego",
      keywords: ["formularz stypendium", "aplikacja stypendialna", "konkurs stypendialny ACADEA"],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/stypendium/aplikacja",
          title: "Aplikacja do konkursu stypendialnego | ACADEA",
          description:
            "Formularz zgłoszeniowy do programu stypendialnego ACADEA dla kandydatów aplikujących o wsparcie.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Stypendia", path: "/stypendium" },
          { name: "Aplikacja", path: "/stypendium/aplikacja" },
        ]),
      ],
    },
    {
      path: "/stypendium/regulamin",
      title: "Regulamin Konkursu Stypendialnego ACADEA",
      description:
        "Przeczytaj regulamin Konkursu Stypendialnego ACADEA, zasady zgłoszeń, punktację, sposób oceny oraz warunki wyboru stypendystów.",
      heading: "Regulamin Konkursu Stypendialnego ACADEA",
      keywords: ["regulamin stypendium", "konkurs stypendialny regulamin", "ACADEA regulamin stypendium"],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/stypendium/regulamin",
          title: "Regulamin Konkursu Stypendialnego ACADEA",
          description:
            "Regulamin programu stypendialnego ACADEA z zasadami zgłoszeń, oceną i wyborem stypendystów.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Stypendia", path: "/stypendium" },
          { name: "Regulamin Stypendium", path: "/stypendium/regulamin" },
        ]),
      ],
    },
    {
      path: "/umow-spotkanie",
      title: "Umów bezpłatną konsultację | ACADEA",
      description:
        "Wybierz termin i umów bezpłatną konsultację z ACADEA dotyczącą studiów za granicą, wyboru uczelni i planu aplikacji.",
      heading: "Umów bezpłatną konsultację",
      keywords: ["umów konsultację", "bezpłatna konsultacja ACADEA", "spotkanie studia za granicą"],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/umow-spotkanie",
          title: "Umów bezpłatną konsultację | ACADEA",
          description:
            "Strona rezerwacji bezpłatnej konsultacji ACADEA dla kandydatów zainteresowanych studiami za granicą.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Umów spotkanie", path: "/umow-spotkanie" },
        ]),
      ],
    },
    {
      path: "/mentoruj",
      title: "Dołącz do zespołu mentorów | ACADEA",
      description:
        "Aplikuj do zespołu ACADEA jako mentor lub wolontariusz i wspieraj kandydatów aplikujących na studia za granicą.",
      heading: "Dołącz do zespołu mentorów",
      keywords: ["mentor ACADEA", "dołącz do zespołu", "mentoring studia za granicą"],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/mentoruj",
          title: "Dołącz do zespołu mentorów | ACADEA",
          description:
            "Formularz zgłoszeniowy dla osób, które chcą współpracować z ACADEA jako mentorzy lub wolontariusze.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Mentoruj", path: "/mentoruj" },
        ]),
      ],
    },
    {
      path: "/polityka-prywatnosci",
      title: "Polityka prywatności | ACADEA",
      description:
        "Polityka prywatności ACADEA: informacje o przetwarzaniu danych osobowych, cookies, formularzach, platformie i prawach użytkownika.",
      heading: "Polityka prywatności",
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/polityka-prywatnosci",
          title: "Polityka prywatności | ACADEA",
          description:
            "Zasady prywatności ACADEA dotyczące danych osobowych, cookies, formularzy i praw użytkownika.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Polityka prywatności", path: "/polityka-prywatnosci" },
        ]),
      ],
    },
    {
      path: "/regulamin",
      title: "Regulamin serwisu | ACADEA",
      description:
        "Regulamin serwisu ACADEA określający zasady korzystania z witryny, formularzy, rezerwacji spotkań i komunikacji elektronicznej.",
      heading: "Regulamin serwisu",
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/regulamin",
          title: "Regulamin serwisu | ACADEA",
          description:
            "Regulamin korzystania z serwisu ACADEA wraz z zasadami formularzy, rezerwacji i odpowiedzialności.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Regulamin", path: "/regulamin" },
        ]),
      ],
    },
    {
      path: "/regulamin-platformy",
      title: "Regulamin platformy ACADEA",
      description:
        "Regulamin platformy ACADEA opisujący zasady korzystania z kont, materiałów, spotkań, danych i integracji zewnętrznych.",
      heading: "Regulamin platformy ACADEA",
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createWebPageSchema({
          path: "/regulamin-platformy",
          title: "Regulamin platformy ACADEA",
          description:
            "Regulamin korzystania z platformy ACADEA, w tym kont, dokumentów, materiałów i integracji zewnętrznych.",
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Regulamin Platformy", path: "/regulamin-platformy" },
        ]),
      ],
    },
    {
      path: "/panel",
      title: "Panel artykułów | ACADEA",
      description: "Panel administracyjny artykułów ACADEA.",
      heading: "Panel artykułów",
      noindex: true,
    },
    {
      path: "/404",
      title: "404 | Strona nie została znaleziona | ACADEA",
      description: "Strona, której szukasz, nie istnieje lub została przeniesiona.",
      heading: "Strona nie została znaleziona",
      noindex: true,
    },
  ];
}

function buildCountryRouteMeta(): RouteMeta[] {
  return countries.map((country) => ({
    path: `/kraje/${country.slug}`,
    title: `Studia w ${country.name} | Uczelnie i aplikacja | ACADEA`,
    description: country.intro,
    heading: `Studia w ${country.name}`,
    keywords: [
      `studia w ${country.name}`,
      `${country.name} uczelnie`,
      `${country.name} aplikacja`,
      `studia za granicą ${country.name}`,
    ],
    schemas: [
      createOrganizationSchema(),
      createLocalBusinessSchema(),
      createWebPageSchema({
        path: `/kraje/${country.slug}`,
        title: `Studia w ${country.name} | Uczelnie i aplikacja | ACADEA`,
        description: country.intro,
      }),
      createBreadcrumbSchema([
        { name: "Strona Główna", path: "/" },
        { name: "Kraje i Uczelnie", path: "/kraje" },
        { name: country.name, path: `/kraje/${country.slug}` },
      ]),
    ],
  }));
}

function estimateWordCount(markdown: string) {
  return markdown
    .replace(/[#*_>`-]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

function buildArticleRouteMeta(): RouteMeta[] {
  return articles.map((article) => {
    const articlePath = `/baza-wiedzy${article.slug}`;

    return {
      path: articlePath,
      title: `${article.title} | ACADEA`,
      description: article.excerpt,
      heading: article.title,
      image: article.image,
      type: "article",
      publishedTime: article.updatedAt,
      modifiedTime: article.updatedAt,
      keywords: [article.category, article.title, "studia za granicą", "ACADEA"],
      schemas: [
        createOrganizationSchema(),
        createLocalBusinessSchema(),
        createArticleSchema({
          path: articlePath,
          title: article.title,
          description: article.excerpt,
          image: article.image,
          updatedAt: article.updatedAt,
          category: article.category,
          keywords: [article.category, article.title, "studia za granicą", "ACADEA"],
          wordCount: estimateWordCount(article.markdown),
        }),
        createBreadcrumbSchema([
          { name: "Strona Główna", path: "/" },
          { name: "Baza Wiedzy", path: "/baza-wiedzy" },
          { name: article.title, path: articlePath },
        ]),
      ],
    };
  });
}

function applyRouteMeta(template: string, meta: RouteMeta) {
  const title = normalizeText(meta.title);
  const description = normalizeText(meta.description);
  const canonical = absoluteUrl(meta.path);
  const image = absoluteUrl(meta.image ?? DEFAULT_OG_IMAGE);
  const robots = meta.noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  let html = template;
  html = html.replace(/<html[^>]*lang="[^"]*"[^>]*>/i, '<html lang="pl">');
  html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = upsertMetaByName(html, "description", description);
  html = upsertMetaByName(html, "robots", robots);
  html = upsertMetaByName(html, "author", SITE_NAME);
  html = upsertMetaByProperty(html, "og:title", title);
  html = upsertMetaByProperty(html, "og:description", description);
  html = upsertMetaByProperty(html, "og:type", meta.type ?? "website");
  html = upsertMetaByProperty(html, "og:url", canonical);
  html = upsertMetaByProperty(html, "og:image", image);
  html = upsertMetaByProperty(html, "og:image:alt", meta.heading ?? title);
  html = upsertMetaByProperty(html, "og:locale", "pl_PL");
  html = upsertMetaByProperty(html, "og:site_name", SITE_NAME);
  html = upsertMetaByName(html, "twitter:card", "summary_large_image");
  html = upsertMetaByName(html, "twitter:title", title);
  html = upsertMetaByName(html, "twitter:description", description);
  html = upsertMetaByName(html, "twitter:image", image);
  html = upsertMetaByName(html, "twitter:image:alt", meta.heading ?? title);
  html = upsertLink(html, { rel: "canonical" }, canonical);
  html = upsertLink(html, { rel: "alternate", hreflang: "pl-PL" }, canonical);
  html = upsertLink(html, { rel: "alternate", hreflang: "x-default" }, canonical);

  if (meta.keywords?.length) {
    html = upsertMetaByName(html, "keywords", meta.keywords.join(", "));
  }

  if (meta.type === "article" && meta.publishedTime) {
    html = upsertMetaByProperty(html, "article:published_time", meta.publishedTime);
  }

  if (meta.type === "article" && meta.modifiedTime) {
    html = upsertMetaByProperty(html, "article:modified_time", meta.modifiedTime);
  }

  if (meta.schemas?.length) {
    html = injectJsonLd(html, meta.schemas);
  }

  html = injectNoScriptFallback(html, meta);
  return html;
}

async function writeRouteHtml(meta: RouteMeta, template: string) {
  const routeDir =
    meta.path === "/"
      ? distRoot
      : path.join(distRoot, meta.path.replace(/^\/+/, ""));

  await mkdir(routeDir, { recursive: true });
  await writeFile(path.join(routeDir, "index.html"), applyRouteMeta(template, meta), "utf8");

  if (meta.path === "/404") {
    await writeFile(path.join(distRoot, "404.html"), applyRouteMeta(template, meta), "utf8");
  }
}

async function main() {
  const template = await readFile(templatePath, "utf8");
  const routeMeta = [
    ...buildStaticRouteMeta(),
    ...buildCountryRouteMeta(),
    ...buildArticleRouteMeta(),
  ];

  await Promise.all(routeMeta.map((meta) => writeRouteHtml(meta, template)));
}

await main();
