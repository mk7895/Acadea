import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { hasDatabaseConfig } from "../lib/databaseConfig";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const siteUrl = (process.env.SITE_URL ?? "https://acadea.org").replace(/\/+$/, "");
function getRequestOrigin(req: Request) {
  const forwardedProto = req.get("x-forwarded-proto");
  const forwardedHost = req.get("x-forwarded-host");
  const protocol = forwardedProto ?? req.protocol;
  const host = forwardedHost ?? req.get("host");
  return `${protocol}://${host}`;
}

function resolveAssetUrl(req: Request, value: string) {
  if (/^https?:\/\//i.test(value) || value.startsWith("data:")) {
    return value;
  }

  if (value.startsWith("/")) {
    return `${getRequestOrigin(req)}${value}`;
  }

  return value;
}

function getArticleLanguage(req: Request) {
  return req.query.language === "en" ? "en" : "pl";
}

function getLocalizedName<T extends { name: string; nameEn?: string | null }>(row: T, language: "pl" | "en") {
  return language === "en" ? row.nameEn?.trim() || row.name : row.name;
}

function shapeSummary(
  req: Request,
  row: {
    id: number;
    sortOrder: number;
    category: string;
    categorySlugs: string[];
    language: string;
    translationKey: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string;
    readMin: number;
    updatedAt: Date;
    isPublished: boolean;
  },
) {
  return {
    id: row.id,
    order: row.sortOrder,
    category: row.category,
    categorySlugs: row.categorySlugs,
    language: row.language,
    translationKey: row.translationKey,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    image: resolveAssetUrl(req, row.coverImage),
    readMin: row.readMin,
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
    isPublished: row.isPublished,
  };
}

async function loadPublicArticleTaxonomy(language: "pl" | "en") {
  const { db, articleCategoriesTable, articleCategoryGroupsTable } = await import("@workspace/db");
  const [groups, categories] = await Promise.all([
    db.select().from(articleCategoryGroupsTable).orderBy(asc(articleCategoryGroupsTable.sortOrder), asc(articleCategoryGroupsTable.name)),
    db.select().from(articleCategoriesTable).orderBy(asc(articleCategoriesTable.sortOrder), asc(articleCategoriesTable.name)),
  ]);

  return groups.map((group) => ({
    id: group.id,
    name: getLocalizedName(group, language),
    nameEn: group.nameEn,
    slug: group.slug,
    sortOrder: group.sortOrder,
    categories: categories
      .filter((category) => category.groupId === group.id)
      .map((category) => ({
        id: category.id,
        groupId: category.groupId,
        name: getLocalizedName(category, language),
        nameEn: category.nameEn,
        slug: category.slug,
        sortOrder: category.sortOrder,
      })),
  }));
}

function toSitemapEntry(route: string, lastmod: string) {
  const normalizedRoute = route === "/" ? "" : `${route.replace(/\/+$/, "")}/`;
  return [
    "  <url>",
    `    <loc>${siteUrl}${normalizedRoute}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    "  </url>",
  ].join("\n");
}

router.get("/articles", async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const { db, articlesTable } = await import("@workspace/db");
  const language = getArticleLanguage(req);
  const rows = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.isPublished, true))
    .orderBy(asc(articlesTable.sortOrder), asc(articlesTable.id));

  return res.json(rows.filter((row) => row.language === language).map((row) => shapeSummary(req, row)));
});

router.get("/article-taxonomy", async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  return res.json({ groups: await loadPublicArticleTaxonomy(getArticleLanguage(req)) });
});

router.get("/articles/:slug", async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const { db, articlesTable } = await import("@workspace/db");
  const language = getArticleLanguage(req);
  const slug = `/${req.params.slug}`;
  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.slug, slug))
    .limit(1);

  if (!article || !article.isPublished || article.language !== language) {
    return res.status(404).json({ error: "Article not found." });
  }

  const related = article.relatedSlugs.length
    ? await db
        .select()
        .from(articlesTable)
        .where(eq(articlesTable.isPublished, true))
    : [];

  const referencedCategorySlugs = Array.from(
    new Set([
      ...article.categorySlugs,
      ...related.flatMap((row) => row.categorySlugs),
    ]),
  );
  const { articleCategoriesTable } = await import("@workspace/db");
  const referencedCategories = referencedCategorySlugs.length
    ? await db
        .select()
        .from(articleCategoriesTable)
        .where(inArray(articleCategoriesTable.slug, referencedCategorySlugs))
    : [];

  const relatedBySlug = new Map(related.filter((row) => row.language === language).map((row) => [row.slug, row]));
  const relatedArticles = article.relatedSlugs
    .map((relatedSlug: string) => relatedBySlug.get(relatedSlug))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => shapeSummary(req, row));

  const [alternate] = await db
    .select({
      slug: articlesTable.slug,
      language: articlesTable.language,
    })
    .from(articlesTable)
    .where(
      and(
        eq(articlesTable.translationKey, article.translationKey),
        ne(articlesTable.language, article.language),
        eq(articlesTable.isPublished, true),
      ),
    )
    .limit(1);

  return res.json({
    ...shapeSummary(req, article),
    markdown: article.markdown,
    tocItems: article.tocItems,
    relatedSlugs: article.relatedSlugs,
    relatedArticles,
    alternateSlug: alternate?.slug ?? null,
    categories: referencedCategories,
  });
});

router.get("/content/sitemap.xml", async (_req, res) => {
  try {
    let dynamicArticles: Array<{ slug: string; language: string; updatedAt: Date }> = [];
    if (hasDatabaseConfig()) {
      const { db, articlesTable } = await import("@workspace/db");
      dynamicArticles = await db
        .select({
          slug: articlesTable.slug,
          language: articlesTable.language,
          updatedAt: articlesTable.updatedAt,
        })
        .from(articlesTable)
        .where(eq(articlesTable.isPublished, true))
        .orderBy(asc(articlesTable.sortOrder), asc(articlesTable.id));
    }

    const articleEntries = dynamicArticles.map((article) =>
      toSitemapEntry(
        article.language === "en"
          ? `/en/knowledge-base${article.slug}`
          : `/baza-wiedzy${article.slug}`,
        article.updatedAt.toISOString().slice(0, 10),
      ),
    );

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...articleEntries,
      "</urlset>",
      "",
    ].join("\n");

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    return res.send(xml);
  } catch (error) {
    logger.error({ err: error }, "failed to generate live sitemap");
    return res.status(500).send("Failed to generate sitemap.");
  }
});

async function sendArticleAsset(req: Request, res: Response) {
  if (!hasDatabaseConfig()) {
    return res.status(404).end();
  }

  const { db, articleImagesTable } = await import("@workspace/db");
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid asset id." });
  }

  const [asset] = await db
    .select()
    .from(articleImagesTable)
    .where(eq(articleImagesTable.id, id))
    .limit(1);

  if (!asset) {
    return res.status(404).end();
  }

  const match = asset.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    logger.warn({ assetId: asset.id }, "article asset had invalid data url");
    return res.status(500).end();
  }

  const [, mimeType, base64Payload] = match;
  res.setHeader("Content-Type", mimeType);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  return res.send(Buffer.from(base64Payload, "base64"));
}

router.get("/content/assets/:id", sendArticleAsset);
router.get("/content/assets/:id/:filename", sendArticleAsset);

export default router;
