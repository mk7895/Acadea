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
  platformGuideAssignmentsTable,
  platformGuideChecklistItemsTable,
  platformGuidesTable,
  platformFileAssetsTable,
  platformMaterialItemStatesTable,
  platformMeetingsTable,
  platformMaterialTemplatesTable,
  platformMentorAssignmentsTable,
  platformMentorWorkspaceLinksTable,
  platformPasswordResetTokensTable,
  platformProfileFieldsTable,
  platformProfileResponsesTable,
  platformUsersTable,
  scholarshipApplicationsTable,
  PLATFORM_CHECKLIST_ITEM_TYPES,
  PLATFORM_CONNECTION_STATUSES,
  PLATFORM_GOOGLE_CONNECTION_TYPES,
  PLATFORM_GUIDE_STATUSES,
  PLATFORM_GUIDE_TYPES,
  PLATFORM_MATERIAL_TEMPLATE_TYPES,
  PLATFORM_MEETING_METHODS,
  PLATFORM_MEETING_STATUSES,
  PLATFORM_PROFILE_FIELD_TYPES,
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
import { logger } from "../lib/logger";
import {
  sendGmailMessageWithAccessToken,
  sendPlatformDriveShareEmail,
  sendPlatformPasswordResetEmail,
} from "../lib/mailer";
import {
  getGoogleAccessTokenForRefreshToken,
  getGoogleOAuthClientCredentials,
  getGooglePrimaryCalendarIdForAccessToken,
  googleApiRequestWithAccessToken,
} from "../lib/google";
import { getPlatformStorageSummary } from "../lib/platform/storage";
import {
  buildMentorMeetingUrl,
  createPlatformGoogleOAuthState,
  getPlatformGoogleConnectionMetadata,
  PLATFORM_MENTOR_GOOGLE_SCOPES,
} from "../lib/platform/google";
import {
  cloneDocumentTabToTarget,
  createDocumentTab,
  createDriveFolder,
  createDriveShortcut,
  createGoogleDocument,
  findDriveDocuments,
  getGoogleSharedDriveId,
  hasGoogleWorkspaceServiceAccount,
  listDocumentTabs,
  parseGoogleDriveId,
  shareDriveItemWithUser,
  uploadFileToDrive,
} from "../lib/googleWorkspace";

const router = Router();
const PLATFORM_TERMS_VERSION = "2026-06-29";

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
  acceptedPlatformTerms: z.boolean().refine((value) => value, {
    message: "Akceptacja Regulaminu Platformy jest wymagana.",
  }),
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
  bookingWindowDays: z.number().int().min(1).max(180).optional().default(30),
  minimumNoticeHours: z.number().int().min(0).max(24 * 7).optional().default(24),
});

const adminMentorDriveSchema = z.object({
  googleDriveFolderUrl: z.string().trim().optional().default(""),
});

const availabilityRuleSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().default(true),
});

const availabilityOverrideRangeSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().default(true),
});

const availabilityOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isBlocked: z.boolean().default(false),
  ranges: z.array(availabilityOverrideRangeSchema).default([]),
});

const mentorAvailabilityPayloadSchema = z.object({
  rules: z.array(availabilityRuleSchema).default([]),
  overrides: z.array(availabilityOverrideSchema).default([]),
  bookingWindowDays: z.number().int().min(1).max(180).default(30),
  minimumNoticeHours: z.number().int().min(0).max(24 * 7).default(24),
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

const assignGuideAccessSchema = z.object({
  guideId: z.number().int().positive(),
  menteeUserId: z.number().int().positive(),
});

const profileFieldSchema = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  fieldType: z.enum(PLATFORM_PROFILE_FIELD_TYPES).default("text"),
  sectionTitle: z.string().trim().min(1).default("Dane podstawowe"),
  placeholder: z.string().trim().optional().default(""),
  isRequired: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

const profileResponseSchema = z.object({
  responses: z.array(
    z.object({
      fieldId: z.number().int().positive(),
      value: z.string().default(""),
    }),
  ).default([]),
});

const materialTemplateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional().default(""),
  templateType: z.enum(PLATFORM_MATERIAL_TEMPLATE_TYPES).default("passport_like"),
  guideId: z.number().int().positive().nullable().optional(),
  appliesToGuideIds: z.array(z.number().int().positive()).default([]),
  structure: z.array(z.record(z.string(), z.unknown())).default([]),
  alternativeOptions: z.array(z.string().trim().min(1)).default([]),
  isActive: z.boolean().default(true),
});

const PLATFORM_MATERIAL_ITEM_ACTIONS = [
  "check_only",
  "file_required",
  "file_or_doc",
  "check_or_file",
] as const;

const guideImportChecklistItemSchema = z.object({
  sortOrder: z.number().int().min(0).optional(),
  sectionTitle: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  itemType: z.enum(PLATFORM_CHECKLIST_ITEM_TYPES).optional(),
  suggestedFilename: z.string().trim().optional(),
  externalUrl: z.string().trim().optional(),
  linkedGuideItemId: z.number().int().positive().nullable().optional(),
  isRequired: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  fileUrl: z.string().trim().optional(),
});

const guideImportGuideSchema = z.object({
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  country: z.string().trim().min(1),
  universityName: z.string().trim().min(1),
  summary: z.string().trim().optional(),
  descriptionMarkdown: z.string().trim().optional(),
  estimatedReadMin: z.number().int().min(1).optional(),
  status: z.enum(PLATFORM_GUIDE_STATUSES).optional(),
  guideType: z.enum(["admin_template", "mentor_blueprint"]).optional(),
  isVisibleToUnapprovedUsers: z.boolean().optional(),
  items: z.array(guideImportChecklistItemSchema).optional(),
});

const guideImportItemGuideSchema = guideImportGuideSchema.extend({
  key: z.string().trim().min(1),
  appliesToGuideSlugs: z.array(z.string().trim().min(1)).optional(),
});

const guideImportMaterialRowSchema = z.object({
  level: z.enum(["country", "university", "item"]),
  country: z.string().trim().optional(),
  university: z.string().trim().optional(),
  task: z.string().trim().optional(),
  insertAfterTask: z.string().trim().optional(),
  actionType: z.enum(PLATFORM_MATERIAL_ITEM_ACTIONS).optional(),
  suggestedFilename: z.string().trim().optional(),
  docTabTitle: z.string().trim().optional(),
  docTabPrompt: z.string().trim().optional(),
  sourceDocumentId: z.string().trim().optional(),
  sourceTabId: z.string().trim().optional(),
  guideKey: z.string().trim().optional(),
  alternativeOptions: z.array(z.string().trim().min(1)).optional(),
  appliesToGuideSlugs: z.array(z.string().trim().min(1)).optional(),
});

const guideImportMaterialTemplateSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  templateType: z.enum(PLATFORM_MATERIAL_TEMPLATE_TYPES).optional(),
  guideKey: z.string().trim().optional(),
  targetTemplateTitle: z.string().trim().optional(),
  mergeMode: z.enum(["replace", "append"]).optional(),
  appliesToGuideSlugs: z.array(z.string().trim().min(1)).optional(),
  alternativeOptions: z.array(z.string().trim().min(1)).optional(),
  isActive: z.boolean().optional(),
  rows: z.array(guideImportMaterialRowSchema).default([]),
});

const guideImportBlueprintSchema = z.object({
  version: z.literal(1),
  guide: guideImportGuideSchema,
  itemGuides: z.array(guideImportItemGuideSchema).optional(),
  materialTemplates: z.array(guideImportMaterialTemplateSchema).min(1),
});

const MAX_MATERIAL_UPLOAD_BYTES = 15 * 1024 * 1024;

const mentorMaterialRowsSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).default([]),
});

const menteeMaterialCheckSchema = z.object({
  templateId: z.number().int().positive(),
  rowKey: z.string().trim().min(1),
  completed: z.boolean(),
});

const menteeMaterialUploadSchema = z.object({
  templateId: z.number().int().positive(),
  rowKey: z.string().trim().min(1),
  base64Content: z.string().min(1),
  fileName: z.string().trim().min(1),
  mimeType: z.string().trim().min(1),
});

const menteeMaterialDocTabSchema = z.object({
  templateId: z.number().int().positive(),
  rowKey: z.string().trim().min(1),
});

const adminMasterDocCreateTabSchema = z.object({
  initialText: z.string().optional().default(""),
  title: z.string().trim().min(1),
});

const assignMentorAccessSchema = z.object({
  menteeUserId: z.number().int().positive(),
  mentorUserId: z.number().int().positive(),
});

const approvalSchema = z.object({
  approved: z.boolean(),
});

