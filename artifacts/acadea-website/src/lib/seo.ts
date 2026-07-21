import { useEffect } from "react";

export const SITE_URL = "https://acadea.org";
export const SITE_NAME = "ACADEA";
export const SITE_TITLE_SUFFIX = "ACADEA";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/opengraph.jpg`;
export const DEFAULT_LOCALE = "pl_PL";
export const DEFAULT_LANGUAGE = "pl";

const ORGANIZATION_NAME = "Fundacja Acadea";
const ORGANIZATION_LOGO = `${SITE_URL}/images/logo-dark.png`;
const CONTACT_EMAIL = "contact@acadea.org";
const CONTACT_PHONE = "+48 728 492 936";
const CONTACT_WHATSAPP = "https://wa.me/48799831204";
const YOUTUBE_URL = "https://www.youtube.com/@acadeaorg";

const ORGANIZATION_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Jedności Narodowej 55-57 / 15",
  addressLocality: "Wrocław",
  postalCode: "50-262",
  addressCountry: "PL",
} as const;

const LANGUAGE_ROUTE_PAIRS: Record<string, string> = {
  "/": "/en",
  "/jak-to-dziala": "/en/how-it-works",
  "/kraje": "/en/countries",
  "/o-nas": "/en/about-us",
  "/kontakt": "/en/contact",
  "/baza-wiedzy": "/en/knowledge-base",
  "/stypendium": "/en/scholarship",
  "/stypendium/aplikacja": "/en/scholarship/application",
  "/stypendium/zgoda-rodzica": "/en/scholarship/parent-consent",
  "/stypendium/regulamin": "/en/scholarship/terms",
  "/umow-spotkanie": "/en/book-consultation",
  "/mentoruj": "/en/become-a-mentor",
  "/polityka-prywatnosci": "/en/privacy-policy",
  "/regulamin": "/en/terms",
  "/regulamin-platformy": "/en/platform-terms",
};

const ENGLISH_TO_POLISH_ROUTE = Object.fromEntries(
  Object.entries(LANGUAGE_ROUTE_PAIRS).map(([pl, en]) => [en, pl]),
);

type JsonLdSchema = Record<string, unknown>;

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type SeoConfig = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article";
  author?: string;
  keywords?: string[];
  noindex?: boolean;
  lang?: string;
  locale?: string;
  publishedTime?: string;
  modifiedTime?: string;
  alternates?: {
    pl: string;
    en: string;
  };
  schemas?: JsonLdSchema[];
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function ensureAbsoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const path = normalizePublicPath(value);
  return `${SITE_URL}${path}`;
}

/**
 * The deployed static host serves route directories with a trailing slash.
 * Keeping every public SEO URL in that form avoids canonical and sitemap mismatches.
 */
export function normalizePublicPath(value: string) {
  const [pathAndQuery, hash = ""] = value.split("#", 2);
  const [pathname, query = ""] = pathAndQuery.split("?", 2);
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (withLeadingSlash === "/" || /\/[^/]+\.[^/]+$/.test(withLeadingSlash)) {
    return `${withLeadingSlash}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
  }

  return `${withLeadingSlash.replace(/\/+$/, "")}/${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

function normalizedPathname(value: string) {
  const [pathAndQuery] = value.split("#", 1);
  const [pathname] = pathAndQuery.split("?", 1);
  return pathname.replace(/\/+$/, "") || "/";
}

function languageForPath(value: string) {
  const pathname = normalizedPathname(value);
  return pathname === "/en" || pathname.startsWith("/en/") ? "en-GB" : "pl-PL";
}

export function getLanguageAlternates(value: string) {
  const pathname = normalizedPathname(value);
  let polishPath = "";
  let englishPath = "";

  if (LANGUAGE_ROUTE_PAIRS[pathname]) {
    polishPath = pathname;
    englishPath = LANGUAGE_ROUTE_PAIRS[pathname];
  } else if (ENGLISH_TO_POLISH_ROUTE[pathname]) {
    polishPath = ENGLISH_TO_POLISH_ROUTE[pathname];
    englishPath = pathname;
  } else if (pathname.startsWith("/kraje/")) {
    polishPath = pathname;
    englishPath = pathname.replace(/^\/kraje/, "/en/countries");
  } else if (pathname.startsWith("/en/countries/")) {
    polishPath = pathname.replace(/^\/en\/countries/, "/kraje");
    englishPath = pathname;
  } else if (pathname.startsWith("/umow-spotkanie/")) {
    polishPath = pathname;
    englishPath = pathname.replace(/^\/umow-spotkanie/, "/en/book-consultation");
  } else if (pathname.startsWith("/en/book-consultation/")) {
    polishPath = pathname.replace(/^\/en\/book-consultation/, "/umow-spotkanie");
    englishPath = pathname;
  } else {
    return null;
  }

  return {
    pl: buildAbsoluteUrl(polishPath),
    en: buildAbsoluteUrl(englishPath),
  };
}

function ensureAbsoluteImage(value?: string) {
  return ensureAbsoluteUrl(value || DEFAULT_OG_IMAGE);
}

function ensureMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value);
  });
}

function removeMeta(selector: string) {
  document.head.querySelector(selector)?.remove();
}

function ensureLink(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element!.setAttribute(key, value);
  });
}

function removeManagedJsonLd() {
  document.head
    .querySelectorAll('script[type="application/ld+json"][data-acadea-seo="true"]')
    .forEach((node) => node.remove());
}

function appendJsonLd(schema: JsonLdSchema) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-acadea-seo", "true");
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function toIsoDate(value?: string) {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString();
}

export function buildAbsoluteUrl(path: string) {
  return ensureAbsoluteUrl(path);
}

export function createOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORGANIZATION_NAME,
    alternateName: SITE_NAME,
    url: SITE_URL,
    logo: ORGANIZATION_LOGO,
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    address: ORGANIZATION_ADDRESS,
    sameAs: [
      "https://www.facebook.com/acadeaorg/",
      "https://www.instagram.com/acadeaorg?igsh=NmFwcHUwZXI1M2Y5&utm_source=qr",
      "https://www.linkedin.com/company/acadeaorg",
      YOUTUBE_URL,
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: CONTACT_EMAIL,
        telephone: CONTACT_PHONE,
        availableLanguage: ["pl", "en"],
      },
    ],
  } satisfies JsonLdSchema;
}

export function createLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    legalName: ORGANIZATION_NAME,
    url: SITE_URL,
    image: DEFAULT_OG_IMAGE,
    logo: ORGANIZATION_LOGO,
    email: CONTACT_EMAIL,
    telephone: CONTACT_PHONE,
    address: ORGANIZATION_ADDRESS,
    sameAs: [
      "https://www.facebook.com/acadeaorg/",
      "https://www.instagram.com/acadeaorg?igsh=NmFwcHUwZXI1M2Y5&utm_source=qr",
      "https://www.linkedin.com/company/acadeaorg",
      YOUTUBE_URL,
      CONTACT_WHATSAPP,
    ],
    areaServed: ["PL", "GB", "NL", "DE", "DK", "SE", "US", "CA", "CH", "FR", "IE"],
  } satisfies JsonLdSchema;
}

export function createWebSiteSchema(language = "pl-PL") {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: ORGANIZATION_NAME,
    url: SITE_URL,
    inLanguage: language,
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: ORGANIZATION_LOGO,
      },
    },
  } satisfies JsonLdSchema;
}

export function createBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: buildAbsoluteUrl(item.path),
    })),
  } satisfies JsonLdSchema;
}

export function createSiteNavigationSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Główna nawigacja serwisu",
    itemListElement: items.map((item, index) => ({
      "@type": "SiteNavigationElement",
      position: index + 1,
      name: item.name,
      url: buildAbsoluteUrl(item.path),
    })),
  } satisfies JsonLdSchema;
}

export function createItemListSchema(input: {
  name: string;
  items: BreadcrumbItem[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: buildAbsoluteUrl(item.path),
    })),
  } satisfies JsonLdSchema;
}

export function createWebPageSchema(input: {
  path: string;
  title: string;
  description: string;
  type?: string;
  image?: string;
}) {
  const schemaType = input.type ?? "WebPage";

  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: input.title,
    headline: input.title,
    description: normalizeText(input.description),
    url: buildAbsoluteUrl(input.path),
    inLanguage: languageForPath(input.path),
    primaryImageOfPage: ensureAbsoluteImage(input.image),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
      logo: {
        "@type": "ImageObject",
        url: ORGANIZATION_LOGO,
      },
    },
  } satisfies JsonLdSchema;
}

export function createCollectionPageSchema(input: {
  path: string;
  title: string;
  description: string;
  image?: string;
}) {
  return createWebPageSchema({
    ...input,
    type: "CollectionPage",
  });
}

export function createArticleSchema(input: {
  path: string;
  title: string;
  description: string;
  image?: string;
  updatedAt?: string;
  category?: string;
  keywords?: string[];
  wordCount?: number;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: normalizeText(input.description),
    image: [ensureAbsoluteImage(input.image)],
    datePublished: toIsoDate(input.updatedAt),
    dateModified: toIsoDate(input.updatedAt),
    articleSection: input.category,
    keywords: input.keywords?.join(", "),
    wordCount: input.wordCount,
    inLanguage: languageForPath(input.path),
    author: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: ORGANIZATION_NAME,
      logo: {
        "@type": "ImageObject",
        url: ORGANIZATION_LOGO,
      },
    },
    mainEntityOfPage: buildAbsoluteUrl(input.path),
  } satisfies JsonLdSchema;
}

export function createFaqSchema(
  items: ReadonlyArray<{
    question: string;
    answer: string;
  }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: normalizeText(item.question),
      acceptedAnswer: {
        "@type": "Answer",
        text: normalizeText(item.answer),
      },
    })),
  } satisfies JsonLdSchema;
}

export function useSeo(config: SeoConfig) {
  const serializedConfig = JSON.stringify(config);

  useEffect(() => {
    const current = JSON.parse(serializedConfig) as SeoConfig;
    const title = normalizeText(current.title);
    const description = normalizeText(current.description);
    const canonical = buildAbsoluteUrl(current.path);
    const image = ensureAbsoluteImage(current.image);
    const isEnglishPath = languageForPath(current.path) === "en-GB";
    const locale = current.locale ?? (isEnglishPath ? "en_GB" : DEFAULT_LOCALE);
    const lang = current.lang ?? (isEnglishPath ? "en-GB" : DEFAULT_LANGUAGE);
    const alternates = current.alternates
      ? {
          pl: buildAbsoluteUrl(current.alternates.pl),
          en: buildAbsoluteUrl(current.alternates.en),
        }
      : getLanguageAlternates(current.path);
    const robots = current.noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    document.documentElement.lang = lang;
    document.title = title;

    ensureMeta('meta[name="description"]', { name: "description", content: description });
    ensureMeta('meta[name="robots"]', { name: "robots", content: robots });
    ensureMeta('meta[name="author"]', {
      name: "author",
      content: current.author ?? SITE_NAME,
    });
    ensureMeta('meta[name="theme-color"]', { name: "theme-color", content: "#166534" });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: title });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    ensureMeta('meta[property="og:type"]', {
      property: "og:type",
      content: current.type ?? "website",
    });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    ensureMeta('meta[property="og:image"]', { property: "og:image", content: image });
    ensureMeta('meta[property="og:image:alt"]', {
      property: "og:image:alt",
      content: title,
    });
    ensureMeta('meta[property="og:locale"]', { property: "og:locale", content: locale });
    ensureMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: SITE_NAME,
    });
    ensureMeta('meta[name="twitter:card"]', {
      name: "twitter:card",
      content: "summary_large_image",
    });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });
    ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    ensureMeta('meta[name="twitter:image:alt"]', {
      name: "twitter:image:alt",
      content: title,
    });

    if (current.keywords?.length) {
      ensureMeta('meta[name="keywords"]', {
        name: "keywords",
        content: current.keywords.join(", "),
      });
    } else {
      removeMeta('meta[name="keywords"]');
    }

    if (current.type === "article" && current.modifiedTime) {
      ensureMeta('meta[property="article:modified_time"]', {
        property: "article:modified_time",
        content: toIsoDate(current.modifiedTime) ?? current.modifiedTime,
      });
    } else {
      removeMeta('meta[property="article:modified_time"]');
    }

    if (current.type === "article" && current.publishedTime) {
      ensureMeta('meta[property="article:published_time"]', {
        property: "article:published_time",
        content: toIsoDate(current.publishedTime) ?? current.publishedTime,
      });
    } else {
      removeMeta('meta[property="article:published_time"]');
    }

    ensureLink('link[rel="canonical"]', { rel: "canonical", href: canonical });
    if (alternates) {
      ensureLink('link[rel="alternate"][hreflang="pl-PL"]', {
        rel: "alternate",
        hreflang: "pl-PL",
        href: alternates.pl,
      });
      ensureLink('link[rel="alternate"][hreflang="en-GB"]', {
        rel: "alternate",
        hreflang: "en-GB",
        href: alternates.en,
      });
      ensureLink('link[rel="alternate"][hreflang="x-default"]', {
        rel: "alternate",
        hreflang: "x-default",
        href: alternates.pl,
      });
    } else {
      removeMeta('link[rel="alternate"][hreflang="pl-PL"]');
      removeMeta('link[rel="alternate"][hreflang="en-GB"]');
      removeMeta('link[rel="alternate"][hreflang="x-default"]');
    }

    removeManagedJsonLd();
    (current.schemas ?? []).forEach(appendJsonLd);
  }, [serializedConfig]);
}
