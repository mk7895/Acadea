import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const googleAuthTokensTable = pgTable("google_auth_tokens", {
  id: integer("id").primaryKey().default(1),
  calendarRefreshToken: text("calendar_refresh_token").notNull(),
  gmailRefreshToken: text("gmail_refresh_token").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertGoogleAuthTokensSchema = createInsertSchema(
  googleAuthTokensTable,
).omit({
  updatedAt: true,
});

export type InsertGoogleAuthTokens = z.infer<
  typeof insertGoogleAuthTokensSchema
>;
export type GoogleAuthTokens = typeof googleAuthTokensTable.$inferSelect;