const menteeLimitsSchema = z.object({
  disabledHintGuideTemplateIds: z.array(z.number().int().positive()).optional(),
  maxActiveGuideCount: z.number().int().min(1).max(20).optional(),
  maxHintGuideCount: z.number().int().min(0).max(20).optional(),
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
  turnstileToken: z.string().optional(),
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

function parseGuideMeta(value: string | null | undefined) {
  if (!value || !value.startsWith("__meta:")) {
    return {};
  }
  try {
    return JSON.parse(value.slice("__meta:".length));
  } catch {
    return {};
  }
}

function isItemGuideRecord(guide: { driveFolderUrl: string | null; guideType: string }) {
  if (guide.guideType !== "admin_template" && guide.guideType !== "mentor_blueprint") {
    return false;
  }
  const metadata = parseGuideMeta(guide.driveFolderUrl);
  return (metadata as any).kind === "item_guide";
}

function getMenteeGuideLimits(profile: {
  disabledHintGuideTemplateIds?: number[] | null;
  maxActiveGuideCount?: number | null;
  maxHintGuideCount?: number | null;
} | null | undefined) {
  return {
    disabledHintGuideTemplateIds: Array.isArray(profile?.disabledHintGuideTemplateIds)
      ? profile!.disabledHintGuideTemplateIds.filter((value): value is number => Number.isFinite(value))
      : [],
    maxActiveGuideCount: Number.isFinite(profile?.maxActiveGuideCount)
      ? Math.max(1, Number(profile?.maxActiveGuideCount))
      : 3,
    maxHintGuideCount: Number.isFinite(profile?.maxHintGuideCount)
      ? Math.max(0, Number(profile?.maxHintGuideCount))
      : 3,
  };
}

function getEligibleHintTemplateIdsForGuides(
  guides: Array<{ createdAt: Date; id: number; sourceGuideId: number | null }>,
  limits: {
    disabledHintGuideTemplateIds: number[];
    maxHintGuideCount: number;
  },
) {
  const disabledIds = new Set(limits.disabledHintGuideTemplateIds);
  const seen = new Set<number>();
  const orderedTemplateIds: number[] = [];

  for (const guide of guides) {
    const sourceGuideId = guide.sourceGuideId ?? guide.id;
    if (!Number.isFinite(sourceGuideId) || seen.has(sourceGuideId)) {
      continue;
    }
    seen.add(sourceGuideId);
    if (!disabledIds.has(sourceGuideId)) {
      orderedTemplateIds.push(sourceGuideId);
    }
  }

  return orderedTemplateIds.slice(0, limits.maxHintGuideCount);
}

function serializeMentorProfile(
  profile:
    | {
        adminApproved?: boolean | null;
        availabilityOverrides?: Array<{
          date: string;
          isBlocked?: boolean;
          ranges?: Array<{
            endTime: string;
            isActive?: boolean;
            startTime: string;
          }>;
        }> | null;
        bio?: string | null;
        bookingWindowDays?: number | null;
        googleCalendarEmail?: string | null;
        googleDriveFolderId?: string | null;
        googleDriveFolderUrl?: string | null;
        headline?: string | null;
        id?: number;
        meetingLink?: string | null;
        meetingMethod?: string | null;
        minimumNoticeHours?: number | null;
        timezone?: string | null;
        updatedAt?: Date | null;
        userId?: number;
        whatsappNumber?: string | null;
      }
    | null
    | undefined,
) {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    availabilityOverrides: Array.isArray(profile.availabilityOverrides)
      ? profile.availabilityOverrides.map((entry) => ({
          date: entry.date,
          isBlocked: Boolean(entry.isBlocked),
          ranges: Array.isArray(entry.ranges)
            ? entry.ranges.map((range) => ({
                startTime: range.startTime,
                endTime: range.endTime,
                isActive: range.isActive !== false,
              }))
            : [],
        }))
      : [],
    bio: profile.bio ?? "",
    bookingWindowDays: profile.bookingWindowDays ?? 30,
    googleCalendarEmail: profile.googleCalendarEmail ?? "",
    googleDriveFolderId: profile.googleDriveFolderId ?? "",
    googleDriveFolderUrl: profile.googleDriveFolderUrl ?? "",
    headline: profile.headline ?? "",
    meetingLink: profile.meetingLink ?? "",
    meetingMethod: profile.meetingMethod ?? "zoom_link",
    minimumNoticeHours: profile.minimumNoticeHours ?? 24,
    timezone: profile.timezone ?? "Europe/Warsaw",
    whatsappNumber: profile.whatsappNumber ?? "",
  };
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

function slugifyWorkspaceToken(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function buildUserWorkspaceSlug(user: { email: string; fullName: string; id: number }) {
  const emailLocal = user.email.split("@")[0] ?? "";
  return slugifyWorkspaceToken(emailLocal) || slugifyWorkspaceToken(user.fullName) || `user-${user.id}`;
}

function normalizeMaterialStructureRow(row: Record<string, unknown>, index: number) {
  const level =
    row.level === "country" || row.level === "university" || row.level === "item"
      ? row.level
      : "item";
  const country = typeof row.country === "string" ? row.country.trim() : "";
  const university = typeof row.university === "string" ? row.university.trim() : "";
  const task = typeof row.task === "string" ? row.task.trim() : "";
  const rowKeySource =
    typeof row.displayKey === "string" && row.displayKey.trim()
      ? row.displayKey
      : `${level}-${task || university || country || `row-${index + 1}`}-${index + 1}`;
  const actionType =
    row.actionType && PLATFORM_MATERIAL_ITEM_ACTIONS.includes(row.actionType as (typeof PLATFORM_MATERIAL_ITEM_ACTIONS)[number])
      ? (row.actionType as (typeof PLATFORM_MATERIAL_ITEM_ACTIONS)[number])
      : "check_only";
  return {
    ...row,
    actionType,
    alternativeOptions: Array.isArray(row.alternativeOptions)
      ? row.alternativeOptions.map((value) => String(value).trim()).filter(Boolean)
      : [],
    appliesToGuideIds: Array.isArray(row.appliesToGuideIds)
      ? row.appliesToGuideIds
          .map((value) => Number(value))
          .filter((value) => Number.isFinite(value) && value > 0)
      : [],
    country,
    displayKey: slugifyWorkspaceToken(String(rowKeySource)) || `row-${index + 1}`,
    docTabPrompt: typeof row.docTabPrompt === "string" ? row.docTabPrompt.trim() : "",
    docTabTitle: typeof row.docTabTitle === "string" ? row.docTabTitle.trim() : "",
    guideId: Number.isFinite(Number(row.guideId)) ? Number(row.guideId) : null,
    level,
    ownerUserId: Number.isFinite(Number(row.ownerUserId)) ? Number(row.ownerUserId) : null,
    sourceDocumentId: typeof row.sourceDocumentId === "string" ? row.sourceDocumentId.trim() : "",
    sourceTabId: typeof row.sourceTabId === "string" ? row.sourceTabId.trim() : "",
    suggestedFilename: typeof row.suggestedFilename === "string" ? row.suggestedFilename.trim() : "",
    task,
    university,
  };
}

function normalizeMaterialStructureRows(rows: unknown) {
  if (!Array.isArray(rows)) {
    return [];
  }
  return rows
    .map((row, index) =>
      typeof row === "object" && row !== null
        ? normalizeMaterialStructureRow(row as Record<string, unknown>, index)
        : null,
    )
    .filter((row): row is ReturnType<typeof normalizeMaterialStructureRow> => Boolean(row));
}

function normalizeImportedGuideItems(items: z.infer<typeof guideImportChecklistItemSchema>[] | undefined) {
  return (items ?? []).map((item, index) => ({
    sortOrder: item.sortOrder ?? index,
    sectionTitle: item.sectionTitle ?? "Checklist",
    title: item.title,
    description: item.description ?? "",
    itemType: item.itemType ?? "todo",
    suggestedFilename: item.suggestedFilename ?? "",
    externalUrl: item.externalUrl ?? "",
    linkedGuideItemId: item.linkedGuideItemId ?? null,
    isRequired: item.isRequired ?? true,
    isCompleted: item.isCompleted ?? false,
    fileUrl: item.fileUrl ?? "",
  }));
}

function mergeImportedRowsIntoExistingStructure(
  existingRows: Array<Record<string, unknown>>,
  importedRows: Array<Record<string, unknown> & { insertAfterTask?: string }>,
) {
  const mergedRows = normalizeMaterialStructureRows(existingRows);

  for (const importedRow of importedRows) {
    const [normalizedImportedRow] = normalizeMaterialStructureRows([importedRow]);
    if (!normalizedImportedRow) {
      continue;
    }

    const anchorTask =
      typeof importedRow.insertAfterTask === "string" ? importedRow.insertAfterTask.trim().toLowerCase() : "";
    if (!anchorTask) {
      mergedRows.push(normalizedImportedRow);
      continue;
    }

    const lastMatchingIndex = [...mergedRows]
      .map((row, index) => ({ index, task: row.task.trim().toLowerCase() }))
      .filter((row) => row.task === anchorTask)
      .map((row) => row.index)
      .pop();

    if (typeof lastMatchingIndex === "number") {
      mergedRows.splice(lastMatchingIndex + 1, 0, normalizedImportedRow);
      continue;
    }

    mergedRows.push(normalizedImportedRow);
  }

  return mergedRows;
}

function createItemGuideMeta(appliesToGuideIds: number[]) {
  return `__meta:${JSON.stringify({
    appliesToGuideIds,
    kind: "item_guide",
  })}`;
}

function resolveGuideIdsFromSlugs(
  slugs: string[] | undefined,
  guideIdBySlug: Map<string, number>,
  fallbackGuideId: number,
) {
  const ids = (slugs ?? [])
    .map((slug) => guideIdBySlug.get(slug))
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return ids.length ? ids : [fallbackGuideId];
}

async function importGuideBlueprint(
  db: Awaited<typeof import("@workspace/db")>["db"],
  ownerUserId: number,
  blueprint: z.infer<typeof guideImportBlueprintSchema>,
) {
  const existingGuides = await db.select().from(platformGuidesTable);
  let existingTemplates = await db.select().from(platformMaterialTemplatesTable);

  const upsertGuide = async (
    payload: {
      country: string;
      descriptionMarkdown: string;
      driveFolderUrl: string | null;
      estimatedReadMin: number;
      guideType: "admin_template" | "mentor_blueprint";
      isVisibleToUnapprovedUsers: boolean;
      items: ReturnType<typeof normalizeImportedGuideItems>;
      slug: string;
      status: "draft" | "published" | "archived";
      summary: string;
      title: string;
      universityName: string;
    },
  ) => {
    const existing = existingGuides.find(
      (guide) => guide.slug === payload.slug && guide.guideType === payload.guideType,
    );

    if (existing) {
      const [updated] = await db
        .update(platformGuidesTable)
        .set({
          title: payload.title,
          slug: normalizeSlug(payload.slug),
          country: payload.country,
          universityName: payload.universityName,
          summary: payload.summary,
          descriptionMarkdown: payload.descriptionMarkdown,
          estimatedReadMin: payload.estimatedReadMin,
          driveFolderUrl: payload.driveFolderUrl,
          status: payload.status,
          isVisibleToUnapprovedUsers: payload.isVisibleToUnapprovedUsers,
          updatedAt: new Date(),
        })
        .where(eq(platformGuidesTable.id, existing.id))
        .returning();
      await upsertGuideItems(db, updated.id, payload.items);
      return updated;
    }

    const [created] = await db
      .insert(platformGuidesTable)
      .values({
        guideType: payload.guideType,
        status: payload.status,
        title: payload.title,
        slug: normalizeSlug(payload.slug),
        country: payload.country,
        universityName: payload.universityName,
        summary: payload.summary,
        descriptionMarkdown: payload.descriptionMarkdown,
        estimatedReadMin: payload.estimatedReadMin,
        ownerUserId,
        menteeUserId: null,
        sourceGuideId: null,
        driveFolderUrl: payload.driveFolderUrl,
        isVisibleToUnapprovedUsers: payload.isVisibleToUnapprovedUsers,
      })
      .returning();
    await upsertGuideItems(db, created.id, payload.items);
    return created;
  };

  const mainGuide = await upsertGuide({
    country: blueprint.guide.country,
    descriptionMarkdown: blueprint.guide.descriptionMarkdown ?? "",
    driveFolderUrl: null,
    estimatedReadMin: blueprint.guide.estimatedReadMin ?? 12,
    guideType: blueprint.guide.guideType ?? "admin_template",
    isVisibleToUnapprovedUsers: blueprint.guide.isVisibleToUnapprovedUsers ?? true,
    items: normalizeImportedGuideItems(blueprint.guide.items),
    slug: blueprint.guide.slug,
    status: blueprint.guide.status ?? "published",
    summary: blueprint.guide.summary ?? "",
    title: blueprint.guide.title,
    universityName: blueprint.guide.universityName,
  });

  const refreshedGuides = await db.select().from(platformGuidesTable);
  const guideIdBySlug = new Map<string, number>([[mainGuide.slug, mainGuide.id]]);
  const itemGuideIdByKey = new Map<string, number>();

  for (const itemGuide of blueprint.itemGuides ?? []) {
    const appliesToGuideIds = resolveGuideIdsFromSlugs(
      itemGuide.appliesToGuideSlugs,
      guideIdBySlug,
      mainGuide.id,
    );
    const upserted = await upsertGuide({
      country: itemGuide.country,
      descriptionMarkdown: itemGuide.descriptionMarkdown ?? "",
      driveFolderUrl: createItemGuideMeta(appliesToGuideIds),
      estimatedReadMin: itemGuide.estimatedReadMin ?? 5,
      guideType: itemGuide.guideType ?? "admin_template",
      isVisibleToUnapprovedUsers: itemGuide.isVisibleToUnapprovedUsers ?? false,
      items: normalizeImportedGuideItems(itemGuide.items),
      slug: itemGuide.slug,
      status: itemGuide.status ?? "published",
      summary: itemGuide.summary ?? "",
      title: itemGuide.title,
      universityName: itemGuide.universityName,
    });
    guideIdBySlug.set(upserted.slug, upserted.id);
    itemGuideIdByKey.set(itemGuide.key, upserted.id);
  }

  for (const template of blueprint.materialTemplates) {
    const appliesToGuideIds = resolveGuideIdsFromSlugs(
      template.appliesToGuideSlugs,
      guideIdBySlug,
      mainGuide.id,
    );
    const resolvedGuideId = template.guideKey ? itemGuideIdByKey.get(template.guideKey) ?? null : null;
    const importedRows = template.rows.map((row) => ({
      actionType: row.actionType ?? "check_only",
      alternativeOptions: row.alternativeOptions ?? [],
      appliesToGuideIds: resolveGuideIdsFromSlugs(row.appliesToGuideSlugs, guideIdBySlug, mainGuide.id),
      country: row.country ?? "",
      docTabPrompt: row.docTabPrompt ?? "",
      docTabTitle: row.docTabTitle ?? "",
      guideId: row.guideKey ? itemGuideIdByKey.get(row.guideKey) ?? null : null,
      insertAfterTask: row.insertAfterTask ?? "",
      level: row.level,
      sourceDocumentId: row.sourceDocumentId ?? "",
      sourceTabId: row.sourceTabId ?? "",
      suggestedFilename: row.suggestedFilename ?? "",
      task: row.task ?? "",
      university: row.university ?? "",
    }));
    const importedStructure = normalizeMaterialStructureRows(importedRows);

    const existing =
      (template.targetTemplateTitle
        ? existingTemplates.find((item) => item.title === template.targetTemplateTitle)
        : null) ??
      existingTemplates.find(
        (item) => item.title === template.title && item.guideId === resolvedGuideId,
      );

    if (!existing && importedStructure.length === 0) {
      throw new Error(
        `Material template "${template.title}" has no rows and does not match an existing tile.`,
      );
    }

    const mergedStructure =
      template.mergeMode === "append" && existing
        ? mergeImportedRowsIntoExistingStructure(
            Array.isArray(existing.structure) ? (existing.structure as Array<Record<string, unknown>>) : [],
            importedRows,
          )
        : importedStructure;
    const mergedAppliesToGuideIds =
      template.mergeMode === "append" && existing
        ? Array.from(
            new Set([...(existing.appliesToGuideIds ?? []), ...appliesToGuideIds].filter((value) => Number.isFinite(value))),
          )
        : appliesToGuideIds;
    const mergedAlternativeOptions =
      template.mergeMode === "append" && existing
        ? Array.from(new Set([...(existing.alternativeOptions ?? []), ...(template.alternativeOptions ?? [])]))
        : (template.alternativeOptions ?? []);

    if (existing) {
      await db
        .update(platformMaterialTemplatesTable)
        .set({
          title: template.mergeMode === "append" ? existing.title : template.title,
          description:
            template.mergeMode === "append"
              ? [existing.description, template.description ?? ""].filter(Boolean).join("\n\n")
              : (template.description ?? ""),
          templateType: template.templateType ?? existing.templateType ?? "passport_like",
          guideId: template.mergeMode === "append" ? existing.guideId : resolvedGuideId,
          appliesToGuideIds: mergedAppliesToGuideIds,
          structure: mergedStructure,
          alternativeOptions: mergedAlternativeOptions,
          isActive: template.isActive ?? existing.isActive ?? true,
          updatedAt: new Date(),
        })
        .where(eq(platformMaterialTemplatesTable.id, existing.id));
      existingTemplates = await db.select().from(platformMaterialTemplatesTable);
      continue;
    }

    await db.insert(platformMaterialTemplatesTable).values({
      ownerUserId,
      title: template.title,
      description: template.description ?? "",
      templateType: template.templateType ?? "passport_like",
      guideId: resolvedGuideId,
      appliesToGuideIds: mergedAppliesToGuideIds,
      structure: mergedStructure,
      alternativeOptions: mergedAlternativeOptions,
      isActive: template.isActive ?? true,
    });
    existingTemplates = await db.select().from(platformMaterialTemplatesTable);
  }

  return {
    importedGuideSlug: mainGuide.slug,
    importedGuideTitle: mainGuide.title,
  };
}

function getGuideBlueprintAssistantSchema() {
  return {
    type: "object",
    required: ["version", "guide", "materialTemplates"],
    properties: {
      version: { const: 1 },
      guide: {
        type: "object",
        required: ["title", "slug", "country", "universityName"],
      },
      itemGuides: {
        type: "array",
      },
      materialTemplates: {
        type: "array",
        items: {
          type: "object",
          required: ["title", "rows"],
          properties: {
            title: { type: "string" },
            targetTemplateTitle: {
              type: "string",
              description:
                "Optional. If set, import will target an existing tile with this exact title instead of creating a new one.",
            },
            mergeMode: {
              type: "string",
              enum: ["replace", "append"],
              description:
                "append = add rows into existing tile; replace = overwrite matched tile/import target.",
            },
            rows: {
              type: "array",
              description:
                "May be empty only when attaching an existing tile to a guide via targetTemplateTitle + appliesToGuideSlugs.",
              items: {
                type: "object",
                properties: {
                  level: {
                    type: "string",
                    enum: ["country", "university", "item"],
                  },
                  country: { type: "string" },
                  university: { type: "string" },
                  task: { type: "string" },
                  insertAfterTask: { type: "string" },
                  actionType: {
                    type: "string",
                    enum: ["check_only", "file_required", "file_or_doc", "check_or_file"],
                  },
                  suggestedFilename: { type: "string" },
                  docTabTitle: { type: "string" },
                  docTabPrompt: { type: "string" },
                  sourceDocumentId: { type: "string" },
                  sourceTabId: { type: "string" },
                  guideKey: { type: "string" },
                  alternativeOptions: {
                    type: "array",
                    items: { type: "string" },
                  },
                  appliesToGuideSlugs: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

function findMaterialTemplateRow(template: { structure?: unknown }, rowKey: string) {
  const normalizedRows = normalizeMaterialStructureRows(template.structure);
  return normalizedRows.find((row) => row.displayKey === rowKey) ?? null;
}

const PLATFORM_ADMIN_MASTER_TEMPLATE_DOC_NAME = "ACADEA Admin Essay Templates";

async function ensureAdminMasterTemplateDocument() {
  if (!hasGoogleWorkspaceServiceAccount()) {
    throw new Error("Google Workspace service account is not configured.");
  }

  const sharedDriveId = getGoogleSharedDriveId();
  const [existing] = await findDriveDocuments({
    mimeType: "application/vnd.google-apps.document",
    name: PLATFORM_ADMIN_MASTER_TEMPLATE_DOC_NAME,
    parentId: sharedDriveId,
  });

  if (existing) {
    return {
      documentId: existing.id,
      title: existing.name,
      url: existing.url,
    };
  }

  const created = await createGoogleDocument({
    name: PLATFORM_ADMIN_MASTER_TEMPLATE_DOC_NAME,
    parentId: sharedDriveId,
  });

  return {
    documentId: created.id,
    title: PLATFORM_ADMIN_MASTER_TEMPLATE_DOC_NAME,
    url: created.url,
  };
}

async function ensureMentorDriveFolder(db: any, mentorUserId: number) {
  const [mentor] = await db
    .select({
      email: platformUsersTable.email,
      fullName: platformUsersTable.fullName,
      id: platformUsersTable.id,
      profileId: mentorProfilesTable.id,
      googleDriveFolderId: mentorProfilesTable.googleDriveFolderId,
      googleDriveFolderUrl: mentorProfilesTable.googleDriveFolderUrl,
    })
    .from(platformUsersTable)
    .leftJoin(mentorProfilesTable, eq(mentorProfilesTable.userId, platformUsersTable.id))
    .where(eq(platformUsersTable.id, mentorUserId))
    .limit(1);

  if (!mentor) {
    throw new Error("Mentor not found.");
  }

  const existingFolderId =
    mentor.googleDriveFolderId || parseGoogleDriveId(mentor.googleDriveFolderUrl);
  if (existingFolderId && mentor.googleDriveFolderUrl) {
    return {
      folderId: existingFolderId,
      folderUrl: mentor.googleDriveFolderUrl,
    };
  }

  if (!hasGoogleWorkspaceServiceAccount()) {
    throw new Error("Google Workspace service account is not configured.");
  }

  const sharedDriveId = getGoogleSharedDriveId();
  const folder = await createDriveFolder({
    name: `Mentor - ${buildUserWorkspaceSlug(mentor)}`,
    parentId: sharedDriveId,
  });
  await shareDriveItemWithUser({
    fileId: folder.id,
    emailAddress: mentor.email,
    role: "writer",
  });

  await db
    .insert(mentorProfilesTable)
    .values({
      userId: mentorUserId,
      bio: "",
      googleDriveFolderId: folder.id,
      googleDriveFolderUrl: folder.url,
    })
    .onConflictDoUpdate({
      target: mentorProfilesTable.userId,
      set: {
        googleDriveFolderId: folder.id,
        googleDriveFolderUrl: folder.url,
        updatedAt: new Date(),
      },
    });

  void sendPlatformDriveShareEmail({
    email: mentor.email,
    folderUrl: folder.url,
    fullName: mentor.fullName,
    roleLabel: "mentor",
  }).catch(() => undefined);

  return {
    folderId: folder.id,
    folderUrl: folder.url,
  };
}

async function ensureMenteeWorkspace(db: any, menteeUserId: number) {
  const [mentee] = await db
    .select({
      email: platformUsersTable.email,
      fullName: platformUsersTable.fullName,
      id: platformUsersTable.id,
      googleDriveFolderId: menteeProfilesTable.googleDriveFolderId,
      googleDriveFolderUrl: menteeProfilesTable.googleDriveFolderUrl,
      googleEssayDocId: menteeProfilesTable.googleEssayDocId,
      googleEssayDocUrl: menteeProfilesTable.googleEssayDocUrl,
    })
    .from(platformUsersTable)
    .leftJoin(menteeProfilesTable, eq(menteeProfilesTable.userId, platformUsersTable.id))
    .where(eq(platformUsersTable.id, menteeUserId))
    .limit(1);

  if (!mentee) {
    throw new Error("Mentee not found.");
  }

  if (
    mentee.googleDriveFolderId &&
    mentee.googleDriveFolderUrl &&
    mentee.googleEssayDocId &&
    mentee.googleEssayDocUrl
  ) {
    return {
      folderId: mentee.googleDriveFolderId,
      folderUrl: mentee.googleDriveFolderUrl,
      essayDocId: mentee.googleEssayDocId,
      essayDocUrl: mentee.googleEssayDocUrl,
    };
  }

  if (!hasGoogleWorkspaceServiceAccount()) {
    return {
      folderId: mentee.googleDriveFolderId ?? "",
      folderUrl: mentee.googleDriveFolderUrl ?? "",
      essayDocId: mentee.googleEssayDocId ?? "",
      essayDocUrl: mentee.googleEssayDocUrl ?? "",
    };
  }

  const sharedDriveId = getGoogleSharedDriveId();
  const createdFolder = !(mentee.googleDriveFolderId && mentee.googleDriveFolderUrl);
  const folder =
    mentee.googleDriveFolderId && mentee.googleDriveFolderUrl
      ? {
          id: mentee.googleDriveFolderId,
          url: mentee.googleDriveFolderUrl,
        }
      : await createDriveFolder({
          name: `Mentee - ${buildUserWorkspaceSlug(mentee)}`,
          parentId: sharedDriveId,
        });
  await shareDriveItemWithUser({
    fileId: folder.id,
    emailAddress: mentee.email,
    role: "writer",
  });
  const essayDoc =
    mentee.googleEssayDocId && mentee.googleEssayDocUrl
      ? {
          id: mentee.googleEssayDocId,
          url: mentee.googleEssayDocUrl,
        }
      : await createGoogleDocument({
          name: "Essay doc",
          parentId: folder.id,
        });

  await db
    .insert(menteeProfilesTable)
    .values({
      userId: menteeUserId,
      adminApproved: false,
      googleDriveFolderId: folder.id,
      googleDriveFolderUrl: folder.url,
      googleEssayDocId: essayDoc.id,
      googleEssayDocUrl: essayDoc.url,
    })
    .onConflictDoUpdate({
      target: menteeProfilesTable.userId,
      set: {
        googleDriveFolderId: folder.id,
        googleDriveFolderUrl: folder.url,
        googleEssayDocId: essayDoc.id,
        googleEssayDocUrl: essayDoc.url,
        updatedAt: new Date(),
      },
    });

  if (createdFolder) {
    void sendPlatformDriveShareEmail({
      email: mentee.email,
      folderUrl: folder.url,
      fullName: mentee.fullName,
      roleLabel: "mentee",
    }).catch(() => undefined);
  }

  return {
    folderId: folder.id,
    folderUrl: folder.url,
    essayDocId: essayDoc.id,
    essayDocUrl: essayDoc.url,
  };
}

async function ensureMentorAccessToMenteeWorkspace(
  db: any,
  input: { menteeUserId: number; mentorUserId: number },
) {
  if (!hasGoogleWorkspaceServiceAccount()) {
    return null;
  }

  const workspace = await ensureMenteeWorkspace(db, input.menteeUserId);
  const mentorFolder = await ensureMentorDriveFolder(db, input.mentorUserId);
  const [mentor] = await db
    .select({
      email: platformUsersTable.email,
      fullName: platformUsersTable.fullName,
    })
    .from(platformUsersTable)
    .where(eq(platformUsersTable.id, input.mentorUserId))
    .limit(1);

  if (!mentor) {
    throw new Error("Mentor not found.");
  }

  await shareDriveItemWithUser({
    fileId: workspace.folderId,
    emailAddress: mentor.email,
    role: "writer",
  });

  const [existingLink] = await db
    .select()
    .from(platformMentorWorkspaceLinksTable)
    .where(
      and(
        eq(platformMentorWorkspaceLinksTable.menteeUserId, input.menteeUserId),
        eq(platformMentorWorkspaceLinksTable.mentorUserId, input.mentorUserId),
      ),
    )
    .limit(1);

  if (existingLink?.shortcutFileId) {
    return existingLink;
  }

  const shortcut = await createDriveShortcut({
    name: `Mentee - ${workspace.folderId}`,
    parentId: mentorFolder.folderId,
    targetId: workspace.folderId,
  });

  void sendPlatformDriveShareEmail({
    email: mentor.email,
    folderUrl: workspace.folderUrl,
    fullName: mentor.fullName,
    roleLabel: "mentor",
  }).catch(() => undefined);

  const [link] = await db
    .insert(platformMentorWorkspaceLinksTable)
    .values({
      menteeUserId: input.menteeUserId,
      mentorUserId: input.mentorUserId,
      shortcutFileId: shortcut.id,
      shortcutFileUrl: shortcut.url,
    })
    .onConflictDoUpdate({
      target: [
        platformMentorWorkspaceLinksTable.menteeUserId,
        platformMentorWorkspaceLinksTable.mentorUserId,
      ] as never,
      set: {
        shortcutFileId: shortcut.id,
        shortcutFileUrl: shortcut.url,
        updatedAt: new Date(),
      },
    })
    .returning();

  return link;
}

async function safeEnsureMenteeWorkspace(db: any, menteeUserId: number) {
  try {
    return await ensureMenteeWorkspace(db, menteeUserId);
  } catch (err) {
    logger.warn({ err, menteeUserId }, "failed to ensure mentee google workspace");
    return null;
  }
}

async function safeEnsureMentorAccessToMenteeWorkspace(
  db: any,
  input: { menteeUserId: number; mentorUserId: number },
) {
  try {
    return await ensureMentorAccessToMenteeWorkspace(db, input);
  } catch (err) {
    logger.warn({ err, ...input }, "failed to ensure mentor access to mentee workspace");
    return null;
  }
}

async function upsertMaterialItemState(
  db: any,
  input: {
    templateId: number;
    menteeUserId: number;
    rowKey: string;
    values: Record<string, unknown>;
  },
) {
  const [state] = await db
    .insert(platformMaterialItemStatesTable)
    .values({
      templateId: input.templateId,
      menteeUserId: input.menteeUserId,
      rowKey: input.rowKey,
      ...input.values,
    })
    .onConflictDoUpdate({
      target: [
        platformMaterialItemStatesTable.templateId,
        platformMaterialItemStatesTable.menteeUserId,
        platformMaterialItemStatesTable.rowKey,
      ] as never,
      set: {
        ...input.values,
        updatedAt: new Date(),
      },
    })
    .returning();
  return state;
}

async function getAccessibleTemplateIdsForMentee(db: any, menteeUserId: number) {
  const guides = await db
    .select({
      id: platformGuidesTable.id,
      sourceGuideId: platformGuidesTable.sourceGuideId,
    })
    .from(platformGuidesTable)
    .where(
      and(
        eq(platformGuidesTable.menteeUserId, menteeUserId),
        eq(platformGuidesTable.status, "published"),
      ),
    );
  const assignedGuideAccess = await db
    .select({ guideId: platformGuideAssignmentsTable.guideId })
    .from(platformGuideAssignmentsTable)
    .where(eq(platformGuideAssignmentsTable.menteeUserId, menteeUserId));

  return Array.from(
    new Set([
      ...assignedGuideAccess.map((row: { guideId: number }) => row.guideId),
      ...guides
        .map((guide: { id: number; sourceGuideId: number | null }) => guide.sourceGuideId ?? guide.id)
        .filter((value: number | null): value is number => Number.isFinite(value)),
    ]),
  );
}

async function menteeCanAccessMaterialRow(
  db: any,
  input: {
    menteeUserId: number;
    template: { appliesToGuideIds?: number[] | null; structure?: unknown };
    rowKey: string;
  },
) {
  const accessibleTemplateIds = await getAccessibleTemplateIdsForMentee(db, input.menteeUserId);
  const templateApplies = input.template.appliesToGuideIds ?? [];
  if (templateApplies.length && !templateApplies.some((guideId: number) => accessibleTemplateIds.includes(guideId))) {
    return false;
  }
  const row = findMaterialTemplateRow(input.template, input.rowKey);
  if (!row) {
    return false;
  }
  const rowApplies = Array.isArray(row.appliesToGuideIds) ? row.appliesToGuideIds : [];
  if (rowApplies.length && !rowApplies.some((guideId: number) => accessibleTemplateIds.includes(guideId))) {
    return false;
  }
  return true;
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

  return guides.map((guide) => {
    const metadata = parseGuideMeta(guide.driveFolderUrl);
    const appliesToGuideIds = Array.isArray((metadata as any).appliesToGuideIds)
      ? (metadata as any).appliesToGuideIds.filter((value: unknown): value is number => typeof value === "number")
      : [];

    return {
      ...guide,
      isItemGuide: isItemGuideRecord(guide),
      itemGuideAppliesToGuideIds: appliesToGuideIds,
      items: itemMap.get(guide.id) ?? [],
      createdAt: guide.createdAt.toISOString(),
      updatedAt: guide.updatedAt.toISOString(),
    };
  });
}

async function collectGuideCascadeIds(
  db: Awaited<typeof import("@workspace/db")>["db"],
  rootGuideIds: number[],
) {
  const seen = new Set(rootGuideIds.filter((value) => Number.isFinite(value)));
  let frontier = [...seen];

  while (frontier.length) {
    const rows = await db
      .select({ id: platformGuidesTable.id })
      .from(platformGuidesTable)
      .where(inArray(platformGuidesTable.sourceGuideId, frontier));

    const nextFrontier: number[] = [];
    for (const row of rows) {
      if (!seen.has(row.id)) {
        seen.add(row.id);
        nextFrontier.push(row.id);
      }
    }
    frontier = nextFrontier;
  }

  return [...seen];
}

function sanitizeMaterialTemplateStructure(
  structure: Array<Record<string, unknown>>,
  removedGuideIds: Set<number>,
) {
  let changed = false;
  const nextStructure = structure.map((row) => {
    const nextRow: Record<string, unknown> = { ...row };

    if (Array.isArray(nextRow.appliesToGuideIds)) {
      const filteredIds = nextRow.appliesToGuideIds.filter(
        (value): value is number => typeof value === "number" && !removedGuideIds.has(value),
      );
      if (filteredIds.length !== nextRow.appliesToGuideIds.length) {
        nextRow.appliesToGuideIds = filteredIds;
        changed = true;
      }
    }

    if (typeof nextRow.guideId === "number" && removedGuideIds.has(nextRow.guideId)) {
      nextRow.guideId = null;
      changed = true;
    }

    return nextRow;
  });

  return { changed, structure: nextStructure };
}

async function removeGuideReferencesFromMaterialTemplates(
  db: Awaited<typeof import("@workspace/db")>["db"],
  removedGuideIds: number[],
) {
  if (!removedGuideIds.length) {
    return;
  }

  const removedGuideIdSet = new Set(removedGuideIds);
  const templates = await db.select().from(platformMaterialTemplatesTable);

  for (const template of templates) {
    const nextAppliesToGuideIds = (template.appliesToGuideIds ?? []).filter(
      (guideId: number) => !removedGuideIdSet.has(guideId),
    );
    const { changed: structureChanged, structure: nextStructure } = sanitizeMaterialTemplateStructure(
      (template.structure ?? []) as Array<Record<string, unknown>>,
      removedGuideIdSet,
    );
    const nextGuideId =
      template.guideId && removedGuideIdSet.has(template.guideId) ? null : template.guideId;

    const changed =
      nextGuideId !== template.guideId ||
      nextAppliesToGuideIds.length !== (template.appliesToGuideIds ?? []).length ||
      structureChanged;

    if (!changed) {
      continue;
    }

    await db
      .update(platformMaterialTemplatesTable)
      .set({
        guideId: nextGuideId,
        appliesToGuideIds: nextAppliesToGuideIds,
        structure: nextStructure,
        updatedAt: new Date(),
      })
      .where(eq(platformMaterialTemplatesTable.id, template.id));
  }
}

async function sanitizeMaterialTemplateUniversityLinks(
  db: Awaited<typeof import("@workspace/db")>["db"],
) {
  const [templates, guides] = await Promise.all([
    db.select().from(platformMaterialTemplatesTable),
    db.select({
      driveFolderUrl: platformGuidesTable.driveFolderUrl,
      guideType: platformGuidesTable.guideType,
      id: platformGuidesTable.id,
      sourceGuideId: platformGuidesTable.sourceGuideId,
    }).from(platformGuidesTable),
  ]);

  const validUniversityGuideIds = new Set(
    guides
      .filter((guide) => !guide.sourceGuideId && !isItemGuideRecord(guide))
      .map((guide) => guide.id),
  );

  for (const template of templates) {
    let changed = false;
    const nextAppliesToGuideIds = (template.appliesToGuideIds ?? []).filter((guideId: number) => {
      const keep = validUniversityGuideIds.has(guideId);
      if (!keep) {
        changed = true;
      }
      return keep;
    });

    const nextStructure = (template.structure ?? []).map((row: Record<string, unknown>) => {
      if (!Array.isArray(row.appliesToGuideIds)) {
        return row;
      }
      const filteredIds = row.appliesToGuideIds.filter(
        (value): value is number => typeof value === "number" && validUniversityGuideIds.has(value),
      );
      if (filteredIds.length !== row.appliesToGuideIds.length) {
        changed = true;
        return {
          ...row,
          appliesToGuideIds: filteredIds,
        };
      }
      return row;
    });

    if (!changed) {
      continue;
    }

    await db
      .update(platformMaterialTemplatesTable)
      .set({
        appliesToGuideIds: nextAppliesToGuideIds,
        structure: nextStructure,
        updatedAt: new Date(),
      })
      .where(eq(platformMaterialTemplatesTable.id, template.id));
  }
}

async function hardDeleteGuidesAndReferences(
  db: Awaited<typeof import("@workspace/db")>["db"],
  rootGuideIds: number[],
) {
  const guideIds = await collectGuideCascadeIds(db, rootGuideIds);
  if (!guideIds.length) {
    return [];
  }

  await removeGuideReferencesFromMaterialTemplates(db, guideIds);
  await db.delete(platformGuidesTable).where(inArray(platformGuidesTable.id, guideIds));
  return guideIds;
}

function meetingWindowIsValid(startsAt: Date, endsAt: Date) {
  return startsAt.getTime() + 1000 * 60 * 15 <= endsAt.getTime();
}

const MENTOR_MEETING_DURATION_MINUTES = 30;
const DEFAULT_MENTOR_BOOKING_WINDOW_DAYS = 30;
const DEFAULT_MENTOR_MINIMUM_NOTICE_HOURS = 24;
const MENTOR_SLOT_LIMIT = 400;

type BusyWindow = {
  start: string;
  end: string;
};

type AvailabilityRule = {
  endTime: string;
  isActive: boolean;
  startTime: string;
  weekday: number;
};

type AvailabilityOverride = {
  date: string;
  isBlocked?: boolean;
  ranges?: Array<{
    endTime: string;
    isActive?: boolean;
    startTime: string;
  }>;
};

type MentorGoogleConnectionRecord = {
  externalEmail: string | null;
  metadata: Record<string, unknown>;
  scopes: string[];
  status: string;
};

function parseClockValue(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2]),
  };
}

function getZonedDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function zonedDateTimeToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  timeZone: string;
}) {
  const second = input.second ?? 0;
  let utcMs = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    second,
  );

  for (let index = 0; index < 4; index += 1) {
    const actual = getZonedDateParts(new Date(utcMs), input.timeZone);
    const desiredAsUtc = Date.UTC(
      input.year,
      input.month - 1,
      input.day,
      input.hour,
      input.minute,
      second,
    );
    const actualAsUtc = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
      actual.second,
    );
    const diff = desiredAsUtc - actualAsUtc;
    if (diff === 0) {
      break;
    }
    utcMs += diff;
  }

  return new Date(utcMs);
}

function toLocalDateKey(
  input: { year: number; month: number; day: number } | Date,
  timeZone?: string,
) {
  if (input instanceof Date) {
    const parts = getZonedDateParts(input, timeZone ?? "UTC");
    return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
  }

  return `${String(input.year).padStart(4, "0")}-${String(input.month).padStart(2, "0")}-${String(input.day).padStart(2, "0")}`;
}

function parseMonthKey(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearRaw, monthRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

function normalizeAvailabilityOverrides(
  overrides: unknown,
): AvailabilityOverride[] {
  const parsed = z.array(availabilityOverrideSchema).safeParse(overrides);
  if (!parsed.success) {
    return [];
  }

  return parsed.data
    .map((entry) => ({
      date: entry.date,
      isBlocked: Boolean(entry.isBlocked),
      ranges: (entry.ranges ?? []).filter((range) => {
        const startClock = parseClockValue(range.startTime);
        const endClock = parseClockValue(range.endTime);
        if (!startClock || !endClock) {
          return false;
        }
        return (
          startClock.hour * 60 + startClock.minute <
          endClock.hour * 60 + endClock.minute
        );
      }),
    }))
    .sort((left, right) => left.date.localeCompare(right.date));
}

function buildMentorSlotsFromRules(input: {
  availabilityOverrides?: AvailabilityOverride[];
  availabilityRules: AvailabilityRule[];
  busy: BusyWindow[];
  bookingWindowDays?: number;
  minimumNoticeHours?: number;
  month?: { month: number; year: number } | null;
  now?: Date;
  timeZone: string;
}) {
  const now = input.now ?? new Date();
  const busy = input.busy.map((entry) => ({
    start: new Date(entry.start),
    end: new Date(entry.end),
  }));
  const minimumNoticeHours = input.minimumNoticeHours ?? DEFAULT_MENTOR_MINIMUM_NOTICE_HOURS;
  const bookingWindowDays = input.bookingWindowDays ?? DEFAULT_MENTOR_BOOKING_WINDOW_DAYS;
  const currentLocal = getZonedDateParts(now, input.timeZone);
  const localStartDate = new Date(
    Date.UTC(currentLocal.year, currentLocal.month - 1, currentLocal.day),
  );
  const bookingWindowEnd = new Date(
    localStartDate.getTime() + bookingWindowDays * 24 * 60 * 60 * 1000,
  );
  const overrideMap = new Map(
    normalizeAvailabilityOverrides(input.availabilityOverrides).map((entry) => [
      entry.date,
      entry,
    ]),
  );
  const slots: Array<{ end: string; label: string; start: string }> = [];

  let rangeStart = localStartDate;
  let rangeEnd = bookingWindowEnd;
  if (input.month) {
    rangeStart = new Date(Date.UTC(input.month.year, input.month.month - 1, 1));
    rangeEnd = new Date(Date.UTC(input.month.year, input.month.month, 1));
  }

  const startMs = Math.max(rangeStart.getTime(), localStartDate.getTime());
  const endMs = Math.min(rangeEnd.getTime(), bookingWindowEnd.getTime());
  if (endMs <= startMs) {
    return [];
  }

  for (
    let currentMs = startMs;
    currentMs < endMs && slots.length < MENTOR_SLOT_LIMIT;
    currentMs += 24 * 60 * 60 * 1000
  ) {
    const localDate = new Date(currentMs);
    const year = localDate.getUTCFullYear();
    const month = localDate.getUTCMonth() + 1;
    const day = localDate.getUTCDate();
    const weekday = localDate.getUTCDay();
    const dateKey = toLocalDateKey({ year, month, day });
    const override = overrideMap.get(dateKey);

    let matchingRules: Array<{
      endTime: string;
      isActive: boolean;
      startTime: string;
    }> = [];

    if (override) {
      if (override.isBlocked) {
        continue;
      }
      matchingRules = (override.ranges ?? [])
        .filter((range) => range.isActive !== false)
        .map((range) => ({
          ...range,
          isActive: true,
        }));
    } else {
      matchingRules = input.availabilityRules.filter(
        (rule) => rule.isActive && rule.weekday === weekday,
      );
    }

    for (const rule of matchingRules) {
      const startClock = parseClockValue(rule.startTime);
      const endClock = parseClockValue(rule.endTime);
      if (!startClock || !endClock) {
        continue;
      }

      let cursorMinutes = startClock.hour * 60 + startClock.minute;
      const endMinutes = endClock.hour * 60 + endClock.minute;

      while (
        cursorMinutes + MENTOR_MEETING_DURATION_MINUTES <= endMinutes &&
        slots.length < MENTOR_SLOT_LIMIT
      ) {
        const start = zonedDateTimeToUtc({
          year,
          month,
          day,
          hour: Math.floor(cursorMinutes / 60),
          minute: cursorMinutes % 60,
          timeZone: input.timeZone,
        });
        const end = new Date(
          start.getTime() + MENTOR_MEETING_DURATION_MINUTES * 60 * 1000,
        );

        if (!meetingOutsideLeadWindow(start, minimumNoticeHours, now)) {
          cursorMinutes += MENTOR_MEETING_DURATION_MINUTES;
          continue;
        }

        const overlaps = busy.some(
          (entry) => start < entry.end && end > entry.start,
        );
        if (!overlaps) {
          slots.push({
            start: start.toISOString(),
            end: end.toISOString(),
            label: start.toLocaleTimeString("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: input.timeZone,
            }),
          });
        }

        cursorMinutes += MENTOR_MEETING_DURATION_MINUTES;
      }
    }
  }

  return slots.sort((left, right) => left.start.localeCompare(right.start));
}

function meetingOutsideLeadWindow(
  startsAt: Date,
  minimumNoticeHours: number,
  now = new Date(),
) {
  return startsAt.getTime() - now.getTime() >= 1000 * 60 * 60 * minimumNoticeHours;
}

async function getMentorCalendarConnection(
  db: Awaited<typeof import("@workspace/db")>["db"],
  mentorUserId: number,
) {
  const [connection] = await db
    .select({
      externalEmail: platformGoogleConnectionsTable.externalEmail,
      metadata: platformGoogleConnectionsTable.metadata,
      scopes: platformGoogleConnectionsTable.scopes,
      status: platformGoogleConnectionsTable.status,
    })
    .from(platformGoogleConnectionsTable)
    .where(
      and(
        eq(platformGoogleConnectionsTable.userId, mentorUserId),
        eq(platformGoogleConnectionsTable.connectionType, "calendar"),
      ),
    )
    .limit(1);

  return (connection ?? null) as MentorGoogleConnectionRecord | null;
}

async function getMentorCalendarAccessToken(
  db: any,
  connection: MentorGoogleConnectionRecord | null,
  mentorUserId?: number,
) {
  const metadata = getPlatformGoogleConnectionMetadata(connection?.metadata);
  if (!connection || connection.status !== "connected" || !metadata.refreshToken) {
    return null;
  }

  const accessToken = await getGoogleAccessTokenForRefreshToken(
    metadata.refreshToken,
  );
  const externalEmail =
    connection.externalEmail ||
    metadata.externalEmail ||
    (await getGooglePrimaryCalendarIdForAccessToken(accessToken));

  if (
    externalEmail &&
    mentorUserId &&
    (connection.externalEmail !== externalEmail ||
      metadata.externalEmail !== externalEmail)
  ) {
    await db
      .update(platformGoogleConnectionsTable)
      .set({
        externalEmail,
        metadata: {
          ...metadata,
          externalEmail,
        },
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(platformGoogleConnectionsTable.userId, mentorUserId),
          eq(platformGoogleConnectionsTable.connectionType, "calendar"),
        ),
      );

    await db
      .insert(mentorProfilesTable)
      .values({
        userId: mentorUserId,
        googleCalendarEmail: externalEmail,
      })
      .onConflictDoUpdate({
        target: mentorProfilesTable.userId,
        set: {
          googleCalendarEmail: externalEmail,
          updatedAt: new Date(),
        },
      });
  }

  return {
    accessToken,
    externalEmail,
    refreshToken: metadata.refreshToken,
    scopes: connection.scopes ?? [],
  };
}

async function cancelMentorCalendarEvent(input: {
  accessToken: string;
  calendarId: string;
  eventId: string;
}) {
  const response = await googleApiRequestWithAccessToken(
    input.accessToken,
    `/calendar/v3/calendars/${encodeURIComponent(
      input.calendarId,
    )}/events/${encodeURIComponent(input.eventId)}?sendUpdates=all`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok && response.status !== 404) {
    const body = await response.text();
    throw new Error(
      `Failed to cancel mentor calendar event with status ${response.status}: ${body.slice(
        0,
        300,
      )}`,
    );
  }
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
      notes: `Regulamin Platformy zaakceptowany przy rejestracji: ${new Date().toISOString()} (wersja ${PLATFORM_TERMS_VERSION}).`,
    })
    .returning();

  await db.insert(menteeProfilesTable).values({
    userId: user.id,
    adminApproved: false,
  });
  await safeEnsureMenteeWorkspace(db, user.id);

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
  const connections = mentorIds.length
    ? await db
        .select({
          externalEmail: platformGoogleConnectionsTable.externalEmail,
          status: platformGoogleConnectionsTable.status,
          userId: platformGoogleConnectionsTable.userId,
        })
        .from(platformGoogleConnectionsTable)
        .where(
          and(
            inArray(platformGoogleConnectionsTable.userId, mentorIds),
            eq(platformGoogleConnectionsTable.connectionType, "calendar"),
          ),
        )
    : [];
  const universities = mentorIds.length
    ? await db
        .select()
        .from(mentorUniversitiesTable)
        .where(inArray(mentorUniversitiesTable.mentorUserId, mentorIds))
        .orderBy(asc(mentorUniversitiesTable.country), asc(mentorUniversitiesTable.universityName))
    : [];

  const grouped = new Map<number, typeof universities>();
  const connectionMap = new Map(
    connections.map((connection) => [connection.userId, connection]),
  );
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
      googleCalendarConnected:
        connectionMap.get(row.userId)?.status === "connected",
      googleCalendarEmail:
        connectionMap.get(row.userId)?.externalEmail ?? null,
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
  const visibleGuides = guides.filter((guide) => !isItemGuideRecord(guide));

  return res.json(
    visibleGuides.map((guide) => ({
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
  "/platform/admin/profile-fields",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (_req, res) => {
    const { db } = await import("@workspace/db");
    const fields = await db
      .select()
      .from(platformProfileFieldsTable)
      .orderBy(asc(platformProfileFieldsTable.sectionTitle), asc(platformProfileFieldsTable.sortOrder));
    return res.json(fields);
  },
);

router.post(
  "/platform/admin/profile-fields",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const parsed = profileFieldSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [field] = await db.insert(platformProfileFieldsTable).values({
      key: parsed.data.key,
      label: parsed.data.label,
      description: parsed.data.description,
      fieldType: parsed.data.fieldType,
      sectionTitle: parsed.data.sectionTitle,
      placeholder: parsed.data.placeholder || null,
      isRequired: parsed.data.isRequired,
      sortOrder: parsed.data.sortOrder,
    }).returning();
    return res.status(201).json(field);
  },
);

router.put(
  "/platform/admin/profile-fields/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    const parsed = profileFieldSchema.safeParse(req.body);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid field id." : parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [field] = await db.update(platformProfileFieldsTable).set({
      key: parsed.data.key,
      label: parsed.data.label,
      description: parsed.data.description,
      fieldType: parsed.data.fieldType,
      sectionTitle: parsed.data.sectionTitle,
      placeholder: parsed.data.placeholder || null,
      isRequired: parsed.data.isRequired,
      sortOrder: parsed.data.sortOrder,
      updatedAt: new Date(),
    }).where(eq(platformProfileFieldsTable.id, id)).returning();
    if (!field) {
      return res.status(404).json({ error: "Nie znaleziono pola." });
    }
    return res.json(field);
  },
);

router.delete(
  "/platform/admin/profile-fields/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid field id." });
    }
    const { db } = await import("@workspace/db");
    await db.delete(platformProfileFieldsTable).where(eq(platformProfileFieldsTable.id, id));
    return res.status(204).end();
  },
);

router.get(
  "/platform/admin/material-templates",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (_req, res) => {
    const { db } = await import("@workspace/db");
    await sanitizeMaterialTemplateUniversityLinks(db);
    const templates = await db
      .select()
      .from(platformMaterialTemplatesTable)
      .orderBy(asc(platformMaterialTemplatesTable.templateType), asc(platformMaterialTemplatesTable.title));
    return res.json(templates);
  },
);

router.post(
  "/platform/admin/material-templates",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = materialTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [template] = await db.insert(platformMaterialTemplatesTable).values({
      ownerUserId: req.platformUser!.id,
      title: parsed.data.title,
      description: parsed.data.description,
      templateType: parsed.data.templateType,
      guideId: parsed.data.guideId ?? null,
      appliesToGuideIds: parsed.data.appliesToGuideIds,
      structure: normalizeMaterialStructureRows(parsed.data.structure),
      alternativeOptions: parsed.data.alternativeOptions,
      isActive: parsed.data.isActive,
    }).returning();
    return res.status(201).json(template);
  },
);

