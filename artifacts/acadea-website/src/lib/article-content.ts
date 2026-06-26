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

