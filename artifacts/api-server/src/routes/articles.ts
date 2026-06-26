import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Router, type IRouter, type Request, type Response } from "express";
import { asc, eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const siteUrl = (process.env.SITE_URL ?? "https://acadea.org").replace(/\/+$/, "");
const frontendRoot = path.resolve(import.meta.dirname, "..", "..", "acadea-website");
const staticRoutesConfigPath = path.join(frontendRoot, "src", "data", "static-routes.json");

type StaticRouteConfig = {
  path: string;
  source: string;
  includeInSitemap: boolean;
};

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

async function loadStaticRoutesForSitemap() {
  const raw = await readFile(staticRoutesConfigPath, "utf8");
  return JSON.parse(raw) as StaticRouteConfig[];
}

async function getStaticRouteLastmod(source: string) {
  try {
    const filePath = path.join(frontendRoot, "src", source);
    const fileStat = await stat(filePath);
    return fileStat.mtime.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function toSitemapEntry(route: string, lastmod: string) {
  const normalizedRoute = route === "/" ? "" : route;
  return [
    "  <url>",
    `    <loc>${siteUrl}${normalizedRoute}</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    "  </url>",
  ].join("\n");
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

router.get("/content/sitemap.xml", async (_req, res) => {
  try {
    const staticRoutes = (await loadStaticRoutesForSitemap()).filter((route) => route.includeInSitemap);

    let dynamicArticles: Array<{ slug: string; updatedAt: Date }> = [];
    if (process.env.DATABASE_URL) {
      const { db, articlesTable } = await import("@workspace/db");
      dynamicArticles = await db
        .select({
          slug: articlesTable.slug,
          updatedAt: articlesTable.updatedAt,
        })
        .from(articlesTable)
        .where(eq(articlesTable.isPublished, true))
        .orderBy(asc(articlesTable.sortOrder), asc(articlesTable.id));
    }

    const staticEntries = await Promise.all(
      staticRoutes.map(async (route) => toSitemapEntry(route.path, await getStaticRouteLastmod(route.source))),
    );
    const articleEntries = dynamicArticles.map((article) =>
      toSitemapEntry(`/baza-wiedzy${article.slug}`, article.updatedAt.toISOString().slice(0, 10)),
    );

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...staticEntries,
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
