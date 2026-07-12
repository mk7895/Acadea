import { Router, type NextFunction, type Request, type Response } from "express";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod/v4";
import { hasDatabaseConfig } from "../lib/databaseConfig";
import {
  DEFAULT_MARKETING_BOOKING_TIMEZONE,
  DEFAULT_WEEKLY_SCHEDULE,
  loadMarketingBookingSettings,
  MarketingBookingSettingsStorageError,
  saveMarketingBookingSettings,
} from "../lib/marketingBookingSettings";
import {
  estimateReadMinutes,
  extractMarkdownHeadings,
  normalizeArticleSlug,
  normalizeCategorySlug,
  normalizeContactFormMarkers,
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

const adminTocItemSchema = z.object({
  sourceIndex: z.number().int().min(0),
  sourceText: z.string().trim().min(1),
  anchorId: z.string().trim().min(1),
  label: z.string().trim().min(1),
  include: z.boolean().default(true),
  level: z.number().int().min(1).max(6),
});

const adminArticleSchema = z.object({
  sortOrder: z.number().int().min(0).default(0),
  category: z.string().trim().default(""),
  categorySlugs: z.array(z.string().trim().min(1)).default([]),
  language: z.enum(["pl", "en"]).default("pl"),
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  excerpt: z.string().trim().min(1),
  coverImage: z.string().trim().min(1),
  markdown: z.string().trim().min(1),
  readMin: z.number().int().min(1).max(120).optional(),
  tocItems: z.array(adminTocItemSchema).default([]),
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

const categoryGroupSchema = z.object({
  sortOrder: z.number().int().min(0).default(0),
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
});

const categorySchema = z.object({
  groupId: z.number().int().positive(),
  sortOrder: z.number().int().min(0).default(0),
  name: z.string().trim().min(1),
  slug: z.string().trim().optional(),
});

const weeklyRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean(),
});

const additionalCalendarSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().max(160).optional().default(""),
  inviteToEvents: z.boolean().default(false),
});