router.post(
  "/platform/admin/import-guide-blueprint",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = guideImportBlueprintSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const result = await importGuideBlueprint(db, req.platformUser!.id, parsed.data);
    return res.status(201).json(result);
  },
);

router.get(
  "/platform/admin/google-doc-master",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (_req, res) => {
    const masterDoc = await ensureAdminMasterTemplateDocument();
    const tabs = await listDocumentTabs(masterDoc.documentId);
    return res.json({
      ...masterDoc,
      tabs,
    });
  },
);

router.post(
  "/platform/admin/google-doc-master/tabs",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const parsed = adminMasterDocCreateTabSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }

    const masterDoc = await ensureAdminMasterTemplateDocument();
    const tab = await createDocumentTab({
      documentId: masterDoc.documentId,
      initialText: parsed.data.initialText,
      title: parsed.data.title,
    });
    const tabs = await listDocumentTabs(masterDoc.documentId);
    return res.status(201).json({
      documentId: masterDoc.documentId,
      tab,
      tabs,
      title: masterDoc.title,
      url: masterDoc.url,
    });
  },
);

router.get(
  "/platform/admin/guide-blueprint-assistant",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (_req, res) => {
    const { db } = await import("@workspace/db");
    const guides = await db.select().from(platformGuidesTable).orderBy(asc(platformGuidesTable.title));
    const templates = await db
      .select()
      .from(platformMaterialTemplatesTable)
      .orderBy(asc(platformMaterialTemplatesTable.title));
    const masterDoc = hasGoogleWorkspaceServiceAccount()
      ? await ensureAdminMasterTemplateDocument().catch(() => null)
      : null;

    const context = {
      adminMasterTemplateDoc: masterDoc,
      existingTiles: templates.map((template) => ({
        guideId: template.guideId,
        id: template.id,
        rows: normalizeMaterialStructureRows(template.structure).map((row) => ({
          actionType: row.actionType,
          displayKey: row.displayKey,
          level: row.level,
          task: row.task,
          university: row.university,
        })),
        templateType: template.templateType,
        title: template.title,
      })),
      guideTemplates: guides
        .filter((guide) => !guide.sourceGuideId && !isItemGuideRecord({ driveFolderUrl: guide.driveFolderUrl, guideType: guide.guideType }))
        .map((guide) => ({
          country: guide.country,
          guideType: guide.guideType,
          id: guide.id,
          slug: guide.slug,
          title: guide.title,
          universityName: guide.universityName,
        })),
      itemGuides: guides
        .filter((guide) => isItemGuideRecord({ driveFolderUrl: guide.driveFolderUrl, guideType: guide.guideType }))
        .map((guide) => ({
          id: guide.id,
          slug: guide.slug,
          title: guide.title,
        })),
      preferredShellTiles: templates
        .filter((template) => ["paszport", "eseje"].includes(template.title.trim().toLowerCase()))
        .map((template) => ({
          id: template.id,
          title: template.title,
        })),
    };

    const promptTemplate = [
      "Return only valid JSON for ACADEA guide import.",
      "Use the current DB context provided below.",
      "If the guide should extend an existing shell tile such as Paszport or Eseje, set materialTemplates[].targetTemplateTitle exactly to that title and set mergeMode to append.",
      "Only create a brand-new tile when there is a clear product reason not to use an existing shell tile.",
      "Use file_or_doc for tasks that may either be uploaded as a file or written inside Essay Doc.",
      "Use docTabTitle and docTabPrompt whenever actionType is file_or_doc.",
      "If a row should be inserted between existing rows in a tile, set rows[].insertAfterTask to the exact visible task label after which the new row should land.",
      "By default leave rows[].sourceDocumentId and rows[].sourceTabId empty and use plain docTabPrompt.",
      "Only set rows[].sourceDocumentId and rows[].sourceTabId when the admin explicitly wants to switch a row to use a master Google Docs template tab.",
      "Preserve current tile structure conventions and existing guide slugs where appropriate.",
      "",
      `Current context:\n${JSON.stringify(context, null, 2)}`,
    ].join("\n");

    return res.json({
      context,
      promptTemplate,
      schema: getGuideBlueprintAssistantSchema(),
    });
  },
);

