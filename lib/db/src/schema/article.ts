import { boolean, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql } from "drizzle-orm";
import { z } from "zod/v4";

export type ArticleTocItem = {
  sourceIndex: number;
  sourceText: string;
  anchorId: string;
  label: string;
  include: boolean;
  level: number;
};

export const articleCategoryGroupsTable = pgTable(
  "article_category_groups",
  {
    id: serial("id").primaryKey(),
    sortOrder: integer("sort_order").notNull().default(0),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("article_category_groups_slug_unique").on(table.slug),
  }),
);

export const articleCategoriesTable = pgTable(
  "article_categories",
  {
    id: serial("id").primaryKey(),
    groupId: integer("group_id").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("article_categories_slug_unique").on(table.slug),
  }),
);

export const articlesTable = pgTable(
  "articles",
  {
    id: serial("id").primaryKey(),
    sortOrder: integer("sort_order").notNull().default(0),
    category: text("category").notNull(),
    categorySlugs: jsonb("category_slugs").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt").notNull(),
    coverImage: text("cover_image").notNull(),
    markdown: text("markdown").notNull(),
    readMin: integer("read_min").notNull().default(3),
    tocItems: jsonb("toc_items").$type<ArticleTocItem[]>().notNull().default(sql`'[]'::jsonb`),
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
  categorySlugs: z.array(z.string()).default([]),
  tocItems: z
    .array(
      z.object({
        sourceIndex: z.number().int().min(0),
        sourceText: z.string(),
        anchorId: z.string(),
        label: z.string(),
        include: z.boolean(),
        level: z.number().int().min(1).max(6),
      }),
    )
    .default([]),
  relatedSlugs: z.array(z.string()).default([]),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticleCategoryGroupSchema = createInsertSchema(articleCategoryGroupsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertArticleCategorySchema = createInsertSchema(articleCategoriesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type InsertArticleCategoryGroup = z.infer<typeof insertArticleCategoryGroupSchema>;
export type InsertArticleCategory = z.infer<typeof insertArticleCategorySchema>;
export type Article = typeof articlesTable.$inferSelect;
export type ArticleCategoryGroup = typeof articleCategoryGroupsTable.$inferSelect;
export type ArticleCategory = typeof articleCategoriesTable.$inferSelect;
