import { Router, type IRouter, type Request, type Response } from "express";
import { asc, eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

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

function shapeSummary(
  req: Request,
  row: {
    id: number;
    sortOrder: number;
    category: string;
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
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    image: resolveAssetUrl(req, row.coverImage),
    readMin: row.readMin,
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
    isPublished: row.isPublished,
  };
}

router.get("/articles", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const { db, articlesTable } = await import("@workspace/db");
  const rows = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.isPublished, true))
    .orderBy(asc(articlesTable.sortOrder), asc(articlesTable.id));

  return res.json(rows.map((row) => shapeSummary(req, row)));
});

router.get("/articles/:slug", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const { db, articlesTable } = await import("@workspace/db");
  const slug = `/${req.params.slug}`;
  const [article] = await db
    .select()
    .from(articlesTable)
    .where(eq(articlesTable.slug, slug))
    .limit(1);

  if (!article || !article.isPublished) {
    return res.status(404).json({ error: "Article not found." });
  }

  const related =
    article.relatedSlugs.length > 0
      ? await db
          .select()
          .from(articlesTable)
          .where(eq(articlesTable.isPublished, true))
      : [];

  const relatedBySlug = new Map(related.map((row) => [row.slug, row]));
  const relatedArticles = article.relatedSlugs
    .map((relatedSlug: string) => relatedBySlug.get(relatedSlug))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => shapeSummary(req, row));

  return res.json({
    ...shapeSummary(req, article),
    markdown: article.markdown,
    relatedSlugs: article.relatedSlugs,
    relatedArticles,
  });
});

async function sendArticleAsset(req: Request, res: Response) {
  if (!process.env.DATABASE_URL) {
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
