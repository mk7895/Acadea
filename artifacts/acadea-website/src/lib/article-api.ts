import { getApiBase } from "@/lib/api-base";
import {
  articles as staticArticles,
  findArticle as findStaticArticle,
  type Article as StaticArticle,
} from "@/data/articles";
import type { ArticleCategoryGroup, ArticleTocItem } from "@/lib/article-content";

const API_BASE = getApiBase();

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

    return (await response.json()) as ArticleSummary[];
  } catch {
    return staticArticles.map(toSummary);
  }
}

export async function fetchArticleDetail(slug: string) {
  try {
    const response = await fetch(`${API_BASE}/articles/${encodeURIComponent(slug.replace(/^\//, ""))}`);
    if (!response.ok) {
      throw new Error("Failed to fetch article");
    }

    return (await response.json()) as ArticleDetail;
  } catch {
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

    return (await response.json()) as ArticleTaxonomyResponse;
  } catch {
    return { groups: [] } satisfies ArticleTaxonomyResponse;
  }
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