const bookingSettingsSchema = z.object({
  timeZone: z.string().trim().min(1).default(DEFAULT_MARKETING_BOOKING_TIMEZONE),
  weeklySchedule: z.array(weeklyRuleSchema).default(DEFAULT_WEEKLY_SCHEDULE),
  additionalCalendars: z.array(additionalCalendarSchema).default([]),
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

function shapeAdminSummary(
  req: Request,
  row: {
    id: number;
    sortOrder: number;
    category: string;
    categorySlugs: string[];
    language: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string;
    readMin: number;
    tocItems: Array<{
      sourceIndex: number;
      sourceText: string;
      anchorId: string;
      label: string;
      include: boolean;
      level: number;
    }>;
    isPublished: boolean;
    updatedAt: Date;
  },
) {
  const image =
    /^https?:\/\//i.test(row.coverImage) || row.coverImage.startsWith("data:")
      ? row.coverImage
      : `${getRequestOrigin(req)}${row.coverImage}`;

  return {
    id: row.id,
    sortOrder: row.sortOrder,
    category: row.category,
    categorySlugs: row.categorySlugs,
    language: row.language,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    coverImage: image,
    readMin: row.readMin,
    tocItems: row.tocItems,
    isPublished: row.isPublished,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function normalizeTocItems(markdown: string, tocItems: z.infer<typeof adminTocItemSchema>[]) {
  const extractedHeadings = extractMarkdownHeadings(markdown);
  const tocByIndex = new Map(tocItems.map((item) => [item.sourceIndex, item]));

  return extractedHeadings.map((heading) => {
    const existing = tocByIndex.get(heading.sourceIndex);
    return {
      ...heading,
      anchorId: normalizeCategorySlug(existing?.anchorId || heading.anchorId) || heading.anchorId,
      label: existing?.label?.trim() || heading.label,
      include: existing?.include ?? true,
    };
  });
}

async function loadArticleTaxonomy() {
  const { db, articleCategoriesTable, articleCategoryGroupsTable } = await import("@workspace/db");
  const [groups, categories] = await Promise.all([
    db.select().from(articleCategoryGroupsTable).orderBy(asc(articleCategoryGroupsTable.sortOrder), asc(articleCategoryGroupsTable.name)),
    db.select().from(articleCategoriesTable).orderBy(asc(articleCategoriesTable.sortOrder), asc(articleCategoriesTable.name)),
  ]);

  return groups.map((group) => ({
    id: group.id,
    name: group.name,
    slug: group.slug,
    sortOrder: group.sortOrder,
    categories: categories
      .filter((category) => category.groupId === group.id)
      .map((category) => ({
        id: category.id,
        groupId: category.groupId,
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
      })),
  }));
}

router.post("/admin/auth/login", async (req, res) => {
  if (!hasDatabaseConfig()) {
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

router.get("/admin/booking-settings", requireAdmin, async (_req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const settings = await loadMarketingBookingSettings();
  return res.json({
    storageReady: settings.storageReady,
    timeZone: settings.timeZone,
    weeklySchedule: settings.weeklySchedule,
    additionalCalendars: settings.additionalCalendars.map((entry) => ({
      email: entry.email,
      fullName: entry.fullName ?? "",
      inviteToEvents: entry.inviteToEvents,
      connectedAt: entry.connectedAt ?? null,
    })),
  });
});

router.put("/admin/booking-settings", requireAdmin, async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const parsed = bookingSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const current = await loadMarketingBookingSettings();
  const inviteByEmail = new Map(
    parsed.data.additionalCalendars.map((entry) => [entry.email.trim().toLowerCase(), entry.inviteToEvents]),
  );
  const fullNameByEmail = new Map(
    parsed.data.additionalCalendars.map((entry) => [entry.email.trim().toLowerCase(), entry.fullName?.trim() ?? ""]),
  );

  const nextAdditionalCalendars = current.additionalCalendars
    .filter((entry) => inviteByEmail.has(entry.email))
    .map((entry) => ({
      ...entry,
      fullName: fullNameByEmail.get(entry.email) || undefined,
      inviteToEvents: inviteByEmail.get(entry.email) ?? false,
    }));

  try {
    const saved = await saveMarketingBookingSettings({
      timeZone: parsed.data.timeZone,
      weeklySchedule: parsed.data.weeklySchedule,
      additionalCalendars: nextAdditionalCalendars,
    });

    return res.json({
      storageReady: true,
      timeZone: saved.timeZone,
      weeklySchedule: saved.weeklySchedule,
      additionalCalendars: saved.additionalCalendars.map((entry) => ({
        email: entry.email,
        fullName: entry.fullName ?? "",
        inviteToEvents: entry.inviteToEvents,
        connectedAt: entry.connectedAt ?? null,
      })),
    });
  } catch (error) {
    if (error instanceof MarketingBookingSettingsStorageError) {
      return res.status(503).json({
        error:
          "Brakuje tabeli marketing_booking_settings w Cloud SQL. Wklej najnowszy SQL update dla ustawień kalendarza strony głównej.",
      });
    }
    throw error;
  }
});

router.get("/admin/article-taxonomy", requireAdmin, async (_req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  return res.json({ groups: await loadArticleTaxonomy() });
});

router.post("/admin/article-category-groups", requireAdmin, async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const parsed = categoryGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const { db, articleCategoryGroupsTable } = await import("@workspace/db");
  const slug = normalizeCategorySlug(parsed.data.slug || parsed.data.name);
  const [group] = await db
    .insert(articleCategoryGroupsTable)
    .values({
      name: parsed.data.name,
      slug,
      sortOrder: parsed.data.sortOrder,
    })
    .returning();

  return res.status(201).json(group);
});

router.put("/admin/article-category-groups/:id", requireAdmin, async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid group id." });
  }

  const parsed = categoryGroupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const { db, articleCategoryGroupsTable } = await import("@workspace/db");
  const slug = normalizeCategorySlug(parsed.data.slug || parsed.data.name);
  const [group] = await db
    .update(articleCategoryGroupsTable)
    .set({
      name: parsed.data.name,
      slug,
      sortOrder: parsed.data.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(articleCategoryGroupsTable.id, id))
    .returning();

  if (!group) {
    return res.status(404).json({ error: "Category group not found." });
  }

  return res.json(group);
});

router.delete("/admin/article-category-groups/:id", requireAdmin, async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid group id." });
  }

  const { db, articleCategoriesTable, articleCategoryGroupsTable } = await import("@workspace/db");
  await db.delete(articleCategoriesTable).where(eq(articleCategoriesTable.groupId, id));
  const [group] = await db
    .delete(articleCategoryGroupsTable)
    .where(eq(articleCategoryGroupsTable.id, id))
    .returning();

  if (!group) {
    return res.status(404).json({ error: "Category group not found." });
  }

  return res.json({ success: true });
});

router.post("/admin/article-categories", requireAdmin, async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const { db, articleCategoriesTable } = await import("@workspace/db");
  const slug = normalizeCategorySlug(parsed.data.slug || parsed.data.name);
  const [category] = await db
    .insert(articleCategoriesTable)
    .values({
      groupId: parsed.data.groupId,
      name: parsed.data.name,
      slug,
      sortOrder: parsed.data.sortOrder,
    })
    .returning();

  return res.status(201).json(category);
});

router.put("/admin/article-categories/:id", requireAdmin, async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid category id." });
  }

  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const { db, articleCategoriesTable } = await import("@workspace/db");
  const slug = normalizeCategorySlug(parsed.data.slug || parsed.data.name);
  const [category] = await db
    .update(articleCategoriesTable)
    .set({
      groupId: parsed.data.groupId,
      name: parsed.data.name,
      slug,
      sortOrder: parsed.data.sortOrder,
      updatedAt: new Date(),
    })
    .where(eq(articleCategoriesTable.id, id))
    .returning();

  if (!category) {
    return res.status(404).json({ error: "Category not found." });
  }

  return res.json(category);
});

