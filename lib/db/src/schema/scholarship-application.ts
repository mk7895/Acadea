import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scholarshipApplicationsTable = pgTable(
  "scholarship_applications",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    message: text("message").notNull(),
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
