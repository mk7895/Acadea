import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { scholarshipApplicationsTable } from "./scholarship-application";

export const SCHOLARSHIP_PARENT_CONSENT_RECORD_STATUSES = [
  "pending",
  "signed",
  "expired",
] as const;

export const scholarshipParentConsentsTable = pgTable(
  "scholarship_parent_consents",
  {
    id: serial("id").primaryKey(),
    scholarshipApplicationId: integer("scholarship_application_id")
      .notNull()
      .references(() => scholarshipApplicationsTable.id, { onDelete: "cascade" }),
    applicantNameSnapshot: text("applicant_name_snapshot").notNull(),
    applicantEmailSnapshot: text("applicant_email_snapshot").notNull(),
    parentFullName: text("parent_full_name").notNull(),
    parentEmail: text("parent_email").notNull(),
    consentStatementVersion: text("consent_statement_version").notNull(),
    consentStatementText: text("consent_statement_text").notNull(),
    tokenHash: text("token_hash").notNull(),
    tokenExpiresAt: timestamp("token_expires_at").notNull(),
    status: text("status")
      .$type<(typeof SCHOLARSHIP_PARENT_CONSENT_RECORD_STATUSES)[number]>()
      .notNull()
      .default("pending"),
    openedAt: timestamp("opened_at"),
    relationshipToApplicant: text("relationship_to_applicant"),
    signatureName: text("signature_name"),
    signedAt: timestamp("signed_at"),
    signatureIpAddress: text("signature_ip_address"),
    signatureUserAgent: text("signature_user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenHashUniqueIdx: uniqueIndex("scholarship_parent_consents_token_hash_idx").on(
      table.tokenHash,
    ),
  }),
);

export const insertScholarshipParentConsentSchema = createInsertSchema(
  scholarshipParentConsentsTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertScholarshipParentConsent = z.infer<
  typeof insertScholarshipParentConsentSchema
>;
export type ScholarshipParentConsent =
  typeof scholarshipParentConsentsTable.$inferSelect;
