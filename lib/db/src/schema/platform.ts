import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const PLATFORM_USER_ROLES = ["admin", "mentor", "mentee"] as const;
export const PLATFORM_USER_STATUSES = ["active", "pending", "disabled"] as const;
export const PLATFORM_MEETING_STATUSES = [
  "scheduled",
  "cancelled",
  "no_show",
  "rescheduled",
  "completed",
] as const;
export const PLATFORM_MEETING_METHODS = [
  "google_meet",
  "zoom_link",
  "teams_link",
  "whatsapp",
  "custom",
] as const;
export const PLATFORM_GUIDE_TYPES = [
  "mentor_blueprint",
  "mentor_live",
  "admin_template",
  "self_service_live",
] as const;
export const PLATFORM_GUIDE_STATUSES = ["draft", "published", "archived"] as const;
export const PLATFORM_CHECKLIST_ITEM_TYPES = [
  "document_template",
  "file_link",
  "todo",
  "external_link",
  "reused_link",
] as const;
export const PLATFORM_GOOGLE_CONNECTION_TYPES = ["calendar", "drive"] as const;
export const PLATFORM_CONNECTION_STATUSES = ["disconnected", "pending", "connected"] as const;
export const PLATFORM_PROFILE_FIELD_TYPES = ["text", "textarea", "date"] as const;
export const PLATFORM_MATERIAL_TEMPLATE_TYPES = ["passport_like", "essay_like"] as const;

export const platformUsersTable = pgTable(
  "platform_users",
  {
    id: serial("id").primaryKey(),
    role: text("role").notNull(),
    status: text("status").notNull().default("pending"),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    passwordSalt: text("password_salt"),
    passwordHash: text("password_hash"),
    avatarUrl: text("avatar_url"),
    notes: text("notes"),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailUnique: uniqueIndex("platform_users_email_unique").on(table.email),
  }),
);

export const platformSessionsTable = pgTable(
  "platform_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("platform_sessions_token_hash_unique").on(table.tokenHash),
  }),
);

export const platformPasswordResetTokensTable = pgTable(
  "platform_password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex("platform_reset_tokens_hash_unique").on(table.tokenHash),
  }),
);

export const mentorProfilesTable = pgTable(
  "mentor_profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    headline: text("headline"),
    bio: text("bio").notNull().default(""),
    timezone: text("timezone").notNull().default("Europe/Warsaw"),
    meetingMethod: text("meeting_method").notNull().default("zoom_link"),
    meetingLink: text("meeting_link"),
    whatsappNumber: text("whatsapp_number"),
    bookingWindowDays: integer("booking_window_days").notNull().default(30),
    minimumNoticeHours: integer("minimum_notice_hours").notNull().default(24),
    rescheduleNoticeHours: integer("reschedule_notice_hours").notNull().default(24),
    availabilityOverrides: jsonb("availability_overrides")
      .$type<
        Array<{
          date: string;
          isBlocked?: boolean;
          ranges?: Array<{
            startTime: string;
            endTime: string;
            isActive?: boolean;
          }>;
        }>
      >()
      .notNull()
      .default(sql`'[]'::jsonb`),
    googleCalendarEmail: text("google_calendar_email"),
    googleDriveFolderId: text("google_drive_folder_id"),
    googleDriveFolderUrl: text("google_drive_folder_url"),
    adminApproved: boolean("admin_approved").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userUnique: uniqueIndex("mentor_profiles_user_unique").on(table.userId),
  }),
);