router.put(
  "/platform/admin/material-templates/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    const parsed = materialTemplateSchema.safeParse(req.body);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid material template id." : parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [template] = await db.update(platformMaterialTemplatesTable).set({
      title: parsed.data.title,
      description: parsed.data.description,
      templateType: parsed.data.templateType,
      guideId: parsed.data.guideId ?? null,
      appliesToGuideIds: parsed.data.appliesToGuideIds,
      structure: normalizeMaterialStructureRows(parsed.data.structure),
      alternativeOptions: parsed.data.alternativeOptions,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    }).where(eq(platformMaterialTemplatesTable.id, id)).returning();
    if (!template) {
      return res.status(404).json({ error: "Nie znaleziono szablonu materiału." });
    }
    return res.json(template);
  },
);

router.delete(
  "/platform/admin/material-templates/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid material template id." });
    }
    const { db } = await import("@workspace/db");
    await db.delete(platformMaterialTemplatesTable).where(eq(platformMaterialTemplatesTable.id, id));
    return res.status(204).end();
  },
);

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
    const googleConnections = await db
      .select()
      .from(platformGoogleConnectionsTable)
      .where(eq(platformGoogleConnectionsTable.userId, req.platformUser!.id))
      .orderBy(asc(platformGoogleConnectionsTable.connectionType));

    return res.json({
      profile: serializeMentorProfile(profile),
      universities,
      availability,
      googleConnections: googleConnections.map((connection) => ({
        ...connection,
        createdAt: connection.createdAt.toISOString(),
        updatedAt: connection.updatedAt.toISOString(),
      })),
    });
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
    const [existingProfile] = await db
      .select()
      .from(mentorProfilesTable)
      .where(eq(mentorProfilesTable.userId, req.platformUser!.id))
      .limit(1);
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
        googleDriveFolderUrl: existingProfile?.googleDriveFolderUrl ?? null,
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
          googleDriveFolderUrl: existingProfile?.googleDriveFolderUrl ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return res.json(serializeMentorProfile(profile));
  },
);

