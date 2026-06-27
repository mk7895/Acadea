import { Router, type NextFunction, type Request, type Response } from "express";
import { and, asc, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { z } from "zod/v4";
import {
  bookingLeadsTable,
  contactSubmissionsTable,
  mentorApplicationsTable,
  menteeProfilesTable,
  mentorAvailabilityRulesTable,
  mentorProfilesTable,
  mentorUniversitiesTable,
  newsletterSignupsTable,
  platformGoogleConnectionsTable,
  platformGuideChecklistItemsTable,
  platformGuidesTable,
  platformMeetingsTable,
  platformPasswordResetTokensTable,
  platformUsersTable,
  scholarshipApplicationsTable,
  PLATFORM_CHECKLIST_ITEM_TYPES,
  PLATFORM_CONNECTION_STATUSES,
  PLATFORM_GOOGLE_CONNECTION_TYPES,
  PLATFORM_GUIDE_STATUSES,
  PLATFORM_GUIDE_TYPES,
  PLATFORM_MEETING_METHODS,
  PLATFORM_MEETING_STATUSES,
  PLATFORM_USER_ROLES,
  PLATFORM_USER_STATUSES,
  type PlatformUserRole,
} from "@workspace/db/schema";
import {
  createOpaqueToken,
  createPasswordResetToken,
  createPlatformSession,
  deletePlatformSession,
  getPlatformBearerToken,
  getPlatformSessionUser,
  hashToken,
  stringsEqual,
} from "../lib/platform/auth";
import { verifyTurnstileToken } from "../lib/turnstile";
import { hashPassword, verifyPassword } from "../lib/adminAuth";
import { sendPlatformPasswordResetEmail } from "../lib/mailer";
import { getPlatformStorageSummary } from "../lib/platform/storage";

const router = Router();

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
  turnstileToken: z.string().optional(),
});

const resetRequestSchema = z.object({
  email: z.string().trim().email(),
  turnstileToken: z.string().optional(),
});

