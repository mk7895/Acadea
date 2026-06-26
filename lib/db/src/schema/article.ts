import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export const articlesTable = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    sortOrder: integer("sort_order").notNull().default(0),
    category: text("category").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull(),
    coverImage: text("cover_image").notNull(),
    markdown: text("markdown").notNull(),
    readMin: integer("read_min").notNull().default(3),
    relatedSlugs: jsonb("related_slugs").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("articles_slug_unique").on(table.slug),
  }),
);

export const insertArticleSchema = createInsertSchema(articlesTable, {
  relatedSlugs: z.array(z.string()).default([]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;