router.patch(
  "/platform/admin/mentors/:id/profile",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    const parsed = adminMentorDriveSchema.safeParse(req.body);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid mentor id." : parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const googleDriveFolderId = parseGoogleDriveId(parsed.data.googleDriveFolderUrl || null);
    const [profile] = await db
      .insert(mentorProfilesTable)
      .values({
        userId: id,
        googleDriveFolderId,
        googleDriveFolderUrl: parsed.data.googleDriveFolderUrl || null,
      })
      .onConflictDoUpdate({
        target: mentorProfilesTable.userId,
        set: {
          googleDriveFolderId,
          googleDriveFolderUrl: parsed.data.googleDriveFolderUrl || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return res.json(serializeMentorProfile(profile));
  },
);

router.post(
  "/platform/admin/mentors/:id/google-drive-folder",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(422).json({ error: "Invalid mentor id." });
    }
    const { db } = await import("@workspace/db");
    try {
      const folder = await ensureMentorDriveFolder(db, id);
      return res.status(201).json(folder);
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Nie udało się utworzyć folderu mentora.",
      });
    }
  },
);

router.put(
  "/platform/mentor/availability",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = mentorAvailabilityPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    await db
      .delete(mentorAvailabilityRulesTable)
      .where(eq(mentorAvailabilityRulesTable.mentorUserId, req.platformUser!.id));

    if (parsed.data.rules.length) {
      await db.insert(mentorAvailabilityRulesTable).values(
        parsed.data.rules.map((rule) => ({
          mentorUserId: req.platformUser!.id,
          weekday: rule.weekday,
          startTime: rule.startTime,
          endTime: rule.endTime,
          isActive: rule.isActive,
        })),
      );
    }

    await db
      .insert(mentorProfilesTable)
      .values({
        userId: req.platformUser!.id,
        bookingWindowDays: parsed.data.bookingWindowDays,
        minimumNoticeHours: parsed.data.minimumNoticeHours,
        availabilityOverrides: normalizeAvailabilityOverrides(parsed.data.overrides),
      })
      .onConflictDoUpdate({
        target: mentorProfilesTable.userId,
        set: {
          bookingWindowDays: parsed.data.bookingWindowDays,
          minimumNoticeHours: parsed.data.minimumNoticeHours,
          availabilityOverrides: normalizeAvailabilityOverrides(parsed.data.overrides),
          updatedAt: new Date(),
        },
      });

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

router.get(
  "/platform/mentor/source-guides",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (_req, res) => {
    const { db } = await import("@workspace/db");
    const guides = await db
      .select()
      .from(platformGuidesTable)
      .where(eq(platformGuidesTable.guideType, "admin_template"))
      .orderBy(asc(platformGuidesTable.country), asc(platformGuidesTable.universityName));
    const shaped = await shapeGuideList(db, guides.filter((guide) => !isItemGuideRecord(guide)));
    const deduped = new Map<string, (typeof shaped)[number]>();
    for (const guide of shaped) {
      const key = `${normalizeSlug(guide.country)}::${normalizeSlug(guide.universityName)}`;
      if (!deduped.has(key)) {
        deduped.set(key, guide);
      }
    }
    return res.json(Array.from(deduped.values()));
  },
);

router.get(
  "/platform/mentor/material-templates",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const { db } = await import("@workspace/db");
    const mentorGuides = await db
      .select()
      .from(platformGuidesTable)
      .where(
        and(
          eq(platformGuidesTable.ownerUserId, req.platformUser!.id),
          eq(platformGuidesTable.guideType, "mentor_blueprint"),
        ),
      )
      .orderBy(desc(platformGuidesTable.updatedAt));
    const templates = await db
      .select()
      .from(platformMaterialTemplatesTable)
      .where(eq(platformMaterialTemplatesTable.isActive, true))
      .orderBy(asc(platformMaterialTemplatesTable.templateType), asc(platformMaterialTemplatesTable.title));
    const rawItemGuides = await db
      .select()
      .from(platformGuidesTable)
      .where(
        or(
          and(eq(platformGuidesTable.guideType, "admin_template")),
          and(
            eq(platformGuidesTable.guideType, "mentor_blueprint"),
            eq(platformGuidesTable.ownerUserId, req.platformUser!.id),
          ),
        ),
      )
      .orderBy(asc(platformGuidesTable.title));
    const itemGuides = rawItemGuides.filter((guide) => isItemGuideRecord(guide));

    return res.json({
      guides: await shapeGuideList(db, mentorGuides),
      itemGuides: await shapeGuideList(db, itemGuides),
      templates,
    });
  },
);

router.get(
  "/platform/mentor/item-guides",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const { db } = await import("@workspace/db");
    const rawItemGuides = await db
      .select()
      .from(platformGuidesTable)
      .where(
        or(
          eq(platformGuidesTable.guideType, "admin_template"),
          and(
            eq(platformGuidesTable.guideType, "mentor_blueprint"),
            eq(platformGuidesTable.ownerUserId, req.platformUser!.id),
          ),
        ),
      )
      .orderBy(asc(platformGuidesTable.title), asc(platformGuidesTable.country), asc(platformGuidesTable.universityName));

    const itemGuides = rawItemGuides.filter((guide) => isItemGuideRecord(guide));
    return res.json(await shapeGuideList(db, itemGuides));
  },
);

router.put(
  "/platform/mentor/material-templates/:id/rows",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = mentorMaterialRowsSchema.safeParse(req.body);
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid material template id." : parsed.error.message });
    }

    const { db } = await import("@workspace/db");
    const [template] = await db
      .select()
      .from(platformMaterialTemplatesTable)
      .where(eq(platformMaterialTemplatesTable.id, id))
      .limit(1);
    if (!template) {
      return res.status(404).json({ error: "Nie znaleziono kafla materiałów." });
    }

    const mentorGuides = await db
      .select({ id: platformGuidesTable.id })
      .from(platformGuidesTable)
      .where(
        and(
          eq(platformGuidesTable.ownerUserId, req.platformUser!.id),
          eq(platformGuidesTable.guideType, "mentor_blueprint"),
        ),
      );
    const mentorGuideIds = new Set(mentorGuides.map((guide) => guide.id));
    const rawAllowedHintGuides = await db
      .select({
        id: platformGuidesTable.id,
        driveFolderUrl: platformGuidesTable.driveFolderUrl,
      })
      .from(platformGuidesTable)
      .where(
        or(
          eq(platformGuidesTable.guideType, "admin_template"),
          and(
            eq(platformGuidesTable.guideType, "mentor_blueprint"),
            eq(platformGuidesTable.ownerUserId, req.platformUser!.id),
          ),
        ),
      );
    const allowedHintGuideIds = new Set(
      rawAllowedHintGuides
        .filter((guide) => isItemGuideRecord({ driveFolderUrl: guide.driveFolderUrl, guideType: "admin_template" }))
        .map((guide) => guide.id),
    );

    let sanitizedRows: Array<Record<string, unknown>>;
    try {
      sanitizedRows = parsed.data.rows.map((row) => {
        const appliesToGuideIds = Array.isArray(row.appliesToGuideIds)
          ? row.appliesToGuideIds.map((value) => Number(value)).filter((value) => Number.isFinite(value) && mentorGuideIds.has(value))
          : [];
        const guideId = row.guideId ? Number(row.guideId) : null;
        if (guideId && !allowedHintGuideIds.has(guideId)) {
          throw new Error("Mentor może podpinać tylko dostępne wskazówki elementów.");
        }
        return {
          actionType:
            row.actionType && PLATFORM_MATERIAL_ITEM_ACTIONS.includes(row.actionType as (typeof PLATFORM_MATERIAL_ITEM_ACTIONS)[number])
              ? row.actionType
              : "check_only",
          alternativeOptions: Array.isArray(row.alternativeOptions) ? row.alternativeOptions.filter((value) => typeof value === "string") : [],
          anchorAfterKey: typeof row.anchorAfterKey === "string" ? row.anchorAfterKey : "",
          appliesToGuideIds,
          country: typeof row.country === "string" ? row.country : "",
          docTabPrompt: typeof row.docTabPrompt === "string" ? row.docTabPrompt : "",
          docTabTitle: typeof row.docTabTitle === "string" ? row.docTabTitle : "",
          guideId,
          level: row.level === "country" || row.level === "university" || row.level === "item" ? row.level : "item",
          ownerUserId: req.platformUser!.id,
          sourceDocumentId: typeof row.sourceDocumentId === "string" ? row.sourceDocumentId : "",
          sourceTabId: typeof row.sourceTabId === "string" ? row.sourceTabId : "",
          suggestedFilename: typeof row.suggestedFilename === "string" ? row.suggestedFilename : "",
          task: typeof row.task === "string" ? row.task : "",
          university: typeof row.university === "string" ? row.university : "",
        };
      });
    } catch (error) {
      return res.status(422).json({ error: error instanceof Error ? error.message : "Nie udało się zapisać wierszy." });
    }

    const existingRows = Array.isArray(template.structure) ? template.structure : [];
    const preservedRows = existingRows.filter((row: any) => Number(row?.ownerUserId ?? 0) !== req.platformUser!.id);
    const preservedKeys = preservedRows.map((_: any, index: number) => `admin:${index}`);
    const mentorRowsByAnchor = new Map<string, Array<Record<string, unknown>>>();

    for (const row of sanitizedRows) {
      const anchorAfterKey =
        typeof row.anchorAfterKey === "string" && preservedKeys.includes(row.anchorAfterKey)
          ? row.anchorAfterKey
          : "";
      const current = mentorRowsByAnchor.get(anchorAfterKey) ?? [];
      current.push({
        ...row,
        anchorAfterKey,
      });
      mentorRowsByAnchor.set(anchorAfterKey, current);
    }

    const mergedRows: Array<Record<string, unknown>> = [];
    mergedRows.push(...(mentorRowsByAnchor.get("") ?? []));
    preservedRows.forEach((row: any, index: number) => {
      mergedRows.push(row);
      mergedRows.push(...(mentorRowsByAnchor.get(`admin:${index}`) ?? []));
    });

    const [updated] = await db
      .update(platformMaterialTemplatesTable)
      .set({
        structure: mergedRows,
        updatedAt: new Date(),
      })
      .where(eq(platformMaterialTemplatesTable.id, id))
      .returning();

    return res.json(updated);
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
    const [guide] = await db
      .select({ id: platformGuidesTable.id })
      .from(platformGuidesTable)
      .where(and(eq(platformGuidesTable.id, id), eq(platformGuidesTable.ownerUserId, req.platformUser!.id)))
      .limit(1);
    if (!guide) {
      return res.status(404).json({ error: "Nie znaleziono przewodnika." });
    }
    await hardDeleteGuidesAndReferences(db, [guide.id]);
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
    const [existingMeeting] = await db
      .select()
      .from(platformMeetingsTable)
      .where(
        and(
          eq(platformMeetingsTable.id, id),
          eq(platformMeetingsTable.mentorUserId, req.platformUser!.id),
        ),
      )
      .limit(1);

    if (!existingMeeting) {
      return res.status(404).json({ error: "Nie znaleziono spotkania." });
    }

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

    if (
      meeting?.status === "cancelled" &&
      existingMeeting.externalCalendarEventId
    ) {
      try {
        const connection = await getMentorCalendarConnection(
          db,
          req.platformUser!.id,
        );
        const mentorGoogle = await getMentorCalendarAccessToken(
          db,
          connection,
          meeting.mentorUserId,
        );
        if (mentorGoogle?.externalEmail) {
          await cancelMentorCalendarEvent({
            accessToken: mentorGoogle.accessToken,
            calendarId: mentorGoogle.externalEmail,
            eventId: existingMeeting.externalCalendarEventId,
          });
        }
      } catch (err) {
        logger.warn({ err, meetingId: id }, "mentor calendar cancellation sync failed");
      }
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

router.post(
  "/platform/mentor/google-connections/:type/start",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const connectionType =
      req.params.type === "calendar" || req.params.type === "drive"
        ? req.params.type
        : null;
    if (!connectionType) {
      return res.status(400).json({ error: "Nieobsługiwany typ połączenia Google." });
    }

    const { clientId } = getGoogleOAuthClientCredentials();
    const redirectUri =
      process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ||
      `${getRequestOrigin(req)}/api/google/auth/callback`;
    const state = createPlatformGoogleOAuthState({
      connectionType,
      userId: req.platformUser!.id,
    });
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
      scope: PLATFORM_MENTOR_GOOGLE_SCOPES.join(" "),
      state,
    });

    return res.json({
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    });
  },
);