const menteeSignupSchema = z.object({
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
  turnstileToken: z.string().optional(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
  turnstileToken: z.string().optional(),
});

const bootstrapAdminSchema = z.object({
  setupSecret: z.string().min(1),
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const userCreateSchema = z.object({
  role: z.enum(PLATFORM_USER_ROLES),
  status: z.enum(PLATFORM_USER_STATUSES).default("pending"),
  fullName: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: z.string().min(8),
});

const userUpdateSchema = z.object({
  status: z.enum(PLATFORM_USER_STATUSES).optional(),
  fullName: z.string().trim().min(1).optional(),
  notes: z.string().optional(),
  avatarUrl: z.string().url().or(z.literal("")).optional(),
});

const mentorProfileSchema = z.object({
  headline: z.string().trim().max(180).optional().default(""),
  bio: z.string().trim().max(10000).optional().default(""),
  timezone: z.string().trim().min(1),
  meetingMethod: z.enum(PLATFORM_MEETING_METHODS),
  meetingLink: z.string().trim().optional().default(""),
  whatsappNumber: z.string().trim().optional().default(""),
  googleDriveFolderUrl: z.string().trim().optional().default(""),
});

const availabilityRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().default(true),
});

const mentorUniversitySchema = z.object({
  country: z.string().trim().min(1),
  universityName: z.string().trim().min(1),
  programName: z.string().trim().optional().default(""),
  summary: z.string().trim().optional().default(""),
});

const guideItemSchema = z.object({
  id: z.number().int().positive().optional(),
  sortOrder: z.number().int().min(0).default(0),
  sectionTitle: z.string().trim().min(1).default("Checklist"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  itemType: z.enum(PLATFORM_CHECKLIST_ITEM_TYPES).default("todo"),
  suggestedFilename: z.string().trim().optional().default(""),
  externalUrl: z.string().trim().optional().default(""),
  linkedGuideItemId: z.number().int().positive().nullable().optional(),
  isRequired: z.boolean().default(true),
  isCompleted: z.boolean().default(false),
  fileUrl: z.string().trim().optional().default(""),
});

const guideSchema = z.object({
  guideType: z.enum(PLATFORM_GUIDE_TYPES),
  status: z.enum(PLATFORM_GUIDE_STATUSES).default("draft"),
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  country: z.string().trim().min(1),
  universityName: z.string().trim().min(1),
  summary: z.string().trim().optional().default(""),
  descriptionMarkdown: z.string().trim().optional().default(""),
  estimatedReadMin: z.number().int().min(1).max(240).default(5),
  menteeUserId: z.number().int().positive().nullable().optional(),
  sourceGuideId: z.number().int().positive().nullable().optional(),
  driveFolderUrl: z.string().trim().optional().default(""),
  isVisibleToUnapprovedUsers: z.boolean().default(false),
  items: z.array(guideItemSchema).default([]),
});

const assignGuideSchema = z.object({
  menteeUserId: z.number().int().positive(),
  mentorUserId: z.number().int().positive().nullable().optional(),
});

const googleConnectionSchema = z.object({
  connectionType: z.enum(PLATFORM_GOOGLE_CONNECTION_TYPES),
  externalEmail: z.string().trim().email().or(z.literal("")).optional().default(""),
  status: z.enum(PLATFORM_CONNECTION_STATUSES).default("pending"),
  scopes: z.array(z.string()).default([]),
});

const meetingCreateSchema = z.object({
  mentorUserId: z.number().int().positive(),
  title: z.string().trim().min(1).default("Spotkanie mentoringowe"),
  description: z.string().trim().optional().default(""),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  timezone: z.string().trim().min(1),
  method: z.enum(PLATFORM_MEETING_METHODS).default("zoom_link"),
  meetingUrl: z.string().trim().optional().default(""),
});

const meetingUpdateSchema = z.object({
  status: z.enum(PLATFORM_MEETING_STATUSES).optional(),
  actualDurationMinutes: z.number().int().min(0).max(600).nullable().optional(),
  mentorNotes: z.string().trim().optional(),
  cancellationReason: z.string().trim().optional(),
});

type AuthenticatedRequest = Request & {
  platformUser?: {
    avatarUrl: string | null;
    createdAt: Date;
    email: string;
    fullName: string;
    id: number;
    lastLoginAt: Date | null;
    notes: string | null;
    passwordHash: string | null;
    passwordSalt: string | null;
    role: string;
    status: string;
    updatedAt: Date;
  };
};

function getRequestOrigin(req: Request) {
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  const host = req.get("x-forwarded-host") ?? req.get("host");
  return `${proto}://${host}`;
}

function getPlatformAppUrl(req: Request) {
  return (process.env.PLATFORM_APP_URL?.trim() || "http://localhost:5174").replace(/\/$/, "");
}

function getPlatformSetupSecret() {
  return process.env.PLATFORM_SETUP_SECRET?.trim() || process.env.ADMIN_PANEL_SECRET?.trim();
}

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function serializeUser(user: NonNullable<AuthenticatedRequest["platformUser"]>) {
  return {
    id: user.id,
    role: user.role,
    status: user.status,
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    notes: user.notes,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

async function requirePlatformAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const user = await getPlatformSessionUser(getPlatformBearerToken(req.get("authorization")));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.platformUser = user;
  next();
}

function requirePlatformRole(...roles: PlatformUserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.platformUser || !roles.includes(req.platformUser.role as PlatformUserRole)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

async function upsertGuideItems(db: Awaited<typeof import("@workspace/db")>["db"], guideId: number, items: z.infer<typeof guideItemSchema>[]) {
  await db.delete(platformGuideChecklistItemsTable).where(eq(platformGuideChecklistItemsTable.guideId, guideId));

  if (!items.length) {
    return;
  }

  await db.insert(platformGuideChecklistItemsTable).values(
    items.map((item) => ({
      guideId,
      sortOrder: item.sortOrder,
      sectionTitle: item.sectionTitle,
      title: item.title,
      description: item.description,
      itemType: item.itemType,
      suggestedFilename: item.suggestedFilename || null,
      externalUrl: item.externalUrl || null,
      linkedGuideItemId: item.linkedGuideItemId ?? null,
      isRequired: item.isRequired,
      isCompleted: item.isCompleted,
      fileUrl: item.fileUrl || null,
    })),
  );
}

async function loadGuideItems(db: Awaited<typeof import("@workspace/db")>["db"], guideIds: number[]) {
  if (!guideIds.length) {
    return new Map<number, Array<Record<string, unknown>>>();
  }

  const items = await db
    .select()
    .from(platformGuideChecklistItemsTable)
    .where(inArray(platformGuideChecklistItemsTable.guideId, guideIds))
    .orderBy(
      asc(platformGuideChecklistItemsTable.guideId),
      asc(platformGuideChecklistItemsTable.sectionTitle),
      asc(platformGuideChecklistItemsTable.sortOrder),
    );

  const map = new Map<number, Array<Record<string, unknown>>>();
  for (const item of items) {
    const current = map.get(item.guideId) ?? [];
    current.push({
      id: item.id,
      sortOrder: item.sortOrder,
      sectionTitle: item.sectionTitle,
      title: item.title,
      description: item.description,
      itemType: item.itemType,
      suggestedFilename: item.suggestedFilename,
      externalUrl: item.externalUrl,
      linkedGuideItemId: item.linkedGuideItemId,
      isRequired: item.isRequired,
      isCompleted: item.isCompleted,
      fileUrl: item.fileUrl,
    });
    map.set(item.guideId, current);
  }

  return map;
}

async function shapeGuideList(
  db: Awaited<typeof import("@workspace/db")>["db"],
  guides: Array<{
    country: string;
    createdAt: Date;
    descriptionMarkdown: string;
    driveFolderUrl: string | null;
    estimatedReadMin: number;
    guideType: string;
    id: number;
    isVisibleToUnapprovedUsers: boolean;
    menteeUserId: number | null;
    ownerUserId: number | null;
    slug: string;
    sourceGuideId: number | null;
    status: string;
    summary: string;
    title: string;
    universityName: string;
    updatedAt: Date;
  }>,
) {
  const itemMap = await loadGuideItems(
    db,
    guides.map((guide) => guide.id),
  );

  return guides.map((guide) => ({
    ...guide,
    items: itemMap.get(guide.id) ?? [],
    createdAt: guide.createdAt.toISOString(),
    updatedAt: guide.updatedAt.toISOString(),
  }));
}

function meetingWindowIsValid(startsAt: Date, endsAt: Date) {
  return startsAt.getTime() + 1000 * 60 * 15 <= endsAt.getTime();
}

function meetingOutside24Hours(startsAt: Date) {
  return startsAt.getTime() - Date.now() >= 1000 * 60 * 60 * 24;
}

router.get("/platform/bootstrap/status", async (_req, res) => {
  const { db } = await import("@workspace/db");
  const [admin] = await db
    .select({ id: platformUsersTable.id })
    .from(platformUsersTable)
    .where(eq(platformUsersTable.role, "admin"))
    .limit(1);

  res.json({ hasAdmin: Boolean(admin) });
});

router.post("/platform/bootstrap/admin", async (req, res) => {
  const parsed = bootstrapAdminSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  if (!stringsEqual(parsed.data.setupSecret, getPlatformSetupSecret())) {
    return res.status(403).json({ error: "Nieprawidłowy kod konfiguracji." });
  }

  const { db } = await import("@workspace/db");
  const [existing] = await db
    .select({ id: platformUsersTable.id })
    .from(platformUsersTable)
    .where(eq(platformUsersTable.role, "admin"))
    .limit(1);

  if (existing) {
    return res.status(409).json({ error: "Administrator platformy już istnieje." });
  }

  const { hash, salt } = hashPassword(parsed.data.password);
  const [user] = await db
    .insert(platformUsersTable)
    .values({
      role: "admin",
      status: "active",
      fullName: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
    })
    .returning();

  const session = await createPlatformSession(user.id);
  await db
    .update(platformUsersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(platformUsersTable.id, user.id));

  return res.status(201).json({
    token: session.token,
    user: serializeUser(user),
  });
});

router.post("/platform/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
  if (!turnstile.ok) {
    return res.status(400).json({ error: turnstile.message });
  }

  const { db } = await import("@workspace/db");
  const [user] = await db
    .select()
    .from(platformUsersTable)
    .where(eq(platformUsersTable.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!user?.passwordHash || !user.passwordSalt) {
    return res.status(401).json({ error: "Nieprawidłowy e-mail lub hasło." });
  }

  if (user.status === "disabled") {
    return res.status(403).json({ error: "To konto zostało wyłączone." });
  }

  if (!verifyPassword(parsed.data.password, user.passwordSalt, user.passwordHash)) {
    return res.status(401).json({ error: "Nieprawidłowy e-mail lub hasło." });
  }

  const session = await createPlatformSession(user.id);
  const [updatedUser] = await db
    .update(platformUsersTable)
    .set({ lastLoginAt: new Date() })
    .where(eq(platformUsersTable.id, user.id))
    .returning();

  return res.json({
    token: session.token,
    user: serializeUser(updatedUser),
  });
});

router.post("/platform/auth/signup-mentee", async (req, res) => {
  const parsed = menteeSignupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
  if (!turnstile.ok) {
    return res.status(400).json({ error: turnstile.message });
  }

  const { db } = await import("@workspace/db");
  const existing = await db
    .select({ id: platformUsersTable.id })
    .from(platformUsersTable)
    .where(eq(platformUsersTable.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return res.status(409).json({ error: "Konto z tym adresem e-mail już istnieje." });
  }

  const { hash, salt } = hashPassword(parsed.data.password);
  const [user] = await db
    .insert(platformUsersTable)
    .values({
      role: "mentee",
      status: "pending",
      fullName: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
    })
    .returning();

  await db.insert(menteeProfilesTable).values({
    userId: user.id,
    adminApproved: false,
  });

  const session = await createPlatformSession(user.id);

  return res.status(201).json({
    token: session.token,
    user: serializeUser(user),
  });
});

router.post("/platform/auth/logout", requirePlatformAuth, async (req: AuthenticatedRequest, res) => {
  await deletePlatformSession(getPlatformBearerToken(req.get("authorization")));
  return res.status(204).end();
});

router.get("/platform/auth/me", requirePlatformAuth, async (req: AuthenticatedRequest, res) => {
  const { db } = await import("@workspace/db");
  const user = req.platformUser!;
  const storage = getPlatformStorageSummary();

  const [mentorProfile] = await db
    .select()
    .from(mentorProfilesTable)
    .where(eq(mentorProfilesTable.userId, user.id))
    .limit(1);
  const [menteeProfile] = await db
    .select()
    .from(menteeProfilesTable)
    .where(eq(menteeProfilesTable.userId, user.id))
    .limit(1);
  const googleConnections = await db
    .select()
    .from(platformGoogleConnectionsTable)
    .where(eq(platformGoogleConnectionsTable.userId, user.id))
    .orderBy(asc(platformGoogleConnectionsTable.connectionType));

  return res.json({
    user: serializeUser(user),
    mentorProfile: mentorProfile
      ? {
          ...mentorProfile,
          createdAt: mentorProfile.createdAt.toISOString(),
          updatedAt: mentorProfile.updatedAt.toISOString(),
        }
      : null,
    menteeProfile: menteeProfile
      ? {
          ...menteeProfile,
          createdAt: menteeProfile.createdAt.toISOString(),
          updatedAt: menteeProfile.updatedAt.toISOString(),
        }
      : null,
    googleConnections: googleConnections.map((connection) => ({
      ...connection,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    })),
    storage,
  });
});

router.post("/platform/auth/request-reset", async (req, res) => {
  const parsed = resetRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
  if (!turnstile.ok) {
    return res.status(400).json({ error: turnstile.message });
  }

  const { db } = await import("@workspace/db");
  const [user] = await db
    .select()
    .from(platformUsersTable)
    .where(eq(platformUsersTable.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (user) {
    const reset = createPasswordResetToken();
    await db
      .delete(platformPasswordResetTokensTable)
      .where(eq(platformPasswordResetTokensTable.userId, user.id));

    await db.insert(platformPasswordResetTokensTable).values({
      userId: user.id,
      tokenHash: reset.tokenHash,
      expiresAt: reset.expiresAt,
    });

    const resetUrl = `${getPlatformAppUrl(req)}/reset-password?token=${encodeURIComponent(reset.token)}`;
    await sendPlatformPasswordResetEmail({
      email: user.email,
      fullName: user.fullName,
      resetUrl,
    });
  }

  return res.status(204).end();
});

router.post("/platform/auth/reset", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: parsed.error.message });
  }

  const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
  if (!turnstile.ok) {
    return res.status(400).json({ error: turnstile.message });
  }

  const { db } = await import("@workspace/db");
  const [tokenRow] = await db
    .select()
    .from(platformPasswordResetTokensTable)
    .where(eq(platformPasswordResetTokensTable.tokenHash, hashToken(parsed.data.token)))
    .limit(1);

  if (!tokenRow || tokenRow.usedAt || tokenRow.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ error: "Link do zmiany hasła jest nieważny albo wygasł." });
  }

  const { hash, salt } = hashPassword(parsed.data.password);
  await db
    .update(platformUsersTable)
    .set({
      passwordHash: hash,
      passwordSalt: salt,
      updatedAt: new Date(),
    })
    .where(eq(platformUsersTable.id, tokenRow.userId));

  await db
    .update(platformPasswordResetTokensTable)
    .set({ usedAt: new Date() })
    .where(eq(platformPasswordResetTokensTable.id, tokenRow.id));

  return res.status(204).end();
});

router.get("/platform/public/mentors", async (_req, res) => {
  const { db } = await import("@workspace/db");
  const rows = await db
    .select({
      userId: platformUsersTable.id,
      fullName: platformUsersTable.fullName,
      email: platformUsersTable.email,
      avatarUrl: platformUsersTable.avatarUrl,
      status: platformUsersTable.status,
      headline: mentorProfilesTable.headline,
      bio: mentorProfilesTable.bio,
      timezone: mentorProfilesTable.timezone,
      meetingMethod: mentorProfilesTable.meetingMethod,
      googleDriveFolderUrl: mentorProfilesTable.googleDriveFolderUrl,
      adminApproved: mentorProfilesTable.adminApproved,
    })
    .from(platformUsersTable)
    .innerJoin(mentorProfilesTable, eq(mentorProfilesTable.userId, platformUsersTable.id))
    .where(and(eq(platformUsersTable.role, "mentor"), eq(platformUsersTable.status, "active")))
    .orderBy(asc(platformUsersTable.fullName));

  const mentorIds = rows.map((row) => row.userId);
  const universities = mentorIds.length
    ? await db
        .select()
        .from(mentorUniversitiesTable)
        .where(inArray(mentorUniversitiesTable.mentorUserId, mentorIds))
        .orderBy(asc(mentorUniversitiesTable.country), asc(mentorUniversitiesTable.universityName))
    : [];

  const grouped = new Map<number, typeof universities>();
  for (const university of universities) {
    const current = grouped.get(university.mentorUserId) ?? [];
    current.push(university);
    grouped.set(university.mentorUserId, current);
  }

  return res.json(
    rows.map((row) => ({
      id: row.userId,
      fullName: row.fullName,
      avatarUrl: row.avatarUrl,
      headline: row.headline,
      bio: row.adminApproved ? row.bio : row.bio.slice(0, 240),
      timezone: row.timezone,
      meetingMethod: row.meetingMethod,
      approved: row.adminApproved,
      universities: (grouped.get(row.userId) ?? []).map((university) => ({
        id: university.id,
        country: university.country,
        universityName: university.universityName,
        programName: university.programName,
        summary: university.summary,
      })),
    })),
  );
});

router.get("/platform/public/guides", async (_req, res) => {
  const { db } = await import("@workspace/db");
  const guides = await db
    .select()
    .from(platformGuidesTable)
    .where(
      and(
        eq(platformGuidesTable.status, "published"),
        or(
          eq(platformGuidesTable.guideType, "admin_template"),
          eq(platformGuidesTable.isVisibleToUnapprovedUsers, true),
        ),
      ),
    )
    .orderBy(asc(platformGuidesTable.country), asc(platformGuidesTable.universityName));

  return res.json(
    guides.map((guide) => ({
      id: guide.id,
      title: guide.title,
      slug: guide.slug,
      country: guide.country,
      universityName: guide.universityName,
      summary: guide.summary,
      guideType: guide.guideType,
    })),
  );
});

router.get(
  "/platform/mentor/profile",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const { db } = await import("@workspace/db");
    const [profile] = await db
      .select()
      .from(mentorProfilesTable)
      .where(eq(mentorProfilesTable.userId, req.platformUser!.id))
      .limit(1);
    const universities = await db
      .select()
      .from(mentorUniversitiesTable)
      .where(eq(mentorUniversitiesTable.mentorUserId, req.platformUser!.id))
      .orderBy(asc(mentorUniversitiesTable.country), asc(mentorUniversitiesTable.universityName));
    const availability = await db
      .select()
      .from(mentorAvailabilityRulesTable)
      .where(eq(mentorAvailabilityRulesTable.mentorUserId, req.platformUser!.id))
      .orderBy(asc(mentorAvailabilityRulesTable.weekday), asc(mentorAvailabilityRulesTable.startTime));

    return res.json({ profile, universities, availability });
  },
);

