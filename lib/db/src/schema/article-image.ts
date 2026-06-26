import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articleImagesTable = pgTable("article_images", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  dataUrl: text("data_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertArticleImageSchema = createInsertSchema(articleImagesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertArticleImage = z.infer<typeof insertArticleImageSchema>;
export type ArticleImage = typeof articleImagesTable.$inferSelect;

