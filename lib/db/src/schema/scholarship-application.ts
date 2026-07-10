import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const SCHOLARSHIP_PARENT_CONSENT_STATUSES = [
  "not_required",
  "pending",
  "signed",
  "expired",
] as const;

export const scholarshipApplicationsTable = pgTable(
  "scholarship_applications",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message").notNull(),
    termsAcceptedAt: timestamp("terms_accepted_at"),
    privacyPolicyAcknowledgedAt: timestamp("privacy_policy_acknowledged_at"),
    isAdultDeclared: boolean("is_adult_declared").notNull().default(true),
    requiresParentConsent: boolean("requires_parent_consent").notNull().default(false),
    parentFullName: text("parent_full_name"),
    parentEmail: text("parent_email"),
    parentConsentStatus: text("parent_consent_status")
      .$type<(typeof SCHOLARSHIP_PARENT_CONSENT_STATUSES)[number]>()
      .notNull()
      .default("not_required"),
    parentConsentCompletedAt: timestamp("parent_consent_completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

export const insertScholarshipApplicationSchema = createInsertSchema(
  scholarshipApplicationsTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertScholarshipApplication = z.infer<
  typeof insertScholarshipApplicationSchema
>;
export type ScholarshipApplication =
  typeof scholarshipApplicationsTable.$inferSelect;