router.put(
  "/platform/mentor/profile",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = mentorProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const [profile] = await db
      .insert(mentorProfilesTable)
      .values({
        userId: req.platformUser!.id,
        headline: parsed.data.headline,
        bio: parsed.data.bio,
        timezone: parsed.data.timezone,
        meetingMethod: parsed.data.meetingMethod,
        meetingLink: parsed.data.meetingLink || null,
        whatsappNumber: parsed.data.whatsappNumber || null,
        googleDriveFolderUrl: parsed.data.googleDriveFolderUrl || null,
      })
      .onConflictDoUpdate({
        target: mentorProfilesTable.userId,
        set: {
          headline: parsed.data.headline,
          bio: parsed.data.bio,
          timezone: parsed.data.timezone,
          meetingMethod: parsed.data.meetingMethod,
          meetingLink: parsed.data.meetingLink || null,
          whatsappNumber: parsed.data.whatsappNumber || null,
          googleDriveFolderUrl: parsed.data.googleDriveFolderUrl || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return res.json(profile);
  },
);

router.put(
  "/platform/mentor/availability",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = z.array(availabilityRuleSchema).safeParse(req.body?.rules);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    await db
      .delete(mentorAvailabilityRulesTable)
      .where(eq(mentorAvailabilityRulesTable.mentorUserId, req.platformUser!.id));

    if (parsed.data.length) {
      await db.insert(mentorAvailabilityRulesTable).values(
        parsed.data.map((rule) => ({
          mentorUserId: req.platformUser!.id,
          weekday: rule.weekday,
          startTime: rule.startTime,
          endTime: rule.endTime,
          isActive: rule.isActive,
        })),
      );
    }

    return res.status(204).end();
  },
);

router.post(
  "/platform/mentor/universities",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = mentorUniversitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const [row] = await db
      .insert(mentorUniversitiesTable)
      .values({
        mentorUserId: req.platformUser!.id,
        ...parsed.data,
        programName: parsed.data.programName || null,
      })
      .returning();

    return res.status(201).json(row);
  },
);

