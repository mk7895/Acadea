export const ARTICLE_CATEGORIES = ["Poradniki", "Kraje", "Stypendia"] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export function normalizeArticleSlug(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return "/";
  }

  const withoutSpaces = trimmed.replace(/\s+/g, "-");
  return withoutSpaces.startsWith("/") ? withoutSpaces : `/${withoutSpaces}`;
}

export function estimateReadMinutes(markdown: string) {
  const plainText = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[[^\]]+\]\(([^)]+)\)/g, " ")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const words = plainText ? plainText.split(" ").length : 0;
  return Math.max(3, Math.ceil(words / 180));
}

export function splitRelatedSection(markdown: string) {
  const marker = /\n## Czytaj też\s*\n/i;
  const match = marker.exec(markdown);
  if (!match) {
    return {
      body: markdown.trim(),
      relatedSlugs: [] as string[],
    };
  }

  const body = markdown.slice(0, match.index).trim();
  const relatedSection = markdown.slice(match.index + match[0].length);
  const relatedSlugs = Array.from(
    relatedSection.matchAll(/\[[^\]]+\]\((\/[^)]+)\)/g),
    (entry) => normalizeArticleSlug(entry[1] ?? ""),
  ).filter(Boolean);

  return {
    body,
    relatedSlugs: Array.from(new Set(relatedSlugs)),
  };
}

