import { getApiBase } from "@/lib/api-base";
import { articles as staticArticles, findArticle as findStaticArticle, type Article as StaticArticle } from "@/data/articles";

const API_BASE = getApiBase();

export interface ArticleSummary {
  id?: number;
  order: number;
  category: StaticArticle["category"];
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
}

export type ArticleEditorRecord = {
  id: number;
  sortOrder: number;
  category: StaticArticle["category"];
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  markdown: string;
  relatedSlugs: string[];
  readMin: number;
  isPublished: boolean;
  updatedAt: string;
};

function toSummary(article: StaticArticle): ArticleSummary {
  return {
    order: article.order,
    category: article.category,
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
    } satisfies ArticleDetail;
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

