import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mentorApplicationsTable = pgTable("mentor_applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMentorApplicationSchema = createInsertSchema(
  mentorApplicationsTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertMentorApplication = z.infer<
  typeof insertMentorApplicationSchema
>;
export type MentorApplication = typeof mentorApplicationsTable.$inferSelect;
