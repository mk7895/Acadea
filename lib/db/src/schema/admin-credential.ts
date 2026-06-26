import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adminCredentialsTable = pgTable("admin_credentials", {
  id: integer("id").primaryKey().default(1),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAdminCredentialsSchema = createInsertSchema(
  adminCredentialsTable,
).omit({
  updatedAt: true,
});

export type InsertAdminCredentials = z.infer<typeof insertAdminCredentialsSchema>;
export type AdminCredentials = typeof adminCredentialsTable.$inferSelect;