router.delete(
  "/platform/mentor/google-connections/:type",
  requirePlatformAuth,
  requirePlatformRole("mentor"),
  async (req: AuthenticatedRequest, res) => {
    const connectionType =
      req.params.type === "calendar" || req.params.type === "drive"
        ? req.params.type
        : null;
    if (!connectionType) {
      return res.status(400).json({ error: "Nieobsługiwany typ połączenia Google." });
    }

    const { db } = await import("@workspace/db");
    await db
      .delete(platformGoogleConnectionsTable)
      .where(
        and(
          eq(platformGoogleConnectionsTable.userId, req.platformUser!.id),
          eq(platformGoogleConnectionsTable.connectionType, connectionType),
        ),
      );

    if (connectionType === "calendar") {
      await db
        .insert(mentorProfilesTable)
        .values({
          userId: req.platformUser!.id,
          googleCalendarEmail: null,
        })
        .onConflictDoUpdate({
          target: mentorProfilesTable.userId,
          set: {
            googleCalendarEmail: null,
            updatedAt: new Date(),
          },
        });
    }

    return res.status(204).end();
  },
);

router.get(
  "/platform/mentee/overview",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const { db } = await import("@workspace/db");
    let [profile] = await db
      .select()
      .from(menteeProfilesTable)
      .where(eq(menteeProfilesTable.userId, req.platformUser!.id))
      .limit(1);
    const ensuredWorkspace = await safeEnsureMenteeWorkspace(db, req.platformUser!.id);
    if (ensuredWorkspace) {
      [profile] = await db
        .select()
        .from(menteeProfilesTable)
        .where(eq(menteeProfilesTable.userId, req.platformUser!.id))
        .limit(1);
    }
    const guideLimits = getMenteeGuideLimits(profile);
    const assignedMentors = await db
      .select({
        assignmentId: platformMentorAssignmentsTable.id,
        mentorId: platformUsersTable.id,
        fullName: platformUsersTable.fullName,
        email: platformUsersTable.email,
        bookingWindowDays: mentorProfilesTable.bookingWindowDays,
        timezone: mentorProfilesTable.timezone,
        meetingMethod: mentorProfilesTable.meetingMethod,
        meetingLink: mentorProfilesTable.meetingLink,
        minimumNoticeHours: mentorProfilesTable.minimumNoticeHours,
        whatsappNumber: mentorProfilesTable.whatsappNumber,
      })
      .from(platformMentorAssignmentsTable)
      .innerJoin(platformUsersTable, eq(platformUsersTable.id, platformMentorAssignmentsTable.mentorUserId))
      .leftJoin(mentorProfilesTable, eq(mentorProfilesTable.userId, platformUsersTable.id))
      .where(eq(platformMentorAssignmentsTable.menteeUserId, req.platformUser!.id))
      .orderBy(asc(platformUsersTable.fullName));
    const assignedMentorIds = assignedMentors.map((mentor) => mentor.mentorId);
    const mentorConnections = assignedMentorIds.length
      ? await db
          .select({
            connectionType: platformGoogleConnectionsTable.connectionType,
            externalEmail: platformGoogleConnectionsTable.externalEmail,
            status: platformGoogleConnectionsTable.status,
            userId: platformGoogleConnectionsTable.userId,
          })
          .from(platformGoogleConnectionsTable)
          .where(
            and(
              inArray(platformGoogleConnectionsTable.userId, assignedMentorIds),
              eq(platformGoogleConnectionsTable.connectionType, "calendar"),
            ),
          )
      : [];
    const mentorConnectionMap = new Map(
      mentorConnections.map((connection) => [connection.userId, connection]),
    );
    const meetings = await db
      .select()
      .from(platformMeetingsTable)
      .where(eq(platformMeetingsTable.menteeUserId, req.platformUser!.id))
      .orderBy(desc(platformMeetingsTable.startsAt));
    const guides = await db
      .select()
      .from(platformGuidesTable)
      .where(
        and(
          eq(platformGuidesTable.menteeUserId, req.platformUser!.id),
          eq(platformGuidesTable.status, "published"),
        ),
      )
      .orderBy(desc(platformGuidesTable.updatedAt));
    const uniqueGuides = guides.filter((guide, index, array) => {
      const sourceId = guide.sourceGuideId ?? guide.id;
      return array.findIndex((entry) => (entry.sourceGuideId ?? entry.id) === sourceId) === index;
    });
    const assignedGuideAccess = await db
      .select()
      .from(platformGuideAssignmentsTable)
      .where(eq(platformGuideAssignmentsTable.menteeUserId, req.platformUser!.id))
      .orderBy(desc(platformGuideAssignmentsTable.createdAt));
    const assignedGuideIds = assignedGuideAccess.map((row) => row.guideId);
    const assignedGuideTemplates = assignedGuideIds.length
      ? await db
          .select()
          .from(platformGuidesTable)
          .where(inArray(platformGuidesTable.id, assignedGuideIds))
          .orderBy(desc(platformGuidesTable.updatedAt))
      : [];
    const publishedAdminTemplates = profile?.adminApproved
      ? await db
          .select()
          .from(platformGuidesTable)
          .where(
            and(
              eq(platformGuidesTable.guideType, "admin_template"),
              eq(platformGuidesTable.status, "published"),
            ),
          )
          .orderBy(asc(platformGuidesTable.country), asc(platformGuidesTable.universityName))
      : [];
    const visibleAdminTemplates = publishedAdminTemplates.filter((guide) => !isItemGuideRecord(guide));
    const profileFields = await db
      .select()
      .from(platformProfileFieldsTable)
      .orderBy(asc(platformProfileFieldsTable.sectionTitle), asc(platformProfileFieldsTable.sortOrder));
    const profileResponses = profileFields.length
      ? await db
          .select()
          .from(platformProfileResponsesTable)
          .where(eq(platformProfileResponsesTable.menteeUserId, req.platformUser!.id))
      : [];
    const accessibleGuideIds = Array.from(new Set([
      ...uniqueGuides.map((guide) => guide.id),
      ...assignedGuideTemplates.map((guide) => guide.id),
    ]));
    const accessibleTemplateIds = Array.from(new Set([
      ...assignedGuideTemplates.map((guide) => guide.id),
      ...uniqueGuides
        .map((guide) => guide.sourceGuideId ?? guide.id)
        .filter((value): value is number => Number.isFinite(value)),
    ]));
    const activeSourceGuideIds = new Set(
      uniqueGuides.map((guide) => guide.sourceGuideId ?? guide.id).filter((value): value is number => Number.isFinite(value)),
    );
    const availableGuideTemplatesRaw = [
      ...visibleAdminTemplates,
      ...assignedGuideTemplates,
    ];
    const availableGuideTemplates = availableGuideTemplatesRaw.filter((guide, index, array) => {
      const sourceId = guide.sourceGuideId ?? guide.id;
      if (activeSourceGuideIds.has(sourceId)) {
        return false;
      }
      return array.findIndex((entry) => (entry.sourceGuideId ?? entry.id) === sourceId) === index;
    });
    const materialTemplates = accessibleTemplateIds.length
      ? await db
          .select()
          .from(platformMaterialTemplatesTable)
          .where(eq(platformMaterialTemplatesTable.isActive, true))
          .orderBy(asc(platformMaterialTemplatesTable.templateType), asc(platformMaterialTemplatesTable.title))
      : [];
    const visibleMaterials = materialTemplates.filter((template) => {
      const applies = template.appliesToGuideIds ?? [];
      return applies.length === 0 || applies.some((guideId: number) => accessibleTemplateIds.includes(guideId));
    });
    const normalizedVisibleMaterials = visibleMaterials.map((template) => ({
      ...template,
      structure: normalizeMaterialStructureRows(template.structure),
    }));
    const hintGuideIds = Array.from(
      new Set(
        normalizedVisibleMaterials.flatMap((template) => [
          ...(typeof template.guideId === "number" ? [template.guideId] : []),
          ...((template.structure ?? [])
            .map((row: any) => (typeof row?.guideId === "number" ? row.guideId : null))
            .filter((value): value is number => Number.isFinite(value))),
        ]),
      ),
    );
    const hintGuides = hintGuideIds.length
      ? await db
          .select()
          .from(platformGuidesTable)
          .where(
            and(
              inArray(platformGuidesTable.id, hintGuideIds),
              eq(platformGuidesTable.status, "published"),
            ),
          )
          .orderBy(asc(platformGuidesTable.title))
      : [];
    const publishedLiveGuides = await db
      .select({
        createdAt: platformGuidesTable.createdAt,
        id: platformGuidesTable.id,
        sourceGuideId: platformGuidesTable.sourceGuideId,
      })
      .from(platformGuidesTable)
      .where(
        and(
          eq(platformGuidesTable.menteeUserId, req.platformUser!.id),
          eq(platformGuidesTable.status, "published"),
          inArray(platformGuidesTable.guideType, ["self_service_live", "mentor_live"]),
        ),
      )
      .orderBy(asc(platformGuidesTable.createdAt));
    const hintEligibleTemplateIds = getEligibleHintTemplateIdsForGuides(publishedLiveGuides, guideLimits);
    const tipAccessGuides = hintEligibleTemplateIds.length
      ? await db
          .select()
          .from(platformGuidesTable)
          .where(inArray(platformGuidesTable.id, hintEligibleTemplateIds))
          .orderBy(asc(platformGuidesTable.country), asc(platformGuidesTable.universityName))
      : [];
    const materialTemplateIds = normalizedVisibleMaterials
      .map((template) => Number(template.id))
      .filter((value) => Number.isFinite(value));
    const materialStates = materialTemplateIds.length
      ? await db
          .select({
            completed: platformMaterialItemStatesTable.completed,
            completionMethod: platformMaterialItemStatesTable.completionMethod,
            currentFileAssetId: platformMaterialItemStatesTable.currentFileAssetId,
            currentFileMimeType: platformFileAssetsTable.mimeType,
            currentFileName: platformFileAssetsTable.originalFilename,
            currentFileUrl: platformFileAssetsTable.publicUrl,
            googleDocTabId: platformMaterialItemStatesTable.googleDocTabId,
            googleDocTabTitle: platformMaterialItemStatesTable.googleDocTabTitle,
            googleDocTabUrl: platformMaterialItemStatesTable.googleDocTabUrl,
            rowKey: platformMaterialItemStatesTable.rowKey,
            templateId: platformMaterialItemStatesTable.templateId,
            updatedAt: platformMaterialItemStatesTable.updatedAt,
          })
          .from(platformMaterialItemStatesTable)
          .leftJoin(
            platformFileAssetsTable,
            eq(platformFileAssetsTable.id, platformMaterialItemStatesTable.currentFileAssetId),
          )
          .where(
            and(
              eq(platformMaterialItemStatesTable.menteeUserId, req.platformUser!.id),
              inArray(platformMaterialItemStatesTable.templateId, materialTemplateIds),
            ),
          )
      : [];

    return res.json({
      guideLimits: {
        maxActiveGuideCount: guideLimits.maxActiveGuideCount,
        maxHintGuideCount: guideLimits.maxHintGuideCount,
      },
      googleWorkspace: {
        essayDocId: profile?.googleEssayDocId ?? "",
        essayDocUrl: profile?.googleEssayDocUrl ?? "",
        folderId: profile?.googleDriveFolderId ?? "",
        folderUrl: profile?.googleDriveFolderUrl ?? "",
      },
      profile,
      assignedMentors: assignedMentors.map((mentor) => ({
        ...mentor,
        googleCalendarConnected:
          mentorConnectionMap.get(mentor.mentorId)?.status === "connected",
        googleCalendarEmail:
          mentorConnectionMap.get(mentor.mentorId)?.externalEmail ?? null,
      })),
      assignedGuideAccess,
      profileFields,
      profileResponses,
      meetings: meetings.map((meeting) => ({
        ...meeting,
        startsAt: meeting.startsAt.toISOString(),
        endsAt: meeting.endsAt.toISOString(),
      })),
      guides: await shapeGuideList(db, uniqueGuides),
      assignedGuideTemplates: await shapeGuideList(db, assignedGuideTemplates),
      availableGuideTemplates: await shapeGuideList(db, availableGuideTemplates),
      hintGuides: await shapeGuideList(db, hintGuides),
      hintEligibleTemplateIds,
      tipAccessGuides: await shapeGuideList(db, tipAccessGuides),
      materialItemStates: materialStates.map((state) => ({
        ...state,
        updatedAt: state.updatedAt.toISOString(),
      })),
      materialTemplates: normalizedVisibleMaterials,
    });
  },
);

router.post(
  "/platform/mentee/material-items/check",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = menteeMaterialCheckSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [template] = await db
      .select()
      .from(platformMaterialTemplatesTable)
      .where(
        and(
          eq(platformMaterialTemplatesTable.id, parsed.data.templateId),
          eq(platformMaterialTemplatesTable.isActive, true),
        ),
      )
      .limit(1);
    if (!template) {
      return res.status(404).json({ error: "Nie znaleziono kafla materiałów." });
    }
    if (!(await menteeCanAccessMaterialRow(db, {
      menteeUserId: req.platformUser!.id,
      rowKey: parsed.data.rowKey,
      template,
    }))) {
      return res.status(403).json({ error: "Nie masz dostępu do tego elementu." });
    }
    const row = findMaterialTemplateRow(template, parsed.data.rowKey);
    if (!row || row.level !== "item") {
      return res.status(404).json({ error: "Nie znaleziono wskazanego elementu." });
    }
    if (!["check_only", "check_or_file"].includes(String(row.actionType))) {
      return res.status(400).json({ error: "Tego elementu nie można oznaczyć tylko checkboxem." });
    }

    const state = await upsertMaterialItemState(db, {
      templateId: parsed.data.templateId,
      menteeUserId: req.platformUser!.id,
      rowKey: parsed.data.rowKey,
      values: {
        completed: parsed.data.completed,
        completionMethod: parsed.data.completed ? "checkbox" : null,
      },
    });
    return res.json(state);
  },
);