export const menteeProfilesTable = pgTable(
  "mentee_profiles",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    adminApproved: boolean("admin_approved").notNull().default(false),
    primaryMentorUserId: integer("primary_mentor_user_id").references(() => platformUsersTable.id, {
      onDelete: "set null",
    }),
    studentEmail: text("student_email"),
    intakeYear: integer("intake_year"),
    targetCountries: jsonb("target_countries").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    maxActiveGuideCount: integer("max_active_guide_count").notNull().default(3),
    maxHintGuideCount: integer("max_hint_guide_count").notNull().default(3),
    disabledHintGuideTemplateIds: jsonb("disabled_hint_guide_template_ids")
      .$type<number[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    googleDriveFolderId: text("google_drive_folder_id"),
    googleDriveFolderUrl: text("google_drive_folder_url"),
    googleEssayDocId: text("google_essay_doc_id"),
    googleEssayDocUrl: text("google_essay_doc_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userUnique: uniqueIndex("mentee_profiles_user_unique").on(table.userId),
  }),
);

export const platformMentorAssignmentsTable = pgTable(
  "platform_mentor_assignments",
  {
    id: serial("id").primaryKey(),
    menteeUserId: integer("mentee_user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    mentorUserId: integer("mentor_user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    grantedByUserId: integer("granted_by_user_id").references(() => platformUsersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    menteeMentorUnique: uniqueIndex("platform_mentor_assignments_unique").on(
      table.menteeUserId,
      table.mentorUserId,
    ),
  }),
);

export const platformGuideAssignmentsTable = pgTable(
  "platform_guide_assignments",
  {
    id: serial("id").primaryKey(),
    guideId: integer("guide_id")
      .references(() => platformGuidesTable.id, { onDelete: "cascade" })
      .notNull(),
    menteeUserId: integer("mentee_user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    grantedByUserId: integer("granted_by_user_id").references(() => platformUsersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    guideMenteeUnique: uniqueIndex("platform_guide_assignments_unique").on(
      table.guideId,
      table.menteeUserId,
    ),
  }),
);