router.put(
  "/platform/mentor/universities/:id",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = mentorUniversitySchema.safeParse(req.body);
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid id." : parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const [row] = await db
      .update(mentorUniversitiesTable)
      .set({
        country: parsed.data.country,
        universityName: parsed.data.universityName,
        programName: parsed.data.programName || null,
        summary: parsed.data.summary,
        updatedAt: new Date(),
      })
      .where(and(eq(mentorUniversitiesTable.id, id), eq(mentorUniversitiesTable.mentorUserId, req.platformUser!.id)))
      .returning();

    if (!row) {
      return res.status(404).json({ error: "Nie znaleziono wpisu." });
    }

    return res.json(row);
  },
);

router.delete(
  "/platform/mentor/universities/:id",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id." });
    }

    const { db } = await import("@workspace/db");
    await db
      .delete(mentorUniversitiesTable)
      .where(and(eq(mentorUniversitiesTable.id, id), eq(mentorUniversitiesTable.mentorUserId, req.platformUser!.id)));

    return res.status(204).end();
  },
);

router.get(
  "/platform/mentor/guides",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const { db } = await import("@workspace/db");
    const guides = await db
      .select()
      .from(platformGuidesTable)
      .where(eq(platformGuidesTable.ownerUserId, req.platformUser!.id))
      .orderBy(desc(platformGuidesTable.updatedAt), asc(platformGuidesTable.title));

    return res.json(await shapeGuideList(db, guides));
  },
);