router.post(
  "/platform/mentee/material-items/upload",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = menteeMaterialUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [template] = await db
      .select()
      .from(platformMaterialTemplatesTable)
      .where(
        and(
          eq(platformMaterialTemplatesTable.id, parsed.data.templateId),
          eq(platformMaterialTemplatesTable.isActive, true),
        ),
      )
      .limit(1);
    if (!template) {
      return res.status(404).json({ error: "Nie znaleziono kafla materiałów." });
    }
    if (!(await menteeCanAccessMaterialRow(db, {
      menteeUserId: req.platformUser!.id,
      rowKey: parsed.data.rowKey,
      template,
    }))) {
      return res.status(403).json({ error: "Nie masz dostępu do tego elementu." });
    }
    const row = findMaterialTemplateRow(template, parsed.data.rowKey);
    if (!row || row.level !== "item") {
      return res.status(404).json({ error: "Nie znaleziono wskazanego elementu." });
    }
    if (!["file_required", "file_or_doc", "check_or_file"].includes(String(row.actionType))) {
      return res.status(400).json({ error: "Ten element nie pozwala na upload pliku." });
    }

    const workspace = await ensureMenteeWorkspace(db, req.platformUser!.id);
    if (!workspace.folderId) {
      return res.status(500).json({ error: "Brak folderu Google Drive dla mentee." });
    }

    const buffer = Buffer.from(parsed.data.base64Content, "base64");
    if (buffer.byteLength > MAX_MATERIAL_UPLOAD_BYTES) {
      return res.status(413).json({ error: "Plik jest zbyt duży. Maksymalny rozmiar uploadu to 15 MB." });
    }
    const uploaded = await uploadFileToDrive({
      fileName: parsed.data.fileName,
      mimeType: parsed.data.mimeType,
      parentId: workspace.folderId,
      data: buffer,
    });
    const [asset] = await db
      .insert(platformFileAssetsTable)
      .values({
        ownerUserId: req.platformUser!.id,
        mimeType: parsed.data.mimeType,
        objectKey: uploaded.id,
        originalFilename: parsed.data.fileName,
        publicUrl: uploaded.url,
        sizeBytes: buffer.byteLength,
      })
      .returning();

    const state = await upsertMaterialItemState(db, {
      templateId: parsed.data.templateId,
      menteeUserId: req.platformUser!.id,
      rowKey: parsed.data.rowKey,
      values: {
        completed: true,
        completionMethod: "file_upload",
        currentFileAssetId: asset.id,
      },
    });

    return res.status(201).json({
      asset,
      state,
    });
  },
);

router.post(
  "/platform/mentee/material-items/create-doc-tab",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = menteeMaterialDocTabSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [template] = await db
      .select()
      .from(platformMaterialTemplatesTable)
      .where(
        and(
          eq(platformMaterialTemplatesTable.id, parsed.data.templateId),
          eq(platformMaterialTemplatesTable.isActive, true),
        ),
      )
      .limit(1);
    if (!template) {
      return res.status(404).json({ error: "Nie znaleziono kafla materiałów." });
    }
    if (!(await menteeCanAccessMaterialRow(db, {
      menteeUserId: req.platformUser!.id,
      rowKey: parsed.data.rowKey,
      template,
    }))) {
      return res.status(403).json({ error: "Nie masz dostępu do tego elementu." });
    }
    const row = findMaterialTemplateRow(template, parsed.data.rowKey);
    if (!row || row.level !== "item") {
      return res.status(404).json({ error: "Nie znaleziono wskazanego elementu." });
    }
    if (row.actionType !== "file_or_doc") {
      return res.status(400).json({ error: "Ten element nie pozwala na utworzenie zakładki w Essay Doc." });
    }

    const workspace = await ensureMenteeWorkspace(db, req.platformUser!.id);
    if (!workspace.essayDocId) {
      return res.status(500).json({ error: "Brak Essay Doc dla mentee." });
    }

    const sourceDocumentId =
      typeof row.sourceDocumentId === "string" ? row.sourceDocumentId.trim() : "";
    const sourceTabId = typeof row.sourceTabId === "string" ? row.sourceTabId.trim() : "";
    const docTab = await createDocumentTab({
      documentId: workspace.essayDocId,
      initialText: sourceDocumentId && sourceTabId ? "" : row.docTabPrompt || "",
      title: row.docTabTitle || row.task || "Essay task",
    });
    if (sourceDocumentId && sourceTabId) {
      await cloneDocumentTabToTarget({
        sourceDocumentId,
        sourceTabId,
        targetDocumentId: workspace.essayDocId,
        targetTabId: docTab.tabId,
      });
    }

    const state = await upsertMaterialItemState(db, {
      templateId: parsed.data.templateId,
      menteeUserId: req.platformUser!.id,
      rowKey: parsed.data.rowKey,
      values: {
        completed: true,
        completionMethod: "google_doc_tab",
        googleDocTabId: docTab.tabId,
        googleDocTabTitle: docTab.title,
        googleDocTabUrl: docTab.tabUrl,
      },
    });

    return res.status(201).json({
      state,
      tab: docTab,
    });
  },
);

router.put(
  "/platform/mentee/profile-responses",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = profileResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    for (const response of parsed.data.responses) {
      await db
        .insert(platformProfileResponsesTable)
        .values({
          menteeUserId: req.platformUser!.id,
          fieldId: response.fieldId,
          value: response.value,
        })
        .onConflictDoUpdate({
          target: [platformProfileResponsesTable.menteeUserId, platformProfileResponsesTable.fieldId] as never,
          set: {
            value: response.value,
            updatedAt: new Date(),
          },
        });
    }
    return res.status(204).end();
  },
);

