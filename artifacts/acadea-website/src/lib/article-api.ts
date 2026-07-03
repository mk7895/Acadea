import { getApiBase } from "@/lib/api-base";
import { COOKIE_CONSENT_COOKIE_NAME, getCookie, PLATFORM_COOKIE_CONSENT_COOKIE_NAME } from "@/lib/cookies";
import {
  articles as staticArticles,
  findArticle as findStaticArticle,
  type Article as StaticArticle,
} from "@/data/articles";
import { STATIC_ARTICLE_TAXONOMY } from "@/data/article-taxonomy";
import {
  normalizeContactFormMarkers,
  type ArticleCategoryGroup,
  type ArticleTocItem,
} from "@/lib/article-content";

const API_BASE = getApiBase();
const allowStaticArticleFallback = import.meta.env.DEV;
const PUBLIC_ARTICLES_CACHE_KEY = "acadea-public-articles-v1";
const PUBLIC_ARTICLE_TAXONOMY_CACHE_KEY = "acadea-public-article-taxonomy-v1";
const PUBLIC_ARTICLE_CACHE_TTL_MS = 1000 * 60 * 60 * 6;

type CacheEnvelope<T> = {
  savedAt: number;
  data: T;
};

type StoredCookieConsent = {
  preferences?: boolean;
};

export interface ArticleSummary {
  id?: number;
  order: number;
  category: string;
  categorySlugs: string[];
  title: string;
  slug: string;
  excerpt: string;
  image: string;
  readMin: number;
  updatedAt: string;
  isPublished?: boolean;
}

export interface ArticleDetail extends ArticleSummary {
  markdown: string;
  relatedSlugs: string[];
  relatedArticles: ArticleSummary[];
  tocItems: ArticleTocItem[];
}

export type ArticleEditorRecord = {
  id: number;
  sortOrder: number;
  category: string;
  categorySlugs: string[];
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  markdown: string;
  relatedSlugs: string[];
  readMin: number;
  tocItems: ArticleTocItem[];
  isPublished: boolean;
  updatedAt: string;
};

export type ArticleTaxonomyResponse = {
  groups: ArticleCategoryGroup[];
};

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function hasPreferencesConsent() {
  const raw = getCookie(COOKIE_CONSENT_COOKIE_NAME) ?? getCookie(PLATFORM_COOKIE_CONSENT_COOKIE_NAME);
  if (!raw) {
    return false;
  }

  try {
    const parsed = JSON.parse(raw) as StoredCookieConsent;
    return Boolean(parsed.preferences);
  } catch {
    return false;
  }
}

function canUseArticleCacheStorage() {
  return canUseStorage() && hasPreferencesConsent();
}

function readCache<T>(key: string): T | null {
  if (!canUseArticleCacheStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed || typeof parsed !== "object" || !("savedAt" in parsed) || !("data" in parsed)) {
      return null;
    }

    if (Date.now() - parsed.savedAt > PUBLIC_ARTICLE_CACHE_TTL_MS) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  if (!canUseArticleCacheStorage()) {
    return;
  }

  try {
    const payload: CacheEnvelope<T> = {
      savedAt: Date.now(),
      data,
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage quota/private mode issues and keep network result usable.
  }
}

export function clearPublicArticleCache() {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(PUBLIC_ARTICLES_CACHE_KEY);
    window.localStorage.removeItem(PUBLIC_ARTICLE_TAXONOMY_CACHE_KEY);
  } catch {
    // Ignore browser storage errors while clearing optional cache.
  }
}

function toSummary(article: StaticArticle): ArticleSummary {
  return {
    order: article.order,
    category: article.category,
    categorySlugs: article.categorySlugs ?? [],
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    image: article.image,
    readMin: article.readMin,
    updatedAt: article.updatedAt,
    isPublished: true,
  };
}

