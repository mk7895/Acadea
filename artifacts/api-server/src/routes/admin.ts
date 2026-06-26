import { Router, type NextFunction, type Request, type Response } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { z } from "zod/v4";
import {
  ARTICLE_CATEGORIES,
  estimateReadMinutes,
  normalizeArticleSlug,
} from "../lib/articleContent";
import {
  createAdminSessionToken,
  getAdminEntrySecret,
  secretsMatch,
  verifyAdminSessionToken,
  verifyPassword,
} from "../lib/adminAuth";
import { verifyTurnstileToken } from "../lib/turnstile";

const router = Router();

const adminLoginSchema = z.object({
  entrySecret: z.string().min(1),
  password: z.string().min(1),
  turnstileToken: z.string().min(1).optional(),
});

const adminEntrySchema = z.object({
  entrySecret: z.string().min(1),
});

const adminArticleSchema = z.object({
  sortOrder: z.number().int().min(0).default(0),
  category: z.enum(ARTICLE_CATEGORIES),
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  excerpt: z.string().trim().min(1),
  coverImage: z.string().trim().min(1),
  markdown: z.string().trim().min(1),
  readMin: z.number().int().min(1).max(120).optional(),
  relatedSlugs: z.array(z.string().trim().min(1)).default([]),
  isPublished: z.boolean().default(true),
});

const adminImageSchema = z.object({
  filename: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
  dataUrl: z
    .string()
    .regex(/^data:[^;]+;base64,[A-Za-z0-9+/=]+$/, "Invalid image payload."),
});

function getRequestOrigin(req: Request) {
  const forwardedProto = req.get("x-forwarded-proto");
  const forwardedHost = req.get("x-forwarded-host");
  const protocol = forwardedProto ?? req.protocol;
  const host = forwardedHost ?? req.get("host");
  return `${protocol}://${host}`;
}

function getBearerToken(req: Request) {
  const header = req.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return undefined;
  }

  return header.slice("Bearer ".length).trim();
}

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!verifyAdminSessionToken(getBearerToken(req))) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function shapeAdminSummary(req: Request, row: {
  id: number;
  sortOrder: number;
  category: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  readMin: number;
  isPublished: boolean;
  updatedAt: Date;
}) {
  const image =
    /^https?:\/\//i.test(row.coverImage) || row.coverImage.startsWith("data:")
      ? row.coverImage
      : `${getRequestOrigin(req)}${row.coverImage}`;

  return {
    id: row.id,
    sortOrder: row.sortOrder,
    category: row.category,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImage: image,
    readMin: row.readMin,
    isPublished: row.isPublished,
    updatedAt: row.updatedAt.toISOString(),
  };
}

router.post("/admin/auth/login", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
  if (!turnstile.ok) {
    return res.status(400).json({ error: turnstile.message });
  }

  if (!secretsMatch(parsed.data.entrySecret, getAdminEntrySecret())) {
    return res.status(404).json({ error: "Not found." });
  }

  const { db, adminCredentialsTable } = await import("@workspace/db");
  const [credentials] = await db
    .select()
    .from(adminCredentialsTable)
    .where(eq(adminCredentialsTable.id, 1))
    .limit(1);

  if (!credentials) {
    return res.status(503).json({
      error:
        'Admin password not configured yet. Run `pnpm admin:set-password "..."` first.',
    });
  }

  if (!verifyPassword(parsed.data.password, credentials.passwordSalt, credentials.passwordHash)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  return res.json({ token: createAdminSessionToken() });
});

router.post("/admin/auth/entry", (req, res) => {
  const parsed = adminEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  if (!secretsMatch(parsed.data.entrySecret, getAdminEntrySecret())) {
    return res.status(404).json({ error: "Not found." });
  }

  return res.status(204).end();
});

router.get("/admin/auth/status", (req, res) => {
  return res.json({ authenticated: verifyAdminSessionToken(getBearerToken(req)) });
});

router.get("/admin/articles", requireAdmin, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const { db, articlesTable } = await import("@workspace/db");
  const rows = await db
    .select()
    .from(articlesTable)
    .orderBy(asc(articlesTable.sortOrder), desc(articlesTable.updatedAt));

  return res.json(
    rows.map((row) => ({
      ...shapeAdminSummary(req, row),
      markdown: row.markdown,
      relatedSlugs: row.relatedSlugs,
    })),
  );
});

router.post("/admin/articles", requireAdmin, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const parsed = adminArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const slug = normalizeArticleSlug(parsed.data.slug);
  const relatedSlugs = Array.from(
    new Set(parsed.data.relatedSlugs.map((value) => normalizeArticleSlug(value)).filter((value) => value !== slug)),
  );
  const readMin = parsed.data.readMin ?? estimateReadMinutes(parsed.data.markdown);
  const { db, articlesTable } = await import("@workspace/db");

  const [row] = await db
    .insert(articlesTable)
    .values({
      sortOrder: parsed.data.sortOrder,
      category: parsed.data.category,
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.excerpt,
      coverImage: parsed.data.coverImage,
      markdown: parsed.data.markdown,
      relatedSlugs,
      readMin,
      isPublished: parsed.data.isPublished,
    })
    .returning();

  return res.status(201).json({
    ...shapeAdminSummary(req, row),
    markdown: row.markdown,
    relatedSlugs: row.relatedSlugs,
  });
});

router.put("/admin/articles/:id", requireAdmin, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid article id." });
  }

  const parsed = adminArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const slug = normalizeArticleSlug(parsed.data.slug);
  const relatedSlugs = Array.from(
    new Set(parsed.data.relatedSlugs.map((value) => normalizeArticleSlug(value)).filter((value) => value !== slug)),
  );
  const readMin = parsed.data.readMin ?? estimateReadMinutes(parsed.data.markdown);
  const { db, articlesTable } = await import("@workspace/db");

  const [row] = await db
    .update(articlesTable)
    .set({
      sortOrder: parsed.data.sortOrder,
      category: parsed.data.category,
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.excerpt,
      coverImage: parsed.data.coverImage,
      markdown: parsed.data.markdown,
      relatedSlugs,
      readMin,
      isPublished: parsed.data.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(articlesTable.id, id))
    .returning();

  if (!row) {
    return res.status(404).json({ error: "Article not found." });
  }

  return res.json({
    ...shapeAdminSummary(req, row),
    markdown: row.markdown,
    relatedSlugs: row.relatedSlugs,
  });
});

router.delete("/admin/articles/:id", requireAdmin, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid article id." });
  }

  const { db, articlesTable } = await import("@workspace/db");
  const [row] = await db
    .delete(articlesTable)
    .where(eq(articlesTable.id, id))
    .returning();

  if (!row) {
    return res.status(404).json({ error: "Article not found." });
  }

  return res.json({ success: true });
});

router.post("/admin/assets", requireAdmin, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const parsed = adminImageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const { db, articleImagesTable } = await import("@workspace/db");
  const [row] = await db
    .insert(articleImagesTable)
    .values(parsed.data)
    .returning();

  return res.status(201).json({
    id: row.id,
    url: `${getRequestOrigin(req)}/api/content/assets/${row.id}/${encodeURIComponent(row.filename)}`,
  });
});

export default router;