router.post(
  "/platform/mentor/guides",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = guideSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const [guide] = await db
      .insert(platformGuidesTable)
      .values({
        guideType: parsed.data.guideType,
        status: parsed.data.status,
        title: parsed.data.title,
        slug: normalizeSlug(parsed.data.slug),
        country: parsed.data.country,
        universityName: parsed.data.universityName,
        summary: parsed.data.summary,
        descriptionMarkdown: parsed.data.descriptionMarkdown,
        estimatedReadMin: parsed.data.estimatedReadMin,
        ownerUserId: req.platformUser!.id,
        menteeUserId: parsed.data.menteeUserId ?? null,
        sourceGuideId: parsed.data.sourceGuideId ?? null,
        driveFolderUrl: parsed.data.driveFolderUrl || null,
        isVisibleToUnapprovedUsers: parsed.data.isVisibleToUnapprovedUsers,
      })
      .returning();

    await upsertGuideItems(db, guide.id, parsed.data.items);
    const [shaped] = await shapeGuideList(db, [guide]);
    return res.status(201).json(shaped);
  },
);

router.put(
  "/platform/mentor/guides/:id",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = guideSchema.safeParse(req.body);
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid guide id." : parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const [guide] = await db
      .update(platformGuidesTable)
      .set({
        guideType: parsed.data.guideType,
        status: parsed.data.status,
        title: parsed.data.title,
        slug: normalizeSlug(parsed.data.slug),
        country: parsed.data.country,
        universityName: parsed.data.universityName,
        summary: parsed.data.summary,
        descriptionMarkdown: parsed.data.descriptionMarkdown,
        estimatedReadMin: parsed.data.estimatedReadMin,
        menteeUserId: parsed.data.menteeUserId ?? null,
        sourceGuideId: parsed.data.sourceGuideId ?? null,
        driveFolderUrl: parsed.data.driveFolderUrl || null,
        isVisibleToUnapprovedUsers: parsed.data.isVisibleToUnapprovedUsers,
        updatedAt: new Date(),
      })
      .where(and(eq(platformGuidesTable.id, id), eq(platformGuidesTable.ownerUserId, req.platformUser!.id)))
      .returning();

    if (!guide) {
      return res.status(404).json({ error: "Nie znaleziono przewodnika." });
    }

    await upsertGuideItems(db, guide.id, parsed.data.items);
    const [shaped] = await shapeGuideList(db, [guide]);
    return res.json(shaped);
  },
);

router.delete(
  "/platform/mentor/guides/:id",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid guide id." });
    }
    const { db } = await import("@workspace/db");
    await db
      .delete(platformGuidesTable)
      .where(and(eq(platformGuidesTable.id, id), eq(platformGuidesTable.ownerUserId, req.platformUser!.id)));
    return res.status(204).end();
  },
);

router.get(
  "/platform/mentor/meetings",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const { db } = await import("@workspace/db");
    const meetings = await db
      .select()
      .from(platformMeetingsTable)
      .where(eq(platformMeetingsTable.mentorUserId, req.platformUser!.id))
      .orderBy(desc(platformMeetingsTable.startsAt));
    return res.json(
      meetings.map((meeting) => ({
        ...meeting,
        startsAt: meeting.startsAt.toISOString(),
        endsAt: meeting.endsAt.toISOString(),
        createdAt: meeting.createdAt.toISOString(),
        updatedAt: meeting.updatedAt.toISOString(),
      })),
    );
  },
);