router.get(
  "/platform/mentee/mentor-slots",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const mentorUserId = Number(req.query.mentorUserId);
    const requestedMonth = parseMonthKey(
      typeof req.query.month === "string" ? req.query.month : undefined,
    );
    if (!Number.isFinite(mentorUserId)) {
      return res.status(400).json({ error: "Invalid mentor user id." });
    }
    if (req.query.month !== undefined && !requestedMonth) {
      return res.status(400).json({ error: "Invalid month." });
    }

    const { db } = await import("@workspace/db");
    const [assignment] = await db
      .select({ id: platformMentorAssignmentsTable.id })
      .from(platformMentorAssignmentsTable)
      .where(
        and(
          eq(platformMentorAssignmentsTable.menteeUserId, req.platformUser!.id),
          eq(platformMentorAssignmentsTable.mentorUserId, mentorUserId),
        ),
      )
      .limit(1);

    if (!assignment) {
      return res.status(403).json({ error: "Nie masz dostępu do spotkań z tym mentorem." });
    }

    const [mentorProfile] = await db
      .select()
      .from(mentorProfilesTable)
      .where(eq(mentorProfilesTable.userId, mentorUserId))
      .limit(1);

    if (!mentorProfile?.adminApproved) {
      return res.status(400).json({ error: "Wybrany mentor nie jest jeszcze aktywny." });
    }

    const availabilityRules = await db
      .select()
      .from(mentorAvailabilityRulesTable)
      .where(eq(mentorAvailabilityRulesTable.mentorUserId, mentorUserId))
      .orderBy(
        asc(mentorAvailabilityRulesTable.weekday),
        asc(mentorAvailabilityRulesTable.startTime),
      );

    const availabilityOverrides = normalizeAvailabilityOverrides(
      mentorProfile.availabilityOverrides,
    );

    if (!availabilityRules.length && !availabilityOverrides.length) {
      return res.json({
        connectionReady: false,
        slots: [],
        timezone: mentorProfile.timezone,
      });
    }

    const connection = await getMentorCalendarConnection(db, mentorUserId);
    const mentorGoogle = await getMentorCalendarAccessToken(
      db,
      connection,
      mentorUserId,
    );

    if (!mentorGoogle?.externalEmail) {
      return res.json({
        connectionReady: false,
        slots: [],
        timezone: mentorProfile.timezone,
      });
    }

    const now = new Date();
    const to = new Date(
      now.getTime() +
        (mentorProfile.bookingWindowDays ?? DEFAULT_MENTOR_BOOKING_WINDOW_DAYS) *
          24 *
          60 *
          60 *
          1000,
    );
    const busyResponse = await googleApiRequestWithAccessToken(
      mentorGoogle.accessToken,
      "/calendar/v3/freeBusy",
      {
        method: "POST",
        body: JSON.stringify({
          timeMin: now.toISOString(),
          timeMax: to.toISOString(),
          timeZone: mentorProfile.timezone,
          items: [{ id: mentorGoogle.externalEmail }],
        }),
      },
    );

    const busyPayload = (await busyResponse.json()) as {
      calendars?: Record<string, { busy: BusyWindow[] }>;
      error?: { message?: string };
    };

    if (!busyResponse.ok) {
      return res.status(502).json({
        error:
          busyPayload.error?.message ||
          "Nie udało się pobrać kalendarza mentora.",
      });
    }

    const busy = busyPayload.calendars?.[mentorGoogle.externalEmail]?.busy ?? [];
    const slots = buildMentorSlotsFromRules({
      availabilityOverrides,
      availabilityRules,
      busy,
      bookingWindowDays:
        mentorProfile.bookingWindowDays ?? DEFAULT_MENTOR_BOOKING_WINDOW_DAYS,
      minimumNoticeHours:
        mentorProfile.minimumNoticeHours ?? DEFAULT_MENTOR_MINIMUM_NOTICE_HOURS,
      month: requestedMonth,
      now,
      timeZone: mentorProfile.timezone,
    });

    return res.json({
      connectionReady: true,
      slots,
      timezone: mentorProfile.timezone,
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

    const turnstile = await verifyTurnstileToken(req, parsed.data.turnstileToken);
    if (!turnstile.ok) {
      return res.status(400).json({ error: turnstile.message });
    }

    const startsAt = new Date(parsed.data.startsAt);
    const endsAt = new Date(parsed.data.endsAt);
    if (!meetingWindowIsValid(startsAt, endsAt)) {
      return res.status(400).json({ error: "Spotkanie musi trwać przynajmniej 15 minut." });
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
    const minimumNoticeHours =
      mentorProfile.minimumNoticeHours ?? DEFAULT_MENTOR_MINIMUM_NOTICE_HOURS;
    if (!meetingOutsideLeadWindow(startsAt, minimumNoticeHours)) {
      return res.status(400).json({
        error: `Spotkania można umawiać najwcześniej za ${minimumNoticeHours} godzin.`,
      });
    }

    const [assignment] = await db
      .select()
      .from(platformMentorAssignmentsTable)
      .where(
        and(
          eq(platformMentorAssignmentsTable.menteeUserId, req.platformUser!.id),
          eq(platformMentorAssignmentsTable.mentorUserId, parsed.data.mentorUserId),
        ),
      )
      .limit(1);

    if (!assignment) {
      return res.status(403).json({ error: "Nie masz jeszcze dostępu do spotkań z tym mentorem." });
    }

    const availabilityRules = await db
      .select()
      .from(mentorAvailabilityRulesTable)
      .where(eq(mentorAvailabilityRulesTable.mentorUserId, parsed.data.mentorUserId))
      .orderBy(
        asc(mentorAvailabilityRulesTable.weekday),
        asc(mentorAvailabilityRulesTable.startTime),
      );
    const availabilityOverrides = normalizeAvailabilityOverrides(
      mentorProfile.availabilityOverrides,
    );
    const connection = await getMentorCalendarConnection(
      db,
      parsed.data.mentorUserId,
    );
    const mentorGoogle = await getMentorCalendarAccessToken(
      db,
      connection,
      parsed.data.mentorUserId,
    );

    if (!mentorGoogle?.externalEmail) {
      return res.status(400).json({
        error:
          "Wybrany mentor nie ma jeszcze podłączonego Google Calendar.",
      });
    }

    const now = new Date();
    const to = new Date(
      now.getTime() +
        (mentorProfile.bookingWindowDays ?? DEFAULT_MENTOR_BOOKING_WINDOW_DAYS) *
          24 *
          60 *
          60 *
          1000,
    );
    const busyResponse = await googleApiRequestWithAccessToken(
      mentorGoogle.accessToken,
      "/calendar/v3/freeBusy",
      {
        method: "POST",
        body: JSON.stringify({
          timeMin: now.toISOString(),
          timeMax: to.toISOString(),
          timeZone: mentorProfile.timezone,
          items: [{ id: mentorGoogle.externalEmail }],
        }),
      },
    );
    const busyPayload = (await busyResponse.json()) as {
      calendars?: Record<string, { busy: BusyWindow[] }>;
      error?: { message?: string };
    };

    if (!busyResponse.ok) {
      return res.status(502).json({
        error:
          busyPayload.error?.message ||
          "Nie udało się sprawdzić dostępności mentora.",
      });
    }

    const availableSlots = buildMentorSlotsFromRules({
      availabilityOverrides,
      availabilityRules,
      busy: busyPayload.calendars?.[mentorGoogle.externalEmail]?.busy ?? [],
      bookingWindowDays:
        mentorProfile.bookingWindowDays ?? DEFAULT_MENTOR_BOOKING_WINDOW_DAYS,
      minimumNoticeHours,
      now,
      timeZone: mentorProfile.timezone,
    });
    const requestedSlot = availableSlots.find(
      (slot) =>
        slot.start === startsAt.toISOString() &&
        slot.end === endsAt.toISOString(),
    );

    if (!requestedSlot) {
      return res.status(409).json({
        error:
          "Ten termin nie jest już dostępny. Odśwież listę slotów i wybierz inny.",
      });
    }

    const eventPayload: Record<string, unknown> = {
      summary: `Konsultacja ACADEA — ${req.platformUser!.fullName}`,
      description: [
        parsed.data.description?.trim() || null,
        `Mentee: ${req.platformUser!.fullName}`,
        `Email mentee: ${req.platformUser!.email}`,
        "",
        "Spotkanie umówione przez ACADEA Platform.",
      ]
        .filter(Boolean)
        .join("\n"),
      start: { dateTime: startsAt.toISOString(), timeZone: mentorProfile.timezone },
      end: { dateTime: endsAt.toISOString(), timeZone: mentorProfile.timezone },
      attendees: [
        { email: req.platformUser!.email, displayName: req.platformUser!.fullName },
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 60 },
          { method: "popup", minutes: 15 },
        ],
      },
    };

    if (mentorProfile.meetingMethod === "google_meet") {
      eventPayload.conferenceData = {
        createRequest: {
          conferenceSolutionKey: { type: "hangoutsMeet" },
          requestId: `acadea-${req.platformUser!.id}-${Date.now()}`,
        },
      };
    }

    const eventResponse = await googleApiRequestWithAccessToken(
      mentorGoogle.accessToken,
      `/calendar/v3/calendars/${encodeURIComponent(
        mentorGoogle.externalEmail,
      )}/events?sendUpdates=all${
        mentorProfile.meetingMethod === "google_meet"
          ? "&conferenceDataVersion=1"
          : ""
      }`,
      {
        method: "POST",
        body: JSON.stringify(eventPayload),
      },
    );
    const eventData = (await eventResponse.json()) as {
      error?: { message?: string };
      hangoutLink?: string;
      htmlLink?: string;
      id?: string;
      conferenceData?: {
        entryPoints?: Array<{ entryPointType?: string; uri?: string }>;
      };
    };

    if (!eventResponse.ok || !eventData.id) {
      return res.status(502).json({
        error:
          eventData.error?.message ||
          "Nie udało się utworzyć wydarzenia w kalendarzu mentora.",
      });
    }

    const generatedMeetUrl =
      eventData.hangoutLink ||
      eventData.conferenceData?.entryPoints?.find(
        (entry) => entry.entryPointType === "video",
      )?.uri ||
      null;
    const resolvedMeetingUrl = buildMentorMeetingUrl({
      generatedGoogleMeetUrl: generatedMeetUrl,
      meetingLink: mentorProfile.meetingLink,
      meetingMethod: mentorProfile.meetingMethod,
      whatsappNumber: mentorProfile.whatsappNumber,
    });

    const [meeting] = await db
      .insert(platformMeetingsTable)
      .values({
        mentorUserId: parsed.data.mentorUserId,
        menteeUserId: req.platformUser!.id,
        title: parsed.data.title,
        description: parsed.data.description,
        startsAt,
        endsAt,
        timezone: mentorProfile.timezone,
        method: mentorProfile.meetingMethod,
        meetingUrl: resolvedMeetingUrl,
        externalCalendarEventId: eventData.id,
      })
      .returning();

    if (
      mentorGoogle.scopes.includes("https://www.googleapis.com/auth/gmail.send")
    ) {
      const startLabel = startsAt.toLocaleString("pl-PL", {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: mentorProfile.timezone,
      });
      const endLabel = endsAt.toLocaleTimeString("pl-PL", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: mentorProfile.timezone,
      });
      const mentorName =
        mentorGoogle.externalEmail || "Twój mentor ACADEA";

      try {
        await sendGmailMessageWithAccessToken({
          accessToken: mentorGoogle.accessToken,
          from: mentorGoogle.externalEmail,
          to: {
            email: req.platformUser!.email,
            name: req.platformUser!.fullName,
          },
          subject: `ACADEA: potwierdzenie spotkania z mentorem`,
          text: [
            `Cześć ${req.platformUser!.fullName},`,
            "",
            "Twoje spotkanie mentoringowe zostało potwierdzone.",
            `Termin: ${startLabel} - ${endLabel}`,
            resolvedMeetingUrl ? `Link / metoda spotkania: ${resolvedMeetingUrl}` : null,
            "",
            `Prowadzący mentor: ${mentorName}`,
            "Szczegóły znajdziesz też w zaproszeniu kalendarzowym.",
            "",
            "Pozdrawiamy,",
            "ACADEA",
          ]
            .filter(Boolean)
            .join("\n"),
          replyTo: mentorGoogle.externalEmail,
        });
      } catch (err) {
        // Keep booking successful even if the custom email fails.
      }
    }

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
      .where(
        and(
          eq(platformGuidesTable.id, sourceGuideId),
          eq(platformGuidesTable.guideType, "admin_template"),
          eq(platformGuidesTable.status, "published"),
        ),
      )
      .limit(1);

    if (!sourceGuide) {
      return res.status(404).json({ error: "Nie znaleziono przewodnika." });
    }

    const [menteeProfile] = await db
      .select()
      .from(menteeProfilesTable)
      .where(eq(menteeProfilesTable.userId, req.platformUser!.id))
      .limit(1);
    if (!menteeProfile?.adminApproved) {
      return res.status(403).json({ error: "Najpierw potrzebujesz akceptacji administratora." });
    }

    const [existingBySource] = await db
      .select({ id: platformGuidesTable.id })
      .from(platformGuidesTable)
      .where(
        and(
          eq(platformGuidesTable.menteeUserId, req.platformUser!.id),
          eq(platformGuidesTable.sourceGuideId, sourceGuide.id),
          eq(platformGuidesTable.status, "published"),
        ),
      )
      .limit(1);
    if (existingBySource) {
      return res.status(409).json({ error: "Ta uczelnia jest już dodana do Twojego panelu." });
    }

    const existingLiveGuides = await db
      .select({ id: platformGuidesTable.id })
      .from(platformGuidesTable)
      .where(
        and(
          eq(platformGuidesTable.menteeUserId, req.platformUser!.id),
          eq(platformGuidesTable.status, "published"),
          inArray(platformGuidesTable.guideType, ["self_service_live", "mentor_live"]),
        ),
      );

    const guideLimits = getMenteeGuideLimits(menteeProfile);
    if (existingLiveGuides.length >= guideLimits.maxActiveGuideCount) {
      return res.status(400).json({
        error: `Na ten moment możesz mieć jednocześnie maksymalnie ${guideLimits.maxActiveGuideCount} aktywne przewodniki.`,
      });
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
  "/platform/mentee/guides/:id/resign",
  requirePlatformAuth,
  requirePlatformRole("mentee"),
  async (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid guide id." });
    }
    const { db } = await import("@workspace/db");
    const [guide] = await db
      .select({ id: platformGuidesTable.id })
      .from(platformGuidesTable)
      .where(
        and(
          eq(platformGuidesTable.id, id),
          eq(platformGuidesTable.menteeUserId, req.platformUser!.id),
          inArray(platformGuidesTable.guideType, ["self_service_live", "mentor_live"]),
        ),
      )
      .limit(1);
    if (!guide) {
      return res.status(404).json({ error: "Nie znaleziono uczelni do usunięcia." });
    }
    await hardDeleteGuidesAndReferences(db, [guide.id]);
    return res.status(204).end();
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
    const [existingMeeting] = await db
      .select()
      .from(platformMeetingsTable)
      .where(
        and(
          eq(platformMeetingsTable.id, id),
          eq(platformMeetingsTable.menteeUserId, req.platformUser!.id),
        ),
      )
      .limit(1);
    if (!existingMeeting) {
      return res.status(404).json({ error: "Nie znaleziono spotkania." });
    }
    const [meeting] = await db
      .update(platformMeetingsTable)
      .set({
        status: "cancelled",
        cancellationReason: typeof req.body?.reason === "string" ? req.body.reason.trim() : null,
        updatedAt: new Date(),
      })
      .where(and(eq(platformMeetingsTable.id, id), eq(platformMeetingsTable.menteeUserId, req.platformUser!.id)))
      .returning();

    if (
      meeting?.status === "cancelled" &&
      existingMeeting.externalCalendarEventId
    ) {
      try {
        const connection = await getMentorCalendarConnection(
          db,
          existingMeeting.mentorUserId,
        );
        const mentorGoogle = await getMentorCalendarAccessToken(
          db,
          connection,
          meeting.mentorUserId,
        );
        if (mentorGoogle?.externalEmail) {
          await cancelMentorCalendarEvent({
            accessToken: mentorGoogle.accessToken,
            calendarId: mentorGoogle.externalEmail,
            eventId: existingMeeting.externalCalendarEventId,
          });
        }
      } catch (err) {
        logger.warn({ err, meetingId: id }, "mentee calendar cancellation sync failed");
      }
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
    const guideTemplates = guides.filter(
      (guide) =>
        !guide.sourceGuideId &&
        (guide.guideType === "admin_template" || guide.guideType === "mentor_blueprint") &&
        !isItemGuideRecord(guide) &&
        guide.status !== "archived",
    );

    return res.json({
      counts: {
        users: users.length,
        mentors: users.filter((user) => user.role === "mentor").length,
        mentees: users.filter((user) => user.role === "mentee").length,
        admins: users.filter((user) => user.role === "admin").length,
        meetings: meetings.length,
        guides: guideTemplates.length,
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
    const mentorAssignments = await db.select().from(platformMentorAssignmentsTable);
    const guideAssignments = await db.select().from(platformGuideAssignmentsTable);
    const liveGuides = await db
      .select({
        country: platformGuidesTable.country,
        createdAt: platformGuidesTable.createdAt,
        id: platformGuidesTable.id,
        menteeUserId: platformGuidesTable.menteeUserId,
        sourceGuideId: platformGuidesTable.sourceGuideId,
        title: platformGuidesTable.title,
        universityName: platformGuidesTable.universityName,
      })
      .from(platformGuidesTable)
      .where(
        and(
          eq(platformGuidesTable.status, "published"),
          inArray(platformGuidesTable.guideType, ["self_service_live", "mentor_live"]),
        ),
      )
      .orderBy(asc(platformGuidesTable.createdAt));

    const guideById = new Map(
      (
        await db
          .select({
            country: platformGuidesTable.country,
            id: platformGuidesTable.id,
            title: platformGuidesTable.title,
            universityName: platformGuidesTable.universityName,
          })
          .from(platformGuidesTable)
      ).map((guide) => [guide.id, guide]),
    );

    const tipAccessByMentee = menteeProfiles.map((profile) => {
      const limits = getMenteeGuideLimits(profile);
      const eligibleTemplateIds = getEligibleHintTemplateIdsForGuides(
        liveGuides.filter((guide) => guide.menteeUserId === profile.userId),
        limits,
      );
      return {
        menteeUserId: profile.userId,
        maxActiveGuideCount: limits.maxActiveGuideCount,
        maxHintGuideCount: limits.maxHintGuideCount,
        disabledHintGuideTemplateIds: limits.disabledHintGuideTemplateIds,
        guides: eligibleTemplateIds
          .map((guideId) => guideById.get(guideId))
          .filter((guide): guide is NonNullable<typeof guide> => Boolean(guide)),
      };
    });

    return res.json({
      users: users.map(serializeUser),
      mentorProfiles,
      menteeProfiles,
      mentorAssignments,
      guideAssignments,
      tipAccessByMentee,
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
      await safeEnsureMenteeWorkspace(db, user.id);
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

router.delete(
  "/platform/admin/users/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req: AuthenticatedRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid user id." });
    }
    if (req.platformUser?.id === id) {
      return res.status(400).json({ error: "Nie możesz usunąć własnego konta administratora." });
    }
    const { db } = await import("@workspace/db");
    await db.delete(platformUsersTable).where(eq(platformUsersTable.id, id));
    return res.status(204).end();
  },
);

router.patch(
  "/platform/admin/mentors/:id/approve",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    const parsed = approvalSchema.safeParse(req.body);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid mentor id." : parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [profile] = await db
      .insert(mentorProfilesTable)
      .values({
        userId: id,
        bio: "",
        adminApproved: parsed.data.approved,
      })
      .onConflictDoUpdate({
        target: mentorProfilesTable.userId,
        set: {
          adminApproved: parsed.data.approved,
          updatedAt: new Date(),
        },
      })
      .returning();

    await db
      .update(platformUsersTable)
      .set({
        status: parsed.data.approved ? "active" : "pending",
        updatedAt: new Date(),
      })
      .where(eq(platformUsersTable.id, id));

    return res.json(profile);
  },
);

router.patch(
  "/platform/admin/mentees/:id/approve",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    const parsed = approvalSchema.safeParse(req.body);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid mentee id." : parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [profile] = await db
      .insert(menteeProfilesTable)
      .values({
        userId: id,
        adminApproved: parsed.data.approved,
      })
      .onConflictDoUpdate({
        target: menteeProfilesTable.userId,
        set: {
          adminApproved: parsed.data.approved,
          updatedAt: new Date(),
        },
      })
      .returning();

    await db
      .update(platformUsersTable)
      .set({
        status: parsed.data.approved ? "active" : "pending",
        updatedAt: new Date(),
      })
      .where(eq(platformUsersTable.id, id));

    return res.json(profile);
  },
);

router.patch(
  "/platform/admin/mentees/:id/settings",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    const parsed = menteeLimitsSchema.safeParse(req.body);
    if (!Number.isFinite(id) || !parsed.success) {
      return res.status(422).json({ error: parsed.success ? "Invalid mentee id." : parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [existing] = await db
      .select()
      .from(menteeProfilesTable)
      .where(eq(menteeProfilesTable.userId, id))
      .limit(1);
    const currentLimits = getMenteeGuideLimits(existing);
    const [profile] = await db
      .insert(menteeProfilesTable)
      .values({
        adminApproved: Boolean(existing?.adminApproved),
        disabledHintGuideTemplateIds:
          parsed.data.disabledHintGuideTemplateIds ?? currentLimits.disabledHintGuideTemplateIds,
        maxActiveGuideCount:
          parsed.data.maxActiveGuideCount ?? currentLimits.maxActiveGuideCount,
        maxHintGuideCount:
          parsed.data.maxHintGuideCount ?? currentLimits.maxHintGuideCount,
        primaryMentorUserId: existing?.primaryMentorUserId ?? null,
        studentEmail: existing?.studentEmail ?? null,
        targetCountries: existing?.targetCountries ?? [],
        intakeYear: existing?.intakeYear ?? null,
        userId: id,
      })
      .onConflictDoUpdate({
        target: menteeProfilesTable.userId,
        set: {
          disabledHintGuideTemplateIds:
            parsed.data.disabledHintGuideTemplateIds ?? currentLimits.disabledHintGuideTemplateIds,
          maxActiveGuideCount:
            parsed.data.maxActiveGuideCount ?? currentLimits.maxActiveGuideCount,
          maxHintGuideCount:
            parsed.data.maxHintGuideCount ?? currentLimits.maxHintGuideCount,
          updatedAt: new Date(),
        },
      })
      .returning();

    return res.json(profile);
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
    await safeEnsureMentorAccessToMenteeWorkspace(db, {
      menteeUserId: id,
      mentorUserId,
    });
    return res.json(profile);
  },
);

router.post(
  "/platform/admin/mentor-access",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = assignMentorAccessSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [row] = await db
      .insert(platformMentorAssignmentsTable)
      .values({
        menteeUserId: parsed.data.menteeUserId,
        mentorUserId: parsed.data.mentorUserId,
        grantedByUserId: req.platformUser!.id,
      })
      .onConflictDoNothing()
      .returning();

    if (!row) {
      const [existing] = await db
        .select()
        .from(platformMentorAssignmentsTable)
        .where(
          and(
            eq(platformMentorAssignmentsTable.menteeUserId, parsed.data.menteeUserId),
            eq(platformMentorAssignmentsTable.mentorUserId, parsed.data.mentorUserId),
          ),
        )
        .limit(1);
      return res.json(existing);
    }

    await safeEnsureMentorAccessToMenteeWorkspace(db, {
      menteeUserId: parsed.data.menteeUserId,
      mentorUserId: parsed.data.mentorUserId,
    });

    return res.status(201).json(row);
  },
);

router.delete(
  "/platform/admin/mentor-access/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid assignment id." });
    }
    const { db } = await import("@workspace/db");
    await db.delete(platformMentorAssignmentsTable).where(eq(platformMentorAssignmentsTable.id, id));
    return res.status(204).end();
  },
);

router.post(
  "/platform/admin/guide-access",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = assignGuideAccessSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({ error: parsed.error.message });
    }
    const { db } = await import("@workspace/db");
    const [row] = await db
      .insert(platformGuideAssignmentsTable)
      .values({
        guideId: parsed.data.guideId,
        menteeUserId: parsed.data.menteeUserId,
        grantedByUserId: req.platformUser!.id,
      })
      .onConflictDoNothing()
      .returning();

    if (!row) {
      const [existing] = await db
        .select()
        .from(platformGuideAssignmentsTable)
        .where(
          and(
            eq(platformGuideAssignmentsTable.guideId, parsed.data.guideId),
            eq(platformGuideAssignmentsTable.menteeUserId, parsed.data.menteeUserId),
          ),
        )
        .limit(1);
      return res.json(existing);
    }

    return res.status(201).json(row);
  },
);

router.delete(
  "/platform/admin/guide-access/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid guide assignment id." });
    }
    const { db } = await import("@workspace/db");
    await db.delete(platformGuideAssignmentsTable).where(eq(platformGuideAssignmentsTable.id, id));
    return res.status(204).end();
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

router.put(
  "/platform/admin/guides/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
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
      .where(eq(platformGuidesTable.id, id))
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
  "/platform/admin/guides/:id",
  requirePlatformAuth,
  requirePlatformRole("admin"),
  async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid guide id." });
    }
    const { db } = await import("@workspace/db");
    const [guide] = await db
      .select({ id: platformGuidesTable.id })
      .from(platformGuidesTable)
      .where(eq(platformGuidesTable.id, id))
      .limit(1);
    if (!guide) {
      return res.status(404).json({ error: "Nie znaleziono przewodnika." });
    }
    await hardDeleteGuidesAndReferences(db, [guide.id]);
    return res.status(204).end();
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
    const [mentee] = await db
      .select({ fullName: platformUsersTable.fullName })
      .from(platformUsersTable)
      .where(eq(platformUsersTable.id, parsed.data.menteeUserId))
      .limit(1);

    const [guide] = await db
      .insert(platformGuidesTable)
      .values({
        guideType: parsed.data.mentorUserId ? "mentor_live" : "self_service_live",
        status: "published",
        title: parsed.data.mentorUserId && mentee ? `${sourceGuide.title} - ${mentee.fullName}` : sourceGuide.title,
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
