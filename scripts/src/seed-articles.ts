import process from "node:process";
import { db, articlesTable } from "../../lib/db/src";
import { articles as staticArticles } from "../../artifacts/acadea-website/src/data/articles";
import {
  estimateReadMinutes,
  normalizeArticleSlug,
  splitRelatedSection,
} from "../../artifacts/api-server/src/lib/articleContent";

async function main() {
  let imported = 0;

  for (const article of staticArticles) {
    const { body, relatedSlugs } = splitRelatedSection(article.markdown);
    await db
      .insert(articlesTable)
      .values({
        sortOrder: article.order,
        category: article.category,
        title: article.title,
        slug: normalizeArticleSlug(article.slug),
        excerpt: article.excerpt,
        coverImage: article.image,
        markdown: body,
        readMin: estimateReadMinutes(body),
        relatedSlugs,
        isPublished: true,
        updatedAt: new Date(article.updatedAt),
      })
      .onConflictDoUpdate({
        target: articlesTable.slug,
        set: {
          sortOrder: article.order,
          category: article.category,
          title: article.title,
          excerpt: article.excerpt,
          coverImage: article.image,
          markdown: body,
          readMin: estimateReadMinutes(body),
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