router.patch(
  "/platform/mentor/meetings/:id",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = meetingUpdateSchema.safeParse(req.body);
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid meeting id." : parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [meeting] = await db
      .update(platformMeetingsTable)
      .set({
        status: parsed.data.status,
        actualDurationMinutes: parsed.data.actualDurationMinutes ?? null,
        mentorNotes: parsed.data.mentorNotes,
        cancellationReason: parsed.data.cancellationReason,
        updatedAt: new Date(),
      })
      .where(and(eq(platformMeetingsTable.id, id), eq(platformMeetingsTable.mentorUserId, req.platformUser!.id)))
      .returning();

    if (!meeting) {
      return res.status(404).json({ error: "Nie znaleziono spotkania." });
    }

    return res.json({
      ...meeting,
      startsAt: meeting.startsAt.toISOString(),
      endsAt: meeting.endsAt.toISOString(),
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
    });
  },
);

router.put(
  "/platform/mentor/google-connections/:type",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = googleConnectionSchema.safeParse({
      ...req.body,
      connectionType: req.params.type,
    });
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const [row] = await db
      .insert(platformGoogleConnectionsTable)
      .values({
        userId: req.platformUser!.id,
        connectionType: parsed.data.connectionType,
        status: parsed.data.status,
        externalEmail: parsed.data.externalEmail || null,
        scopes: parsed.data.scopes,
      })
      .onConflictDoUpdate({
        target: [platformGoogleConnectionsTable.userId, platformGoogleConnectionsTable.connectionType] as never,
        set: {
          status: parsed.data.status,
          externalEmail: parsed.data.externalEmail || null,
          scopes: parsed.data.scopes,
          updatedAt: new Date(),
        },
      })
      .returning();

    return res.json(row);
  },
);

router.get(
  "/platform/mentee/overview",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const { db } = await import("@workspace/db");
    const [profile] = await db
      .select()
      .from(menteeProfilesTable)
      .where(eq(menteeProfilesTable.userId, req.platformUser!.id))
      .limit(1);
    const meetings = await db
      .select()
      .from(platformMeetingsTable)
      .where(eq(platformMeetingsTable.menteeUserId, req.platformUser!.id))
      .orderBy(desc(platformMeetingsTable.startsAt));
    const guides = await db
      .select()
      .from(platformGuidesTable)
      .where(
        or(
          eq(platformGuidesTable.menteeUserId, req.platformUser!.id),
          and(
            eq(platformGuidesTable.guideType, "admin_template"),
            eq(platformGuidesTable.status, "published"),
          ),
        ),
      )
      .orderBy(desc(platformGuidesTable.updatedAt));

    return res.json({
      profile,
      meetings: meetings.map((meeting) => ({
        ...meeting,
        startsAt: meeting.startsAt.toISOString(),
        endsAt: meeting.endsAt.toISOString(),
      })),
      guides: await shapeGuideList(db, guides),
    });
  },
);

router.post(
  "/platform/mentee/meetings",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = meetingCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }

    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = new Date(parsed.data.endsAt);
    if (!meetingWindowIsValid(startsAt, endsAt)) {
      return res.status(400).json({ error: "Spotkanie musi trwać przynajmniej 15 minut." });
    }
    if (!meetingOutside24Hours(startsAt)) {
      return res.status(400).json({ error: "Spotkania można umawiać najwcześniej za 24 godziny." });
    }

    const { db } = await import("@workspace/db");
    const [menteeProfile] = await db
      .select()
      .from(menteeProfilesTable)
      .where(eq(menteeProfilesTable.userId, req.platformUser!.id))
      .limit(1);

    if (!menteeProfile?.adminApproved) {
      return res.status(403).json({ error: "Najpierw potrzebujesz akceptacji administratora." });
    }

    const [mentorProfile] = await db
      .select()
      .from(mentorProfilesTable)
      .where(eq(mentorProfilesTable.userId, parsed.data.mentorUserId))
      .limit(1);

    if (!mentorProfile?.adminApproved) {
      return res.status(400).json({ error: "Wybrany mentor nie jest jeszcze aktywny." });
    }

    const [meeting] = await db
      .insert(platformMeetingsTable)
      .values({
        mentorUserId: parsed.data.mentorUserId,
        menteeUserId: req.platformUser!.id,
        title: parsed.data.title,
        description: parsed.data.description,
        startsAt,
        endsAt,
        timezone: parsed.data.timezone,
        method: parsed.data.method,
        meetingUrl: parsed.data.meetingUrl || null,
      })
      .returning();

    return res.status(201).json({
      ...meeting,
      startsAt: meeting.startsAt.toISOString(),
      endsAt: meeting.endsAt.toISOString(),
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
    });
  },
);