router.delete("/admin/article-categories/:id", requireAdmin, async (req, res) => {
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid category id." });
  }

  const { db, articleCategoriesTable } = await import("@workspace/db");
  const [category] = await db
    .delete(articleCategoriesTable)
    .where(eq(articleCategoriesTable.id, id))
    .returning();

  if (!category) {
    return res.status(404).json({ error: "Category not found." });
  }

  return res.json({ success: true });
});

router.get("/admin/articles", requireAdmin, async (req, res) => {
  if (!hasDatabaseConfig()) {
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
  if (!hasDatabaseConfig()) {
    return res.status(503).json({ error: "Database not configured." });
  }

  const parsed = adminArticleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const slug = normalizeArticleSlug(parsed.data.slug);
  const markdown = normalizeContactFormMarkers(parsed.data.markdown);
  const relatedSlugs = Array.from(
    new Set(parsed.data.relatedSlugs.map((value) => normalizeArticleSlug(value)).filter((value) => value !== slug)),
  );
  const categorySlugs = Array.from(
    new Set(parsed.data.categorySlugs.map((value) => normalizeCategorySlug(value)).filter(Boolean)),
  );
  const readMin = parsed.data.readMin ?? estimateReadMinutes(markdown);
  const tocItems = normalizeTocItems(markdown, parsed.data.tocItems);
  const { db, articleCategoriesTable, articlesTable } = await import("@workspace/db");

  const selectedCategories = categorySlugs.length
    ? await db.select().from(articleCategoriesTable).where(inArray(articleCategoriesTable.slug, categorySlugs))
    : [];
  const primaryCategory = parsed.data.category || selectedCategories[0]?.name || "Artykuł";

  const [row] = await db
    .insert(articlesTable)
    .values({
      sortOrder: parsed.data.sortOrder,
      category: primaryCategory,
      categorySlugs,
      language: parsed.data.language,
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.excerpt,
      coverImage: parsed.data.coverImage,
      markdown,
      readMin,
      tocItems,
      relatedSlugs,
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
  if (!hasDatabaseConfig()) {
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
  const markdown = normalizeContactFormMarkers(parsed.data.markdown);
  const relatedSlugs = Array.from(
    new Set(parsed.data.relatedSlugs.map((value) => normalizeArticleSlug(value)).filter((value) => value !== slug)),
  );
  const categorySlugs = Array.from(
    new Set(parsed.data.categorySlugs.map((value) => normalizeCategorySlug(value)).filter(Boolean)),
  );
  const readMin = parsed.data.readMin ?? estimateReadMinutes(markdown);
  const tocItems = normalizeTocItems(markdown, parsed.data.tocItems);
  const { db, articleCategoriesTable, articlesTable } = await import("@workspace/db");

  const selectedCategories = categorySlugs.length
    ? await db.select().from(articleCategoriesTable).where(inArray(articleCategoriesTable.slug, categorySlugs))
    : [];
  const primaryCategory = parsed.data.category || selectedCategories[0]?.name || "Artykuł";

  const [row] = await db
    .update(articlesTable)
    .set({
      sortOrder: parsed.data.sortOrder,
      category: primaryCategory,
      categorySlugs,
      language: parsed.data.language,
      title: parsed.data.title,
      slug,
      excerpt: parsed.data.excerpt,
      coverImage: parsed.data.coverImage,
      markdown,
      readMin,
      tocItems,
      relatedSlugs,
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
  if (!hasDatabaseConfig()) {
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
  if (!hasDatabaseConfig()) {
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