export const mentorAvailabilityRulesTable = pgTable("mentor_availability_rules", {
  id: serial("id").primaryKey(),
  mentorUserId: integer("mentor_user_id")
    .references(() => platformUsersTable.id, { onDelete: "cascade" })
    .notNull(),
  weekday: integer("weekday").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mentorUniversitiesTable = pgTable("mentor_universities", {
  id: serial("id").primaryKey(),
  mentorUserId: integer("mentor_user_id")
    .references(() => platformUsersTable.id, { onDelete: "cascade" })
    .notNull(),
  country: text("country").notNull(),
  universityName: text("university_name").notNull(),
  programName: text("program_name"),
  summary: text("summary").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const platformGoogleConnectionsTable = pgTable(
  "platform_google_connections",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    connectionType: text("connection_type").notNull(),
    status: text("status").notNull().default("disconnected"),
    externalEmail: text("external_email"),
    scopes: jsonb("scopes").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userConnectionUnique: uniqueIndex("platform_google_connections_user_type_unique").on(
      table.userId,
      table.connectionType,
    ),
  }),
);

export const platformGuidesTable = pgTable("platform_guides", {
  id: serial("id").primaryKey(),
  guideType: text("guide_type").notNull(),
  status: text("status").notNull().default("draft"),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  country: text("country").notNull(),
  universityName: text("university_name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  summary: text("summary").notNull().default(""),
  descriptionMarkdown: text("description_markdown").notNull().default(""),
  estimatedReadMin: integer("estimated_read_min").notNull().default(5),
  ownerUserId: integer("owner_user_id").references(() => platformUsersTable.id, {
    onDelete: "set null",
  }),
  menteeUserId: integer("mentee_user_id").references(() => platformUsersTable.id, {
    onDelete: "set null",
  }),
  sourceGuideId: integer("source_guide_id"),
  driveFolderUrl: text("drive_folder_url"),
  isVisibleToUnapprovedUsers: boolean("is_visible_to_unapproved_users").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const platformProfileFieldsTable = pgTable("platform_profile_fields", {
  id: serial("id").primaryKey(),
  key: text("key").notNull(),
  label: text("label").notNull(),
  description: text("description").notNull().default(""),
  fieldType: text("field_type").notNull().default("text"),
  sectionTitle: text("section_title").notNull().default("Dane podstawowe"),
  placeholder: text("placeholder"),
  isRequired: boolean("is_required").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  keyUnique: uniqueIndex("platform_profile_fields_key_unique").on(table.key),
}));

export const platformProfileResponsesTable = pgTable("platform_profile_responses", {
  id: serial("id").primaryKey(),
  menteeUserId: integer("mentee_user_id")
    .references(() => platformUsersTable.id, { onDelete: "cascade" })
    .notNull(),
  fieldId: integer("field_id")
    .references(() => platformProfileFieldsTable.id, { onDelete: "cascade" })
    .notNull(),
  value: text("value").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  menteeFieldUnique: uniqueIndex("platform_profile_responses_unique").on(
    table.menteeUserId,
    table.fieldId,
  ),
}));

export const platformMaterialTemplatesTable = pgTable("platform_material_templates", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id").references(() => platformUsersTable.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  templateType: text("template_type").notNull().default("passport_like"),
  guideId: integer("guide_id").references(() => platformGuidesTable.id, {
    onDelete: "set null",
  }),
  appliesToGuideIds: jsonb("applies_to_guide_ids").$type<number[]>().notNull().default(sql`'[]'::jsonb`),
  structure: jsonb("structure").$type<Array<Record<string, unknown>>>().notNull().default(sql`'[]'::jsonb`),
  alternativeOptions: jsonb("alternative_options").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const platformGuideChecklistItemsTable = pgTable("platform_guide_checklist_items", {
  id: serial("id").primaryKey(),
  guideId: integer("guide_id")
    .references(() => platformGuidesTable.id, { onDelete: "cascade" })
    .notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  sectionTitle: text("section_title").notNull().default("Checklist"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  itemType: text("item_type").notNull().default("todo"),
  suggestedFilename: text("suggested_filename"),
  externalUrl: text("external_url"),
  linkedGuideItemId: integer("linked_guide_item_id"),
  isRequired: boolean("is_required").notNull().default(true),
  isCompleted: boolean("is_completed").notNull().default(false),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const platformMeetingsTable = pgTable("platform_meetings", {
  id: serial("id").primaryKey(),
  mentorUserId: integer("mentor_user_id")
    .references(() => platformUsersTable.id, { onDelete: "cascade" })
    .notNull(),
  menteeUserId: integer("mentee_user_id")
    .references(() => platformUsersTable.id, { onDelete: "cascade" })
    .notNull(),
  guideId: integer("guide_id").references(() => platformGuidesTable.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull().default("Spotkanie mentoringowe"),
  description: text("description").notNull().default(""),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  timezone: text("timezone").notNull().default("Europe/Warsaw"),
  status: text("status").notNull().default("scheduled"),
  method: text("method").notNull().default("zoom_link"),
  meetingUrl: text("meeting_url"),
  meetingContactValue: text("meeting_contact_value"),
  externalCalendarEventId: text("external_calendar_event_id"),
  actualDurationMinutes: integer("actual_duration_minutes"),
  mentorNotes: text("mentor_notes"),
  cancellationReason: text("cancellation_reason"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledByRole: text("cancelled_by_role"),
  cancelledByUserId: integer("cancelled_by_user_id").references(() => platformUsersTable.id, {
    onDelete: "set null",
  }),
  cancelledMinutesBeforeStart: integer("cancelled_minutes_before_start"),
  rescheduledAt: timestamp("rescheduled_at"),
  rescheduledByRole: text("rescheduled_by_role"),
  rescheduledByUserId: integer("rescheduled_by_user_id").references(() => platformUsersTable.id, {
    onDelete: "set null",
  }),
  rescheduledMinutesBeforeStart: integer("rescheduled_minutes_before_start"),
  rescheduledFromStartsAt: timestamp("rescheduled_from_starts_at"),
  rescheduledFromEndsAt: timestamp("rescheduled_from_ends_at"),
  rescheduleCount: integer("reschedule_count").notNull().default(0),
  mentorOccurred: boolean("mentor_occurred"),
  mentorOccurredAt: timestamp("mentor_occurred_at"),
  menteeOccurred: boolean("mentee_occurred"),
  menteeOccurredAt: timestamp("mentee_occurred_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const platformFileAssetsTable = pgTable("platform_file_assets", {
  id: serial("id").primaryKey(),
  ownerUserId: integer("owner_user_id").references(() => platformUsersTable.id, {
    onDelete: "set null",
  }),
  guideId: integer("guide_id").references(() => platformGuidesTable.id, {
    onDelete: "set null",
  }),
  checklistItemId: integer("checklist_item_id").references(() => platformGuideChecklistItemsTable.id, {
    onDelete: "set null",
  }),
  objectKey: text("object_key").notNull(),
  originalFilename: text("original_filename").notNull(),
  mimeType: text("mime_type").notNull(),
  publicUrl: text("public_url"),
  sizeBytes: integer("size_bytes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const platformMaterialItemStatesTable = pgTable(
  "platform_material_item_states",
  {
    id: serial("id").primaryKey(),
    templateId: integer("template_id")
      .references(() => platformMaterialTemplatesTable.id, { onDelete: "cascade" })
      .notNull(),
    menteeUserId: integer("mentee_user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    rowKey: text("row_key").notNull(),
    completed: boolean("completed").notNull().default(false),
    completionMethod: text("completion_method"),
    currentFileAssetId: integer("current_file_asset_id").references(() => platformFileAssetsTable.id, {
      onDelete: "set null",
    }),
    googleDocTabId: text("google_doc_tab_id"),
    googleDocTabUrl: text("google_doc_tab_url"),
    googleDocTabTitle: text("google_doc_tab_title"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    templateMenteeRowUnique: uniqueIndex("platform_material_item_states_template_mentee_row_unique").on(
      table.templateId,
      table.menteeUserId,
      table.rowKey,
    ),
  }),
);

export const platformMentorWorkspaceLinksTable = pgTable(
  "platform_mentor_workspace_links",
  {
    id: serial("id").primaryKey(),
    menteeUserId: integer("mentee_user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    mentorUserId: integer("mentor_user_id")
      .references(() => platformUsersTable.id, { onDelete: "cascade" })
      .notNull(),
    shortcutFileId: text("shortcut_file_id"),
    shortcutFileUrl: text("shortcut_file_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    mentorWorkspaceUnique: uniqueIndex("platform_mentor_workspace_links_unique").on(
      table.menteeUserId,
      table.mentorUserId,
    ),
  }),
);

export const insertPlatformUserSchema = createInsertSchema(platformUsersTable, {
  role: z.enum(PLATFORM_USER_ROLES),
  status: z.enum(PLATFORM_USER_STATUSES).default("pending"),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export type PlatformUserRole = (typeof PLATFORM_USER_ROLES)[number];
export type PlatformUserStatus = (typeof PLATFORM_USER_STATUSES)[number];
export type PlatformMeetingStatus = (typeof PLATFORM_MEETING_STATUSES)[number];
export type PlatformMeetingMethod = (typeof PLATFORM_MEETING_METHODS)[number];
export type PlatformGuideType = (typeof PLATFORM_GUIDE_TYPES)[number];
export type PlatformGuideStatus = (typeof PLATFORM_GUIDE_STATUSES)[number];
export type PlatformChecklistItemType = (typeof PLATFORM_CHECKLIST_ITEM_TYPES)[number];
export type PlatformGoogleConnectionType = (typeof PLATFORM_GOOGLE_CONNECTION_TYPES)[number];
export type PlatformConnectionStatus = (typeof PLATFORM_CONNECTION_STATUSES)[number];
export type PlatformProfileFieldType = (typeof PLATFORM_PROFILE_FIELD_TYPES)[number];
export type PlatformMaterialTemplateType = (typeof PLATFORM_MATERIAL_TEMPLATE_TYPES)[number];
export type InsertPlatformUser = z.infer<typeof insertPlatformUserSchema>;
export type PlatformUser = typeof platformUsersTable.$inferSelect;
