import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const newsletterSignupsTable = pgTable("newsletter_signups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNewsletterSignupSchema = createInsertSchema(
  newsletterSignupsTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertNewsletterSignup = z.infer<
  typeof insertNewsletterSignupSchema
>;
export type NewsletterSignup = typeof newsletterSignupsTable.$inferSelect;