export async function fetchPublishedArticles() {
  try {
    const response = await fetch(`${API_BASE}/articles`);
    if (!response.ok) {
      throw new Error("Failed to fetch articles");
    }

    const articles = (await response.json()) as ArticleSummary[];
    writeCache(PUBLIC_ARTICLES_CACHE_KEY, articles);
    return articles;
  } catch {
    if (allowStaticArticleFallback) {
      return staticArticles.map(toSummary);
    }

    throw new Error("Published articles are unavailable");
  }
}

export async function fetchArticleDetail(slug: string) {
  try {
    const response = await fetch(`${API_BASE}/articles/${encodeURIComponent(slug.replace(/^\//, ""))}`);
    if (!response.ok) {
      throw new Error("Failed to fetch article");
    }

    const article = (await response.json()) as ArticleDetail;
    return {
      ...article,
      markdown: normalizeContactFormMarkers(article.markdown),
    } satisfies ArticleDetail;
  } catch {
    if (!allowStaticArticleFallback) {
      throw new Error("Article detail is unavailable");
    }

    const article = findStaticArticle(slug);
    if (!article) {
      return null;
    }

    const relatedArticles = staticArticles
      .filter((candidate) => candidate.category === article.category && candidate.slug !== article.slug)
      .slice(0, 3)
      .map(toSummary);

    return {
      ...toSummary(article),
      markdown: article.markdown,
      relatedSlugs: relatedArticles.map((candidate) => candidate.slug),
      relatedArticles,
      tocItems: article.tocItems ?? [],
    } satisfies ArticleDetail;
  }
}

export async function fetchArticleTaxonomy() {
  try {
    const response = await fetch(`${API_BASE}/article-taxonomy`);
    if (!response.ok) {
      throw new Error("Failed to fetch article taxonomy");
    }

    const taxonomy = (await response.json()) as ArticleTaxonomyResponse;
    writeCache(PUBLIC_ARTICLE_TAXONOMY_CACHE_KEY, taxonomy);
    return taxonomy;
  } catch {
    if (allowStaticArticleFallback) {
      return { groups: STATIC_ARTICLE_TAXONOMY } satisfies ArticleTaxonomyResponse;
    }

    throw new Error("Article taxonomy is unavailable");
  }
}

export function getCachedPublishedArticles() {
  return readCache<ArticleSummary[]>(PUBLIC_ARTICLES_CACHE_KEY);
}

export function getCachedArticleTaxonomy() {
  return readCache<ArticleTaxonomyResponse>(PUBLIC_ARTICLE_TAXONOMY_CACHE_KEY);
}

export async function prefetchPublicArticleIndex() {
  await Promise.allSettled([fetchPublishedArticles(), fetchArticleTaxonomy()]);
}

export async function fetchAdminArticles(token: string) {
  const response = await fetch(`${API_BASE}/admin/articles`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch admin articles");
  }

  return (await response.json()) as ArticleEditorRecord[];
}

export async function fetchAdminArticleTaxonomy(token: string) {
  const response = await fetch(`${API_BASE}/admin/article-taxonomy`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch admin taxonomy");
  }

  return (await response.json()) as ArticleTaxonomyResponse;
}

export async function createArticleCategoryGroup(
  token: string,
  payload: { name: string; slug?: string; sortOrder?: number },
) {
  const response = await fetch(`${API_BASE}/admin/article-category-groups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create category group");
  }

  return await response.json();
}

export async function deleteArticleCategoryGroup(token: string, id: number) {
  const response = await fetch(`${API_BASE}/admin/article-category-groups/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete category group");
  }
}

export async function createArticleCategory(
  token: string,
  payload: { groupId: number; name: string; slug?: string; sortOrder?: number },
) {
  const response = await fetch(`${API_BASE}/admin/article-categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to create category");
  }

  return await response.json();
}

export async function deleteArticleCategory(token: string, id: number) {
  const response = await fetch(`${API_BASE}/admin/article-categories/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete category");
  }
}
