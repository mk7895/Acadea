import process from "node:process";
import {
  articleCategoriesTable,
  articleCategoryGroupsTable,
  db,
  articlesTable,
} from "../../lib/db/src";
import { articles as staticArticles } from "../../artifacts/acadea-website/src/data/articles";
import { STATIC_ARTICLE_TAXONOMY } from "../../artifacts/acadea-website/src/data/article-taxonomy";
import {
  estimateReadMinutes,
  extractMarkdownHeadings,
  normalizeArticleSlug,
  normalizeContactFormMarkers,
  splitRelatedSection,
} from "../../artifacts/api-server/src/lib/articleContent";

async function main() {
  for (const group of STATIC_ARTICLE_TAXONOMY) {
    await db
      .insert(articleCategoryGroupsTable)
      .values({
        sortOrder: group.sortOrder,
        name: group.name,
        slug: group.slug,
      })
      .onConflictDoUpdate({
        target: articleCategoryGroupsTable.slug,
        set: {
          sortOrder: group.sortOrder,
          name: group.name,
        },
      });
  }

  const groupRows = await db.select().from(articleCategoryGroupsTable);
  const groupIdBySlug = new Map(groupRows.map((group) => [group.slug, group.id]));

  for (const group of STATIC_ARTICLE_TAXONOMY) {
    const groupId = groupIdBySlug.get(group.slug);
    if (!groupId) {
      continue;
    }

    for (const category of group.categories) {
      await db
        .insert(articleCategoriesTable)
        .values({
          groupId,
          sortOrder: category.sortOrder,
          name: category.name,
          slug: category.slug,
        })
        .onConflictDoUpdate({
          target: articleCategoriesTable.slug,
          set: {
            groupId,
            sortOrder: category.sortOrder,
            name: category.name,
          },
        });
    }
  }

  let imported = 0;

  for (const article of staticArticles) {
    const normalizedMarkdown = normalizeContactFormMarkers(article.markdown);
    const { body, relatedSlugs } = splitRelatedSection(normalizedMarkdown);
    const tocItems = extractMarkdownHeadings(body);
    await db
      .insert(articlesTable)
      .values({
        sortOrder: article.order,
        category: article.category,
        categorySlugs: article.categorySlugs ?? [],
        title: article.title,
        slug: normalizeArticleSlug(article.slug),
        excerpt: article.excerpt,
        coverImage: article.image,
        markdown: body,
        readMin: article.readMin || estimateReadMinutes(body),
        tocItems,
        relatedSlugs,
        isPublished: true,
        updatedAt: new Date(article.updatedAt),
      })
      .onConflictDoUpdate({
        target: articlesTable.slug,
        set: {
          sortOrder: article.order,
          category: article.category,
          categorySlugs: article.categorySlugs ?? [],
          title: article.title,
          excerpt: article.excerpt,
          coverImage: article.image,
          markdown: body,
          readMin: article.readMin || estimateReadMinutes(body),
          tocItems,
          relatedSlugs,
          isPublished: true,
          updatedAt: new Date(article.updatedAt),
        },
      });
    imported += 1;
  }

  console.log(`Seeded ${imported} articles.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