router.post(
  "/platform/mentee/guides/:id/adopt",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const sourceGuideId = Number(req.params.id);
    if (!Number.isFinite(sourceGuideId)) {
      return res.status(400).json({ error: "Invalid guide id." });
    }

    const { db } = await import("@workspace/db");
    const [sourceGuide] = await db
      .select()
      .from(platformGuidesTable)
      .where(and(eq(platformGuidesTable.id, sourceGuideId), eq(platformGuidesTable.guideType, "admin_template")))
      .limit(1);

    if (!sourceGuide) {
      return res.status(404).json({ error: "Nie znaleziono przewodnika." });
    }

    const sourceItems = await db
      .select()
      .from(platformGuideChecklistItemsTable)
      .where(eq(platformGuideChecklistItemsTable.guideId, sourceGuide.id))
      .orderBy(asc(platformGuideChecklistItemsTable.sortOrder));

    const [guide] = await db
      .insert(platformGuidesTable)
      .values({
        guideType: "self_service_live",
        status: "published",
        title: sourceGuide.title,
        slug: `${sourceGuide.slug}-${req.platformUser!.id}`,
        country: sourceGuide.country,
        universityName: sourceGuide.universityName,
        summary: sourceGuide.summary,
        descriptionMarkdown: sourceGuide.descriptionMarkdown,
        estimatedReadMin: sourceGuide.estimatedReadMin,
        ownerUserId: req.platformUser!.id,
        menteeUserId: req.platformUser!.id,
        sourceGuideId: sourceGuide.id,
      })
      .returning();

    await upsertGuideItems(
      db,
      guide.id,
      sourceItems.map((item) => ({
        sortOrder: item.sortOrder,
        sectionTitle: item.sectionTitle,
        title: item.title,
        description: item.description,
        itemType: item.itemType as z.infer<typeof guideItemSchema>["itemType"],
        suggestedFilename: item.suggestedFilename ?? "",
        externalUrl: item.externalUrl ?? "",
        linkedGuideItemId: item.linkedGuideItemId,
        isRequired: item.isRequired,
        isCompleted: false,
        fileUrl: item.fileUrl ?? "",
      })),
    );

    const [shaped] = await shapeGuideList(db, [guide]);
    return res.status(201).json(shaped);
  },
);

router.patch(
  "/platform/mentee/meetings/:id/cancel",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid meeting id." });
    }
    const { db } = await import("@workspace/db");
    const [meeting] = await db
      .update(platformMeetingsTable)
      .set({
        status: "cancelled",
        cancellationReason: typeof req.body?.reason === "string" ? req.body.reason.trim() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(platformMeetingsTable.id, id), eq(platformMeetingsTable.menteeUserId, req.platformUser!.id)))
      .returning();
    if (!meeting) {
      return res.status(404).json({ error: "Nie znaleziono spotkania." });
    }
    return res.json({
      ...meeting,
      startsAt: meeting.startsAt.toISOString(),
      endsAt: meeting.endsAt.toISOString(),
      createdAt: meeting.createdAt.toISOString(),
      updatedAt: meeting.updatedAt.toISOString(),
    });
  },
);

router.get(
  "/platform/admin/overview",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (_req, res) => {
    const { db } = await import("@workspace/db");
    const users = await db.select().from(platformUsersTable);
    const meetings = await db.select().from(platformMeetingsTable);
    const guides = await db.select().from(platformGuidesTable);

    return res.json({
      counts: {
        users: users.length,
        mentors: users.filter((user) => user.role === "mentor").length,
        mentees: users.filter((user) => user.role === "mentee").length,
        admins: users.filter((user) => user.role === "admin").length,
        meetings: meetings.length,
        guides: guides.length,
      },
    });
  },
);

router.get(
  "/platform/admin/users",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (_req, res) => {
    const { db } = await import("@workspace/db");
    const users = await db.select().from(platformUsersTable).orderBy(asc(platformUsersTable.role), asc(platformUsersTable.fullName));
    const mentorProfiles = await db.select().from(mentorProfilesTable);
    const menteeProfiles = await db.select().from(menteeProfilesTable);
    return res.json({
      users: users.map(serializeUser),
      mentorProfiles,
      menteeProfiles,
    });
  },
);

router.post(
  "/platform/admin/users",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const parsed = userCreateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const { hash, salt } = hashPassword(parsed.data.password);
    const [user] = await db
      .insert(platformUsersTable)
      .values({
        role: parsed.data.role,
        status: parsed.data.status,
        fullName: parsed.data.fullName,
        email: parsed.data.email.toLowerCase(),
        passwordHash: hash,
        passwordSalt: salt,
      })
      .returning();

    if (parsed.data.role === "mentor") {
      await db.insert(mentorProfilesTable).values({
        userId: user.id,
        bio: "",
        adminApproved: parsed.data.status === "active",
      });
    }

    if (parsed.data.role === "mentee") {
      await db.insert(menteeProfilesTable).values({
        userId: user.id,
        adminApproved: parsed.data.status === "active",
      });
    }

    return res.status(201).json({ user: serializeUser(user) });
  },
);

router.put(
  "/platform/admin/users/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const parsed = userUpdateSchema.safeParse(req.body);
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid user id." : parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const [user] = await db
      .update(platformUsersTable)
      .set({
        fullName: parsed.data.fullName,
        status: parsed.data.status,
        notes: parsed.data.notes,
        avatarUrl: parsed.data.avatarUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(platformUsersTable.id, id))
      .returning();

    if (!user) {
      return res.status(404).json({ error: "Nie znaleziono użytkownika." });
    }

    if (user.role === "mentor") {
      await db
        .insert(mentorProfilesTable)
        .values({
          userId: user.id,
          bio: "",
          adminApproved: user.status === "active",
        })
        .onConflictDoUpdate({
          target: mentorProfilesTable.userId,
          set: {
            adminApproved: user.status === "active",
            updatedAt: new Date(),
          },
        });
    }

    if (user.role === "mentee") {
      await db
        .insert(menteeProfilesTable)
        .values({
          userId: user.id,
          adminApproved: user.status === "active",
        })
        .onConflictDoUpdate({
          target: menteeProfilesTable.userId,
          set: {
            adminApproved: user.status === "active",
            updatedAt: new Date(),
          },
        });
    }

    return res.json({ user: serializeUser(user) });
  },
);

router.put(
  "/platform/admin/mentees/:id/assign-mentor",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    const mentorUserId = Number(req.body?.mentorUserId);
    if (!Number.isFinite(id) || !Number.isFinite(mentorUserId)) {
      return res.status(422).json({ error: "Invalid mentor or mentee id." });
    }
    const { db } = await import("@workspace/db");
    const [profile] = await db
      .insert(menteeProfilesTable)
      .values({
        userId: id,
        adminApproved: true,
        primaryMentorUserId: mentorUserId,
      })
      .onConflictDoUpdate({
        target: menteeProfilesTable.userId,
        set: {
          primaryMentorUserId: mentorUserId,
          adminApproved: true,
          updatedAt: new Date(),
        },
      })
      .returning();
    return res.json(profile);
  },
);

router.get(
  "/platform/admin/guides",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (_req, res) => {
    const { db } = await import("@workspace/db");
    const guides = await db.select().from(platformGuidesTable).orderBy(desc(platformGuidesTable.updatedAt));
    return res.json(await shapeGuideList(db, guides));
  },
);

router.post(
  "/platform/admin/guides",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = guideSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [guide] = await db
      .insert(platformGuidesTable)
      .values({
        guideType: parsed.data.guideType,
        status: parsed.data.status,
        title: parsed.data.title,
        slug: normalizeSlug(parsed.data.slug),
        country: parsed.data.country,
        universityName: parsed.data.universityName,
        summary: parsed.data.summary,
        descriptionMarkdown: parsed.data.descriptionMarkdown,
        estimatedReadMin: parsed.data.estimatedReadMin,
        ownerUserId: req.platformUser!.id,
        menteeUserId: parsed.data.menteeUserId ?? null,
        sourceGuideId: parsed.data.sourceGuideId ?? null,
        driveFolderUrl: parsed.data.driveFolderUrl || null,
        isVisibleToUnapprovedUsers: parsed.data.isVisibleToUnapprovedUsers,
      })
      .returning();
    await upsertGuideItems(db, guide.id, parsed.data.items);
    const [shaped] = await shapeGuideList(db, [guide]);
    return res.status(201).json(shaped);
  },
);

router.post(
  "/platform/admin/guides/:id/assign",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const parsed = assignGuideSchema.safeParse(req.body);
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid guide id." : parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const [sourceGuide] = await db
      .select()
      .from(platformGuidesTable)
      .where(eq(platformGuidesTable.id, id))
      .limit(1);
    if (!sourceGuide) {
      return res.status(404).json({ error: "Nie znaleziono przewodnika." });
    }

    const sourceItems = await db
      .select()
      .from(platformGuideChecklistItemsTable)
      .where(eq(platformGuideChecklistItemsTable.guideId, sourceGuide.id))
      .orderBy(asc(platformGuideChecklistItemsTable.sortOrder));

    const [guide] = await db
      .insert(platformGuidesTable)
      .values({
        guideType: parsed.data.mentorUserId ? "mentor_live" : "self_service_live",
        status: "published",
        title: sourceGuide.title,
        slug: `${sourceGuide.slug}-${parsed.data.menteeUserId}-${Date.now()}`,
        country: sourceGuide.country,
        universityName: sourceGuide.universityName,
        summary: sourceGuide.summary,
        descriptionMarkdown: sourceGuide.descriptionMarkdown,
        estimatedReadMin: sourceGuide.estimatedReadMin,
        ownerUserId: parsed.data.mentorUserId ?? parsed.data.menteeUserId,
        menteeUserId: parsed.data.menteeUserId,
        sourceGuideId: sourceGuide.id,
      })
      .returning();

    await upsertGuideItems(
      db,
      guide.id,
      sourceItems.map((item) => ({
        sortOrder: item.sortOrder,
        sectionTitle: item.sectionTitle,
        title: item.title,
        description: item.description,
        itemType: item.itemType as z.infer<typeof guideItemSchema>["itemType"],
        suggestedFilename: item.suggestedFilename ?? "",
        externalUrl: item.externalUrl ?? "",
        linkedGuideItemId: item.linkedGuideItemId,
        isRequired: item.isRequired,
        isCompleted: false,
        fileUrl: item.fileUrl ?? "",
      })),
    );

    const [shaped] = await shapeGuideList(db, [guide]);
    return res.status(201).json(shaped);
  },
);

router.get(
  "/platform/admin/leads/:kind",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const kind = req.params.kind;
    const { db } = await import("@workspace/db");

    switch (kind) {
      case "contact":
        return res.json(await db.select().from(contactSubmissionsTable).orderBy(desc(contactSubmissionsTable.createdAt)));
      case "mentor":
        return res.json(await db.select().from(mentorApplicationsTable).orderBy(desc(mentorApplicationsTable.createdAt)));
      case "scholarship":
        return res.json(await db.select().from(scholarshipApplicationsTable).orderBy(desc(scholarshipApplicationsTable.createdAt)));
      case "newsletter":
        return res.json(await db.select().from(newsletterSignupsTable).orderBy(desc(newsletterSignupsTable.createdAt)));
      case "booking":
        return res.json(await db.select().from(bookingLeadsTable).orderBy(desc(bookingLeadsTable.createdAt)));
      default:
        return res.status(404).json({ error: "Unknown lead type." });
    }
  },
);

router.delete(
  "/platform/admin/leads/:kind/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const kind = req.params.kind;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid lead id." });
    }

    const { db } = await import("@workspace/db");
    switch (kind) {
      case "contact":
        await db.delete(contactSubmissionsTable).where(eq(contactSubmissionsTable.id, id));
        break;
      case "mentor":
        await db.delete(mentorApplicationsTable).where(eq(mentorApplicationsTable.id, id));
        break;
      case "scholarship":
        await db.delete(scholarshipApplicationsTable).where(eq(scholarshipApplicationsTable.id, id));
        break;
      case "newsletter":
        await db.delete(newsletterSignupsTable).where(eq(newsletterSignupsTable.id, id));
        break;
      case "booking":
        await db.delete(bookingLeadsTable).where(eq(bookingLeadsTable.id, id));
        break;
      default:
        return res.status(404).json({ error: "Unknown lead type." });
    }

    return res.status(204).end();
  },
);

export default router;
